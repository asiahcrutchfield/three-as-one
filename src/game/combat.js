import { characters } from '../data/characters.js';

export function getActiveCharacterData(state) {
    return characters[state.player.id];
}

export function applyPassives(state) {
    state.damageBonus = 0;
    state.damageReduction = 0;
    
    const activeId = state.player.id;
    const allIds = ["girl", "officer", "man"];
    const inactiveIds = allIds.filter(id => id !== activeId);
    
    // Active character's personal passive
    const activeChar = characters[activeId];
    if (activeChar && activeChar.passive) {
        state.damageBonus += activeChar.passive(state.player);
    }
    
    // Inactive characters' assist passives
    inactiveIds.forEach(id => {
        const char = characters[id];
        if (char && char.assist && char.assist.passive) {
            if (char.assist.passive.effect) {
                char.assist.passive.effect(state);
            }
            if (id === "girl" && char.assist.passive.getRegen) {
                const meltdown = state.player.hp <= 0;
                const emotion = char.getEmotion(state.player.hp, state.player.maxHp);
                const regenPct = char.assist.passive.getRegen(emotion, meltdown);
                const healAmt = Math.floor(state.player.maxHp * regenPct);
                if (healAmt > 0) {
                    state.player.hp = Math.min(state.player.maxHp, state.player.hp + healAmt);
                }
            }
        }
    });
}

export function addCombo(state, amount) {
    // Combo Lock only blocks combo gain, not combo loss
    if (state.comboLocked && amount > 0) return;

    // Combo Delay only delays combo gain, not combo loss
    if (state.comboDelayed && amount > 0) {
        state.delayedComboGain = (state.delayedComboGain || 0) + amount;
        return;
    }

    state.combo = Math.min(3, Math.max(1, state.combo + amount));
}

export function handlePlayerTimeout(state) {
    if (state.turn !== "player") return null;

    state.stats ??= {};
    state.stats.timeouts = (state.stats.timeouts || 0) + 1;

    addCombo(state, -0.5);

    state.activeDefense = null;
    state.turn = "enemy";
    state.status = "Timeout! Enemy Turn";

    return {
        type: "timeout",
        comboLost: 0.5,
        message: "Too slow! -0.5 combo"
    };
}

export function resolvePlayerAction(state, category, subcategory, actionName) {
    state.lastPlayerAction = category;
    
    const result = {
        logs: [],
        flashes: []
    };
    
    const charData = getActiveCharacterData(state);
    
    if (category === "attack") {
        resolveAttackAbility(state, charData, subcategory, actionName, result);
    } else if (category === "defense") {
        resolveDefenseAbility(state, charData, actionName, result);
    } else if (category === "assist") {
        resolveAssistAbility(state, actionName, result);
    } else if (category === "switch") {
        result.logs.push(`Switched to ${actionName}. Combo +1.0!`);
    }
    
    if (category !== "switch" && category !== "assist") {
        state.turn = "enemy";
        state.status = "Enemy Turn";
    }
    
    return result;
}

function resolveAttackAbility(state, char, subcategory, actionName, result) {
    const key = actionName.split(' ').map((word, index) => index === 0 ? word.toLowerCase() : word).join('');
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
            const emotion = char.getEmotion(state.player.hp, state.player.maxHp);
            if (ability.getDamage) damage = ability.getDamage(emotion);
        } else if (char.id === "officer") {
            if (key === "batonStrike" && state.enemy.damageMultiplier === 0.5) {
                damage += ability.bonusIfSuppressed || 6;
            }
            if (ability.apply) ability.apply(state.enemy);
        } else if (char.id === "man") {
            if (key === "bottleThrow" && state.lastPlayerActionId === "bottleThrow") {
                damage = Math.floor(damage * 0.5);
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
        
        state.enemy.hp = Math.max(0, state.enemy.hp - totalDamage);
        
        result.flashes.push({ selector: '.enemy-sprite', className: 'feedback-attack' });
        result.logs.push(`Player used ${actionName} for ${totalDamage} damage.`);
        
        addCombo(state, comboGain);
        result.logs.push(`Combo: x${state.combo.toFixed(2)}`);
    }
}

function resolveSpecialAbility(state, char, key, ability, result) {
    if (char.id === "girl") {
        const emotion = char.getEmotion(state.player.hp, state.player.maxHp);
        if (key === "comfort") {
            const healPct = ability.getHealPercent(emotion);
            const healAmt = Math.floor(state.player.maxHp * healPct);
            state.player.hp = Math.min(state.player.maxHp, state.player.hp + healAmt);
            result.logs.push(`Comfort healed ${healAmt} HP!`);
        } else if (key === "tigersRoar") {
            const dmgPct = ability.getDamagePercent(emotion);
            const dmgAmt = Math.floor(state.enemy.maxHp * dmgPct);
            state.enemy.hp = Math.max(0, state.enemy.hp - dmgAmt);
            ability.effect(state);
            result.flashes.push({ selector: '.enemy-sprite', className: 'feedback-attack' });
            result.logs.push(`Tiger's Roar dealt ${dmgAmt} damage! Enemy deals 0 damage next turn.`);
        }
    } else if (char.id === "officer") {
        if (key === "suppress") {
            ability.effect(state.enemy);
            result.logs.push(`Enemy is suppressed! Deals 50% damage next turn.`);
        } else if (key === "backup") {
            ability.effect(state);
            result.logs.push(`Backup called! Next switch is free and Combo +0.5.`);
        }
    } else if (char.id === "man") {
        if (key === "overexert") {
            if (state.player.hp <= ability.selfDamage) {
                result.logs.push(`HP too low to Overexert! Action failed.`);
                return;
            }
            state.player.hp = Math.max(ability.minHp, state.player.hp - ability.selfDamage);
            state.enemy.hp = Math.max(0, state.enemy.hp - ability.damage);
            addCombo(state, ability.combo);
            result.flashes.push({ selector: '.enemy-sprite', className: 'feedback-attack' });
            result.logs.push(`Man took ${ability.selfDamage} damage to deal ${ability.damage}!`);
        } else if (key === "allIn") {
            const multi = Math.min(ability.maxMultiplier, state.combo);
            const dmg = Math.floor(ability.base * multi);
            state.enemy.hp = Math.max(0, state.enemy.hp - dmg);
            state.combo = 1.0;
            result.flashes.push({ selector: '.enemy-sprite', className: 'feedback-attack' });
            result.logs.push(`All In dealt ${dmg} damage! Combo reset to x1.0.`);
        }
    }
}

function resolveDefenseAbility(state, char, actionName, result) {
    state.activeDefense = actionName.toLowerCase();
    result.logs.push(`Player prepares to ${actionName}.`);
}

function resolveAssistAbility(state, actionName, result) {
    const assistCharId = actionName.split(' ')[0].toLowerCase();
    const assistChar = characters[assistCharId];
    
    if (!assistChar || !assistChar.assist.active) return;
    const ability = assistChar.assist.active;
    
    if (assistCharId === "girl") {
        const emotion = assistChar.getEmotion(state.player.hp, state.player.maxHp);
        const values = ability.getValues(emotion);
        const activeHeal = Math.floor(state.player.maxHp * values.active);
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + activeHeal);
        result.logs.push(`${assistChar.name} used Good Vibes! Healed active character for ${activeHeal} HP.`);
    } else if (assistCharId === "officer") {
        const success = ability.effect(state);
        if (success) {
            result.logs.push(`${assistChar.name} used Tactical Focus! Cost 1 combo. Timer slowed, intent revealed.`);
        } else {
            result.logs.push(`${assistChar.name} tried Tactical Focus but combo was too low!`);
        }
    } else if (assistCharId === "man") {
        ability.effect(state.enemy);
        result.logs.push(`${assistChar.name} used Improv! Damaged enemy for 15% current HP.`);
    }
}

export function enemyAttack(state) {
    if (state.turn !== "enemy") return {};

    state.pendingAttacks ??= [];

    let intent = state.enemyIntent || {
        type: "attack",
        range: "close",
        damage: 8
    };

    if (intent.type === "fake" && intent.actualAbility) {
        intent = intent.actualAbility;
    }

    const result = {
        intentType: intent.type,
        range: intent.range,
        effect: intent.effect,
        playerDamageTaken: 0,
        enemyDamageTaken: 0,
        counterSucceeded: false,
        dodgeSucceeded: false,
        blockSucceeded: false
    };

    if (intent.delayed) {
        state.pendingAttacks.push({ ...intent, delayed: false });
        intent = null;
    }

    let attacksToResolve = [];

    if (intent && intent.type !== "status") {
        attacksToResolve.push(intent);
    }

    attacksToResolve = attacksToResolve.concat(state.pendingAttacks);
    state.pendingAttacks = [];

    let totalDamage = 0;

    attacksToResolve.forEach((attack) => {
        let dmg = attack.damage || 0;

        if (state.tigerMarked && state.player.id === "girl") {
            dmg = Math.floor(dmg * 1.5);
            state.tigerMarked = false;
        }

        const enemyDamageMultiplier = state.enemyDamageMultiplier ?? 1;
        const playerDamageReduction = state.damageReduction || 0;
        
        dmg = Math.floor(dmg * enemyDamageMultiplier);
        dmg = Math.floor(dmg * (1 - playerDamageReduction));

        if (state.activeDefense === "dodge") {
            result.dodgeSucceeded = true;
            addCombo(state, 0.25);
            dmg = 0;
            state.activeDefense = null;
        }

        else if (state.activeDefense === "block") {
            result.blockSucceeded = true;
            dmg = Math.floor(dmg * 0.5);
            addCombo(state, 0.15);
            state.activeDefense = null;
        }

        else if (state.activeDefense === "counter") {
            if (attack.range === "close") {
                result.counterSucceeded = true;

                const counterDamage = Math.floor(10 * state.combo * 1.5);
                result.enemyDamageTaken += counterDamage;

                state.enemy.hp = Math.max(0, state.enemy.hp - counterDamage);

                addCombo(state, 0.5);
                dmg = 0;
            } else {
                addCombo(state, -0.5);
            }

            state.activeDefense = null;
        }

        totalDamage += dmg;
    });

    if (totalDamage > 0) {
        state.player.hp = Math.max(0, state.player.hp - totalDamage);
        result.playerDamageTaken = totalDamage;

        state.stats ??= {};
        state.stats.heavyDamageTaken = (state.stats.heavyDamageTaken || 0) + 1;
    }

    state.activeDefense = null;

    if (state.comboLocked) {
        state.comboLocked = false;
    }

    if (state.comboDelayed) {
        state.comboDelayed = false;

        if (state.delayedComboGain > 0) {
            state.combo = Math.min(
                3,
                Math.max(1, state.combo + state.delayedComboGain)
            );

            state.delayedComboGain = 0;
        }
    }

    if (state.enemy.hp <= 0) {
        state.status = "Victory";
        return result;
    }

    if (state.player.hp <= 0) {
        state.status = "Defeat";
        return result;
    }

    state.turn = "player";
    state.status = "Player Turn";

    return result;
}