import { renderCharacter } from '../render/render.js';

async function init() {
    try {
        const response = await fetch('/assets/characters/index.json');
        const data = await response.json();

        const stage = document.getElementById('battle-stage');
        
        // Create UI to toggle characters for testing
        const controls = document.createElement('div');
        controls.style.position = 'absolute';
        controls.style.top = '20px';
        controls.style.right = '20px';
        controls.style.background = 'rgba(255, 255, 255, 0.9)';
        controls.style.padding = '10px';
        controls.style.borderRadius = '5px';
        controls.style.fontFamily = 'sans-serif';
        controls.style.zIndex = '10';

        const charSelect = document.createElement('select');
        charSelect.style.marginLeft = '10px';
        charSelect.style.padding = '5px';
        
        Object.keys(data.characters).forEach(charId => {
            const option = document.createElement('option');
            option.value = charId;
            option.textContent = data.characters[charId].name;
            charSelect.appendChild(option);
        });

        controls.appendChild(document.createTextNode('Select Character:'));
        controls.appendChild(charSelect);
        document.getElementById('app').appendChild(controls);

        // Render initial character
        const initialCharacter = charSelect.value;
        renderCharacter(stage, data, initialCharacter, 'idle');

        // Render character on change
        charSelect.addEventListener('change', (e) => {
            renderCharacter(stage, data, e.target.value, 'idle');
        });
    } catch (err) {
        console.error('Failed to load character data:', err);
    }
}

document.addEventListener('DOMContentLoaded', init);
