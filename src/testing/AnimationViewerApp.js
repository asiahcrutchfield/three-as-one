import Phaser from 'phaser';
import { AnimationViewerScene } from './AnimationViewerScene.js';

let game;

function initApp() {
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        backgroundColor: '#444444',
        scene: [AnimationViewerScene],
        pixelArt: true
    };

    game = new Phaser.Game(config);

    // Setup UI event listeners
    const assetTypeSelect = document.getElementById('asset-type');
    const assetNameSelect = document.getElementById('asset-name');
    const animationSelect = document.getElementById('animation');
    const playBtn = document.getElementById('play-btn');

    assetTypeSelect.addEventListener('change', (e) => {
        updateNamesList(e.target.value);
    });

    playBtn.addEventListener('click', () => {
        const scene = game.scene.getScene('AnimationViewerScene');
        if (scene) {
            const data = {
                type: assetTypeSelect.value,
                name: assetNameSelect.value,
                animation: animationSelect.value
            };
            scene.events.emit('play-animation', data);
        }
    });
}

function updateNamesList(type) {
    const assetNameSelect = document.getElementById('asset-name');
    assetNameSelect.innerHTML = '';
    
    let options = [];
    if (type === 'character') {
        options = ['Officer', 'Girl', 'Man'];
    } else if (type === 'stage') {
        options = ['paradise', 'ximending', 'mardi_gras'];
    }

    options.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt;
        el.textContent = opt;
        assetNameSelect.appendChild(el);
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
