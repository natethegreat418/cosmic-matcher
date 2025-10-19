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
import { getCanvasDimensions } from './config/ResponsiveConfig';
import { DEV_CONFIG } from './game/DevConfig';
import { DevSceneNavigator } from './game/DevSceneNavigator';

const dimensions = getCanvasDimensions();

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

// Initialize dev navigation in development mode
let devNavigator: DevSceneNavigator | null = null;
let devNavState: any = null;
let devInitialScene: string | null = null;

if (DEV_CONFIG.enabled) {
  devNavigator = DevSceneNavigator.getInstance();
  devNavState = devNavigator.parseURLParams();

  if (devNavState) {
    // Apply dev state before starting the game
    devNavigator.applyState(devNavState);
    // Get the initial scene to start
    devInitialScene = devNavigator.getInitialScene(devNavState);
  }
}

// Check URL parameters to determine game flow
const urlParams = new URLSearchParams(window.location.search);
const shouldContinue = urlParams.has('continue');
const shouldStartNew = urlParams.has('new');
const shouldShowLeaderboard = urlParams.has('leaderboard');

// Only handle normal URL params if not in dev navigation mode
if (!devNavState) {
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
}

const game = new Phaser.Game(config);

// Pass game instance to dev navigator
if (devNavigator) {
  devNavigator.setPhaserGame(game);
}

// Handle scene starting based on URL parameters
game.events.once('ready', () => {
  if (devInitialScene) {
    // Dev navigation: start the specified scene
    game.scene.start(devInitialScene);
  } else if (shouldShowLeaderboard) {
    // Handle leaderboard parameter
    game.scene.start('LeaderboardScene');
  }
  // Otherwise, Phaser will start the first scene in the config
});
