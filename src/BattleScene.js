import Phaser from 'phaser';

const CHARACTERS = ['Officer', 'Man', 'Girl'];

export class BattleScene extends Phaser.Scene {
    constructor() {
        super('BattleScene');
    }

    init(data) {
        // Carry over the active character from the last cycle if it exists
        this.previousCharacter = data ? data.previousCharacter : null;

        // Core states
        this.playerHp = 100;
        this.enemyHp = 100;
        this.isGameOver = false;

        // Character and Mechanics states
        this.activeCharacter = '';
        this.extraActionPending = false; // "Push Through" state
        
        // "Suppress" state
        this.isSuppressedThisRound = false; 
        this.suppressNextRound = false; 

        // Combat Configuration
        this.baseEnemyDamage = 15;

        // Character Action Movepool
        this.characters = {
            'Officer': {
                action1: { name: 'Attack', type: 'damage', enemyDmg: 15, playerHeal: 0, playerDmg: 0 },
                action2: { name: 'Defend', type: 'heal', enemyDmg: 0, playerHeal: 15, playerDmg: 0 },
                action3: { name: 'Suppress', type: 'suppress', enemyDmg: 0, playerHeal: 0, playerDmg: 0 }
            },
            'Man': {
                action1: { name: 'Attack', type: 'damage', enemyDmg: 25, playerHeal: 0, playerDmg: 0 },
                action2: { name: 'Overexert', type: 'damage', enemyDmg: 40, playerHeal: 0, playerDmg: 20 },
                action3: { name: 'Push Through', type: 'extra_action', enemyDmg: 0, playerHeal: 0, playerDmg: 0 }
            },
            'Girl': {
                action1: { name: 'Attack', type: 'damage', enemyDmg: 10, playerHeal: 0, playerDmg: 0 },
                action2: { name: 'Heal', type: 'heal', enemyDmg: 0, playerHeal: 20, playerDmg: 0 },
                action3: { name: 'Shift Emotion', type: 'shift', enemyDmg: 0, playerHeal: 0, playerDmg: 0 }
            }
        };
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Create Characters (Simple rectangles)
        this.playerRect = this.add.rectangle(width * 0.25, height * 0.4, 80, 150, 0x3498db);
        this.playerHpText = this.add.text(width * 0.25, height * 0.4 - 100, '', {
            fontSize: '24px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.enemyRect = this.add.rectangle(width * 0.75, height * 0.4, 80, 150, 0xe74c3c);
        this.enemyHpText = this.add.text(width * 0.75, height * 0.4 - 100, '', {
            fontSize: '24px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.updateHpDisplays();

        // 2. Create UI (Action Log & Active Character)
        this.actionLogText = this.add.text(width * 0.5, height * 0.2, 'Battle Start!', {
            fontSize: '20px', fill: '#aaaaaa', align: 'center'
        }).setOrigin(0.5);

        this.activeCharacterText = this.add.text(width * 0.25, height * 0.4 + 100, '', {
            fontSize: '22px', fill: '#f1c40f', fontStyle: 'bold'
        }).setOrigin(0.5);

        // 3. Create Player Action Buttons
        this.buttons = [];
        this.buttons.push(this.makeButton(width * 0.25, height * 0.8, () => this.handleActionClick(0)));
        this.buttons.push(this.makeButton(width * 0.5, height * 0.8, () => this.handleActionClick(1)));
        this.buttons.push(this.makeButton(width * 0.75, height * 0.8, () => this.handleActionClick(2)));

        // Game Over Text (Hidden until end)
        this.gameOverText = this.add.text(width * 0.5, height * 0.5, '', {
            fontSize: '64px', fontStyle: 'bold'
        }).setOrigin(0.5).setVisible(false);

        // Restart Button (Hidden until end)
        this.restartButton = this.makeButton(width * 0.5, height * 0.65, () => {
            this.scene.restart({ previousCharacter: this.activeCharacter });
        });
        this.restartButton.setVisible(false);
        this.restartButton.getAt(1).setText('Restart');

        // Initialize the cycle's character
        if (this.previousCharacter) {
            const available = CHARACTERS.filter(c => c !== this.previousCharacter);
            this.activeCharacter = Phaser.Utils.Array.GetRandom(available);
        } else {
            this.activeCharacter = Phaser.Utils.Array.GetRandom(CHARACTERS);
        }
        this.activeCharacterText.setText(`Active: ${this.activeCharacter}`);
        
        this.updateActionButtons();
    }

    makeButton(x, y, callback) {
        const bg = this.add.rectangle(0, 0, 160, 50, 0x555555).setInteractive({ useHandCursor: true });
        const lbl = this.add.text(0, 0, '', { fontSize: '18px', fill: '#ffffff' }).setOrigin(0.5);
        const container = this.add.container(x, y, [bg, lbl]);

        bg.on('pointerdown', () => {
            bg.setFillStyle(0x888888);
            callback();
        });
        bg.on('pointerup', () => { bg.setFillStyle(0x555555); });
        bg.on('pointerout', () => { bg.setFillStyle(0x555555); });

        return container;
    }

    updateActionButtons() {
        // Update UI Button Labels dynamically based on character
        const charActions = this.characters[this.activeCharacter];
        const actionKeys = ['action1', 'action2', 'action3'];
        
        for (let i = 0; i < 3; i++) {
            const action = charActions[actionKeys[i]];
            const container = this.buttons[i];
            const label = container.getAt(1); // The text object
            label.setText(action.name);
        }
    }

    nextRound() {
        if (this.isGameOver) return;
        
        // Apply cross-round effects like Suppression
        this.isSuppressedThisRound = this.suppressNextRound;
        this.suppressNextRound = false; 
    }

    handleActionClick(buttonIndex) {
        if (this.isGameOver) return;

        const charActions = this.characters[this.activeCharacter];
        const actionKeys = ['action1', 'action2', 'action3'];
        const action = charActions[actionKeys[buttonIndex]];

        this.resolveTurn(action);
    }

    resolveTurn(action) {
        if (this.isGameOver) return;

        let logMsg = `${this.activeCharacter} used ${action.name}! `;

        // 1. Process Player Move Values
        this.enemyHp -= action.enemyDmg;
        this.playerHp += action.playerHeal;
        this.playerHp -= action.playerDmg; // E.g., Overexert recoil

        if (action.enemyDmg > 0) logMsg += `Dealt ${action.enemyDmg} damage. `;
        if (action.playerHeal > 0) logMsg += `Healed ${action.playerHeal} HP. `;
        if (action.playerDmg > 0) logMsg += `Lost ${action.playerDmg} HP. `;

        // Specific mechanical behaviors
        if (action.type === 'suppress') {
            this.suppressNextRound = true;
            logMsg += `Enemy will be suppressed NEXT round! `;
        } else if (action.type === 'extra_action') {
            this.extraActionPending = true;
            logMsg += `The Man pushes through for an immediate extra action! `;
        } else if (action.type === 'shift') {
            logMsg += `The Girl shifts her emotion... (mysterious aura surrounds her). `;
        }

        // 2. Process Enemy Retaliation immediately
        const enemySurvives = this.enemyHp > 0;
        if (enemySurvives) {
            let actualEnemyDmg = this.baseEnemyDamage;
            
            // Check if enemy was suppressed from the LAST round
            if (this.isSuppressedThisRound) {
                actualEnemyDmg = Math.floor(this.baseEnemyDamage / 2);
            }

            this.playerHp -= actualEnemyDmg;
            logMsg += `\nEnemy retaliates for ${actualEnemyDmg} damage!`;
        }

        this.updateHpDisplays();
        this.actionLogText.setText(logMsg);

        // 3. Round resolution check
        if (this.checkGameEnd()) return;

        // 4. Proceed to next round OR wait for extra action
        if (this.extraActionPending) {
            this.extraActionPending = false; 
            // We just let the player act again with the SAME character. The UI labels stay the same.
            this.actionLogText.setText(this.actionLogText.text + `\nTake your extra action!`);
        } else {
            // Normal flow: proceed to next round and pick new random character
            this.nextRound();
        }
    }

    updateHpDisplays() {
        this.playerHpText.setText(`Player HP: ${Math.max(0, this.playerHp)}`);
        this.enemyHpText.setText(`Enemy HP: ${Math.max(0, this.enemyHp)}`);
    }

    checkGameEnd() {
        if (this.enemyHp <= 0) {
            this.endGame('YOU WIN', '#2ecc71');
            return true;
        } else if (this.playerHp <= 0) {
            this.endGame('YOU LOSE', '#e74c3c');
            return true;
        }
        return false;
    }

    endGame(message, colorStr) {
        this.isGameOver = true;
        
        // Hide standard action buttons
        this.buttons.forEach(btn => btn.setVisible(false));
        this.actionLogText.setVisible(false);
        this.activeCharacterText.setVisible(false);
        
        // Show Game Over UI
        this.gameOverText.setText(message).setFill(colorStr).setVisible(true);
        this.restartButton.setVisible(true);
    }
}
