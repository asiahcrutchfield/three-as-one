import { enemies } from "../data/enemies.js";
import { characters } from "../data/characters.js";
import {
    applyComboChange,
    damageCharacter,
    getCharacterMaxHp,
    getCurrentEnemySlotId,
    getCurrentPlayerSlotId,
    getGirlEmotion,
    getPassiveBonuses
} from "./statusEffect.js";

function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}

function withinWindow(value, start, end, padding = 0) {
    return value >= Math.max(0, start - padding) && value <= Math.min(1, end + padding);
}

function getCounterValues(state) {
    const activeId = state.activeCharacterId;

    if (activeId === "girl") {
        return characters.girl.abilities.defense.counter.getValues(getGirlEmotion(state));
    }

    return characters[activeId].abilities.defense.counter;
}

function getBlockReduction(state) {
    const activeId = state.activeCharacterId;

    if (activeId === "girl") {
        return characters.girl.abilities.defense.block.getReduction(getGirlEmotion(state));
    }

    return characters[activeId].abilities.defense.block.reduction;
}

function getFailedCounterPenalty(activeId) {
    if (activeId === "officer") return -0.25;
    if (activeId === "man") return -0.75;
    return -0.5;
}

export function chooseEnemyIntent(state) {
    const template = enemies[state.enemy.id];
    const picked = template.behavior?.(state) ?? template.abilities[0];
    return { ...picked };
}

export function getDefenseTimingConfig(state, intent) {
    const defense = state.currentDefense;
    if (!defense || !intent) return null;

    const activeId = state.activeCharacterId;
    const emotion = activeId === "girl" ? getGirlEmotion(state) : null;

    if (defense === "block") {
        return {
            durationMs: 900,
            goodWindowStart: 0.24,
            goodWindowEnd: 0.76,
            label: "BLOCK"
        };
    }

    if (intent.type !== "attack") return null;

    if (defense === "dodge") {
        let durationMs = 820;
        let goodWindowStart = 0.24;
        let goodWindowEnd = 0.54;

        if (activeId === "girl") {
            const baseSeconds = characters.girl.abilities.defense.dodge.getWindow(emotion);
            if (baseSeconds >= 3) {
                durationMs = 900;
                goodWindowStart = 0.18;
                goodWindowEnd = 0.58;
            } else if (baseSeconds >= 2.5) {
                durationMs = 840;
                goodWindowStart = 0.2;
                goodWindowEnd = 0.56;
            } else if (baseSeconds >= 2) {
                durationMs = 760;
                goodWindowStart = 0.24;
                goodWindowEnd = 0.52;
            } else {
                durationMs = 700;
                goodWindowStart = 0.28;
                goodWindowEnd = 0.48;
            }
        }
        if (activeId === "officer") {
            durationMs = 800;
            goodWindowStart = 0.22;
            goodWindowEnd = 0.54;
        }
        if (activeId === "man") {
            durationMs = 720;
            goodWindowStart = 0.28;
            goodWindowEnd = 0.48;
        }

        if (intent.range === "close") {
            goodWindowStart += 0.06;
            goodWindowEnd -= 0.04;
        } else {
            goodWindowStart -= 0.04;
            goodWindowEnd += 0.06;
        }

        return {
            durationMs,
            goodWindowStart: Math.max(0.08, goodWindowStart),
            goodWindowEnd: Math.min(0.88, goodWindowEnd),
            label: "DODGE"
        };
    }

    if (defense === "counter") {
        let durationMs = 780;
        let goodWindowStart = 0.18;
        let goodWindowEnd = 0.46;
        let perfectWindowStart = 0.24;
        let perfectWindowEnd = 0.36;

        if (activeId === "girl") {
            const values = characters.girl.abilities.defense.counter.getValues(emotion);
            if (values.window >= 2.5) {
                durationMs = 860;
                goodWindowStart = 0.14;
                goodWindowEnd = 0.5;
                perfectWindowStart = 0.22;
                perfectWindowEnd = 0.36;
            } else if (values.window >= 2) {
                durationMs = 800;
                goodWindowStart = 0.18;
                goodWindowEnd = 0.46;
                perfectWindowStart = 0.24;
                perfectWindowEnd = 0.36;
            } else if (values.window >= 1.5) {
                durationMs = 720;
                goodWindowStart = 0.22;
                goodWindowEnd = 0.42;
                perfectWindowStart = 0.28;
                perfectWindowEnd = 0.36;
            } else {
                durationMs = 640;
                goodWindowStart = 0.24;
                goodWindowEnd = 0.38;
                perfectWindowStart = 0.28;
                perfectWindowEnd = 0.34;
            }
            if (emotion === "happy") {
            } else if (emotion === "neutral") {
            } else if (emotion === "worried") {
            } else {
            }
        } else if (activeId === "officer") {
            durationMs = 820;
            goodWindowStart = 0.16;
            goodWindowEnd = 0.48;
            perfectWindowStart = 0.22;
            perfectWindowEnd = 0.36;
        } else if (activeId === "man") {
            durationMs = 660;
            goodWindowStart = 0.24;
            goodWindowEnd = 0.4;
            perfectWindowStart = 0.28;
            perfectWindowEnd = 0.34;
        }

        return {
            durationMs,
            perfectWindowStart,
            perfectWindowEnd,
            goodWindowStart,
            goodWindowEnd,
            label: "COUNTER"
        };
    }

    return null;
}

export function evaluateDefenseTiming(state, intent, timingInput) {
    const defense = state.currentDefense;

    if (!defense) {
        return { defense: null, outcome: "none", success: false };
    }

    if (!timingInput?.clicked) {
        return { defense, outcome: "miss", success: false };
    }

    const cursorRatio = timingInput.remainingRatio;

    if (defense === "block") {
        const config = getDefenseTimingConfig(state, intent);
        const success = withinWindow(cursorRatio, config.goodWindowStart, config.goodWindowEnd, 0.04);
        return { defense, outcome: success ? "success" : "early", success };
    }

    if (defense === "dodge") {
        if (intent.type !== "attack" || intent.range === "status") {
            return { defense, outcome: "invalid", success: false };
        }
        const config = getDefenseTimingConfig(state, intent);
        const success = withinWindow(cursorRatio, config.goodWindowStart, config.goodWindowEnd, 0.045);
        return { defense, outcome: success ? "success" : "early", success };
    }

    if (defense === "counter") {
        if (intent.range !== "close" || !intent.counterable) {
            return { defense, outcome: "invalid", success: false };
        }

        const config = getDefenseTimingConfig(state, intent);
        const ratio = cursorRatio;

        if (withinWindow(ratio, config.perfectWindowStart, config.perfectWindowEnd, 0.03)) {
            return { defense, outcome: "perfect", success: true };
        }

        if (withinWindow(ratio, config.goodWindowStart, config.goodWindowEnd, 0.045)) {
            return { defense, outcome: "good", success: true };
        }

        return { defense, outcome: "early", success: false };
    }

    return { defense, outcome: "miss", success: false };
}

export function resolveEnemyTurn(state, timingResult = null) {
    const feedback = [];
    const intent = state.enemyIntent;

    if (!intent) return { feedback };

    if (intent.type === "status") {
        if (state.currentDefense === "block" && timingResult?.success) {
            feedback.push({ kind: "defense", slotId: getCurrentPlayerSlotId(), label: "Guarded" });
            state.currentDefense = null;
            state.enemy.nextAttackMultiplier = 1;
            return { feedback };
        }

        if (intent.effect === "enemy_damage_up") {
            state.enemy.nextAttackMultiplier *= 1.5;
            feedback.push({ kind: "text", slotId: getCurrentEnemySlotId(), label: "Damage Up" });
        }

        state.currentDefense = null;
        return { feedback };
    }

    if (intent.type !== "attack") {
        state.currentDefense = null;
        return { feedback };
    }

    const activeId = state.activeCharacterId;
    const slotId = getCurrentPlayerSlotId();
    const enemySlotId = getCurrentEnemySlotId();
    const passives = getPassiveBonuses(state);
    let damage = Math.round(intent.damage * state.enemy.nextAttackMultiplier * (1 - passives.damageReduction));

    if (state.enemy.noDamageNextTurn) {
        damage = 0;
        state.enemy.noDamageNextTurn = false;
    }

    if (state.currentDefense === "block") {
        const reduction = getBlockReduction(state);
        const success = timingResult?.success;
        const reductionMultiplier = success ? reduction : reduction * 0.45;
        const dealt = damageCharacter(state, activeId, Math.round(damage * (1 - reductionMultiplier)));
        if (success) {
            applyComboChange(state, 0.15);
            feedback.push({ kind: "defense", slotId, label: "Block" });
        } else {
            feedback.push({ kind: "text", slotId, label: "Late Block" });
        }
        if (dealt > 0) feedback.push({ kind: "damage", slotId, amount: dealt });
    } else if (state.currentDefense === "dodge") {
        if (timingResult?.success) {
            applyComboChange(state, 0.25);
            feedback.push({ kind: "defense", slotId, label: "Dodge" });
        } else {
            const dealt = damageCharacter(state, activeId, damage);
            applyComboChange(state, -0.5);
            state.stats.penalties += 1;
            feedback.push({ kind: "text", slotId, label: "Dodge Failed" });
            if (dealt > 0) feedback.push({ kind: "damage", slotId, amount: dealt });
        }
    } else if (state.currentDefense === "counter") {
        if (timingResult?.success && intent.range === "close" && intent.counterable) {
            const counterValues = getCounterValues(state);
            const baseMultiplier = timingResult?.outcome === "perfect" ? counterValues.dmg : Math.max(1, counterValues.dmg - 0.25);
            const comboGain = timingResult?.outcome === "perfect" ? 0.5 : 0.25;
            const counterDamage = Math.round(intent.damage * baseMultiplier * Math.max(1, state.combo));
            const dealt = damageCharacter(state, "enemy", counterDamage);
            applyComboChange(state, comboGain);
            state.stats.counters += 1;
            feedback.push({ kind: "counter", slotId, label: timingResult?.outcome === "perfect" ? "Perfect Counter" : "Good Counter" });
            if (timingResult?.outcome === "good") {
                const chipDamage = Math.round(damage * 0.25);
                const chipTaken = damageCharacter(state, activeId, chipDamage);
                if (chipTaken > 0) feedback.push({ kind: "damage", slotId, amount: chipTaken });
            }
            if (dealt > 0) feedback.push({ kind: "damage", slotId: enemySlotId, amount: dealt });
        } else {
            const penalty = getFailedCounterPenalty(activeId);
            const extraDamage = activeId === "officer" ? 1 : 1.1;
            const dealt = damageCharacter(state, activeId, Math.round(damage * extraDamage));
            applyComboChange(state, penalty);
            state.stats.penalties += 1;
            feedback.push({ kind: "text", slotId, label: "Counter Failed" });
            if (dealt > 0) feedback.push({ kind: "damage", slotId, amount: dealt });
        }
    } else {
        const dealt = damageCharacter(state, activeId, damage);
        if (dealt > 0) feedback.push({ kind: "damage", slotId, amount: dealt });
    }

    if (damage >= Math.round(getCharacterMaxHp(state, activeId) * 0.25)) {
        applyComboChange(state, -0.5);
        state.stats.penalties += 1;
    }

    state.enemy.nextAttackMultiplier = 1;
    state.currentDefense = null;
    state.activeTimingResult = timingResult;

    return { feedback };
}
