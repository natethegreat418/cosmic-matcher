import './style.css'
import * as Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { RoundTransitionScene } from './scenes/RoundTransitionScene';
import { ShopScene } from './scenes/ShopScene';
import { GameOverScene } from './scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 900,  // Increased width to accommodate UI
  height: 700,
  parent: 'app',
  backgroundColor: '#2a2a2a',
  scene: [GameScene, RoundTransitionScene, ShopScene, GameOverScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  }
};

new Phaser.Game(config);
