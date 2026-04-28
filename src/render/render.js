import { renderCharacter, renderDuo, renderEnemy } from './animations.js';
import { gameState } from '../game/state.js';
import { enemyAttack, handlePlayerTimeout, resolvePlayerAction, applyPassives } from '../game/combat.js';
import { enemies } from '../data/enemies.js';
import { characters } from '../data/characters.js';

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

            // Stop timer if player switched
            const timerEl = document.getElementById('turn-timer');
            if (timerEl) {
                const { isFast } = timerEl.stop();
                if (isFast) {
                    gameState.combo = Math.min(3, gameState.combo + 0.25);
                    addLog("Fast Action! +0.25 Combo");
                }
            }

            updateDebugUI();

            // Switching counts as a turn in this simple version
            gameState.turn = "enemy";
            gameState.status = "Enemy Turn";
            handleEnemyTurn();
        }
    });

    document.addEventListener('timeout', () => {
        if (gameState.turn !== "player") return;

        const result = handlePlayerTimeout(gameState);
        if (!result) return;

        addLog(result.message);

        updateDebugUI();
        handleEnemyTurn();
    });

    function stopTimerAndCheckBonus() {
        const timerEl = document.getElementById('turn-timer');
        if (timerEl) {
            const { isFast } = timerEl.stop();
            if (isFast) {
                gameState.combo = Math.min(3, gameState.combo + 0.25);
                addLog("Fast Action! +0.25 Combo");
            }
        }
    }

    function startRound() {
        if (gameState.status !== "Player Turn") return;

        applyPassives(gameState);

        // Enemy decides what to do next
        const enemyObj = enemies[gameState.enemy.id];
        gameState.enemyIntent = enemyObj.behavior(gameState);

        const telegraphUI = document.getElementById('enemy-telegraph');
        if (telegraphUI) {
            if (gameState.enemyIntent.type === "fake") {
                telegraphUI.textContent = `Prepares: ${gameState.enemyIntent.label} (${gameState.enemyIntent.shownRange})`;
            } else {
                telegraphUI.textContent = `Prepares: ${gameState.enemyIntent.label}`;
            }
            telegraphUI.style.display = 'block';
        }

        addLog(`Enemy prepares: ${gameState.enemyIntent.label}`);

        const timerEl = document.getElementById('turn-timer');
        if (timerEl) {
            timerEl.start(7000 * gameState.timerMultiplier);
            gameState.timerMultiplier = 1.0; // Reset after applying
        }
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

                if (result.effect) {
                    switch (result.effect) {
                        case 'enemy_damage_up':
                            gameState.enemyDamageMultiplier = 1.5;
                            addLog(`Enemy used Status! Damage increased for next attack.`);
                            flashElement('.enemy-sprite', 'feedback-block');
                            break;
                        case 'pressure_up':
                            addLog(`Breaker builds pressure!`);
                            flashElement('.enemy-sprite', 'feedback-block');
                            break;
                        case 'pressure_consume':
                            addLog(`Breaker unleashes pressure!`);
                            break;
                        case 'combo_lock':
                            gameState.comboLocked = true;
                            addLog(`Combo Locked for 1 turn!`);
                            flashElement('.character-sprite', 'feedback-block');
                            break;
                        case 'combo_delay':
                            gameState.comboDelayed = true;
                            addLog(`Combo Gain Delayed!`);
                            flashElement('.character-sprite', 'feedback-block');
                            break;
                        case 'combo_drain':
                            gameState.combo = Math.max(1, gameState.combo - 0.5);
                            addLog(`Combo Drained by 0.5!`);
                            flashElement('.character-sprite', 'feedback-attack');
                            break;
                        case 'combo_break':
                            gameState.combo = 1.0;
                            addLog(`Combo Broken! Momentum lost completely.`);
                            flashElement('.character-sprite', 'feedback-attack');
                            break;
                        case 'tiger_mark':
                            gameState.tigerMarked = true;
                            addLog(`Tiger is Marked! Next hit deals more damage.`);
                            flashElement('.character-sprite', 'feedback-attack');
                            break;
                        case 'consume_tiger_mark':
                            gameState.tigerMarked = false;
                            addLog(`Mark consumed for heavy damage!`);
                            break;
                        case 'emotional_decay':
                            addLog(`Girl feels Emotional Pressure.`);
                            break;
                        case 'timer_fast_on_hit':
                            if (result.playerDamageTaken > 0) {
                                gameState.timerMultiplier = 0.8;
                                addLog(`You got hit! Timer speeds up next turn!`);
                            }
                            break;
                        case 'timer_fast':
                            gameState.timerMultiplier = 0.6;
                            addLog(`Timer crushed! Decisions must be fast!`);
                            break;
                        case 'mob_rotate':
                            addLog(`Mob rotates the active enemy!`);
                            break;
                        default:
                            break;
                    }
                }

                if (result.playerDamageTaken === 0 && result.enemyDamageTaken === 0 && !result.effect) {
                    if (gameState.enemyIntent && gameState.enemyIntent.delayed) {
                        addLog(`Enemy attack delayed! It will strike next turn.`);
                    }
                }

                if (activeDefenseBefore === 'dodge') {
                    if (result.dodgeSucceeded) {
                        addLog(`Player Dodged the attack!`);
                        flashElement('.character-sprite', 'feedback-counter');
                    } else if (result.playerDamageTaken > 0) {
                        addLog(`Dodge failed! Taken ${result.playerDamageTaken} damage.`);
                        flashElement('.character-sprite', 'feedback-attack');
                    }
                } else if (activeDefenseBefore === 'block') {
                    if (result.playerDamageTaken > 0) {
                        addLog(`Enemy attacked but it was partially blocked! Taken ${result.playerDamageTaken}.`);
                        flashElement('.character-sprite', 'feedback-block');
                    }
                } else if (activeDefenseBefore === 'counter') {
                    if (result.counterSucceeded) {
                        addLog(`Player countered for ${result.enemyDamageTaken} damage!`);
                        flashElement('.character-sprite', 'feedback-counter');
                        setTimeout(() => {
                            flashElement('.enemy-sprite', 'feedback-attack');
                        }, 100);
                    } else if (result.playerDamageTaken > 0) {
                        addLog(`Counter failed! Taken ${result.playerDamageTaken}.`);
                        flashElement('.character-sprite', 'feedback-attack');
                    }
                } else if (!activeDefenseBefore && result.playerDamageTaken > 0) {
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
        actionButtons.addEventListener('action-selected', (e) => {
            if (gameState.turn !== "player") return;

            const { category, subcategory, actionName } = e.detail;
            let timeRemaining = null;
            const timerEl = document.getElementById('turn-timer');
            if (timerEl) {
                const status = timerEl.stop();
                timeRemaining = status.timeLeft;
            }
            
            if (category !== "assist") {
                // Check bonus for non-assist actions
                if (timeRemaining !== null && timeRemaining >= (timerEl.duration / 2)) {
                    gameState.combo = Math.min(3, gameState.combo + 0.25);
                    addLog("Fast Action! +0.25 Combo");
                }
            }

            // Pass execution to combat engine
            const result = resolvePlayerAction(gameState, category, subcategory, actionName);
            
            // Process feedback
            if (result && result.logs) {
                result.logs.forEach(msg => addLog(msg));
            }
            if (result && result.flashes) {
                result.flashes.forEach(f => flashElement(f.selector, f.className));
            }
            
            // Handle character switch dynamically from action
            if (category === "switch") {
                const switchId = actionName.toLowerCase();
                if (gameState.switchesRemaining <= 0 && !gameState.freeSwitch) {
                    addLog(`Cannot switch: Switch limit reached.`);
                    // Resume timer if switch failed
                    const timerEl = document.getElementById('turn-timer');
                    if (timerEl && timeRemaining !== null) timerEl.start(timeRemaining);
                    return; 
                }
                
                if (gameState.freeSwitch) {
                    gameState.freeSwitch = false;
                    addLog(`Free Switch consumed!`);
                    gameState.turn = "player"; // Free switch does not end turn
                    gameState.status = "Player Turn";
                } else {
                    gameState.switchesRemaining--;
                }
                
                gameState.player.id = switchId;
                gameState.combo = Math.min(3, gameState.combo + 1.0); 
                updateCharacterUI();
            }

            if (gameState.turn === "player") {
                // Turn didn't end (e.g. Assist used or Free Switch)
                const timerEl = document.getElementById('turn-timer');
                if (timerEl && timeRemaining !== null) {
                    if (gameState.timerSlow) {
                        timeRemaining = timeRemaining / gameState.timerSlow;
                        addLog(`Timer slowed! Remaining time extended.`);
                        gameState.timerSlow = null; // consume it
                    }
                    timerEl.start(timeRemaining);
                }
                updateDebugUI();
                return; // Do NOT call handleEnemyTurn
            }

            setTimeout(() => {
                updateDebugUI();
                handleEnemyTurn();
            }, 100);
        });
    }
}

init();