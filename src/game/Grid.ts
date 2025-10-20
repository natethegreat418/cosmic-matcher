import * as Phaser from 'phaser';
import { Tile } from './Tile';
import { TilePool } from './TilePool';
import { MatchDetector } from './MatchDetector';
import { GameState } from './GameState';
import { InputManager } from './InputManager';
import { UpgradeManager } from './UpgradeManager';
import type { TileColor, TilePosition, MatchGroup, MatchConfig } from '../types';
import { GAME_CONFIG } from '../types';
import { INPUT_CONFIG, GRID_CONFIG, GAME_ANIMATIONS, UPGRADE_EFFECTS } from '../config/GameConfig';

export class Grid {
  public tiles: (Tile | null)[][];
  public gridWidth: number;
  public gridHeight: number;
  private scene: Phaser.Scene;
  private inputManager: InputManager;
  private gameState: GameState;
  private tilePool: TilePool;
  private swipeStartTile: Tile | null = null;
  private swipeStartX: number = 0;
  private swipeStartY: number = 0;
  private matchConfig: MatchConfig;

  constructor(width: number, height: number, scene: Phaser.Scene, gameState: GameState) {
    this.gridWidth = width;
    this.gridHeight = height;
    this.scene = scene;
    this.gameState = gameState;
    this.inputManager = new InputManager(scene);
    this.tilePool = new TilePool(scene);

    this.tiles = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => null)
    );

    // Initialize match config based on current upgrades
    this.matchConfig = this.createMatchConfig();

    this.initializeGrid();
    this.setupClickHandlers();
    this.setupSwipeHandlers();
  }

  /**
   * Creates match configuration based on current upgrade state
   * This decouples MatchDetector from UpgradeManager
   */
  private createMatchConfig(): MatchConfig {
    const upgradeManager = UpgradeManager.getInstance();

    return {
      allowDiagonals: upgradeManager.hasUpgrade('phase_gun'),
      maxSwapDistance: upgradeManager.hasUpgrade('tractor_beam')
        ? UPGRADE_EFFECTS.TRACTOR_BEAM_DISTANCE
        : UPGRADE_EFFECTS.DEFAULT_SWAP_DISTANCE,
    };
  }

  /**
   * Initializes the grid with random tiles, ensuring no initial matches
   * This prevents the game from starting with matches already present
   */
  private initializeGrid(): void {
    for (let row = 0; row < this.gridHeight; row++) {
      for (let col = 0; col < this.gridWidth; col++) {
        let color: TileColor;
        let attempts = 0;

        // Try to find a color that doesn't create immediate matches
        do {
          color = this.getRandomColor();
          attempts++;
        } while (attempts < GRID_CONFIG.MAX_COLOR_ATTEMPTS && this.wouldCreateInitialMatch(row, col, color));

        const tile = this.tilePool.acquire(col, row, color);
        this.tiles[row][col] = tile;
      }
    }
  }

  /**
   * Checks if placing a color at a position would create a match
   * Only checks positions that have already been filled (above and left)
   */
  private wouldCreateInitialMatch(row: number, col: number, color: TileColor): boolean {
    // Check horizontal match to the left
    if (col >= 2) {
      const tile1 = this.tiles[row][col - 1];
      const tile2 = this.tiles[row][col - 2];
      if (tile1 && tile2 && tile1.color === color && tile2.color === color) {
        return true;
      }
    }

    // Check vertical match above
    if (row >= 2) {
      const tile1 = this.tiles[row - 1][col];
      const tile2 = this.tiles[row - 2][col];
      if (tile1 && tile2 && tile1.color === color && tile2.color === color) {
        return true;
      }
    }

    return false;
  }

  private getRandomColor(): TileColor {
    const colors = GAME_CONFIG.COLORS;
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private setupClickHandlers(): void {
    this.scene.input.on('gameobjectdown', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Rectangle) => {
      const tile = gameObject.getData('tile') as Tile;
      if (tile) {
        this.handleTileClick(tile);
      }
    });
  }

  /**
   * Sets up swipe gesture handlers for mobile touch controls
   */
  private setupSwipeHandlers(): void {
    // Handle touch start
    this.scene.input.on('gameobjectdown', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Rectangle) => {
      const tile = gameObject.getData('tile') as Tile;
      if (tile && !this.inputManager.isInputLocked() && !this.gameState.getIsGameOver()) {
        this.swipeStartTile = tile;
        this.swipeStartX = pointer.x;
        this.swipeStartY = pointer.y;
      }
    });

    // Handle touch end (swipe)
    this.scene.input.on('gameobjectup', (pointer: Phaser.Input.Pointer, _gameObject: Phaser.GameObjects.Rectangle) => {
      if (this.swipeStartTile && !this.inputManager.isInputLocked() && !this.gameState.getIsGameOver()) {
        const deltaX = pointer.x - this.swipeStartX;
        const deltaY = pointer.y - this.swipeStartY;

        // Check if movement is significant enough to be a swipe
        if (Math.abs(deltaX) > INPUT_CONFIG.MIN_SWIPE_DISTANCE || Math.abs(deltaY) > INPUT_CONFIG.MIN_SWIPE_DISTANCE) {
          this.handleSwipe(this.swipeStartTile, deltaX, deltaY);
        }

        // Reset swipe tracking
        this.swipeStartTile = null;
      }
    });
  }

  /**
   * Handles swipe gesture to swap tiles in the direction of the swipe
   */
  private async handleSwipe(tile: Tile, deltaX: number, deltaY: number): Promise<void> {
    const startPos = this.inputManager.getTilePosition(tile, this.tiles);
    if (!startPos) return;

    // Determine swipe direction (prioritize larger delta)
    let targetPos: TilePosition | null = null;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0) {
        // Swipe right
        targetPos = { row: startPos.row, col: startPos.col + 1 };
      } else {
        // Swipe left
        targetPos = { row: startPos.row, col: startPos.col - 1 };
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        // Swipe down
        targetPos = { row: startPos.row + 1, col: startPos.col };
      } else {
        // Swipe up
        targetPos = { row: startPos.row - 1, col: startPos.col };
      }
    }

    // Validate target position and attempt swap
    if (targetPos && this.isValidPosition(targetPos.row, targetPos.col)) {
      await this.attemptSwap(startPos, targetPos);
    }
  }

  /**
   * Handles tile click events for selection and swapping
   * Now uses InputManager for cleaner state management
   */
  private async handleTileClick(tile: Tile): Promise<void> {
    // Ignore clicks during animations or if game is over
    if (this.inputManager.isInputLocked() || this.gameState.getIsGameOver()) {
      return;
    }

    const selectedTile = this.inputManager.getSelectedTile();

    // If clicking the same tile, deselect it
    if (selectedTile === tile) {
      this.inputManager.clearSelection();
      this.clearHints();
      return;
    }

    // If no tile is selected, select this one and show possible swaps
    if (!selectedTile) {
      this.inputManager.setSelectedTile(tile);
      this.showValidSwapHints(tile);
      return;
    }

    // Two tiles are selected - attempt to swap them
    const firstPos = this.inputManager.getTilePosition(selectedTile, this.tiles);
    const secondPos = this.inputManager.getTilePosition(tile, this.tiles);

    if (!firstPos || !secondPos) {
      console.error('Could not find tile positions');
      return;
    }

    // Check if tiles are adjacent (using match config for distance)
    if (!MatchDetector.areAdjacent(firstPos, secondPos, this.matchConfig)) {
      // Not adjacent - just switch selection to the new tile
      this.inputManager.setSelectedTile(tile);
      this.clearHints();
      this.showValidSwapHints(tile);
      return;
    }

    // Adjacent tiles - attempt the swap
    await this.attemptSwap(firstPos, secondPos);
  }

  public getTile(row: number, col: number): Tile | null {
    if (this.isValidPosition(row, col)) {
      return this.tiles[row][col];
    }
    return null;
  }

  public setTile(row: number, col: number, tile: Tile | null): void {
    if (this.isValidPosition(row, col)) {
      this.tiles[row][col] = tile;
    }
  }

  private isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < this.gridHeight && col >= 0 && col < this.gridWidth;
  }


  /**
   * Shows green hints on tiles that can be validly swapped with the selected tile
   * @param selectedTile - The currently selected tile
   */
  private showValidSwapHints(selectedTile: Tile): void {
    const selectedPos = this.inputManager.getTilePosition(selectedTile, this.tiles);
    if (!selectedPos) return;

    // Check all adjacent positions
    const adjacentPositions = [
      { row: selectedPos.row - 1, col: selectedPos.col }, // Up
      { row: selectedPos.row + 1, col: selectedPos.col }, // Down
      { row: selectedPos.row, col: selectedPos.col - 1 }, // Left
      { row: selectedPos.row, col: selectedPos.col + 1 }  // Right
    ];

    adjacentPositions.forEach(pos => {
      if (this.isValidPosition(pos.row, pos.col)) {
        // Check if swapping would create a match
        if (MatchDetector.wouldSwapCreateMatch(this.tiles, selectedPos, pos, this.matchConfig)) {
          const adjacentTile = this.tiles[pos.row][pos.col];
          if (adjacentTile) {
            adjacentTile.setHint();
          }
        }
      }
    });
  }

  /**
   * Clears all visual hints from the grid
   */
  private clearHints(): void {
    for (let row = 0; row < this.gridHeight; row++) {
      for (let col = 0; col < this.gridWidth; col++) {
        const tile = this.tiles[row][col];
        if (tile) {
          tile.unhighlight();
        }
      }
    }
  }

  /**
   * Attempts to swap two tiles, with validation and animation
   * Now uses InputManager for improved visual feedback
   * @param pos1 - Position of first tile
   * @param pos2 - Position of second tile
   */
  private async attemptSwap(pos1: TilePosition, pos2: TilePosition): Promise<void> {
    this.inputManager.lockInput();

    const tile1 = this.tiles[pos1.row][pos1.col];
    const tile2 = this.tiles[pos2.row][pos2.col];

    if (!tile1 || !tile2) {
      console.error('Cannot swap: one or both tiles are null');
      this.inputManager.unlockInput();
      return;
    }

    // Clear selection and hints
    this.clearHints();
    this.inputManager.clearSelection();

    // Check if this swap would create a match
    const wouldCreateMatch = MatchDetector.wouldSwapCreateMatch(this.tiles, pos1, pos2, this.matchConfig);

    if (!wouldCreateMatch) {
      // Invalid swap - use InputManager's shake animation
      console.log('Invalid swap: no match created');
      await this.inputManager.animateInvalidSwap(tile1, tile2);
      this.inputManager.unlockInput();
      return;
    }

    // Valid swap - perform the swap
    console.log('Valid swap: match created!');
    await this.performSwapAnimation(tile1, tile2, pos1, pos2, false);

    // Update the grid state
    this.tiles[pos1.row][pos1.col] = tile2;
    this.tiles[pos2.row][pos2.col] = tile1;

    // Phase 3: Start the match-drop-refill cycle
    await this.processMatches();

    this.inputManager.unlockInput();
  }

  /**
   * Performs the visual animation of swapping two tiles
   * @param tile1 - First tile to swap
   * @param tile2 - Second tile to swap
   * @param pos1 - Target position for tile1
   * @param pos2 - Target position for tile2
   * @param isRevert - Whether this is a revert animation (faster)
   */
  private async performSwapAnimation(
    tile1: Tile,
    tile2: Tile,
    pos1: TilePosition,
    pos2: TilePosition,
    isRevert: boolean
  ): Promise<void> {
    // Temporarily adjust animation speed for reverts
    const originalDuration = GAME_CONFIG.ANIMATION_DURATION;
    if (isRevert) {
      // Override the config temporarily for faster revert
      (GAME_CONFIG as any).ANIMATION_DURATION = originalDuration / 3;
    }

    // Animate both tiles to their new positions simultaneously
    await Promise.all([
      tile1.animateToPosition(pos2.col, pos2.row),
      tile2.animateToPosition(pos1.col, pos1.row)
    ]);

    // Restore original animation duration
    if (isRevert) {
      (GAME_CONFIG as any).ANIMATION_DURATION = originalDuration;
    }
  }

  /**
   * Phase 3: Main match processing cycle - handles cascading matches
   * Repeats until no more matches are found (for combo chains)
   */
  private async processMatches(): Promise<void> {
    let matchesFound = true;
    let cascadeCount = 0;

    // Keep processing matches until no more are found
    while (matchesFound) {
      const matches = MatchDetector.findMatches(this.tiles, this.matchConfig);

      if (matches.length === 0) {
        matchesFound = false;
        break;
      }

      cascadeCount++;
      console.log(`Cascade ${cascadeCount}: Found ${matches.length} match groups`);

      // Phase 4: Calculate and add score for this cascade
      this.gameState.addMatchScore(matches, cascadeCount);

      // Step 1: Remove matched tiles with animation
      await this.removeMatches(matches);

      // Step 2: Drop existing tiles down to fill gaps
      await this.dropTiles();

      // Step 3: Generate new tiles at the top
      await this.fillEmptySpaces();

      // Brief pause between cascades for visual clarity
      await this.delay(GAME_ANIMATIONS.CASCADE_PAUSE);
    }

    console.log(`Match processing complete! Total cascades: ${cascadeCount}`);

    // Phase 4: Reset combo if no cascade occurred
    if (cascadeCount === 0) {
      this.gameState.resetCombo();
    }
  }

  /**
   * Removes matched tiles with satisfying animations
   * @param matches - Array of match groups to remove
   */
  private async removeMatches(matches: MatchGroup[]): Promise<void> {
    const tilesToRemove: Tile[] = [];

    // Collect all tiles that need to be removed
    matches.forEach(matchGroup => {
      matchGroup.tiles.forEach(pos => {
        const tile = this.tiles[pos.row][pos.col];
        if (tile) {
          tilesToRemove.push(tile);
        }
      });
    });

    // Animate removal of all matched tiles simultaneously
    const removalPromises = tilesToRemove.map(tile => tile.animateRemoval());
    await Promise.all(removalPromises);

    // Return tiles to pool instead of destroying them
    matches.forEach(matchGroup => {
      matchGroup.tiles.forEach(pos => {
        const tile = this.tiles[pos.row][pos.col];
        if (tile) {
          this.tilePool.release(tile);
          this.tiles[pos.row][pos.col] = null;
        }
      });
    });
  }

  /**
   * Drops existing tiles down to fill gaps left by removed matches
   * Uses gravity simulation - tiles fall to the lowest available position
   */
  private async dropTiles(): Promise<void> {
    const dropPromises: Promise<void>[] = [];

    // Process each column independently
    for (let col = 0; col < this.gridWidth; col++) {
      // Start from bottom and work upward
      let writeRow = this.gridHeight - 1; // Position where next tile should go

      for (let readRow = this.gridHeight - 1; readRow >= 0; readRow--) {
        const tile = this.tiles[readRow][col];

        if (tile) {
          // Found a tile that needs to drop (or stay in place)
          if (readRow !== writeRow) {
            // Tile needs to drop - animate it to new position
            this.tiles[writeRow][col] = tile;
            this.tiles[readRow][col] = null;

            dropPromises.push(tile.animateToPosition(col, writeRow));
          }
          writeRow--; // Next tile will go one row higher
        }
        // If no tile at readRow, just continue (it's already empty)
      }
    }

    // Wait for all drop animations to complete
    await Promise.all(dropPromises);
  }

  /**
   * Generates new tiles at the top to fill any remaining empty spaces
   * New tiles drop in from above with bouncy animation
   */
  private async fillEmptySpaces(): Promise<void> {
    const newTilePromises: Promise<void>[] = [];

    for (let col = 0; col < this.gridWidth; col++) {
      // Count empty spaces from the top
      let emptyCount = 0;
      for (let row = 0; row < this.gridHeight; row++) {
        if (this.tiles[row][col] === null) {
          emptyCount++;
        } else {
          break; // Stop at first non-empty tile
        }
      }

      // Create new tiles for empty spaces (reuse from pool)
      for (let i = 0; i < emptyCount; i++) {
        const row = i;
        const color = this.getRandomColor();
        const tile = this.tilePool.acquire(col, row, color);

        this.tiles[row][col] = tile;

        // Calculate starting position above the grid
        const startY = GAME_CONFIG.BOARD_OFFSET_Y - (emptyCount - i) * (GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SPACING);

        // Animate drop-in effect
        newTilePromises.push(tile.animateDropIn(startY));
      }
    }

    // Wait for all new tiles to finish dropping
    await Promise.all(newTilePromises);
  }

  /**
   * Utility function to add delays between animations
   * @param ms - Milliseconds to wait
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Hides all tiles in the grid (for game over)
   */
  public hideGrid(): void {
    for (let row = 0; row < this.gridHeight; row++) {
      for (let col = 0; col < this.gridWidth; col++) {
        const tile = this.tiles[row][col];
        if (tile) {
          // Create targets array with sprite and optional background
          const targets = [tile.sprite];
          if (tile.backgroundRect) {
            targets.push(tile.backgroundRect);
          }

          // Fade out animation
          this.scene.tweens.add({
            targets: targets,
            alpha: 0,
            duration: GAME_ANIMATIONS.GRID_HIDE,
            ease: 'Power2.easeOut'
          });
        }
      }
    }
  }

  public destroy(): void {
    // Clean up input manager
    this.inputManager.destroy();

    // Return all active tiles to pool
    for (let row = 0; row < this.gridHeight; row++) {
      for (let col = 0; col < this.gridWidth; col++) {
        const tile = this.tiles[row][col];
        if (tile) {
          this.tilePool.release(tile);
        }
      }
    }

    // Destroy the pool (which destroys all pooled tiles)
    this.tilePool.destroy();
  }
}