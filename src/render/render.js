import { renderCharacter, renderDuo, renderEnemy } from './animations.js';
import { gameState } from '../game/state.js';
import { playerAttack, enemyAttack } from '../game/combat.js';
import { enemies } from '../data/enemies.js';

function updateDebugUI() {
    const playerHpEl = document.getElementById('player-hp');
    if (playerHpEl) {
        playerHpEl.setAttribute('hp', gameState.player.hp);
        playerHpEl.setAttribute('max-hp', gameState.player.maxHp);
        
        const hpPercent = gameState.player.hp / gameState.player.maxHp;
        let emotion = 'happy';
        if (hpPercent <= 0.25) emotion = 'sad';
        else if (hpPercent <= 0.50) emotion = 'worried';
        else if (hpPercent <= 0.75) emotion = 'neutral';
        
        playerHpEl.setAttribute('image', `/assets/characters/girl/emotions/girl_${emotion}.png`);
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

function addLog(message) {
    const log = document.getElementById('battle-log');

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = message;

    log.prepend(entry);
}

// Listeners attached in init

function flashElement(selector, className = 'feedback-attack', duration = 300) {
    const el = document.querySelector(selector);
    if (!el) return;

    el.classList.add(className);

    setTimeout(() => {
        el.classList.remove(className);
    }, duration);
}

async function init() {
    const response = await fetch('/assets/characters/index.json');

    if (!response.ok) {
        throw new Error('Failed to load character data');
    }

    const characterData = await response.json();
    const stage = document.getElementById('battle-stage');

    renderDuo(stage, characterData, 'tiger', 'girl', 'idle');
    renderEnemy(stage);

    function updateCharacterUI() {
        const activeId = gameState.player.id;
        const charactersList = ['girl', 'officer', 'man'];
        const inactiveIds = charactersList.filter(id => id !== activeId);

        const switchUI = document.querySelector('character-switch');
        if (switchUI) switchUI.setAttribute('active', activeId);

        const playerHpEl = document.getElementById('player-hp');
        if (playerHpEl) {
            playerHpEl.setAttribute('name', characterData.characters[activeId].name);
            if (activeId === 'girl') {
                playerHpEl.setAttribute('image', `/assets/characters/girl/emotions/girl_happy.png`);
            } else {
                playerHpEl.setAttribute('image', `/assets/characters/${activeId}/portrait/${activeId}_portrait.png`);
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

        if (activeId === 'girl') {
            renderDuo(stage, characterData, 'tiger', 'girl', 'idle');
        } else {
            import('./animations.js').then(({ renderCharacter }) => {
                renderCharacter(stage, characterData, activeId, 'idle');
            });
        }

        const actionButtons = document.querySelector('action-buttons');
        if (actionButtons && actionButtons.setOptions) {
            const optionsMap = {
                girl: {
                    attack: ['Pounce', 'Rock Throw', 'Comfort', "Tiger's Roar"],
                    defense: ['Block', 'Dodge', 'Counter']
                },
                officer: {
                    attack: ['Baton Strike', 'Gun Shot', 'Command', 'Suppress'],
                    defense: ['Block', 'Dodge', 'Counter']
                },
                man: {
                    attack: ['Heavy Swing', 'Throw Object', 'Overexert', 'All In'],
                    defense: ['Block', 'Dodge', 'Counter']
                }
            };
            
            const assistNames = inactiveIds.map(id => characterData.characters[id].name + ' Assist');
            optionsMap[activeId].assist = assistNames;

            actionButtons.setOptions(optionsMap[activeId]);
        }
    }

    document.addEventListener('character-switch', (e) => {
        if (gameState.switchesRemaining <= 0) {
            addLog(`Cannot switch: Switch limit reached.`);
            return;
        }

        const newId = e.detail.id;
        if (gameState.player.id !== newId) {
            gameState.switchesRemaining--;
            gameState.player.id = newId;
            gameState.combo = Math.min(3, gameState.combo + 1.0); // Game rule: switching gives +1.0 combo
            updateCharacterUI();
            addLog(`Switched to ${characterData.characters[newId].name}. Combo +1.0!`);
            updateDebugUI();
        }
    });

    function startRound() {
        if (gameState.status !== "Player Turn") return;
        
        // Enemy decides what to do next
        const enemyObj = enemies[gameState.enemy.id];
        gameState.enemyIntent = enemyObj.behavior();
        
        const telegraphUI = document.getElementById('enemy-telegraph');
        if (telegraphUI) {
            telegraphUI.textContent = `Prepares: ${gameState.enemyIntent.label}`;
            telegraphUI.style.display = 'block';
        }
        
        addLog(`Enemy prepares: ${gameState.enemyIntent.label}`);
    }

    // Run once on init to set up correct actions based on default state
    setTimeout(() => {
        updateCharacterUI();
        updateDebugUI();
        startRound();
    }, 100);

    function handleEnemyTurn() {
        if (gameState.turn === "enemy") {
            const telegraphUI = document.getElementById('enemy-telegraph');
            if (telegraphUI) telegraphUI.style.display = 'none';

            setTimeout(() => {
                const activeDefenseBefore = gameState.activeDefense;

                const result = enemyAttack(gameState);

                if (result.intentType === "status") {
                    addLog(`Enemy used Status! Damage increased for next attack.`);
                    flashElement('.enemy-sprite', 'feedback-block');
                } else if (activeDefenseBefore === 'block') {
                    addLog(`Enemy attacked but it was partially blocked! Taken ${result.playerDamageTaken}.`);
                    flashElement('.character-sprite', 'feedback-block');
                } else if (activeDefenseBefore === 'counter') {
                    if (result.counterSucceeded) {
                        addLog(`Player countered for ${result.enemyDamageTaken} damage!`);
                        flashElement('.character-sprite', 'feedback-counter');
                        setTimeout(() => {
                            flashElement('.enemy-sprite', 'feedback-attack');
                        }, 100);
                    } else if (result.intentType === "long") {
                        addLog(`Counter failed! Enemy used a long attack. Taken ${result.playerDamageTaken}.`);
                        flashElement('.character-sprite', 'feedback-attack');
                    }
                } else if (result.playerDamageTaken > 0) {
                    addLog(`Enemy attacked for ${result.playerDamageTaken} damage.`);
                    flashElement('.character-sprite', 'feedback-attack');
                }

                addLog(`Player HP: ${gameState.player.hp}/${gameState.player.maxHp}`);
                updateDebugUI();
                
                if (gameState.status === "Player Turn") {
                    setTimeout(() => {
                        startRound();
                    }, 500);
                } else {
                    addLog(`Battle Over: ${gameState.status}`);
                }
            }, 800);
        }
    }

    const actionButtons = document.querySelector('action-buttons');
    if (actionButtons) {
        actionButtons.addEventListener('action-attack', () => {
            if (gameState.turn !== "player") return;
            const enemyHpBefore = gameState.enemy.hp;

            playerAttack(gameState);
            flashElement('.enemy-sprite', 'feedback-attack');

            const damage = enemyHpBefore - gameState.enemy.hp;
            addLog(`Player attacked for ${damage} damage.`);
            addLog(`Enemy HP: ${gameState.enemy.hp}/${gameState.enemy.maxHp}`);
            addLog(`Combo: x${gameState.combo.toFixed(2)}`);

            updateDebugUI();
            handleEnemyTurn();
        });

        actionButtons.addEventListener('action-block', () => {
            if (gameState.turn !== "player") return;

            import('../game/combat.js').then(({ playerBlock }) => {
                playerBlock(gameState);
                addLog(`Player prepared to block.`);
                updateDebugUI();
                handleEnemyTurn();
            });
        });

        actionButtons.addEventListener('action-counter', () => {
            if (gameState.turn !== "player") return;

            import('../game/combat.js').then(({ playerCounter }) => {
                playerCounter(gameState);
                addLog(`Player prepared to counter.`);
                updateDebugUI();
                handleEnemyTurn();
            });
        });
    }
}

init();