import {
    getAvailableCharacterIds,
    getCharacterMaxHp,
    healCharacter,
    isCharacterUnavailable
} from "./statusEffect.js";

const BOSS_SWITCH_CHANCES = {
    1: 0.12,
    2: 0.28,
    3: 0.42
};

export function getConvergencePhase(state) {
    if (state.enemy.id !== "convergence") return null;

    const hpPct = state.enemy.hp / state.enemy.maxHp;

    if (hpPct <= 0.33) return 3;
    if (hpPct <= 0.66) return 2;
    return 1;
}

export function syncConvergenceState(state) {
    if (state.enemy.id !== "convergence") return false;

    const nextPhase = getConvergencePhase(state);
    const previousPhase = state.enemy.phase ?? 1;

    state.enemy.phase = nextPhase;

    if (nextPhase === 3) {
        state.enemy.stageLocked = true;
    }

    return nextPhase !== previousPhase;
}

export function getConvergenceStageOverride(state) {
    if (state.enemy.id !== "convergence") return null;

    return state.enemy.stageLocked ? "boss" : null;
}

export function chooseConvergenceIntent(state, enemyTemplate) {
    syncConvergenceState(state);

    const phase = state.enemy.phase ?? 1;
    const roll = Math.random();

    const pick = (id) => enemyTemplate.abilities.find((ability) => ability.id === id);

    if (phase === 1) {
        if (roll < 0.52) return { ...pick("crushing_blow") };
        if (roll < 0.9) return { ...pick("core_beam") };
        return { ...pick("phase_shift") };
    }

    if (phase === 2) {
        if (roll < 0.34) return { ...pick("crushing_blow") };
        if (roll < 0.64) return { ...pick("core_beam") };
        if (roll < 0.82) return { ...pick("false_signal"), fake: true };
        return { ...pick("phase_shift") };
    }

    if (roll < 0.28) return { ...pick("crushing_blow") };
    if (roll < 0.52) return { ...pick("core_beam") };
    if (roll < 0.8) return { ...pick("false_signal"), fake: true };
    return { ...pick("phase_shift"), effect: "boss_switch_ready", delayed: true };
}

export function canUseStandardAssist(state, assistCharacterId) {
    if (state.enemy.id !== "convergence") return true;

    if (assistCharacterId === "girl") {
        return state.activeCharacterId !== "girl" && !state.roster.girl.usedOnce.goodVibesBoss;
    }

    return false;
}

export function getBossAssistEntryState(state) {
    if (state.enemy.id !== "convergence") return null;

    if (state.activeCharacterId === "girl" || isCharacterUnavailable(state, "girl")) {
        return {
            available: false,
            reason: "Girl must be inactive"
        };
    }

    if (state.roster.girl.usedOnce.goodVibesBoss) {
        return {
            available: false,
            reason: "1/Boss"
        };
    }

    return {
        available: true,
        reason: "1/Boss"
    };
}

export function useConvergenceGoodVibes(state) {
    const activeId = state.activeCharacterId;
    const healAmount = Math.floor(getCharacterMaxHp(state, activeId) * 0.2);
    const healed = healCharacter(state, activeId, healAmount);

    state.roster.girl.usedOnce.goodVibesBoss = true;
    state.enemy.switchCooldown = Math.max(state.enemy.switchCooldown ?? 0, 1);

    return healed;
}

export function maybeForceBossSwitch(state) {
    if (state.enemy.id !== "convergence") return null;

    syncConvergenceState(state);

    if ((state.enemy.switchCooldown ?? 0) > 0) {
        state.enemy.switchCooldown -= 1;
        return null;
    }

    const phase = state.enemy.phase ?? 1;
    const chance = BOSS_SWITCH_CHANCES[phase] ?? 0;

    if (Math.random() >= chance) return null;

    const options = getAvailableCharacterIds(state).filter((id) => id !== state.activeCharacterId);
    if (!options.length) return null;

    const nextId = options[Math.floor(Math.random() * options.length)];
    const previousId = state.activeCharacterId;

    state.activeCharacterId = nextId;

    // Phase 3 is more aggressive: no forced cooldown after switch.
    state.enemy.switchCooldown = phase === 3 ? 0 : 1;

    return {
        from: previousId,
        to: nextId
    };
}

export function getConvergenceStatusChips(state) {
    if (state.enemy.id !== "convergence") return [];

    const chips = [`Phase ${state.enemy.phase ?? getConvergencePhase(state)}`];

    if (state.enemy.stageLocked) {
        chips.push("Arena Locked");
    }

    return chips;
}