import { characters } from '../data/characters.js';
import { applyComboChange, applyMark, applyEnemyDamageMultiplier } from './statusEffect.js';

export function getActiveCharacterData(state) {
    return characters[state.player.id];
}

function actionNameToKey(actionName) {
    const aliases = {
        "Tiger's Roar": "tigersRoar",
        "Throw Object": "bottleThrow"
    };

    if (aliases[actionName]) return aliases[actionName];

    return actionName
        .replace(/['’]/g, "")
        .split(" ")
        .map((word, index) => {
            if (index === 0) return word.toLowerCase();
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join("");
}

export function resolveAttackAbility(state, char, subcategory, actionName, result) {
    const key = actionNameToKey(actionName);
    const isSpecial = subcategory === "Special";
    const abilityPool = isSpecial ? char.abilities.special : char.abilities.attack;
    const ability = abilityPool ? abilityPool[key] : null;

    if (!ability) {
        result.logs.push(`Unknown ability: ${actionName}`);
        return;
    }

    if (isSpecial) {
        resolveSpecialAbility(state, char, key, ability, result);
    } else {
        let damage = ability.base || ability.damage || 0;
        let comboGain = ability.combo !== undefined ? ability.combo : 0.25;

        if (char.id === "girl") {
            const emotion = char.getEmotion(state.tiger.hp, state.tiger.maxHp);
            if (ability.getDamage) damage = ability.getDamage(emotion);
        } else if (char.id === "officer") {
            if (key === "batonStrike" && state.enemyDamageMultiplier === 0.5) {
                damage += ability.bonusIfSuppressed || 6;
            }
            if (ability.apply) applyMark(state);
        } else if (char.id === "man") {
            if (key === "heavySwing") {
                // Heavy Swing multi-hit simulation (W/A/S/D inputs)
                // 1st hit: normal, 2nd hit: 0.5s window, 3rd hit: 0.25s window
                const hitsLanded = 3; // Simulated perfect chain
                damage = Math.floor((damage / 3) * hitsLanded);
                result.hitsLanded = hitsLanded;
                result.totalDamage = damage;
                result.comboGained = comboGain;
                result.logs.push(`Heavy Swing input chain: landed ${hitsLanded} hits!`);
            } else if (key === "bottleThrow" && state.lastPlayerActionId === "bottleThrow") {
                damage = Math.floor(damage * 0.5);
                result.logs.push(`Repeated Bottle Throw deals less damage.`);
            }
            comboGain = ability.combo !== undefined ? ability.combo : 0;
        }

        state.lastPlayerActionId = key;

        let totalDamage = Math.floor(damage * state.combo);
        if (state.damageBonus) totalDamage = Math.floor(totalDamage * (1 + state.damageBonus));
        if (state.enemy.marked) {
            totalDamage = Math.floor(totalDamage * 1.25);
            state.enemy.marked = false;
        }

        state.enemy.hp = Math.max(0, Math.min(state.enemy.maxHp, state.enemy.hp - totalDamage));

        result.effects.push({ type: 'attack', target: 'enemy' });
        result.logs.push(`Player used ${actionName} for ${totalDamage} damage.`);

        applyComboChange(state, comboGain);
        result.logs.push(`Combo: x${state.combo.toFixed(2)}`);
    }
}

export function resolveSpecialAbility(state, char, key, ability, result) {
    if (char.id === "girl") {
        const emotion = char.getEmotion(state.tiger.hp, state.tiger.maxHp);
        if (key === "comfort") {
            const healPct = ability.getHealPercent(emotion);
            const healAmt = Math.floor(state.tiger.maxHp * healPct);
            state.tiger.hp = Math.max(0, Math.min(state.tiger.maxHp, state.tiger.hp + healAmt));
            result.logs.push(`Comfort healed Tiger for ${healAmt} HP!`);
        } else if (key === "tigersRoar") {
            state.usedAbilities = state.usedAbilities || {};
            if (state.usedAbilities.tigersRoar) {
                result.logs.push(`Tiger's Roar can only be used once per battle!`);
                return;
            }
            state.usedAbilities.tigersRoar = true;

            const dmgPct = ability.getDamagePercent(emotion);
            const dmgAmt = Math.floor(state.enemy.maxHp * dmgPct);
            state.enemy.hp = Math.max(0, Math.min(state.enemy.maxHp, state.enemy.hp - dmgAmt));
            state.enemy.noDamageNextTurn = true; // From effect
            result.effects.push({ type: 'attack', target: 'enemy' });
            result.logs.push(`Tiger's Roar dealt ${dmgAmt} damage! Enemy deals 0 damage next turn.`);
        }
    } else if (char.id === "officer") {
        if (key === "suppress") {
            applyEnemyDamageMultiplier(state, 0.5);
            result.logs.push(`Enemy is suppressed! Deals 50% damage next turn.`);
        } else if (key === "backup") {
            state.usedAbilities = state.usedAbilities || {};
            if (state.usedAbilities.backup) {
                result.logs.push(`Backup can only be used once per battle!`);
                return;
            }
            state.usedAbilities.backup = true;
            state.freeSwitch = true;
            applyComboChange(state, 0.5);
            result.logs.push(`Backup called! Next switch is free and Combo +0.5.`);
        }
    } else if (char.id === "man") {
        if (key === "overexert") {
            if (state.player.hp <= 15) {
                result.logs.push(`HP too low to Overexert! Action failed.`);
                return;
            }
            state.player.hp = Math.max(ability.minHp, state.player.hp - ability.selfDamage);
            state.enemy.hp = Math.max(0, Math.min(state.enemy.maxHp, state.enemy.hp - ability.damage));
            applyComboChange(state, ability.combo);
            result.effects.push({ type: 'attack', target: 'enemy' });
            result.logs.push(`Man took ${ability.selfDamage} damage to deal ${ability.damage}!`);
        } else if (key === "allIn") {
            const multi = Math.min(ability.maxMultiplier, state.combo);
            const dmg = Math.floor(ability.base * multi);
            state.enemy.hp = Math.max(0, Math.min(state.enemy.maxHp, state.enemy.hp - dmg));
            state.combo = 1.0;
            result.effects.push({ type: 'attack', target: 'enemy' });
            result.logs.push(`All In dealt ${dmg} damage! Combo reset to x1.0.`);
        }
    }
}

export function resolveDefenseAbility(state, char, actionName, result) {
    state.activeDefense = actionName.toLowerCase();
    result.logs.push(`Player prepares to ${actionName}.`);
}

export function resolveAssistAbility(state, actionName, result) {
    const assistCharId = actionName.split(' ')[0].toLowerCase();
    const assistChar = characters[assistCharId];

    if (!assistChar || !assistChar.assist.active) return;
    const ability = assistChar.assist.active;

    if (assistCharId === "girl") {
        const emotion = assistChar.getEmotion(state.tiger.hp, state.tiger.maxHp);
        const values = ability.getValues(emotion);
        const activeHeal = Math.floor(state.player.maxHp * values.active);
        state.player.hp = Math.max(0, Math.min(state.player.maxHp, state.player.hp + activeHeal));
        result.logs.push(`${assistChar.name} used Good Vibes! Healed active character for ${activeHeal} HP.`);
        // TODO: Implement inactive character HP tracking and heal them by ${values.inactive * 100}% of their max HP.
    } else if (assistCharId === "officer") {
        if (state.lastAssistId === "officer") {
            result.logs.push(`Tactical Focus cannot be used twice in a row!`);
            return;
        }
        if (state.combo >= 1) {
            applyComboChange(state, -1);
            state.timerBonusSeconds = 2;
            state.revealEnemyIntent = true;
            applyEnemyDamageMultiplier(state, 0.5);
            state.lastAssistId = "officer";

            result.effects.push({
                type: "timerBonus",
                amount: 2
            });

            result.logs.push(`${assistChar.name} used Tactical Focus! +2 seconds, intent revealed.`);
        } else {
            result.logs.push(`${assistChar.name} tried Tactical Focus but combo was too low!`);
        }
    } else if (assistCharId === "man") {
        // Assume not boss for now
        state.enemy.hp = Math.max(0, Math.min(state.enemy.maxHp, state.enemy.hp - Math.floor(state.enemy.hp * 0.15)));
        result.logs.push(`${assistChar.name} used Improv! Damaged enemy for 15% current HP.`);
    }

    if (assistCharId !== "officer") {
        state.lastAssistId = assistCharId;
    }
}
