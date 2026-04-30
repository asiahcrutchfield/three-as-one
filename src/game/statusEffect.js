import { characters } from "../data/characters.js";
import { PLAYER_CHARACTER_IDS } from "./state.js";

export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function applyComboChange(state, delta) {
    state.combo = clamp(Number((state.combo + delta).toFixed(2)), 0, 3);
    state.maxComboReached = Math.max(state.maxComboReached, state.combo);
    return state.combo;
}

export function getPlayerTurnDuration(state) {
    return Math.round((state.playerTurnDurationMs + (state.run?.playerTurnBonusMs ?? 0)) * state.playerTurnScale);
}

export function resetCombo(state) {
    state.combo = 1;
}

export function getGirlEmotion(state) {
    const pct = state.tiger.hp / state.tiger.maxHp;
    return characters.girl.getEmotion(state.tiger.hp, state.tiger.maxHp, pct);
}

export function getCharacterMaxHp(state, characterId) {
    if (characterId === "enemy") return state.enemy.maxHp;
    if (characterId === "girl") return state.tiger.maxHp;
    return state.roster[characterId].maxHp;
}

export function getCharacterHp(state, characterId) {
    if (characterId === "enemy") return state.enemy.hp;
    if (characterId === "girl") return state.tiger.hp;
    return state.roster[characterId].hp;
}

export function setCharacterHp(state, characterId, nextHp) {
    const maxHp = getCharacterMaxHp(state, characterId);
    const clamped = clamp(Math.round(nextHp), 0, maxHp);

    if (characterId === "girl") {
        state.tiger.hp = clamped;
        state.roster.girl.hp = clamped;
        state.tiger.defeated = clamped <= 0;
        state.roster.girl.unavailable = clamped <= 0;
    } else if (characterId === "enemy") {
        state.enemy.hp = clamped;
        state.enemy.defeated = clamped <= 0;
    } else {
        state.roster[characterId].hp = clamped;
        state.roster[characterId].defeated = clamped <= 0;
    }

    return clamped;
}

export function healCharacter(state, characterId, amount) {
    if (!amount || isCharacterUnavailable(state, characterId)) return 0;

    const currentHp = getCharacterHp(state, characterId);
    const nextHp = setCharacterHp(state, characterId, currentHp + amount);
    return nextHp - currentHp;
}

export function damageCharacter(state, characterId, amount) {
    if (!amount || isCharacterUnavailable(state, characterId)) return 0;

    let adjustedAmount = amount;
    if (characterId === "girl" && (state.run?.tigerGuard ?? 0) > 0) {
        adjustedAmount = Math.round(amount * (1 - state.run.tigerGuard));
    }

    const currentHp = getCharacterHp(state, characterId);
    const nextHp = setCharacterHp(state, characterId, currentHp - adjustedAmount);
    return currentHp - nextHp;
}

export function isCharacterUnavailable(state, characterId) {
    if (characterId === "enemy") return state.enemy.defeated;

    const characterState = state.roster[characterId];
    if (!characterState) return true;

    return characterState.defeated || characterState.unavailable;
}

export function getAvailableCharacterIds(state) {
    return PLAYER_CHARACTER_IDS.filter((id) => !isCharacterUnavailable(state, id));
}

export function getInactiveCharacterIds(state) {
    return PLAYER_CHARACTER_IDS.filter((id) => id !== state.activeCharacterId);
}

export function getInactiveAssistIds(state) {
    return getInactiveCharacterIds(state).filter((id) => !isCharacterUnavailable(state, id));
}

export function getPassiveBonuses(state) {
    const bonuses = {
        damageBonus: state.run?.damageBonus ?? 0,
        damageReduction: 0
    };

    getInactiveAssistIds(state).forEach((id) => {
        const character = characters[id];

        if (id === "officer") bonuses.damageReduction += 0.03;
        if (id === "man") bonuses.damageBonus += 0.05;
        if (id === "girl" && state.activeCharacterId === "man") {
            bonuses.damageBonus += 0;
        }
    });

    if (state.activeCharacterId === "man") {
        bonuses.damageBonus += characters.man.passive(state.roster.man);
    }

    return bonuses;
}

export function tickCooldowns(state) {
    PLAYER_CHARACTER_IDS.forEach((id) => {
        const cooldowns = state.roster[id].cooldowns;
        Object.keys(cooldowns).forEach((key) => {
            cooldowns[key] = Math.max(0, cooldowns[key] - 1);
        });
    });

    if (typeof state.enemy.switchCooldown === "number") {
        state.enemy.switchCooldown = Math.max(0, state.enemy.switchCooldown - 1);
    }
}

export function healInactiveCharacters(state) {
    if (isCharacterUnavailable(state, "girl") || state.activeCharacterId === "girl") return [];

    const emotion = getGirlEmotion(state);
    const regenPct = characters.girl.assist.passive.getRegen(emotion, state.tiger.hp <= 0);
    const healed = [];

    getInactiveCharacterIds(state).forEach((id) => {
        if (isCharacterUnavailable(state, id)) return;

        const amount = Math.floor(getCharacterMaxHp(state, id) * regenPct);
        const healedAmount = healCharacter(state, id, amount);
        if (healedAmount > 0) healed.push({ id, amount: healedAmount });
    });

    return healed;
}

export function resolveDefeatState(state) {
    PLAYER_CHARACTER_IDS.forEach((id) => {
        if (id === "girl") {
            if (state.tiger.hp <= 0) {
                state.tiger.defeated = true;
                state.roster.girl.unavailable = true;
            }
            return;
        }

        state.roster[id].defeated = state.roster[id].hp <= 0;
    });

    state.enemy.defeated = state.enemy.hp <= 0;

    if (state.enemy.defeated) {
        state.battleOver = true;
        state.outcome = "victory";
        return null;
    }

    if (isCharacterUnavailable(state, state.activeCharacterId)) {
        state.stats.defeats += 1;
        resetCombo(state);

        const fallbackId = getAvailableCharacterIds(state)[0] ?? null;
        state.activeCharacterId = fallbackId;
    }

    if (!state.activeCharacterId) {
        state.battleOver = true;
        state.outcome = "defeat";
        return null;
    }

    return state.activeCharacterId;
}

export function getCurrentPlayerSlotId() {
    return "player-slot";
}

export function getCurrentEnemySlotId() {
    return "enemy-slot";
}
