// Controls for Health Bars
window.changeHP = function(id, amount) {
    const el = document.getElementById(id);
    if (!el) return;
    
    let currentHp = parseFloat(el.getAttribute('hp'));
    const maxHp = parseFloat(el.getAttribute('max-hp'));
    
    currentHp = Math.max(0, Math.min(maxHp, currentHp + amount));
    el.setAttribute('hp', currentHp);
};

// Controls for Combo Meter
let currentCombo = 1.0;

window.changeCombo = function(amount) {
    currentCombo = Math.max(1.0, Math.min(3.0, currentCombo + amount));
    document.getElementById('combo').setAttribute('value', currentCombo.toFixed(2));
};

window.resetCombo = function() {
    currentCombo = 1.0;
    document.getElementById('combo').setAttribute('value', currentCombo.toFixed(2));
};

window.maxCombo = function() {
    currentCombo = 3.0;
    document.getElementById('combo').setAttribute('value', currentCombo.toFixed(2));
};

// Controls for Action Buttons
document.addEventListener('DOMContentLoaded', () => {
    const logEl = document.getElementById('action-log');
    const actionButtons = document.querySelector('action-buttons');
    
    if (actionButtons) {
        actionButtons.addEventListener('action-attack', () => {
            logEl.textContent = 'Action triggered: ATTACK';
            logEl.style.color = '#e74c3c';
        });
        
        actionButtons.addEventListener('action-block', () => {
            logEl.textContent = 'Action triggered: BLOCK';
            logEl.style.color = '#3498db';
        });
        
        actionButtons.addEventListener('action-counter', () => {
            logEl.textContent = 'Action triggered: COUNTER';
            logEl.style.color = '#2ecc71';
        });
    }

    const switchComponent = document.getElementById('demo-switch');
    if (switchComponent) {
        switchComponent.addEventListener('character-switch', (e) => {
            switchComponent.setAttribute('active', e.detail.id);
        });
    }
});

// Controls for Results
window.showResults = function(rank) {
    const results = document.getElementById('demo-results');
    results.setAttribute('rank', rank);
    
    // Restart animation by toggling active
    results.setAttribute('active', 'false');
    setTimeout(() => {
        results.setAttribute('active', 'true');
    }, 50);
};

document.addEventListener('results-continue', () => {
    document.getElementById('demo-results').setAttribute('active', 'false');
});
