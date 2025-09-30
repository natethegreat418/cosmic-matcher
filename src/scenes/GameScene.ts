import * as Phaser from 'phaser';
import { Grid } from '../game/Grid';
import { GameState } from '../game/GameState';
import { GameProgressManager } from '../game/GameProgressManager';
import { GAME_CONFIG } from '../types';

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

    // Responsive font sizes and positioning
    const isMobile = GAME_CONFIG.IS_MOBILE;
    const fontSize = {
      title: isMobile ? '24px' : '28px',
      subtitle: isMobile ? '16px' : '18px',
      speed: isMobile ? '16px' : '20px'
    };

    const uiX = GAME_CONFIG.BOARD_OFFSET_X;
    let currentY = isMobile ? 10 : 30;

    // Round indicator
    const roundText = this.add.text(
      uiX,
      currentY,
      `Round ${currentRound} / 10`,
      {
        fontSize: fontSize.title,
        color: '#00F5FF',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );

    // Calculate position after the text, centered vertically with the text
    const iconX = uiX + roundText.width + (isMobile ? 10 : 30);
    const iconY = roundText.y + (roundText.height / 2);

    // Add ship icon after the text (scaled for mobile)
    const shipIcon = this.add.image(iconX, iconY, shipType);
    if (isMobile) {
      shipIcon.setScale(0.57); // Scale down from 70 to ~40
    }

    currentY += roundText.height + (isMobile ? 3 : 10);

    // Speed warning for higher rounds
    if (speedMultiplier > 1) {
      this.add.text(
        uiX,
        currentY,
        `(${speedMultiplier}x Speed!)`,
        {
          fontSize: fontSize.speed,
          color: speedMultiplier > 2 ? '#EC4899' : '#F59E0B',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'italic'
        }
      );
      currentY += parseInt(fontSize.speed) + (isMobile ? 3 : 5);
    }

    // Total score display (if not first round)
    if (currentRound > 1) {
      this.add.text(
        uiX,
        currentY,
        `Total Score: ${totalScore.toLocaleString()}`,
        {
          fontSize: fontSize.subtitle,
          color: '#F59E0B',
          fontFamily: 'Arial, sans-serif'
        }
      );
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

        // Pass round result to transition scene
        this.scene.start('RoundTransitionScene', { roundResult });
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