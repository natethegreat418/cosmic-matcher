import * as Phaser from 'phaser';
import { COLORS, ANIMATIONS, ColorHelpers } from '../config/DesignSystem';

/**
 * Button style variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'disabled';

/**
 * Button configuration options
 */
export interface ButtonConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  variant?: ButtonVariant;
  fontSize?: string;
  onClick?: () => void;
  enabled?: boolean;
  sticky?: boolean;  // For mobile sticky positioning
  customColor?: number;  // Override color for special cases
}

/**
 * UIButton - Standardized button component
 *
 * Encapsulates all button creation, styling, and interaction logic
 * in one reusable component.
 *
 * Features:
 * - Consistent hover effects across all buttons
 * - Standard color variants (primary, secondary, danger)
 * - Disabled state support
 * - Sticky positioning for mobile shelves
 * - Easy to modify styling in one place
 *
 * @example
 * ```ts
 * const button = UIButton.create(scene, {
 *   x: 100,
 *   y: 100,
 *   width: 200,
 *   height: 60,
 *   text: 'Click Me',
 *   variant: 'primary',
 *   onClick: () => console.log('clicked!')
 * });
 * ```
 */
export class UIButton {
  private scene: Phaser.Scene;
  private background: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private config: ButtonConfig;
  private hoverTween?: Phaser.Tweens.Tween;

  private constructor(scene: Phaser.Scene, config: ButtonConfig) {
    this.scene = scene;
    this.config = {
      enabled: true,
      variant: 'primary',
      fontSize: '20px',
      sticky: false,
      ...config
    };

    // Create background rectangle
    const color = this.getButtonColor();
    this.background = scene.add.rectangle(
      config.x,
      config.y,
      config.width,
      config.height,
      color
    );

    // Create text label
    this.label = scene.add.text(
      config.x,
      config.y,
      config.text,
      {
        fontSize: this.config.fontSize,
        color: COLORS.neutral.black.text,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold'
      }
    );
    this.label.setOrigin(0.5, 0.5);

    // Apply sticky positioning if needed
    if (this.config.sticky) {
      this.background.setScrollFactor(0);
      this.background.setDepth(1001);
      this.label.setScrollFactor(0);
      this.label.setDepth(1002);
    }

    // Set up interactivity
    if (this.config.enabled && this.config.onClick) {
      this.setupInteractivity();
    }
  }

  /**
   * Factory method to create a new button
   */
  static create(scene: Phaser.Scene, config: ButtonConfig): UIButton {
    return new UIButton(scene, config);
  }

  /**
   * Get the button fill color based on variant
   */
  private getButtonColor(): number {
    if (this.config.customColor !== undefined) {
      return this.config.customColor;
    }

    if (!this.config.enabled) {
      return COLORS.state.disabled.phaser;
    }

    switch (this.config.variant) {
      case 'primary':
        return COLORS.primary.main;
      case 'secondary':
        return COLORS.secondary.main;
      case 'danger':
        return COLORS.danger.main;
      case 'disabled':
        return COLORS.state.disabled.phaser;
      default:
        return COLORS.primary.main;
    }
  }

  /**
   * Set up hover and click interactions
   */
  private setupInteractivity(): void {
    this.background.setInteractive({ useHandCursor: true });

    const baseColor = this.getButtonColor();
    const hoverColor = ColorHelpers.getHoverColor(baseColor);

    // Hover in
    this.background.on('pointerover', () => {
      this.background.setFillStyle(hoverColor);

      // Stop any existing tween
      if (this.hoverTween) {
        this.hoverTween.stop();
      }

      // Animate scale
      this.hoverTween = this.scene.tweens.add({
        targets: [this.background, this.label],
        scaleX: ANIMATIONS.button.hover.scaleX,
        scaleY: ANIMATIONS.button.hover.scaleY,
        duration: ANIMATIONS.button.hover.duration
      });
    });

    // Hover out
    this.background.on('pointerout', () => {
      this.background.setFillStyle(baseColor);

      // Stop any existing tween
      if (this.hoverTween) {
        this.hoverTween.stop();
      }

      // Reset scale
      this.background.setScale(1);
      this.label.setScale(1);
    });

    // Click
    this.background.on('pointerdown', () => {
      if (this.config.onClick) {
        this.config.onClick();
      }
    });
  }

  /**
   * Update button text
   */
  public setText(text: string): void {
    this.label.setText(text);
  }

  /**
   * Update button position
   */
  public setPosition(x: number, y: number): void {
    this.background.setPosition(x, y);
    this.label.setPosition(x, y);
  }

  /**
   * Enable or disable the button
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;

    if (enabled && this.config.onClick) {
      this.setupInteractivity();
    } else {
      this.background.disableInteractive();
      this.background.setFillStyle(COLORS.state.disabled.phaser);
    }
  }

  /**
   * Change button variant/color
   */
  public setVariant(variant: ButtonVariant): void {
    this.config.variant = variant;
    const color = this.getButtonColor();
    this.background.setFillStyle(color);
  }

  /**
   * Destroy the button and clean up
   */
  public destroy(): void {
    if (this.hoverTween) {
      this.hoverTween.stop();
    }
    this.background.destroy();
    this.label.destroy();
  }

  /**
   * Get the background game object (for advanced use cases)
   */
  public getBackground(): Phaser.GameObjects.Rectangle {
    return this.background;
  }

  /**
   * Get the label game object (for advanced use cases)
   */
  public getLabel(): Phaser.GameObjects.Text {
    return this.label;
  }
}
