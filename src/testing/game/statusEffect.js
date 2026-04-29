export function applyComboChange(state, amount) {
    if (state.comboLocked && amount > 0) return 0;

    if (state.comboDelayed && amount > 0) {
        state.delayedComboGain = (state.delayedComboGain || 0) + amount;
        return 0;
    }

    const oldCombo = state.combo;
    state.combo = Math.min(3, Math.max(0, state.combo + amount));
    return state.combo - oldCombo;
}

export function applyComboLock(state) {
    state.comboLocked = true;
}

export function applyComboDelay(state) {
    state.comboDelayed = true;
}

export function applyComboDrain(state, amount) {
    state.combo = Math.max(0, state.combo - amount);
}

export function applyComboBreak(state) {
    state.combo = 1.0;
}

export function applyMark(state) {
    state.enemy.marked = true;
}

export function consumeMark(state) {
    state.enemy.marked = false;
}

export function applyTigerMark(state) {
    state.tigerMarked = true;
}

export function consumeTigerMark(state) {
    state.tigerMarked = false;
}

export function applyEnemyDamageMultiplier(state, multiplier) {
    state.enemyDamageMultiplier = multiplier;
}

export function applyTimerMultiplier(state, multiplier) {
    state.timerMultiplier = multiplier;
}

export function resolveStatusAfterEnemyTurn(state) {
    if (state.comboLocked) {
        state.comboLocked = false;
    }

    if (state.comboDelayed) {
        state.comboDelayed = false;

        if (state.delayedComboGain > 0) {
            state.combo = Math.min(
                3,
                Math.max(0, state.combo + state.delayedComboGain)
            );
            state.delayedComboGain = 0;
        }
    }
}
