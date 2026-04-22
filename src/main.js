import Phaser from 'phaser';
import { BattleScene } from './BattleScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#333333',
  scene: [BattleScene],
};

new Phaser.Game(config);
