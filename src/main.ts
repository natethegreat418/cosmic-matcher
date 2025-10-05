import './style.css'
import * as Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { RoundTransitionScene } from './scenes/RoundTransitionScene';
import { ShopScene } from './scenes/ShopScene';
import { GameOverScene } from './scenes/GameOverScene';
import { NameEntryScene } from './scenes/NameEntryScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { LocalStorageManager } from './services/LocalStorageManager';
import { GameProgressManager } from './game/GameProgressManager';
import { ShopSystem } from './game/ShopSystem';

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
  scene: [GameScene, RoundTransitionScene, ShopScene, GameOverScene, NameEntryScene, LeaderboardScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

// Check URL parameters to determine game flow
const urlParams = new URLSearchParams(window.location.search);
const shouldContinue = urlParams.has('continue');
const shouldStartNew = urlParams.has('new');
const shouldShowLeaderboard = urlParams.has('leaderboard');

if (shouldContinue) {
  // Load saved game
  const savedState = LocalStorageManager.loadGame();

  if (savedState) {
    const progressManager = GameProgressManager.getInstance();
    const shopSystem = ShopSystem.getInstance();

    progressManager.loadFromSave(savedState);
    shopSystem.loadPurchaseCounts(savedState.shopPurchaseCounts);
  }
} else if (shouldStartNew) {
  // Start new game (clear any existing save)
  const progressManager = GameProgressManager.getInstance();
  progressManager.startNewGame();
}
// If no parameters, just start fresh (default behavior)

const game = new Phaser.Game(config);

// Handle leaderboard parameter - start the leaderboard scene
if (shouldShowLeaderboard) {
  game.events.once('ready', () => {
    game.scene.start('LeaderboardScene');
  });
}
