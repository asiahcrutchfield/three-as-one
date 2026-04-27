import { renderCharacter, renderEnemy } from './animations.js';
import { gameState } from '../game/state.js';
import { playerAttack, enemyAttack } from '../game/combat.js';

function updateDebugUI() {
    document.getElementById('status').textContent = gameState.status;
    document.getElementById('hp').textContent = gameState.player.hp;
    document.getElementById('combo').textContent = gameState.combo.toFixed(2);
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

    renderCharacter(stage, characterData, 'tiger', 'idle');
    renderEnemy(stage);

    updateDebugUI();

    function handleEnemyTurn() {
        if (gameState.turn === "enemy") {
            setTimeout(() => {
                const playerHpBefore = gameState.player.hp;
                const enemyHpBefore = gameState.enemy.hp;

                const activeDefenseBefore = gameState.activeDefense;

                enemyAttack(gameState);

                const enemyDamage = playerHpBefore - gameState.player.hp;
                if (activeDefenseBefore === 'block') {
                    addLog(`Enemy attacked but it was partially blocked!`);
                    flashElement('.character-sprite', 'feedback-block');
                } else if (activeDefenseBefore === 'counter') {
                    // Handled below
                } else if (enemyDamage > 0) {
                    addLog(`Enemy attacked for ${enemyDamage} damage.`);
                    flashElement('.character-sprite', 'feedback-attack');
                }

                const counterDamage = enemyHpBefore - gameState.enemy.hp;
                if (counterDamage > 0) {
                    addLog(`Player countered for ${counterDamage} damage!`);
                    flashElement('.character-sprite', 'feedback-counter');
                    setTimeout(() => {
                        flashElement('.enemy-sprite', 'feedback-attack');
                    }, 100);
                }

                addLog(`Player HP: ${gameState.player.hp}/${gameState.player.maxHp}`);
                updateDebugUI();
            }, 800);
        }
    }

    document.getElementById('attack-btn').addEventListener('click', () => {
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

    document.getElementById('block-btn').addEventListener('click', () => {
        if (gameState.turn !== "player") return;

        import('../game/combat.js').then(({ playerBlock }) => {
            playerBlock(gameState);
            addLog(`Player prepared to block.`);
            updateDebugUI();
            handleEnemyTurn();
        });
    });

    document.getElementById('counter-btn').addEventListener('click', () => {
        if (gameState.turn !== "player") return;

        import('../game/combat.js').then(({ playerCounter }) => {
            playerCounter(gameState);
            addLog(`Player prepared to counter.`);
            updateDebugUI();
            handleEnemyTurn();
        });
    });
}

init();