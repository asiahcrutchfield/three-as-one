import { gameState } from '../game/state.js';

export function updateDebugUI() {
    const playerHpEl = document.getElementById('player-hp');
    if (playerHpEl) {
        if (gameState.player.id === 'girl') {
            playerHpEl.setAttribute('hp', gameState.tiger.hp);
            playerHpEl.setAttribute('max-hp', gameState.tiger.maxHp);

            const emotion = getGirlEmotion();
            playerHpEl.setAttribute('image', `/assets/characters/girl/emotions/girl_${emotion}.png`);

            updateGirlEmotionLabel();
        } else {
            playerHpEl.setAttribute('hp', gameState.player.hp);
            playerHpEl.setAttribute('max-hp', gameState.player.maxHp);
            playerHpEl.setAttribute('image', `/assets/characters/${gameState.player.id}/portrait/${gameState.player.id}_portrait.png`);
        }
    }

    const enemyHpEl = document.getElementById('enemy-hp');
    if (enemyHpEl) {
        enemyHpEl.setAttribute('hp', gameState.enemy.hp);
        enemyHpEl.setAttribute('max-hp', gameState.enemy.maxHp);
    }

    const comboEl = document.getElementById('combo');
    if (comboEl) {
        comboEl.setAttribute('value', gameState.combo.toFixed(2));
    }
}

export function addLog(message) {
    const log = document.getElementById('battle-log');
    if (!log) return;

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = message;

    log.prepend(entry);
}

export function updateCharacterUI(characterData) {
    const activeId = gameState.player.id;
    const charactersList = ['girl', 'officer', 'man'];
    const inactiveIds = charactersList.filter(id => id !== activeId);

    const switchUI = document.querySelector('character-switch');
    if (switchUI) switchUI.setAttribute('active', activeId);

    const playerHpEl = document.getElementById('player-hp');
    if (playerHpEl) {
        if (activeId === 'girl') {
            playerHpEl.setAttribute('name', 'Girl / Tiger');

            const hpPercent = gameState.tiger.hp / gameState.tiger.maxHp;
            const emotion = getGirlEmotion();

            playerHpEl.setAttribute('image', `/assets/characters/girl/emotions/girl_${emotion}.png`);

            // Add or update emotion label under the portrait
            let emotionLabel = document.getElementById('girl-emotion-label');
            if (!emotionLabel) {
                emotionLabel = document.createElement('div');
                emotionLabel.id = 'girl-emotion-label';
                emotionLabel.style.textAlign = 'center';
                emotionLabel.style.fontWeight = 'bold';
                emotionLabel.style.marginTop = '4px';
                emotionLabel.style.color = '#fff';
                // Insert right after playerHpEl (assuming there's a container)
                playerHpEl.parentNode.insertBefore(emotionLabel, playerHpEl.nextSibling);
            }
            emotionLabel.textContent = `Emotion: ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}`;
            emotionLabel.style.display = 'block';
        } else {
            playerHpEl.setAttribute('name', characterData.characters[activeId].name);
            playerHpEl.setAttribute('image', `/assets/characters/${activeId}/portrait/${activeId}_portrait.png`);

            const emotionLabel = document.getElementById('girl-emotion-label');
            if (emotionLabel) emotionLabel.style.display = 'none';
        }
    }

    const assist1HpEl = document.getElementById('assist1-hp');
    const assist2HpEl = document.getElementById('assist2-hp');

    if (assist1HpEl && inactiveIds[0]) {
        assist1HpEl.setAttribute('image', `/assets/characters/${inactiveIds[0]}/portrait/${inactiveIds[0]}_portrait.png`);
    }
    if (assist2HpEl && inactiveIds[1]) {
        assist2HpEl.setAttribute('image', `/assets/characters/${inactiveIds[1]}/portrait/${inactiveIds[1]}_portrait.png`);
    }

    const actionButtons = document.querySelector('action-buttons');
    if (actionButtons && actionButtons.setOptions) {
        const optionsMap = {
            girl: {
                Attack: {
                    "Close Range": ["Pounce"],
                    "Long Range": ["Rock Throw"],
                    "Special": ["Comfort", "Tiger's Roar"]
                },
                Defense: ["Block", "Dodge", "Counter"]
            },
            officer: {
                Attack: {
                    "Close Range": ["Baton Strike"],
                    "Long Range": ["Gun Shot"],
                    "Special": ["Suppress", "Backup"]
                },
                Defense: ["Block", "Dodge", "Counter"]
            },
            man: {
                Attack: {
                    "Close Range": ["Heavy Swing"],
                    "Long Range": ["Bottle Throw"],
                    "Special": ["Overexert", "All In"]
                },
                Defense: ["Block", "Dodge", "Counter"]
            }
        };

        const assistNames = inactiveIds.map(id => characterData.characters[id].name + ' Assist');
        const switchNames = inactiveIds.map(id => characterData.characters[id].name);

        optionsMap[activeId].Assist = assistNames;
        optionsMap[activeId].Switch = switchNames;

        actionButtons.setOptions(optionsMap[activeId]);
    }
}

function getGirlEmotion() {
    const hpPercent = gameState.tiger.hp / gameState.tiger.maxHp;

    if (hpPercent <= 0) return "meltdown";
    if (hpPercent <= 0.24) return "sad";
    if (hpPercent <= 0.49) return "worried";
    if (hpPercent <= 0.74) return "neutral";
    return "happy";
}

function updateGirlEmotionLabel() {
    const emotionLabel = document.getElementById('girl-emotion-label');
    if (!emotionLabel) return;

    if (gameState.player.id !== 'girl') {
        emotionLabel.style.display = 'none';
        return;
    }

    const emotion = getGirlEmotion();

    emotionLabel.textContent =
        `Emotion: ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}`;

    emotionLabel.style.display = 'block';
}
