import * as Phaser from 'phaser';
import { Tile } from './Tile';
import type { TilePosition } from '../types';

/**
 * Manages input state and visual feedback for tile interactions
 * Separates input handling from grid logic for better maintainability
 */
export class InputManager {
  private scene: Phaser.Scene;
  private selectedTile: Tile | null = null;
  private isProcessing: boolean = false;
  private hintTile: Tile | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Gets the currently selected tile
   */
  public getSelectedTile(): Tile | null {
    return this.selectedTile;
  }

  /**
   * Sets the selected tile and applies visual feedback
   */
  public setSelectedTile(tile: Tile | null): void {
    // Clear previous selection
    if (this.selectedTile) {
      this.selectedTile.unhighlight();
    }

    this.selectedTile = tile;

    // Highlight new selection
    if (this.selectedTile) {
      this.selectedTile.setSelected();
    }
  }

  /**
   * Clears the current selection
   */
  public clearSelection(): void {
    this.setSelectedTile(null);
  }

  /**
   * Checks if input is currently being processed
   */
  public isInputLocked(): boolean {
    return this.isProcessing;
  }

  /**
   * Locks input during processing (swaps, matches, animations)
   */
  public lockInput(): void {
    this.isProcessing = true;
  }

  /**
   * Unlocks input after processing completes
   */
  public unlockInput(): void {
    this.isProcessing = false;
  }

  /**
   * Shows a hint on a specific tile
   */
  public showHint(tile: Tile): void {
    this.clearHint();
    this.hintTile = tile;
    tile.setHint();
  }

  /**
   * Clears the current hint
   */
  public clearHint(): void {
    if (this.hintTile) {
      this.hintTile.unhighlight();
      this.hintTile = null;
    }
  }

  /**
   * Animates an invalid swap attempt with a shake effect
   */
  public async animateInvalidSwap(tile1: Tile, tile2: Tile): Promise<void> {
    const tile1Pos = { x: tile1.sprite.x, y: tile1.sprite.y };
    const tile2Pos = { x: tile2.sprite.x, y: tile2.sprite.y };

    // Calculate direction for shake
    const dx = (tile2Pos.x - tile1Pos.x) * 0.15; // 15% of the distance
    const dy = (tile2Pos.y - tile1Pos.y) * 0.15;

    return new Promise((resolve) => {
      // Move both tiles slightly toward each other
      const tile1Targets = tile1.backgroundRect ? [tile1.sprite, tile1.backgroundRect] : [tile1.sprite];
      const tile2Targets = tile2.backgroundRect ? [tile2.sprite, tile2.backgroundRect] : [tile2.sprite];

      this.scene.tweens.add({
        targets: tile1Targets,
        x: tile1Pos.x + dx,
        y: tile1Pos.y + dy,
        duration: 100,
        ease: 'Power2.easeOut',
        yoyo: true,
        onComplete: () => {
          // Ensure tiles are back in original position
          tile1.sprite.setPosition(tile1Pos.x, tile1Pos.y);
          if (tile1.backgroundRect) {
            tile1.backgroundRect.setPosition(tile1Pos.x, tile1Pos.y);
          }
          resolve();
        }
      });

      this.scene.tweens.add({
        targets: tile2Targets,
        x: tile2Pos.x - dx,
        y: tile2Pos.y - dy,
        duration: 100,
        ease: 'Power2.easeOut',
        yoyo: true,
        onComplete: () => {
          tile2.sprite.setPosition(tile2Pos.x, tile2Pos.y);
          if (tile2.backgroundRect) {
            tile2.backgroundRect.setPosition(tile2Pos.x, tile2Pos.y);
          }
        }
      });
    });
  }

  /**
   * Animates a swap preview (subtle movement to show swap direction)
   */
  public async animateSwapPreview(tile1: Tile, tile2: Tile): Promise<void> {
    const tile1Pos = { x: tile1.sprite.x, y: tile1.sprite.y };
    const tile2Pos = { x: tile2.sprite.x, y: tile2.sprite.y };

    // Calculate direction for preview (smaller than shake)
    const dx = (tile2Pos.x - tile1Pos.x) * 0.1; // 10% of the distance
    const dy = (tile2Pos.y - tile1Pos.y) * 0.1;

    return new Promise((resolve) => {
      // Quick pulse in the swap direction
      const tile1Targets = tile1.backgroundRect ? [tile1.sprite, tile1.backgroundRect] : [tile1.sprite];
      const tile2Targets = tile2.backgroundRect ? [tile2.sprite, tile2.backgroundRect] : [tile2.sprite];

      this.scene.tweens.add({
        targets: tile1Targets,
        x: tile1Pos.x + dx,
        y: tile1Pos.y + dy,
        duration: 80,
        ease: 'Sine.easeInOut',
        yoyo: true,
        onComplete: () => {
          tile1.sprite.setPosition(tile1Pos.x, tile1Pos.y);
          if (tile1.backgroundRect) {
            tile1.backgroundRect.setPosition(tile1Pos.x, tile1Pos.y);
          }
          resolve();
        }
      });

      this.scene.tweens.add({
        targets: tile2Targets,
        x: tile2Pos.x - dx,
        y: tile2Pos.y - dy,
        duration: 80,
        ease: 'Sine.easeInOut',
        yoyo: true,
        onComplete: () => {
          tile2.sprite.setPosition(tile2Pos.x, tile2Pos.y);
          if (tile2.backgroundRect) {
            tile2.backgroundRect.setPosition(tile2Pos.x, tile2Pos.y);
          }
        }
      });
    });
  }

  /**
   * Pulse animation for a tile (used for hints or emphasis)
   */
  public pulseTile(tile: Tile): void {
    const targets = tile.backgroundRect ? [tile.sprite, tile.backgroundRect] : [tile.sprite];
    this.scene.tweens.add({
      targets,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 300,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1 // Infinite repeat
    });
  }

  /**
   * Stops all animations on a tile
   */
  public stopTileAnimations(tile: Tile): void {
    const targets = tile.backgroundRect ? [tile.sprite, tile.backgroundRect] : [tile.sprite];
    this.scene.tweens.killTweensOf(targets);

    // Reset scale in case it was pulsing
    tile.sprite.setScale(1);
    if (tile.backgroundRect) {
      tile.backgroundRect.setScale(1);
    }
  }

  /**
   * Gets grid position from a tile
   */
  public getTilePosition(tile: Tile, tiles: (Tile | null)[][]): TilePosition | null {
    for (let row = 0; row < tiles.length; row++) {
      for (let col = 0; col < tiles[row].length; col++) {
        if (tiles[row][col] === tile) {
          return { row, col };
        }
      }
    }
    return null;
  }

  /**
   * Checks if two tiles are adjacent
   */
  public areAdjacent(pos1: TilePosition, pos2: TilePosition): boolean {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);

    // Adjacent if exactly one space apart in one direction and same in other
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  /**
   * Cleanup method
   */
  public destroy(): void {
    this.clearSelection();
    this.clearHint();
    this.selectedTile = null;
    this.hintTile = null;
  }
}
