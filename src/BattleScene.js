import Phaser from 'phaser';

const ALL_CHARACTERS = ['Girl', 'Officer', 'Man'];
const ENEMIES = ['Blitzer', 'Tank', 'Charger'];

export class BattleScene extends Phaser.Scene {
    constructor() {
        super('BattleScene');
    }

    preload() {
        this.load.image('stage_girl', 'assests/stages/paradise.png');
        this.load.image('stage_officer', 'assests/stages/ximending.png');
        this.load.image('stage_man', 'assests/stages/mardi_gras.png');

        this.load.image('char_Girl', 'assests/characters/girl/girl.png');
        this.load.image('char_Officer', 'assests/characters/officer/officer.png');
        this.load.image('char_Man', 'assests/characters/man/man.png');
    }

    getGirlEmotion() {
        if (this.characters['Girl'].isDead) return 'Defeated';
        return this.characters['Girl'].animalHp > 50 ? 'Happy' : 'Sad';
    }

    init() {
        // Init properties
        this.characters = {
            'Girl': { animalHp: 100, maxAnimalHp: 100 },
            'Officer': { hp: 150, maxHp: 150 },
            'Man': { hp: 200, maxHp: 200 }
        };
        
        let aliveChars = ALL_CHARACTERS.map(c => c);
        this.activeCharacter = Phaser.Utils.Array.GetRandom(aliveChars);
        this.inactives = aliveChars.filter(c => c !== this.activeCharacter);

        const enemyType = Phaser.Utils.Array.GetRandom(ENEMIES);
        let enemyHp = 300;
        if (enemyType === 'Tank') enemyHp = 500;
        if (enemyType === 'Blitzer') enemyHp = 250;
        this.enemy = { type: enemyType, hp: enemyHp, maxHp: enemyHp, intent: null, turnCounter: 0 };
        
        this.isGameOver = false;
        
        // Cooldowns & Status tracking
        this.cooldowns = { girlComfort: 0, girlEncourage: 0, assist0: 0, assist1: 0 };
        this.status = { suppress: false, guard: false, protect: false, encourage: false, brace: false };

        this.updateEnemyIntent();
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.bgStage = this.add.image(width / 2, height / 2, 'stage_' + this.activeCharacter.toLowerCase());
        this.bgStage.setDisplaySize(width, height);
        this.bgStage.setDepth(-1);

        // Graphics for health bars
        this.graphics = this.add.graphics();

        // 1. Enemy Layout (Right Side)
        this.enemyRect = this.add.rectangle(width * 0.75, height * 0.65, 100, 150, 0xe74c3c);
        this.enemyText = this.add.text(width * 0.75, height * 0.65 - 90, '', { fontSize: '18px', fill: '#fff', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
        this.intentText = this.add.text(width * 0.5, height * 0.1, '', { fontSize: '24px', fill: '#e74c3c', fontStyle: 'bold', align: 'center', backgroundColor: '#00000088' }).setOrigin(0.5);

        // 2. Active Character (Bottom Left)
        this.playerSprite = this.add.image(width * 0.25, height * 0.65, 'char_' + this.activeCharacter);
        this.playerSprite.setDisplaySize(150, 150);
        this.playerText = this.add.text(width * 0.25, height * 0.65 - 90, '', { fontSize: '18px', fill: '#fff', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);

        // 3. Inactive Allies (Side Panels)
        this.inactiveSprites = [];
        this.inactiveTexts = [];
        this.inactives.forEach((charName, i) => {
            let xPos = width * 0.08;
            let yPos = height * 0.3 + (i * 180);
            let s = this.add.image(xPos, yPos, 'char_' + charName);
            s.setDisplaySize(80, 80);
            s.setAlpha(0.6);
            let t = this.add.text(xPos, yPos - 50, '', { fontSize: '14px', fill: '#ccc', align: 'center' }).setOrigin(0.5);
            this.inactiveSprites.push(s);
            this.inactiveTexts.push(t);
        });

        // 4. Action Log
        this.actionLogText = this.add.text(width * 0.5, height * 0.45, 'Battle Start! Choose an action.', {
            fontSize: '20px', fill: '#aaaaaa', align: 'center', wordWrap: { width: 400 }, backgroundColor: '#000000aa'
        }).setOrigin(0.5);

        // 5. Controls Bottom Center
        this.uiControlsText = this.add.text(width * 0.5, height * 0.85, '', {
            fontSize: '18px', fill: '#f1c40f', align: 'center', wordWrap: { width: 700 }, backgroundColor: '#000000bb'
        }).setOrigin(0.5);

        // Input
        this.input.keyboard.on('keydown', this.handleInput, this);

        this.updateUI();
    }

    updateEnemyIntent() {
        this.enemy.turnCounter++;
        let e = this.enemy;
        this.status.brace = false; // reset previous brace if any, handle in turn
        
        if (e.type === 'Blitzer') {
            if (e.turnCounter % 2 === 0) {
                e.intent = { name: 'Double Strike', dmg: 20, desc: 'Will attack twice rapidly! (20x2 dmg)', hits: 2 };
            } else {
                e.intent = { name: 'Strike', dmg: 30, desc: 'Will deal quick damage. (30 dmg)', hits: 1 };
            }
        } else if (e.type === 'Tank') {
            if (e.turnCounter % 3 === 0) {
                e.intent = { name: 'Heavy Slam', dmg: 50, desc: 'Preparing a massive slam! (50 dmg)', hits: 1 };
            } else if (e.turnCounter % 3 === 2) {
                e.intent = { name: 'Heavy Strike', dmg: 35, desc: 'Heavy Attack (35 dmg)', hits: 1 };
            } else {
                e.intent = { name: 'Brace', dmg: 0, desc: 'Defending. Takes reduced damage next turn.', hits: 0, effect: 'brace' };
            }
        } else if (e.type === 'Charger') {
            if (e.turnCounter % 3 === 0) {
                e.intent = { name: 'Unleash', dmg: 70, desc: 'UNLEASHING CHARGED ATTACK! (70 dmg)', hits: 1 };
            } else {
                e.intent = { name: 'Charge', dmg: 0, desc: 'Charging power...', hits: 0 };
            }
        }
    }

    handleInput(event) {
        if (this.isGameOver) {
            if (event.code === 'KeyR') {
                this.scene.restart();
            }
            return;
        }

        const key = event.key.toUpperCase();
        let tookAction = false;
        let playerLog = '';
        let pdmg = 0, selfDmg = 0;
        let encourageMult = this.status.encourage ? 2 : 1;
        this.status.encourage = false;

        // Decrease Cooldowns before resolving this turn's actions
        if (this.cooldowns.girlComfort > 0) this.cooldowns.girlComfort--;
        if (this.cooldowns.girlEncourage > 0) this.cooldowns.girlEncourage--;
        if (this.cooldowns.assist0 > 0) this.cooldowns.assist0--;
        if (this.cooldowns.assist1 > 0) this.cooldowns.assist1--;

        // Action resolution
        if (this.activeCharacter === 'Girl') {
            if (key === 'A') { // Pounce
                let base = this.characters['Girl'].animalHp > 50 ? 24 : 10;
                pdmg = base * encourageMult;
                playerLog = `Girl uses Pounce! Deals ${pdmg} damage.`;
                tookAction = true;
            } else if (key === 'S') { // Comfort
                if (this.cooldowns.girlComfort > 0) { this.floatText(this.playerSprite, "Cooldown!", '#e74c3c'); return; }
                this.cooldowns.girlComfort = 2; // Sets cooldown
                let heal = 25 * encourageMult;
                this.characters['Girl'].animalHp = Math.min(100, this.characters['Girl'].animalHp + heal);
                playerLog = `Girl comforts Animal! Heals ${heal} HP.`;
                this.showHeal(this.playerSprite, heal);
                tookAction = true;
            } else if (key === 'D') { // Encourage
                if (this.cooldowns.girlEncourage > 0) { this.floatText(this.playerSprite, "Cooldown!", '#e74c3c'); return; }
                this.cooldowns.girlEncourage = 2;
                this.status.encourage = true;
                playerLog = `Girl uses Encourage! Next action 2x effect.`;
                this.floatText(this.playerSprite, "Encouraged!", '#f1c40f');
                tookAction = true;
            }
        } else if (this.activeCharacter === 'Officer') {
            if (key === 'A') {
                pdmg = 15 * encourageMult;
                playerLog = `Officer Attacks! Deals ${pdmg} damage.`;
                tookAction = true;
            } else if (key === 'S') {
                this.status.suppress = true;
                playerLog = `Officer Suppresses enemy! Halves their damage this round.`;
                this.floatText(this.enemyRect, "Suppressed!", '#3498db');
                tookAction = true;
            } else if (key === 'D') {
                this.status.guard = true;
                playerLog = `Officer Guards! Ready to mitigate half damage.`;
                this.floatText(this.playerSprite, "Guarding!", '#3498db');
                tookAction = true;
            }
        } else if (this.activeCharacter === 'Man') {
            if (key === 'A') {
                pdmg = 25 * encourageMult;
                playerLog = `Man Attacks! Deals ${pdmg} damage.`;
                tookAction = true;
            } else if (key === 'S') {
                pdmg = 40 * encourageMult;
                selfDmg = 15;
                playerLog = `Man Overexerts! Takes 15 damage to deal ${pdmg}.`;
                tookAction = true;
            } else if (key === 'D') {
                pdmg = 35 * encourageMult;
                playerLog = `Man Pushes Through! Deals ${pdmg} damage.`;
                tookAction = true;
            }
        }

        if (!tookAction) {
            // Check Assists
            if (key === 'J' && this.inactives.length > 0) {
                if (this.cooldowns.assist0 > 0) { this.floatText(this.inactiveSprites[0], "Cooldown!", '#e74c3c'); return; }
                playerLog = this.executeAssist(0);
                tookAction = true;
            } else if (key === 'K' && this.inactives.length > 1) {
                if (this.cooldowns.assist1 > 0) { this.floatText(this.inactiveSprites[1], "Cooldown!", '#e74c3c'); return; }
                playerLog = this.executeAssist(1);
                tookAction = true;
            }
        }

        if (tookAction) {
            this.input.keyboard.enabled = false; // block inputs during resolution
            this.resolveTurn(playerLog, pdmg, selfDmg);
        }
    }

    executeAssist(index) {
        let assistChar = this.inactives[index];
        index === 0 ? this.cooldowns.assist0 = 3 : this.cooldowns.assist1 = 3;
        
        let msg = '';
        if (assistChar === 'Girl') {
            let activeObj = this.characters[this.activeCharacter];
            let heal = 30;
            activeObj.hp = Math.min(activeObj.maxHp, activeObj.hp + heal);
            msg = `Girl Assist: Heals active character for 30 HP!`;
            this.showHeal(this.playerSprite, heal);
        } else if (assistChar === 'Officer') {
            this.status.protect = true;
            msg = `Officer Assist: Protecting from next enemy action!`;
            this.floatText(this.playerSprite, "Protected!", '#3498db');
        } else if (assistChar === 'Man') {
            msg = `Man Assist: Unleashes flat burst damage (40)!`;
            this.applyDamageToEnemy(40);
        }
        return msg;
    }

    resolveTurn(playerMsg, playerDmg, selfDmg) {
        // Update Log immediately so player can see feedback
        this.actionLogText.setText(playerMsg);
        
        if (selfDmg > 0) {
            this.characters[this.activeCharacter].hp -= selfDmg;
            this.showDamage(this.playerSprite, selfDmg);
        }

        if (playerDmg > 0) {
            if (this.status.brace) playerDmg = Math.floor(playerDmg / 2); // Tank brace mitigates
            this.applyDamageToEnemy(playerDmg);
        }

        // Wait a beat before enemy acts
        this.time.delayedCall(1000, this.resolveEnemyAction, [], this);
    }

    applyDamageToEnemy(dmg) {
        this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
        this.showDamage(this.enemyRect, dmg);
        this.flashSprite(this.enemyRect);
        if (this.enemy.hp > 0) this.cameras.main.shake(100, 0.01);
    }

    resolveEnemyAction() {
        if (this.enemy.hp <= 0) {
            this.endBattle(true);
            return;
        }

        let e = this.enemy;
        let eLog = `Enemy executes: ${e.intent.name}!`;

        if (e.intent.effect === 'brace') {
            this.status.brace = true;
            this.floatText(this.enemyRect, "Braced!", '#3498db');
        }

        if (e.intent.hits > 0) {
            let hitsRemaining = e.intent.hits;
            let dmgPerHit = e.intent.dmg;

            if (this.status.suppress) dmgPerHit = Math.ceil(dmgPerHit / 2);
            if (this.status.guard) dmgPerHit = Math.ceil(dmgPerHit / 2);

            let applyHit = () => {
                if (this.isGameOver) return;
                let actualDmg = dmgPerHit;
                if (this.status.protect) {
                    actualDmg = 0;
                    this.status.protect = false;
                    this.floatText(this.playerSprite, "Blocked!", '#3498db');
                } else {
                    if (this.activeCharacter === 'Girl') {
                        this.characters['Girl'].animalHp = Math.max(0, this.characters['Girl'].animalHp - actualDmg);
                    } else {
                        this.characters[this.activeCharacter].hp = Math.max(0, this.characters[this.activeCharacter].hp - actualDmg);
                    }
                    this.showDamage(this.playerSprite, actualDmg);
                    this.flashSprite(this.playerSprite);
                    this.cameras.main.shake(150, 0.015);
                }

                hitsRemaining--;
                if (hitsRemaining > 0) {
                    this.time.delayedCall(400, applyHit, [], this);
                } else {
                    this.postTurnCleanup(eLog);
                }
            };
            applyHit();
            return; // clean-up is done chronologically after hits
        }

        this.postTurnCleanup(eLog);
    }

    postTurnCleanup(enemyLog) {
        this.actionLogText.setText(this.actionLogText.text + '\n' + enemyLog);
        this.status.suppress = false;
        this.status.guard = false;
        
        let isDefeated = false;
        if (this.activeCharacter === 'Girl' && this.characters['Girl'].animalHp <= 0) isDefeated = true;
        if (this.activeCharacter !== 'Girl' && this.characters[this.activeCharacter].hp <= 0) isDefeated = true;
        
        if (isDefeated) {
            this.characters[this.activeCharacter].isDead = true;
            let aliveChars = ALL_CHARACTERS.filter(c => !this.characters[c].isDead);
            if (aliveChars.length === 0) {
                this.endBattle(false);
                return;
            } else {
                this.actionLogText.setText(this.actionLogText.text + `\n${this.activeCharacter} was defeated and swapped!`);
                this.activeCharacter = Phaser.Utils.Array.GetRandom(aliveChars);
                this.inactives = aliveChars.filter(c => c !== this.activeCharacter);
                if (this.bgStage) this.bgStage.setTexture('stage_' + this.activeCharacter.toLowerCase());
            }
        }
        
        this.updateEnemyIntent();
        this.updateUI();
        this.input.keyboard.enabled = true;
    }

    endBattle(isVictory) {
        this.isGameOver = true;
        this.actionLogText.setText(isVictory ? "VICTORY!\n\nPress R to Restart Test" : "DEFEAT...\n\nPress R to Restart Test");
        this.uiControlsText.setText('');
        this.intentText.setText('');
        this.updateUI(); // Updates bars one last time
        this.input.keyboard.enabled = true; // allow R key
    }

    // --- Aesthetics & UI Helpers ---

    updateUI() {
        this.graphics.clear();
        if (this.isGameOver) return; // Freeze UI

        if (this.playerSprite && this.activeCharacter) this.playerSprite.setTexture('char_' + this.activeCharacter);

        // Intent
        this.intentText.setText(`ENEMY INTENT:\n[ ${this.enemy.intent.name.toUpperCase()} ]\n${this.enemy.intent.desc}`);

        // Enemy info
        this.enemyText.setText(`${this.enemy.type}\nHP: ${Math.floor(this.enemy.hp)}/${this.enemy.maxHp}`);
        this.drawHealthBar(this.enemyRect.x - 50, this.enemyRect.y + 85, 100, 10, this.enemy.hp, this.enemy.maxHp);

        // Active Player
        let actT = '';
        if (this.activeCharacter === 'Girl') {
            actT = `Girl (Emotion: ${this.getGirlEmotion()})\nAnimal: ${Math.floor(this.characters['Girl'].animalHp)}/100`;
            this.drawHealthBar(this.playerSprite.x - 75, this.playerSprite.y + 85, 150, 12, this.characters['Girl'].animalHp, this.characters['Girl'].maxAnimalHp);
        } else {
            actT = `${this.activeCharacter}\nHP: ${Math.floor(this.characters[this.activeCharacter].hp)}/${this.characters[this.activeCharacter].maxHp}`;
            this.drawHealthBar(this.playerSprite.x - 75, this.playerSprite.y + 85, 150, 12, this.characters[this.activeCharacter].hp, this.characters[this.activeCharacter].maxHp);
        }
        this.playerText.setText(actT);

        // Inactives
        this.inactives.forEach((charName, i) => {
            this.inactiveSprites[i].setTexture('char_' + charName);
            this.inactiveSprites[i].setVisible(true);
            if (charName === 'Girl') {
                this.inactiveTexts[i].setText(`Girl\n${this.getGirlEmotion()}`);
                this.drawHealthBar(this.inactiveSprites[i].x - 40, this.inactiveSprites[i].y + 50, 80, 8, this.characters['Girl'].animalHp, this.characters['Girl'].maxAnimalHp);
            } else {
                this.inactiveTexts[i].setText(`${charName}\nHP: ${Math.floor(this.characters[charName].hp)}/${this.characters[charName].maxHp}`);
                this.drawHealthBar(this.inactiveSprites[i].x - 40, this.inactiveSprites[i].y + 50, 80, 8, this.characters[charName].hp, this.characters[charName].maxHp);
            }
        });
        
        for (let i = this.inactives.length; i < 2; i++) {
            if (this.inactiveSprites[i]) this.inactiveSprites[i].setVisible(false);
            if (this.inactiveTexts[i]) this.inactiveTexts[i].setText('');
        }

        // Controls Box
        let controls = '';
        if (this.activeCharacter === 'Girl') {
            controls = `A: Pounce | S: Comfort (CD: ${this.cooldowns.girlComfort}) | D: Encourage (CD: ${this.cooldowns.girlEncourage})\n`;
        } else if (this.activeCharacter === 'Officer') {
            controls = `A: Attack | S: Suppress | D: Guard\n`;
        } else if (this.activeCharacter === 'Man') {
            controls = `A: Attack | S: Overexert | D: Push Through\n`;
        }

        if (this.inactives.length > 0) {
            controls += `Assists:\nJ: ${this.inactives[0]} (CD: ${this.cooldowns.assist0}) `;
            if (this.inactives.length > 1) {
                controls += `| K: ${this.inactives[1]} (CD: ${this.cooldowns.assist1})`;
            }
        }
        this.uiControlsText.setText(controls);
    }

    drawHealthBar(x, y, w, h, current, max) {
        this.graphics.fillStyle(0x000000);
        this.graphics.fillRect(x, y, w, h);
        if (current > 0) {
            let ratio = current / max;
            let color = 0x2ecc71; // green
            if (ratio < 0.25) color = 0xe74c3c; // red
            else if (ratio < 0.5) color = 0xf1c40f; // yellow
            this.graphics.fillStyle(color);
            this.graphics.fillRect(x, y, w * ratio, h);
        }
    }

    showDamage(target, amount) {
        if (amount === 0) return;
        this.floatText(target, `-${amount}`, '#e74c3c');
    }

    showHeal(target, amount) {
        if (amount === 0) return;
        this.floatText(target, `+${Math.floor(amount)}`, '#2ecc71');
    }

    floatText(target, text, color) {
        let t = this.add.text(target.x, target.y - 40, text, { fontSize: '24px', fill: color, fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        this.tweens.add({
            targets: t, y: target.y - 100, alpha: 0, duration: 1000,
            onComplete: () => t.destroy()
        });
    }

    flashSprite(sprite) {
        if (sprite.setTintFill && sprite.clearTint) {
            sprite.setTintFill(0xffcccc);
            this.time.delayedCall(150, () => sprite.clearTint());
        } else {
            sprite.setAlpha(0.5);
            this.time.delayedCall(150, () => sprite.setAlpha(1));
        }
    }
}
