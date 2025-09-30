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

    // Load alien SVG sprites
    this.load.svg('deepSpaceBlue', '/aliens/deepSpaceBlue.svg', { width: 60, height: 60 });
    this.load.svg('nebulaPurple', '/aliens/nebulaPurple.svg', { width: 60, height: 60 });
    this.load.svg('cosmicTeal', '/aliens/cosmicTeal.svg', { width: 60, height: 60 });
    this.load.svg('solarGold', '/aliens/solarGold.svg', { width: 60, height: 60 });
    this.load.svg('meteorSilver', '/aliens/meteorSilver.svg', { width: 60, height: 60 });
    this.load.svg('plasmaPink', '/aliens/plasmaPink.svg', { width: 60, height: 60 });

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

    // Round indicator
    const roundText = this.add.text(
      GAME_CONFIG.BOARD_OFFSET_X,
      30,
      `Round ${currentRound} / 10`,
      {
        fontSize: '28px',
        color: '#00F5FF',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );

    // Calculate position after the text, centered vertically with the text
    const iconX = GAME_CONFIG.BOARD_OFFSET_X + roundText.width + 30;
    const iconY = roundText.y + (roundText.height / 2); // Center align with the middle of the text

    // Add ship icon after the text
    this.add.image(iconX, iconY, shipType);

    // Speed warning for higher rounds
    if (speedMultiplier > 1) {
      this.add.text(
        GAME_CONFIG.BOARD_OFFSET_X + 180,
        35,
        `(${speedMultiplier}x Speed!)`,
        {
          fontSize: '20px',
          color: speedMultiplier > 2 ? '#EC4899' : '#F59E0B',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'italic'
        }
      );
    }

    // Total score display (if not first round)
    if (currentRound > 1) {
      this.add.text(
        GAME_CONFIG.BOARD_OFFSET_X,
        60,
        `Total Score: ${totalScore.toLocaleString()}`,
        {
          fontSize: '18px',
          color: '#F59E0B',
          fontFamily: 'Arial, sans-serif'
        }
      );
    } else {
      // First round instructions
      this.add.text(
        GAME_CONFIG.BOARD_OFFSET_X,
        60,
        'Score as much as you can in 60 seconds!',
        {
          fontSize: '16px',
          color: '#cccccc',
          fontFamily: 'Arial, sans-serif'
        }
      );
    }

    this.add.text(
      GAME_CONFIG.BOARD_OFFSET_X,
      80,
      'Big combos (5+) give bonus time!',
      {
        fontSize: '14px',
        color: '#00F5FF',
        fontFamily: 'Arial, sans-serif'
      }
    );

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