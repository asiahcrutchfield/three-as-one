import { renderCharacter, renderDuo, renderEnemy } from './animations.js';
import { gameState } from '../game/state.js';
import { handlePlayerTimeout, resolvePlayerAction, applyPassives } from '../game/combat.js';
import { resolveEnemyTurn } from '../game/enemyAbilities.js';
import { enemies } from '../data/enemies.js';
import { characters } from '../data/characters.js';
import { updateDebugUI, updateCharacterUI, addLog } from './renderUI.js';
import { handleVisualEffects, playCounterEffect, playAttackEffect, playBlockEffect } from '../game/visualFeedback.js';

function showTimerBonus(text) {
    const timerEl = document.getElementById("turn-timer");
    if (!timerEl) return;

    const bonus = document.createElement("div");
    bonus.textContent = text;
    bonus.className = "timer-bonus-popup";

    timerEl.parentNode.appendChild(bonus);

    setTimeout(() => {
        bonus.remove();
    }, 800);
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
            updateCharacterUI(characterData);
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
        updateCharacterUI(characterData);
        updateDebugUI();
        startRound();
    }, 100);

    function handleEnemyTurn() {
        if (gameState.turn === "enemy") {
            const telegraphUI = document.getElementById('enemy-telegraph');
            if (telegraphUI) telegraphUI.style.display = 'none';

            setTimeout(() => {
                const activeDefenseBefore = gameState.activeDefense;

                const result = resolveEnemyTurn(gameState);

                if (result.effect) {
                    switch (result.effect) {
                        case 'enemy_damage_up':
                            addLog(`Enemy used Status! Damage increased for next attack.`);
                            playBlockEffect('enemy');
                            break;
                        case 'pressure_up':
                            addLog(`Breaker builds pressure!`);
                            playBlockEffect('enemy');
                            break;
                        case 'pressure_consume':
                            addLog(`Breaker unleashes pressure!`);
                            break;
                        case 'combo_lock':
                            addLog(`Combo Locked for 1 turn!`);
                            playBlockEffect('player');
                            break;
                        case 'combo_delay':
                            addLog(`Combo Gain Delayed!`);
                            playBlockEffect('player');
                            break;
                        case 'combo_drain':
                            addLog(`Combo Drained by 0.5!`);
                            playAttackEffect('player');
                            break;
                        case 'combo_break':
                            addLog(`Combo Broken! Momentum lost completely.`);
                            playAttackEffect('player');
                            break;
                        case 'tiger_mark':
                            addLog(`Tiger is Marked! Next hit deals more damage.`);
                            playAttackEffect('player');
                            break;
                        case 'consume_tiger_mark':
                            addLog(`Mark consumed for heavy damage!`);
                            break;
                        case 'emotional_decay':
                            addLog(`Girl feels Emotional Pressure.`);
                            break;
                        case 'timer_fast_on_hit':
                            if (result.playerDamageTaken > 0) {
                                addLog(`You got hit! Timer speeds up next turn!`);
                            }
                            break;
                        case 'timer_fast':
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
                        playCounterEffect('player');
                    } else if (result.playerDamageTaken > 0) {
                        addLog(`Dodge failed! Taken ${result.playerDamageTaken} damage.`);
                        playAttackEffect('player');
                    }
                } else if (activeDefenseBefore === 'block') {
                    if (result.playerDamageTaken > 0) {
                        addLog(`Enemy attacked but it was partially blocked! Taken ${result.playerDamageTaken}.`);
                        playBlockEffect('player');
                    }
                } else if (activeDefenseBefore === 'counter') {
                    if (result.counterSucceeded) {
                        addLog(`Player countered for ${result.enemyDamageTaken} damage!`);
                        playCounterEffect('player');
                        setTimeout(() => playAttackEffect('enemy'), 100);
                    } else if (result.playerDamageTaken > 0) {
                        addLog(`Counter failed! Taken ${result.playerDamageTaken}.`);
                        playAttackEffect('player');
                    }
                } else if (!activeDefenseBefore && result.playerDamageTaken > 0) {
                    addLog(`Enemy attacked for ${result.playerDamageTaken} damage.`);
                    playAttackEffect('player');
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
                // result.flashes shouldn't happen anymore, handled in visualFeedback.js via handleVisualEffects
                // But leave it for fallback if any remain
                result.flashes.forEach(f => {
                    const el = document.querySelector(f.selector);
                    if (el) {
                        el.classList.add(f.className);
                        setTimeout(() => el.classList.remove(f.className), 300);
                    }
                });
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
                updateCharacterUI(characterData);
            }

            if (gameState.turn === "player") {
                // Turn didn't end (e.g. Assist used or Free Switch)
                const timerEl = document.getElementById('turn-timer');
                if (timerEl && timeRemaining !== null) {
                    if (gameState.timerBonusSeconds) {
                        timeRemaining += gameState.timerBonusSeconds * 1000;
                        addLog(`+${gameState.timerBonusSeconds} sec`);
                        showTimerBonus(`+${gameState.timerBonusSeconds} sec`);
                        gameState.timerBonusSeconds = 0;
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