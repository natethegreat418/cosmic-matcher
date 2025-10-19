import * as Phaser from 'phaser';
import { COLORS } from '../config/DesignSystem';
import { UIButton } from './UIButton';

/**
 * Configuration for button in mobile shelf
 */
export interface ShelfButtonConfig {
  text: string;
  variant: 'primary' | 'secondary' | 'danger' | 'disabled';
  fontSize?: string;
  onClick: () => void;
  enabled?: boolean;
}

/**
 * Configuration for mobile shelf
 */
export interface MobileShelfConfig {
  /** Array of buttons to create inside the shelf (auto-layout) */
  buttons?: ShelfButtonConfig[];

  /** Custom height override (calculated automatically if buttons provided) */
  height?: number;

  /** Bottom safe area offset (default: 0) */
  bottomSafeArea?: number;

  /** Gap between buttons (default: 12) */
  buttonGap?: number;

  /** Button height (default: 56) */
  buttonHeight?: number;

  /** Horizontal padding for buttons (default: 16 per side, 32 total) */
  paddingHorizontal?: number;

  /** Top padding inside shelf (default: 16) */
  paddingTop?: number;

  /** Bottom padding inside shelf (default: 16) */
  paddingBottom?: number;
}

/**
 * UIMobileShelf - Sticky bottom shelf for mobile layouts
 *
 * Creates a fixed-position bottom shelf with dark background and top border.
 * Commonly used for action buttons on mobile devices with proper safe area handling.
 *
 * Features:
 * - Sticky positioning (always visible at bottom)
 * - Automatic button layout or manual positioning
 * - iOS safe area support
 * - Design system colors
 * - High z-index for visibility
 *
 * @example
 * ```ts
 * // Auto-layout buttons
 * UIMobileShelf.create(scene, {
 *   buttons: [
 *     { text: 'Cancel', variant: 'secondary', onClick: () => {...} },
 *     { text: 'Continue', variant: 'primary', onClick: () => {...} }
 *   ],
 *   bottomSafeArea: 80
 * });
 *
 * // Manual positioning (just creates shelf container)
 * const shelf = UIMobileShelf.create(scene, {
 *   height: 200,
 *   bottomSafeArea: 80
 * });
 * // Then manually position buttons at desired Y coordinates
 * ```
 */
export class UIMobileShelf {
  private scene: Phaser.Scene;
  private background: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private buttons: UIButton[] = [];
  private config: Required<MobileShelfConfig>;

  private constructor(scene: Phaser.Scene, config: MobileShelfConfig) {
    this.scene = scene;

    // Calculate defaults
    const buttonHeight = config.buttonHeight ?? 56;
    const buttonGap = config.buttonGap ?? 12;
    const paddingTop = config.paddingTop ?? 16;
    const paddingBottom = config.paddingBottom ?? 16;
    const buttonCount = config.buttons?.length ?? 0;

    // Auto-calculate height if buttons provided
    const calculatedHeight = buttonCount > 0
      ? (buttonHeight * buttonCount) + (buttonGap * (buttonCount - 1)) + paddingTop + paddingBottom
      : config.height ?? 200;

    this.config = {
      buttons: config.buttons ?? [],
      height: calculatedHeight,
      bottomSafeArea: config.bottomSafeArea ?? 0,
      buttonGap,
      buttonHeight,
      paddingHorizontal: config.paddingHorizontal ?? 16,
      paddingTop,
      paddingBottom
    };

    // Create shelf elements
    this.background = this.createBackground();
    this.border = this.createBorder();

    // Auto-layout buttons if provided
    if (this.config.buttons.length > 0) {
      this.createButtons();
    }
  }

  /**
   * Factory method to create a mobile shelf
   */
  static create(scene: Phaser.Scene, config: MobileShelfConfig): UIMobileShelf {
    return new UIMobileShelf(scene, config);
  }

  /**
   * Create the shelf background
   */
  private createBackground(): Phaser.GameObjects.Rectangle {
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;
    const centerX = screenWidth / 2;

    // Position shelf at bottom, accounting for safe area
    const shelfY = screenHeight - this.config.height / 2 - this.config.bottomSafeArea;

    const bg = this.scene.add.rectangle(
      centerX,
      shelfY,
      screenWidth,
      this.config.height,
      COLORS.background.shelf // 0x1a1a1a
    );

    bg.setScrollFactor(0);
    bg.setDepth(1000);

    return bg;
  }

  /**
   * Create the top border line
   */
  private createBorder(): Phaser.GameObjects.Rectangle {
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;
    const centerX = screenWidth / 2;

    // Border at top edge of shelf
    const borderY = screenHeight - this.config.height - this.config.bottomSafeArea;

    const border = this.scene.add.rectangle(
      centerX,
      borderY,
      screenWidth,
      1,
      COLORS.background.border // 0x4a4a4a
    );

    border.setScrollFactor(0);
    border.setDepth(1000);

    return border;
  }

  /**
   * Auto-create and layout buttons inside shelf
   */
  private createButtons(): void {
    const screenWidth = this.scene.cameras.main.width;
    const screenHeight = this.scene.cameras.main.height;
    const centerX = screenWidth / 2;

    const buttonWidth = screenWidth - (this.config.paddingHorizontal * 2);
    const shelfTop = screenHeight - this.config.height - this.config.bottomSafeArea;

    this.config.buttons.forEach((btnConfig, index) => {
      const y = shelfTop + this.config.paddingTop +
                (this.config.buttonHeight / 2) +
                (index * (this.config.buttonHeight + this.config.buttonGap));

      const button = UIButton.create(this.scene, {
        x: centerX,
        y,
        width: buttonWidth,
        height: this.config.buttonHeight,
        text: btnConfig.text,
        variant: btnConfig.variant,
        fontSize: btnConfig.fontSize ?? '20px',
        enabled: btnConfig.enabled ?? true,
        sticky: true,
        onClick: btnConfig.onClick
      });

      this.buttons.push(button);
    });
  }

  /**
   * Get the Y coordinate for the top of the shelf content area
   * Useful for manual button positioning
   */
  public getContentTop(): number {
    const screenHeight = this.scene.cameras.main.height;
    return screenHeight - this.config.height - this.config.bottomSafeArea + this.config.paddingTop;
  }

  /**
   * Get the Y coordinate for a specific button slot (0-indexed)
   * Useful for manual button positioning
   */
  public getButtonY(index: number): number {
    return this.getContentTop() +
           (this.config.buttonHeight / 2) +
           (index * (this.config.buttonHeight + this.config.buttonGap));
  }

  /**
   * Get the shelf height
   */
  public getHeight(): number {
    return this.config.height;
  }

  /**
   * Destroy the shelf and all its elements
   */
  public destroy(): void {
    this.background.destroy();
    this.border.destroy();
    this.buttons.forEach(btn => btn.destroy());
    this.buttons = [];
  }
}
