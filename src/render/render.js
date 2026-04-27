import { renderCharacter } from './animations.js';

async function init() {
    const response = await fetch('/assets/characters/index.json');

    if (!response.ok) {
        throw new Error('Failed to load character data');
    }

    const characterData = await response.json();
    const stage = document.getElementById('battle-stage');

    if (!stage) {
        throw new Error('Battle stage not found');
    }

    renderCharacter(stage, characterData, 'man', 'idle');
}

init();