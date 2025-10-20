import * as Phaser from 'phaser';
import { type TileColor, GAME_CONFIG } from '../types';

export class Tile {
  public x: number;
  public y: number;
  public color: TileColor;
  public sprite: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  public backgroundRect?: Phaser.GameObjects.Rectangle;
  private gridX: number;
  private gridY: number;
  private scene: Phaser.Scene;

  constructor(
    gridX: number,
    gridY: number,
    color: TileColor,
    scene: Phaser.Scene
  ) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.color = color;
    this.scene = scene;

    this.x = this.calculatePixelX(gridX);
    this.y = this.calculatePixelY(gridY);

    // Create a background rectangle for the border
    this.backgroundRect = scene.add.rectangle(
      this.x,
      this.y,
      GAME_CONFIG.TILE_SIZE,
      GAME_CONFIG.TILE_SIZE,
      0x000000, // Black background
      0
    );
    this.backgroundRect.setStrokeStyle(2, 0x000000);

    // Create the alien sprite based on color
    this.sprite = scene.add.image(
      this.x,
      this.y,
      color // This now maps to the sprite key
    );

    // Scale sprite to fit full tile size
    this.sprite.setDisplaySize(GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);

    this.sprite.setInteractive();
    this.sprite.setData('tile', this);
  }

  private calculatePixelX(gridX: number): number {
    return GAME_CONFIG.BOARD_OFFSET_X +
           gridX * (GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SPACING) +
           GAME_CONFIG.TILE_SIZE / 2;
  }

  private calculatePixelY(gridY: number): number {
    return GAME_CONFIG.BOARD_OFFSET_Y +
           gridY * (GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SPACING) +
           GAME_CONFIG.TILE_SIZE / 2;
  }


  public setPosition(gridX: number, gridY: number): void {
    this.gridX = gridX;
    this.gridY = gridY;
    this.x = this.calculatePixelX(gridX);
    this.y = this.calculatePixelY(gridY);

    this.sprite.x = this.x;
    this.sprite.y = this.y;
    if (this.backgroundRect) {
      this.backgroundRect.x = this.x;
      this.backgroundRect.y = this.y;
    }
  }

  /**
   * Standard highlight (legacy method - kept for compatibility)
   */
  public highlight(): void {
    if (this.backgroundRect) {
      this.backgroundRect.setStrokeStyle(4, 0x00F5FF); // Bright Cyan for selected
    }
  }

  /**
   * Removes all highlights and returns to normal state
   */
  public unhighlight(): void {
    if (this.backgroundRect) {
      this.backgroundRect.setStrokeStyle(2, 0x000000); // Black border for normal
    }
    this.sprite.setAlpha(1.0); // Reset to full opacity
  }

  public getGridPosition(): { x: number, y: number } {
    return { x: this.gridX, y: this.gridY };
  }

  /**
   * Animates the tile to a new grid position with smooth movement
   * @param gridX - New grid X coordinate
   * @param gridY - New grid Y coordinate
   * @returns Promise that resolves when animation completes
   */
  public animateToPosition(gridX: number, gridY: number): Promise<void> {
    // Calculate the new pixel position
    const newX = this.calculatePixelX(gridX);
    const newY = this.calculatePixelY(gridY);

    // Update grid position immediately for logic purposes
    this.gridX = gridX;
    this.gridY = gridY;
    this.x = newX;
    this.y = newY;

    const targets = [this.sprite];
    if (this.backgroundRect) {
      targets.push(this.backgroundRect);
    }

    // Return a promise that resolves when the tween completes
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: targets,
        x: newX,
        y: newY,
        duration: GAME_CONFIG.ANIMATION_DURATION,
        ease: 'Power2.easeInOut',
        onComplete: () => {
          resolve();
        }
      });
    });
  }

  /**
   * Sets the tile to selected state with bright cyan highlight
   * Uses the specified Bright Cyan color from the design specs
   */
  public setSelected(): void {
    if (this.backgroundRect) {
      this.backgroundRect.setStrokeStyle(4, 0x00F5FF); // Bright Cyan (#00F5FF) for selected
    }
  }

  /**
   * Sets the tile to hint state with subtle white glow
   * Shows tiles that can be validly swapped with the selected tile
   * Uses 40% opacity white as specified in the design
   */
  public setHint(): void {
    // Create a subtle white glow effect for valid moves
    if (this.backgroundRect) {
      this.backgroundRect.setStrokeStyle(4, 0xFFFFFF); // White border
    }
    this.sprite.setAlpha(0.9); // Slight transparency for the glow effect
  }

  /**
   * Animates tile removal with scaling and fading effect
   * @returns Promise that resolves when animation completes
   */
  public animateRemoval(): Promise<void> {
    return new Promise((resolve) => {
      // Animate both the sprite and background
      const targets = [this.sprite];
      if (this.backgroundRect) {
        targets.push(this.backgroundRect);
      }

      // Create a satisfying removal animation
      this.scene.tweens.add({
        targets: targets,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        rotation: Math.PI / 4, // 45 degree rotation for extra flair
        duration: GAME_CONFIG.ANIMATION_DURATION * 0.8, // Slightly faster than movement
        ease: 'Back.easeIn',
        onComplete: () => {
          resolve();
        }
      });
    });
  }

  /**
   * Animates tile dropping from above (for new tiles)
   * @param fromY - Starting Y position (above the grid)
   * @returns Promise that resolves when animation completes
   */
  public animateDropIn(fromY: number): Promise<void> {
    // Set initial position above the grid
    this.sprite.y = fromY;
    this.sprite.setAlpha(1.0);
    this.sprite.setScale(1.0);

    if (this.backgroundRect) {
      this.backgroundRect.y = fromY;
      this.backgroundRect.setAlpha(1.0);
      this.backgroundRect.setScale(1.0);
    }

    const targets = [this.sprite];
    if (this.backgroundRect) {
      targets.push(this.backgroundRect);
    }

    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: targets,
        y: this.y,
        duration: GAME_CONFIG.ANIMATION_DURATION * 1.2, // Slightly slower for gravity effect
        ease: 'Bounce.easeOut', // Bouncy drop effect
        onComplete: () => {
          resolve();
        }
      });
    });
  }

  /**
   * Reset tile to new position and color (for object pooling)
   * More efficient than creating a new tile from scratch
   * @param gridX - New grid X coordinate
   * @param gridY - New grid Y coordinate
   * @param color - New tile color
   */
  public reset(gridX: number, gridY: number, color: TileColor): void {
    this.gridX = gridX;
    this.gridY = gridY;
    this.color = color;
    this.x = this.calculatePixelX(gridX);
    this.y = this.calculatePixelY(gridY);

    // Update sprite texture (only Images have setTexture)
    if (this.sprite instanceof Phaser.GameObjects.Image) {
      this.sprite.setTexture(color);
    }
    this.sprite.setPosition(this.x, this.y);
    this.sprite.setAlpha(1);
    this.sprite.setScale(1);
    this.sprite.setRotation(0);
    this.sprite.setVisible(true);

    // Update background
    if (this.backgroundRect) {
      this.backgroundRect.setPosition(this.x, this.y);
      this.backgroundRect.setAlpha(1);
      this.backgroundRect.setScale(1);
      this.backgroundRect.setRotation(0);
      this.backgroundRect.setVisible(true);
      this.backgroundRect.setStrokeStyle(2, 0x000000); // Reset to normal border
    }
  }

  /**
   * Hide tile (for object pooling - keeps object alive but invisible)
   */
  public hide(): void {
    this.sprite.setVisible(false);
    this.sprite.setAlpha(0);
    if (this.backgroundRect) {
      this.backgroundRect.setVisible(false);
      this.backgroundRect.setAlpha(0);
    }
  }

  public destroy(): void {
    if (this.backgroundRect) {
      this.backgroundRect.destroy();
    }
    this.sprite.destroy();
  }
}