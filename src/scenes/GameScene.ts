import * as Phaser from 'phaser';
import { Grid } from '../game/Grid';
import { GameState } from '../game/GameState';
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
  }

  create(): void {
    // Phase 4: Complete game with scoring and timer
    this.add.text(
      GAME_CONFIG.BOARD_OFFSET_X,
      30,
      'Cosmic Match-3 - Complete Game!',
      {
        fontSize: '28px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }
    );

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

    this.add.text(
      GAME_CONFIG.BOARD_OFFSET_X,
      80,
      'Big combos (5+) give bonus time!',
      {
        fontSize: '14px',
        color: '#00F5FF', // Bright cyan for excitement
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

    // Set up game over callback to hide grid
    this._gameState.setGameOverCallback(() => {
      if (this._grid) {
        this._grid.hideGrid();
      }
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