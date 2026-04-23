import Phaser from 'phaser';

const ALL_CHARACTERS = ['Girl', 'Officer', 'Man'];

export class BattleScene extends Phaser.Scene {
    constructor() {
        super('BattleScene');
    }

    init(data) {
        this.currentCycle = data.cycle || 1;
        this.baseEnemyHp = this.currentCycle === 1 ? 300 : (this.currentCycle === 2 ? 150 : 400);

        this.characters = data.characters || {
            'Girl': { hp: 100, maxHp: 100, animalHp: 100, isDead: false, comfortCooldown: 0, encourageCooldown: 0 },
            'Officer': { hp: 150, maxHp: 150, isDead: false },
            'Man': { hp: 200, maxHp: 200, isDead: false }
        };

        this.enemy = { hp: this.baseEnemyHp, maxHp: this.baseEnemyHp, type: this.getEnemyType(), turnCounter: 0 };
        this.isGameOver = false;
        
        let aliveChars = ALL_CHARACTERS.filter(c => !this.characters[c].isDead);
        if (data.activeCharacter && aliveChars.includes(data.activeCharacter)) {
            this.activeCharacter = data.activeCharacter;
        } else {
            this.activeCharacter = aliveChars.length > 0 ? Phaser.Utils.Array.GetRandom(aliveChars) : null;
        }

        this.inactives = aliveChars.filter(c => c !== this.activeCharacter);
        
        // Status Effects
        this.suppressEnemyNextTurn = false;
        this.guardNextTurn = false;
        this.officerProtectNextTurn = false;
        this.encourageNextAction = false;
        
        // Meltdown
        this.meltdownRoundsLeft = data.meltdownRoundsLeft || 0;
        this.meltdownStabilized = data.meltdownStabilized || false;
    }

    getEnemyType() {
        if (this.currentCycle === 1) return 'Tank';
        if (this.currentCycle === 2) return 'Charger';
        return 'Boss (Blitzer)';
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(10, 10, `Cycle: ${this.currentCycle} / 3 | Enemy: ${this.enemy.type}`, { fontSize: '20px', fill: '#fff' });

        this.playerRect = this.add.rectangle(width * 0.25, height * 0.4, 80, 150, 0x3498db);
        this.playerInfoText = this.add.text(width * 0.25, height * 0.4 - 100, '', {
            fontSize: '18px', fill: '#ffffff', fontStyle: 'bold', align: 'center'
        }).setOrigin(0.5);

        this.enemyRect = this.add.rectangle(width * 0.75, height * 0.4, 80, 150, 0xe74c3c);
        this.enemyInfoText = this.add.text(width * 0.75, height * 0.4 - 100, '', {
            fontSize: '18px', fill: '#ffffff', fontStyle: 'bold', align: 'center'
        }).setOrigin(0.5);

        this.actionLogText = this.add.text(width * 0.5, height * 0.3, 'Round Start! Waiting for your action...', {
            fontSize: '20px', fill: '#aaaaaa', align: 'center', wordWrap: { width: 400 }
        }).setOrigin(0.5);

        this.uiControlsText = this.add.text(width * 0.5, height * 0.8, '', {
            fontSize: '18px', fill: '#f1c40f', align: 'center', wordWrap: { width: 700 }
        }).setOrigin(0.5);

        this.meltdownText = this.add.text(width * 0.5, height * 0.15, '', {
            fontSize: '22px', fill: '#ff0000', align: 'center', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Keyboard setup
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
        this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE); // For Stabilize

        this.keyA.on('down', () => this.handlePlayerAction('A'));
        this.keyS.on('down', () => this.handlePlayerAction('S'));
        this.keyD.on('down', () => this.handlePlayerAction('D'));
        this.keyJ.on('down', () => this.handleAssist('J'));
        this.keyK.on('down', () => this.handleAssist('K'));
        this.keySpace.on('down', () => this.handleStabilize());

        this.events.on('shutdown', () => {
            this.input.keyboard.removeAllKeys(true);
        });

        this.updateUI();
    }

    getGirlEmotion() {
        if (this.characters['Girl'].isDead) return 'Dead';
        if (this.meltdownRoundsLeft > 0) return 'Meltdown';
        const animalHp = this.characters['Girl'].animalHp;
        const ratio = animalHp / 100;
        if (ratio >= 0.75) return 'Happy';
        if (ratio >= 0.5) return 'Neutral';
        if (ratio >= 0.25) return 'Upset';
        if (animalHp > 0) return 'Sad';
        return 'Sad'; // Fallback if 0 but meltdown ended
    }

    updateUI() {
        if (!this.activeCharacter) return;
        
        let cLog = `${this.activeCharacter}\nHP: ${Math.floor(this.characters[this.activeCharacter].hp)}/${this.characters[this.activeCharacter].maxHp}`;
        if (this.activeCharacter === 'Girl') {
            cLog += `\nAnimal: ${Math.floor(this.characters['Girl'].animalHp)}/100`;
            cLog += `\nEmotion: ${this.getGirlEmotion()}`;
            cLog += `\nCDs: Comfort(${this.characters['Girl'].comfortCooldown}), Encourage(${this.characters['Girl'].encourageCooldown})`;
        } else {
            if (!this.characters['Girl'].isDead) {
                cLog += `\n(Girl Inactive - Animal: ${Math.floor(this.characters['Girl'].animalHp)}/100 | Emotion: ${this.getGirlEmotion()})`;
            }
        }
        this.playerInfoText.setText(cLog);

        this.enemyInfoText.setText(`${this.enemy.type}\nHP: ${Math.floor(this.enemy.hp)}/${this.enemy.maxHp}`);

        let abilitiesTxt = '';
        if (this.activeCharacter === 'Girl') abilitiesTxt = `A: Pounce (Emotion Dmg) | S: Comfort (Heal Animal 25) | D: Encourage (Next 2x)\n`;
        else if (this.activeCharacter === 'Officer') abilitiesTxt = `A: Attack (15) | S: Suppress (Enemy dmg/2) | D: Guard (-50% dmg taken)\n`;
        else if (this.activeCharacter === 'Man') abilitiesTxt = `A: Attack (25) | S: Overexert (40 dmg, takes 15) | D: Push Through (Attack x2?)\n`;

        abilitiesTxt += '\nAssists:\n';
        if (this.inactives.length > 0) {
            abilitiesTxt += `J: ${this.inactives[0]} Assist  `;
            if (this.inactives.length > 1) {
                abilitiesTxt += `|  K: ${this.inactives[1]} Assist`;
            }
        }
        
        this.uiControlsText.setText(abilitiesTxt);

        if (this.meltdownRoundsLeft > 0) {
            this.meltdownText.setText(`MELTDOWN! (${this.meltdownRoundsLeft} rounds left)\nPress SPACE to Stabilize (Cost 20 HP to all)`);
        } else {
            this.meltdownText.setText('');
        }
    }

    handleStabilize() {
        if (this.isGameOver || this.meltdownRoundsLeft <= 0 || this.meltdownStabilized) return;
        
        this.meltdownRoundsLeft = 0;
        this.meltdownStabilized = true;
        
        // Cost 20 HP from all alive allies
        Object.keys(this.characters).forEach(c => {
            if (!this.characters[c].isDead) {
                this.characters[c].hp = Math.max(0, this.characters[c].hp - 20);
            }
        });

        this.actionLogText.setText(this.actionLogText.text + `\nStabilized meltdown! All allies took 20 DMG.`);
        this.postCombatResolution(); // Re-check defeats since HP dropped
    }

    handlePlayerAction(key) {
        if (this.isGameOver) {
            this.handleEndGameInput(key);
            return;
        }

        let dmg = 0;
        let heal = 0;
        let selfDmg = 0;
        let logMsg = '';

        let multiplier = this.encourageNextAction ? 2 : 1;
        this.encourageNextAction = false;
        
        // Decrement Cooldowns
        if (this.characters['Girl'].comfortCooldown > 0) this.characters['Girl'].comfortCooldown--;
        if (this.characters['Girl'].encourageCooldown > 0) this.characters['Girl'].encourageCooldown--;

        // Meltdown misfire
        if (this.meltdownRoundsLeft > 0 && Math.random() < 0.3) {
            logMsg += "Misfire due to Meltdown! Random Attack! ";
            dmg = 10 * multiplier;
            this.executeCombat(dmg, 0, 0, logMsg, false, 0); 
            return;
        }

        let manMultiplier = 1;
        if (this.activeCharacter === 'Man') {
            const hpRatio = this.characters['Man'].hp / this.characters['Man'].maxHp;
            if (hpRatio <= 0.1) manMultiplier = 1.15;
            else if (hpRatio <= 0.25) manMultiplier = 1.1;
        }

        let girlMultiplier = 1;
        if (this.activeCharacter === 'Girl') {
            if (key === 'A') { // Pounce
                const emotion = this.getGirlEmotion();
                let basePounce = 18;
                if (emotion === 'Happy') basePounce = 24;
                else if (emotion === 'Upset') basePounce = 14;
                else if (emotion === 'Sad') basePounce = 10;
                
                dmg = basePounce * multiplier;
                logMsg = `Girl uses Pounce! Deals ${dmg} dmg.`;
            } else if (key === 'S') { // Comfort
                if (this.characters['Girl'].comfortCooldown > 0) {
                    this.actionLogText.setText('Comfort is on cooldown!');
                    return;
                }
                this.characters['Girl'].comfortCooldown = 2; // Every other turn
                this.characters['Girl'].animalHp = Math.min(100, this.characters['Girl'].animalHp + (25 * multiplier));
                logMsg = `Girl uses Comfort, heals animal for ${25 * multiplier}.`;
            } else if (key === 'D') { // Encourage
                if (this.characters['Girl'].encourageCooldown > 0) {
                    this.actionLogText.setText('Encourage is on cooldown!');
                    return;
                }
                this.characters['Girl'].encourageCooldown = 2; // Every other turn
                this.encourageNextAction = true;
                logMsg = `Girl uses Encourage! Next action 2x effect.`;
            }
        } else if (this.activeCharacter === 'Officer') {
            if (key === 'A') {
                dmg = 15 * multiplier;
                logMsg = `Officer Attacks for ${dmg}!`;
            } else if (key === 'S') {
                this.suppressEnemyNextTurn = true;
                logMsg = `Officer used Suppress! Enemy damage halved next turn.`;
            } else if (key === 'D') {
                this.guardNextTurn = true;
                logMsg = `Officer Guards! Takes 50% damage next turn.`;
            }
        } else if (this.activeCharacter === 'Man') {
            if (key === 'A') {
                dmg = 25 * multiplier * manMultiplier;
                logMsg = `Man Attacks for ${Math.floor(dmg)}!`;
            } else if (key === 'S') {
                dmg = 40 * multiplier * manMultiplier;
                selfDmg = 15;
                logMsg = `Man Overexerts for ${Math.floor(dmg)} dmg! Pays 15 HP.`;
            } else if (key === 'D') {
                dmg = 25 * multiplier * manMultiplier; // Repeat basic attack
                logMsg = `Man Pushes Through! Attacks for ${Math.floor(dmg)}!`;
            }
        }
        
        // Passive: Man increases active damage by 5%
        if (dmg > 0 && this.inactives.includes('Man')) dmg *= 1.05;

        this.executeCombat(Math.floor(dmg), heal, selfDmg, logMsg, false, 0); // animal heal is processed directly above
    }

    handleAssist(key) {
        if (this.isGameOver) return;
        let assistTargetIndex = key === 'J' ? 0 : 1;
        if (assistTargetIndex >= this.inactives.length) return;
        
        let assistant = this.inactives[assistTargetIndex];
        let logMsg = '';
        
        if (assistant === 'Girl') {
            let heal = this.characters[this.activeCharacter].maxHp * 0.2;
            this.characters[this.activeCharacter].hp = Math.min(this.characters[this.activeCharacter].maxHp, this.characters[this.activeCharacter].hp + heal);
            logMsg = `Girl's Assist heals ${this.activeCharacter} for ${heal} HP!`;
        } else if (assistant === 'Officer') {
            this.officerProtectNextTurn = true;
            logMsg = `Officer's Assist will protect active character from the next attack!`;
        } else if (assistant === 'Man') {
            let dmg = this.enemy.hp * 0.2; // 20% CURRENT hp
            dmg = Math.floor(dmg);
            this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
            logMsg = `Man's Assist deals ${dmg} damage (20% enemy current HP)!`;
        }
        
        this.executeCombat(0, 0, 0, logMsg, true, 0); 
    }

    executeCombat(playerDmg, playerHeal, selfDmg, playerMsg, isAssist, animalHeal) {
        if (playerDmg > 0) this.enemy.hp -= playerDmg;
        if (selfDmg > 0) this.characters[this.activeCharacter].hp -= selfDmg;

        // Apply clamping
        this.clampHP();

        let totalMsg = playerMsg;

        // Check if Enemy Defeated Immediately
        if (this.enemy.hp <= 0) {
            this.updateUI();
            totalMsg += `\nEnemy defeated! Cycle ends.`;
            this.actionLogText.setText(totalMsg);
            this.endCycle(true);
            return;
        }

        // --- ENEMY TURN ---
        let enemyDmgBase = 0;
        this.enemy.turnCounter++;

        if (this.enemy.type === 'Tank') {
            enemyDmgBase = 10;
        } else if (this.enemy.type === 'Charger') {
            if (this.enemy.turnCounter % 3 === 0) {
                enemyDmgBase = 40;
                totalMsg += `\nCharger unloads its payload!`;
            } else {
                totalMsg += `\nCharger is charging up...`;
            }
        } else {
            enemyDmgBase = 20; // Boss Blitzer
        }

        if (enemyDmgBase > 0) {
            let finalEnemyDmg = enemyDmgBase;
            if (this.suppressEnemyNextTurn) finalEnemyDmg /= 2;
            if (this.guardNextTurn) finalEnemyDmg /= 2;
            
            if (this.officerProtectNextTurn) {
                finalEnemyDmg = 0;
                this.officerProtectNextTurn = false;
                totalMsg += `\nOfficer blocked the attack!`;
            } else {
                // Officer passive: reduce damage by 5 
                if (this.inactives.includes('Officer')) finalEnemyDmg = Math.max(0, finalEnemyDmg - 5);
            }

            finalEnemyDmg = Math.floor(finalEnemyDmg);
            this.characters[this.activeCharacter].hp -= finalEnemyDmg;
            
            if (this.activeCharacter === 'Girl' && finalEnemyDmg > 0) {
                this.characters['Girl'].animalHp -= finalEnemyDmg * 0.5;
            }

            totalMsg += `\nEnemy deals ${finalEnemyDmg} damage.`;
        }

        this.suppressEnemyNextTurn = false;
        this.guardNextTurn = false;

        // Clamp HP again after enemy damage
        this.clampHP();

        // Round processing
        if (this.meltdownRoundsLeft > 0) {
            this.meltdownRoundsLeft--;
            if (this.meltdownRoundsLeft === 0) totalMsg += `\nMeltdown has ended!`;
        } else {
            // Passive heal from Girl only if no meltdown
            if (this.inactives.includes('Girl')) {
                this.inactives.forEach(c => {
                    this.characters[c].hp = Math.min(this.characters[c].maxHp, this.characters[c].hp + this.characters[c].maxHp * 0.05);
                });
            }
        }

        this.clampHP();
        this.actionLogText.setText(totalMsg);
        
        this.postCombatResolution();
    }

    clampHP() {
        this.enemy.hp = Math.max(0, this.enemy.hp);
        Object.keys(this.characters).forEach(c => {
            this.characters[c].hp = Math.max(0, this.characters[c].hp);
        });
        this.characters['Girl'].animalHp = Math.max(0, this.characters['Girl'].animalHp);
    }

    postCombatResolution() {
        if (this.isGameOver) return; // Prevent double trigger
        
        let shouldUpdateUI = false;

        // Check if any character HP is 0
        Object.keys(this.characters).forEach(c => {
            if (this.characters[c].hp === 0 && !this.characters[c].isDead) {
                this.characters[c].isDead = true;
                this.actionLogText.setText(this.actionLogText.text + `\n${c} has been defeated!`);
                shouldUpdateUI = true;
            }
        });

        // 1. Check ALL characters DEAD
        let aliveChars = ALL_CHARACTERS.filter(c => !this.characters[c].isDead);
        if (aliveChars.length === 0) {
            this.endCycle(false);
            return;
        }

        // 2. Animal Defeat triggers Meltdown & Girl inactive
        if (this.characters['Girl'].animalHp === 0 && this.meltdownRoundsLeft === 0 && !this.meltdownStabilized && !this.characters['Girl'].isDead) {
            this.meltdownRoundsLeft = 2;
            this.actionLogText.setText(this.actionLogText.text + `\nAnimal Defeated! MELTDOWN TRIGGERED! Girl becomes inactive.`);
            
            // Force Girl to be inactive
            if (this.activeCharacter === 'Girl') {
                aliveChars = aliveChars.filter(c => c !== 'Girl');
                if (aliveChars.length > 0) {
                    this.activeCharacter = Phaser.Utils.Array.GetRandom(aliveChars);
                    shouldUpdateUI = true;
                }
            }
        }

        // 3. Active character is dead
        if (this.characters[this.activeCharacter] && this.characters[this.activeCharacter].isDead) {
            if (aliveChars.length > 0) {
                // If Girl is alive but in meltdown, can she be selected? 
                // Rule: "Girl is inactive during meltdown"
                if (this.meltdownRoundsLeft > 0) aliveChars = aliveChars.filter(c => c !== 'Girl');
                
                if (aliveChars.length > 0) {
                    this.activeCharacter = Phaser.Utils.Array.GetRandom(aliveChars);
                    this.actionLogText.setText(this.actionLogText.text + `\n${this.activeCharacter} steps in actively!`);
                } else {
                    // Everyone else dead, and Girl is in meltdown so she can't act... basically game over for this cycle
                    this.endCycle(false);
                    return;
                }
            }
        }
        
        // Re-evaluate inactives based on who is active
        this.inactives = ALL_CHARACTERS.filter(c => !this.characters[c].isDead && c !== this.activeCharacter);
        
        this.updateUI();
    }

    endCycle(win) {
        if (this.isGameOver) return; // Prevent double execution
        this.isGameOver = true;
        let grade = 'D';

        if (win) {
            let totalAlive = ALL_CHARACTERS.filter(c => !this.characters[c].isDead).length;
            let avgHpR = ALL_CHARACTERS.reduce((acc, c) => acc + (this.characters[c].isDead ? 0 : this.characters[c].hp / this.characters[c].maxHp), 0) / 3;

            if (totalAlive === 3 && avgHpR > 0.7) grade = 'S';
            else if (totalAlive === 3) grade = 'A';
            else if (totalAlive === 2) grade = 'B';
            else grade = 'C';
        }

        this.uiControlsText.setText('');
        this.meltdownText.setText('');
        this.actionLogText.setText(this.actionLogText.text + `\n\nCycle Ended! Grade: ${grade}\nPress A to proceed.`);
        this.nextCycleReady = true;
        this.playerRect.setVisible(false);
        this.enemyRect.setVisible(false);
        this.playerInfoText.setVisible(false);
        this.enemyInfoText.setVisible(false);
    }

    handleEndGameInput(key) {
        if (!this.nextCycleReady || key !== 'A') return;
        
        const clonedChars = JSON.parse(JSON.stringify(this.characters));
        Object.keys(clonedChars).forEach(c => clonedChars[c].activeCooldown = 0);
        // Ensure cooldowns and animal restart fresh for new cycle (or preserved if game design wants persistence)
        clonedChars['Girl'].comfortCooldown = 0;
        clonedChars['Girl'].encourageCooldown = 0;
        
        let aliveChars = ALL_CHARACTERS.filter(c => !clonedChars[c].isDead);
        
        if (aliveChars.length === 0 || this.currentCycle >= 3) {
            this.scene.start('BattleScene', { cycle: 1, characters: undefined });
        } else {
            this.scene.start('BattleScene', { 
                cycle: this.currentCycle + 1, 
                characters: clonedChars, 
                activeCharacter: this.activeCharacter,
                meltdownRoundsLeft: this.meltdownRoundsLeft,
                meltdownStabilized: this.meltdownStabilized
            });
        }
    }
}
