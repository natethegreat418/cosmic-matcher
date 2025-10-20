import * as Phaser from 'phaser';
import { Grid } from '../game/Grid';
import { GameState } from '../game/GameState';
import { GameProgressManager } from '../game/GameProgressManager';
import { LocalStorageManager } from '../services/LocalStorageManager';
import { GAME_CONFIG } from '../types';
import { getGameSceneLayout, isMobile } from '../config/ResponsiveConfig';

export class GameScene extends Phaser.Scene {
  private _grid?: Grid;
  private _gameState?: GameState;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    this.cameras.main.setBackgroundColor('#2a2a2a');

    // Load alien SVG sprites with responsive size
    const tileSize = GAME_CONFIG.TILE_SIZE;
    this.load.svg('deepSpaceBlue', '/aliens/deepSpaceBlue.svg', { width: tileSize, height: tileSize });
    this.load.svg('nebulaPurple', '/aliens/nebulaPurple.svg', { width: tileSize, height: tileSize });
    this.load.svg('cosmicTeal', '/aliens/cosmicTeal.svg', { width: tileSize, height: tileSize });
    this.load.svg('solarGold', '/aliens/solarGold.svg', { width: tileSize, height: tileSize });
    this.load.svg('meteorSilver', '/aliens/meteorSilver.svg', { width: tileSize, height: tileSize });
    this.load.svg('plasmaPink', '/aliens/plasmaPink.svg', { width: tileSize, height: tileSize });

    // Load ship SVGs for round indicator
    this.load.svg('ship-normal', '/ships/normal.svg', { width: 70, height: 70 });
    this.load.svg('ship-medium', '/ships/medium.svg', { width: 70, height: 70 });
    this.load.svg('ship-fast', '/ships/fast.svg', { width: 70, height: 70 });
    this.load.svg('ship-ludicrous', '/ships/ludicrous.svg', { width: 70, height: 70 });
  }

  create(): void {
    const progressManager = GameProgressManager.getInstance();
    const currentRound = progressManager.getCurrentRound();
    const totalScore = progressManager.getTotalScore();
    const speedMultiplier = progressManager.getTimerSpeedMultiplier();
    const lives = progressManager.getLives();
    const threshold = progressManager.getCurrentRoundThreshold();

    // Auto-save before round starts (captures any shop changes)
    LocalStorageManager.saveGame();

    // Determine ship type for current round
    let shipType: string;
    if (currentRound <= 2) {
      shipType = 'ship-normal';
    } else if (currentRound <= 4) {
      shipType = 'ship-medium';
    } else if (currentRound <= 6) {
      shipType = 'ship-fast';
    } else if (currentRound <= 8) {
      shipType = 'ship-fast';
    } else {
      shipType = 'ship-ludicrous';
    }

    // Get responsive layout configuration
    const layout = getGameSceneLayout();
    const mobile = isMobile();

    if (mobile) {
      // Mobile layout: header at top
      const { header } = layout;

      // Round indicator (centered at top)
      const roundText = this.add.text(
        header.roundText.x,
        header.roundText.y,
        `Round ${currentRound} / 10`,
        {
          fontSize: header.roundText.fontSize,
          color: '#00F5FF',
          fontFamily: 'Arial, sans-serif',
          fontStyle: header.roundText.fontWeight
        }
      );
      roundText.setOrigin(0.5, 0);

      // Add ship icon after the text
      const iconX = header.roundText.x + roundText.width / 2 + 25;
      const iconY = header.roundText.y + roundText.height / 2;
      const shipIcon = this.add.image(iconX, iconY, shipType);
      shipIcon.setScale(0.5);

      // Speed warning (if applicable)
      if (speedMultiplier > 1) {
        const speedText = this.add.text(
          header.roundText.x,
          header.roundText.y + parseInt(header.roundText.fontSize) + 4,
          `(${speedMultiplier}x Speed!)`,
          {
            fontSize: '16px',
            color: speedMultiplier > 2 ? '#EC4899' : '#F59E0B',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'italic'
          }
        );
        speedText.setOrigin(0.5, 0);
      }

      // Total score removed from mobile - shown on round summary and shop pages instead

      // Lives and Target displayed at bottom (below timer/score)
      // Position below footer timer/score
      const { footer } = layout;
      const livesTargetY = footer!.timer.y + 40; // Below timer/score footer

      // Lives display
      const livesDisplay = '❤️'.repeat(lives);
      this.add.text(
        this.cameras.main.width / 2,
        livesTargetY,
        `Lives: ${livesDisplay} (${lives})`,
        {
          fontSize: '18px',
          color: lives <= 1 ? '#EC4899' : '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5, 0);

      // Threshold display
      this.add.text(
        this.cameras.main.width / 2,
        livesTargetY + 26,
        `Target: ${threshold.toLocaleString()}`,
        {
          fontSize: '16px',
          color: '#F59E0B',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'normal'
        }
      ).setOrigin(0.5, 0);
    } else {
      // Desktop layout: header on left, timer/score on right
      const { header } = layout;

      // Round indicator with ship (top left)
      const roundText = this.add.text(
        header.roundText.x,
        header.roundText.y,
        `Round ${currentRound} / 10`,
        {
          fontSize: header.roundText.fontSize,
          color: '#00F5FF',
          fontFamily: 'Arial, sans-serif',
          fontStyle: header.roundText.fontWeight
        }
      );

      // Add ship icon after the text
      const iconX = header.roundText.x + roundText.width + 20;
      const iconY = header.roundText.y + roundText.height / 2;
      const shipIcon = this.add.image(iconX, iconY, shipType);
      shipIcon.setScale(0.6);

      // Speed warning (if applicable)
      if (speedMultiplier > 1) {
        this.add.text(
          header.roundText.x + roundText.width + 85,
          header.roundText.y + 8,
          `(${speedMultiplier}x Speed!)`,
          {
            fontSize: '18px',
            color: speedMultiplier > 2 ? '#EC4899' : '#F59E0B',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'italic'
          }
        );
      }

      // Total score display (if not first round)
      if (currentRound > 1) {
        this.add.text(
          header.totalScore.x,
          header.totalScore.y,
          `Total Score: ${totalScore.toLocaleString()}`,
          {
            fontSize: header.totalScore.fontSize,
            color: '#F59E0B',
            fontFamily: 'Arial, sans-serif',
            fontStyle: header.totalScore.fontWeight
          }
        );
      }

      // Lives and Target on right rail (below score/timer)
      const rightX = this.cameras.main.width - 50;
      const livesY = 125; // Below timer/score on right rail

      // Lives display
      const livesDisplay = '❤️'.repeat(lives);
      this.add.text(
        rightX,
        livesY,
        `Lives: ${livesDisplay}`,
        {
          fontSize: '20px',
          color: lives <= 1 ? '#EC4899' : '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'bold'
        }
      ).setOrigin(1, 0); // Right-aligned

      // Threshold display
      this.add.text(
        rightX,
        livesY + 32,
        `Target: ${threshold.toLocaleString()}`,
        {
          fontSize: '18px',
          color: '#F59E0B',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'normal'
        }
      ).setOrigin(1, 0); // Right-aligned
    }

    // Initialize game state (creates UI)
    this._gameState = new GameState(this);

    // Create grid with game state
    this._grid = new Grid(
      GAME_CONFIG.GRID_WIDTH,
      GAME_CONFIG.GRID_HEIGHT,
      this,
      this._gameState
    );

    // Set up game over callback to transition to next round
    this._gameState.setGameOverCallback(() => {
      if (this._grid) {
        this._grid.hideGrid();
      }

      // Transition to round complete scene after a short delay
      this.time.delayedCall(1500, () => {
        const progressManager = GameProgressManager.getInstance();
        const roundScore = this._gameState!.getScore();
        const roundResult = progressManager.completeRound(roundScore);

        // Add combos to round result
        roundResult.combosAchieved = this._gameState!.getTotalCombos();
        roundResult.timeRemaining = Math.floor(this._gameState!.getTimeRemaining());

        // Get pass/fail information
        const completion = progressManager.getLastRoundCompletion();

        // Pass round result and completion info to transition scene
        this.scene.start('RoundTransitionScene', { roundResult, completion });
      });
    });
  }

  update(_time: number, _delta: number): void {
  }

  shutdown(): void {
    if (this._grid) {
      this._grid.destroy();
    }
    if (this._gameState) {
      this._gameState.destroy();
    }
  }
}