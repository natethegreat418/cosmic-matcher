import './style.css'
import * as Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { RoundTransitionScene } from './scenes/RoundTransitionScene';
import { ShopScene } from './scenes/ShopScene';
import { GameOverScene } from './scenes/GameOverScene';

// Calculate responsive dimensions for mobile and desktop
const getGameDimensions = () => {
  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    return {
      width: Math.min(window.innerWidth, 500),
      height: window.innerHeight
    };
  }
  return { width: 900, height: 700 };
};

const dimensions = getGameDimensions();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: dimensions.width,
  height: dimensions.height,
  parent: 'app',
  backgroundColor: '#2a2a2a',
  scene: [GameScene, RoundTransitionScene, ShopScene, GameOverScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);
