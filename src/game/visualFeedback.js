function flashElement(selector, className, duration = 300) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.add(className);
    setTimeout(() => {
        el.classList.remove(className);
    }, duration);
}

export function playAttackEffect(target) {
    const selector = target === 'enemy' ? '.enemy-sprite' : '.character-sprite';
    flashElement(selector, 'feedback-attack');
}

export function playBlockEffect(target) {
    const selector = target === 'enemy' ? '.enemy-sprite' : '.character-sprite';
    flashElement(selector, 'feedback-block');
}

export function playCounterEffect(target) {
    const selector = target === 'enemy' ? '.enemy-sprite' : '.character-sprite';
    flashElement(selector, 'feedback-counter');
}

export function playDamageEffect(target) {
    playAttackEffect(target);
}

export function playTimeoutEffect() {
    // Implement any specific timeout visual effect
}

export function playComboGainEffect(amount) {
    // Could add floating text or particles
}

export function playComboLossEffect(amount) {
    // Could add floating text or particles
}

export function handleVisualEffects(effects) {
    if (!effects || !Array.isArray(effects)) return;

    for (const effect of effects) {
        switch (effect.type) {
            case 'attack':
                playAttackEffect(effect.target);
                break;
            case 'block':
                playBlockEffect(effect.target);
                break;
            case 'counter':
                playCounterEffect(effect.target);
                break;
            case 'damage':
                playDamageEffect(effect.target);
                break;
            case 'timeout':
                playTimeoutEffect();
                break;
            case 'comboGain':
                playComboGainEffect(effect.amount);
                break;
            case 'comboLoss':
                playComboLossEffect(effect.amount);
                break;
            default:
                break;
        }
    }
}
