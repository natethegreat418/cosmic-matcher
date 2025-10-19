/**
 * Development Scene Navigator
 * Enables direct navigation to any game scene via URL parameters or global functions
 * Only active in development mode
 *
 * URL Parameters:
 * - ?scene=game|shop|transition|gameover
 * - &round=1-10
 * - &points=<number> (available points)
 * - &score=<number> (total score)
 * - &upgrades=phase_gun,tractor_beam (comma-separated)
 *
 * Global Functions (window.debugNav):
 * - goToScene(sceneName)
 * - setRound(roundNumber)
 * - addPoints(amount)
 * - setPoints(amount)
 * - addUpgrade(upgradeId)
 * - reset()
 */

import { DEV_CONFIG } from './DevConfig';
import { GameProgressManager } from './GameProgressManager';
import { ShopSystem } from './ShopSystem';
import { UpgradeManager } from './UpgradeManager';

type SceneName = 'game' | 'shop' | 'transition' | 'gameover';

interface DevNavState {
  scene?: SceneName;
  round?: number;
  points?: number;
  score?: number;
  upgrades?: string[];
}

export class DevSceneNavigator {
  private static instance: DevSceneNavigator | null = null;
  private phaserGame: Phaser.Game | null = null;

  private constructor() {
    if (!DEV_CONFIG.enabled) {
      console.warn('DevSceneNavigator only works in development mode');
      return;
    }

    // Expose global debug functions
    this.exposeGlobalFunctions();
    console.log('🛠️ Dev Navigation enabled! Use window.debugNav or URL params');
    console.log('Examples:');
    console.log('  - ?scene=shop&round=5&points=10000');
    console.log('  - debugNav.goToScene("gameover")');
    console.log('  - debugNav.setRound(7)');
  }

  public static getInstance(): DevSceneNavigator {
    if (!DevSceneNavigator.instance) {
      DevSceneNavigator.instance = new DevSceneNavigator();
    }
    return DevSceneNavigator.instance;
  }

  /**
   * Set the Phaser game instance for scene navigation
   */
  public setPhaserGame(game: Phaser.Game): void {
    this.phaserGame = game;
  }

  /**
   * Parse URL parameters and return dev nav state
   */
  public parseURLParams(): DevNavState | null {
    if (!DEV_CONFIG.enabled) return null;

    const params = new URLSearchParams(window.location.search);
    const state: DevNavState = {};

    // Parse scene
    const scene = params.get('scene');
    if (scene && this.isValidScene(scene)) {
      state.scene = scene as SceneName;
    }

    // Parse round
    const round = params.get('round');
    if (round) {
      const roundNum = parseInt(round, 10);
      if (roundNum >= 1 && roundNum <= 10) {
        state.round = roundNum;
      }
    }

    // Parse points
    const points = params.get('points');
    if (points) {
      const pointsNum = parseInt(points, 10);
      if (!isNaN(pointsNum) && pointsNum >= 0) {
        state.points = pointsNum;
      }
    }

    // Parse score
    const score = params.get('score');
    if (score) {
      const scoreNum = parseInt(score, 10);
      if (!isNaN(scoreNum) && scoreNum >= 0) {
        state.score = scoreNum;
      }
    }

    // Parse upgrades
    const upgrades = params.get('upgrades');
    if (upgrades) {
      state.upgrades = upgrades.split(',').map(u => u.trim()).filter(u => u.length > 0);
    }

    return Object.keys(state).length > 0 ? state : null;
  }

  /**
   * Apply dev nav state to game managers
   */
  public applyState(state: DevNavState): void {
    if (!DEV_CONFIG.enabled) return;

    const progressManager = GameProgressManager.getInstance();

    // Apply round
    if (state.round !== undefined) {
      this.setRound(state.round);
    }

    // Apply points
    if (state.points !== undefined) {
      this.setPoints(state.points);
    }

    // Apply score
    if (state.score !== undefined) {
      this.setScore(state.score);
    }

    // Apply upgrades
    if (state.upgrades && state.upgrades.length > 0) {
      state.upgrades.forEach(upgradeId => {
        this.addUpgrade(upgradeId);
      });
    }

    console.log('🛠️ Dev state applied:', {
      round: progressManager.getCurrentRound(),
      points: progressManager.getAvailablePoints(),
      score: progressManager.getTotalScore(),
      upgrades: progressManager.getOwnedUpgrades()
    });
  }

  /**
   * Get the initial scene to start based on URL params
   */
  public getInitialScene(state: DevNavState | null): string {
    if (!state || !state.scene) {
      return 'GameScene'; // Default
    }

    const sceneMap: Record<SceneName, string> = {
      'game': 'GameScene',
      'shop': 'ShopScene',
      'transition': 'RoundTransitionScene',
      'gameover': 'GameOverScene'
    };

    return sceneMap[state.scene] || 'GameScene';
  }

  /**
   * Navigate to a specific scene programmatically
   */
  public goToScene(sceneName: SceneName): void {
    if (!DEV_CONFIG.enabled || !this.phaserGame) {
      console.warn('Dev navigation not available');
      return;
    }

    const sceneMap: Record<SceneName, string> = {
      'game': 'GameScene',
      'shop': 'ShopScene',
      'transition': 'RoundTransitionScene',
      'gameover': 'GameOverScene'
    };

    const phaserSceneName = sceneMap[sceneName];
    if (!phaserSceneName) {
      console.error(`Unknown scene: ${sceneName}`);
      return;
    }

    // Stop all scenes and start the requested one
    this.phaserGame.scene.scenes.forEach(scene => {
      if (scene.scene.isActive()) {
        this.phaserGame!.scene.stop(scene.scene.key);
      }
    });

    this.phaserGame.scene.start(phaserSceneName);
    console.log(`🛠️ Navigated to ${sceneName} (${phaserSceneName})`);
  }

  /**
   * Set the current round number
   */
  public setRound(round: number): void {
    if (!DEV_CONFIG.enabled) return;

    if (round < 1 || round > 10) {
      console.error('Round must be between 1 and 10');
      return;
    }

    const progressManager = GameProgressManager.getInstance();
    // Access private property via type assertion for dev purposes
    (progressManager as any).progress.currentRound = round;
    console.log(`🛠️ Round set to ${round}`);
  }

  /**
   * Set available points (replaces current value)
   */
  public setPoints(points: number): void {
    if (!DEV_CONFIG.enabled) return;

    if (points < 0) {
      console.error('Points cannot be negative');
      return;
    }

    const progressManager = GameProgressManager.getInstance();
    (progressManager as any).progress.availablePoints = points;
    console.log(`🛠️ Available points set to ${points}`);
  }

  /**
   * Add points to available points
   */
  public addPoints(amount: number): void {
    if (!DEV_CONFIG.enabled) return;

    const progressManager = GameProgressManager.getInstance();
    const current = progressManager.getAvailablePoints();
    this.setPoints(current + amount);
  }

  /**
   * Set total score
   */
  public setScore(score: number): void {
    if (!DEV_CONFIG.enabled) return;

    if (score < 0) {
      console.error('Score cannot be negative');
      return;
    }

    const progressManager = GameProgressManager.getInstance();
    (progressManager as any).progress.totalScore = score;
    console.log(`🛠️ Total score set to ${score}`);
  }

  /**
   * Add an upgrade to the player
   */
  public addUpgrade(upgradeId: string): void {
    if (!DEV_CONFIG.enabled) return;

    const progressManager = GameProgressManager.getInstance();
    progressManager.addUpgrade(upgradeId);
    console.log(`🛠️ Added upgrade: ${upgradeId}`);
  }

  /**
   * Reset game state to initial
   */
  public reset(): void {
    if (!DEV_CONFIG.enabled) return;

    GameProgressManager.resetInstance();
    ShopSystem.resetInstance();
    UpgradeManager.resetInstance();

    console.log('🛠️ Game state reset to initial');

    // Reload page to start fresh
    window.location.href = window.location.pathname;
  }

  /**
   * Expose global debug functions on window object
   */
  private exposeGlobalFunctions(): void {
    (window as any).debugNav = {
      goToScene: this.goToScene.bind(this),
      setRound: this.setRound.bind(this),
      setPoints: this.setPoints.bind(this),
      addPoints: this.addPoints.bind(this),
      setScore: this.setScore.bind(this),
      addUpgrade: this.addUpgrade.bind(this),
      reset: this.reset.bind(this),

      // Helper to show current state
      showState: () => {
        const progressManager = GameProgressManager.getInstance();
        console.log('Current Game State:', {
          round: progressManager.getCurrentRound(),
          totalScore: progressManager.getTotalScore(),
          availablePoints: progressManager.getAvailablePoints(),
          ownedUpgrades: progressManager.getOwnedUpgrades(),
          isComplete: progressManager.isGameComplete()
        });
      },

      // Helper to show help
      help: () => {
        console.log('🛠️ Dev Navigation Commands:');
        console.log('  debugNav.goToScene("game"|"shop"|"transition"|"gameover")');
        console.log('  debugNav.setRound(1-10)');
        console.log('  debugNav.setPoints(amount)');
        console.log('  debugNav.addPoints(amount)');
        console.log('  debugNav.setScore(amount)');
        console.log('  debugNav.addUpgrade("upgrade_id")');
        console.log('  debugNav.showState()');
        console.log('  debugNav.reset()');
        console.log('');
        console.log('🛠️ URL Parameters:');
        console.log('  ?scene=shop&round=5&points=10000&score=15000');
        console.log('  &upgrades=phase_gun,tractor_beam');
      }
    };
  }

  /**
   * Validate scene name
   */
  private isValidScene(scene: string): scene is SceneName {
    return ['game', 'shop', 'transition', 'gameover'].includes(scene);
  }

  public static resetInstance(): void {
    DevSceneNavigator.instance = null;
  }
}
