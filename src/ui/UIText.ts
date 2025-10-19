import * as Phaser from 'phaser';
import { COLORS } from '../config/DesignSystem';

/**
 * Text style variants matching design system typography
 */
export type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'score';

/**
 * Text color variants
 */
export type TextColor =
  | 'primary'      // Bright cyan
  | 'secondary'    // Solar gold
  | 'danger'       // Plasma pink
  | 'white'        // White
  | 'black'        // Black
  | 'gray-light'   // Light gray
  | 'gray-medium'  // Medium gray
  | 'gray-dark'    // Dark gray
  | 'success'      // Green
  | 'error'        // Red error
  | 'cost';        // Cost red

/**
 * Text configuration options
 */
export interface TextConfig {
  x: number;
  y: number;
  text: string;
  variant?: TextVariant;
  color?: TextColor;
  customColor?: string;  // Override with specific hex color
  fontStyle?: 'normal' | 'bold' | 'italic' | '600';
  align?: 'left' | 'center' | 'right';
  originX?: number;
  originY?: number;
  stroke?: boolean;  // Add black stroke for headers
  strokeThickness?: number;
  wordWrap?: number;  // Word wrap width
  sticky?: boolean;  // For mobile sticky positioning
}

/**
 * UIText - Standardized text component
 *
 * Provides consistent typography across all scenes using the design system.
 * Automatically applies correct font sizes and colors based on variants.
 *
 * Features:
 * - Typography variants (h1, h2, h3, body, small, score)
 * - Color variants from design system
 * - Optional stroke for headers
 * - Word wrapping support
 * - Sticky positioning for mobile
 *
 * @example
 * ```ts
 * const header = UIText.create(scene, {
 *   x: 100,
 *   y: 50,
 *   text: 'Welcome!',
 *   variant: 'h1',
 *   color: 'primary',
 *   stroke: true
 * });
 * ```
 */
export class UIText {
  private textObject: Phaser.GameObjects.Text;
  private config: Required<TextConfig>;

  private constructor(scene: Phaser.Scene, config: TextConfig) {

    // Default config
    this.config = {
      variant: 'body',
      color: 'white',
      fontStyle: 'normal',
      align: 'left',
      originX: 0,
      originY: 0,
      stroke: false,
      strokeThickness: 2,
      wordWrap: 0,
      sticky: false,
      customColor: '',
      ...config
    };

    // Create text object
    const style = this.buildTextStyle();
    this.textObject = scene.add.text(config.x, config.y, config.text, style);
    this.textObject.setOrigin(this.config.originX, this.config.originY);

    // Apply sticky positioning if needed
    if (this.config.sticky) {
      this.textObject.setScrollFactor(0);
      this.textObject.setDepth(1002);
    }
  }

  /**
   * Factory method to create a new text object
   */
  static create(scene: Phaser.Scene, config: TextConfig): UIText {
    return new UIText(scene, config);
  }

  /**
   * Build Phaser text style from config
   */
  private buildTextStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: this.getFontSize(),
      color: this.getColor(),
      fontFamily: 'Arial, sans-serif',
      fontStyle: this.getFontStyle(),
      align: this.config.align
    };

    // Add stroke if requested
    if (this.config.stroke) {
      style.stroke = COLORS.neutral.black.text;
      style.strokeThickness = this.config.strokeThickness;
    }

    // Add word wrap if specified
    if (this.config.wordWrap > 0) {
      style.wordWrap = { width: this.config.wordWrap };
    }

    return style;
  }

  /**
   * Get font size based on variant
   * Note: Uses desktop sizes by default. ResponsiveConfig layouts should pass custom fontSize
   */
  private getFontSize(): string {
    switch (this.config.variant) {
      case 'h1':
        return '56px';
      case 'h2':
        return '42px';
      case 'h3':
        return '28px';
      case 'body':
        return '20px';
      case 'small':
        return '16px';
      case 'score':
        return '36px';
      default:
        return '20px';
    }
  }

  /**
   * Get color from design system based on color variant
   */
  private getColor(): string {
    // Custom color overrides everything
    if (this.config.customColor) {
      return this.config.customColor;
    }

    switch (this.config.color) {
      case 'primary':
        return COLORS.primary.text;
      case 'secondary':
        return COLORS.secondary.text;
      case 'danger':
        return COLORS.danger.text;
      case 'white':
        return COLORS.neutral.white.text;
      case 'black':
        return COLORS.neutral.black.text;
      case 'gray-light':
        return COLORS.neutral.gray.light.text;
      case 'gray-medium':
        return COLORS.neutral.gray.medium.text;
      case 'gray-dark':
        return COLORS.neutral.gray.dark.text;
      case 'success':
        return COLORS.success.text;
      case 'error':
        return COLORS.danger.error;
      case 'cost':
        return COLORS.danger.cost;
      default:
        return COLORS.neutral.white.text;
    }
  }

  /**
   * Get font style (handles both string and number weights)
   */
  private getFontStyle(): string {
    if (this.config.fontStyle === '600') {
      return 'bold'; // Phaser doesn't support numeric weights, map to bold
    }
    return this.config.fontStyle;
  }

  /**
   * Update text content
   */
  public setText(text: string): void {
    this.textObject.setText(text);
  }

  /**
   * Update text color
   */
  public setColor(color: TextColor | string): void {
    if (typeof color === 'string' && color.startsWith('#')) {
      // Custom hex color
      this.textObject.setColor(color);
    } else {
      // Use color variant
      this.config.color = color as TextColor;
      this.textObject.setColor(this.getColor());
    }
  }

  /**
   * Update position
   */
  public setPosition(x: number, y: number): void {
    this.textObject.setPosition(x, y);
  }

  /**
   * Update origin
   */
  public setOrigin(x: number, y: number): void {
    this.textObject.setOrigin(x, y);
  }

  /**
   * Set visibility
   */
  public setVisible(visible: boolean): void {
    this.textObject.setVisible(visible);
  }

  /**
   * Set alpha
   */
  public setAlpha(alpha: number): void {
    this.textObject.setAlpha(alpha);
  }

  /**
   * Get the underlying Phaser text object (for animations, etc.)
   */
  public getTextObject(): Phaser.GameObjects.Text {
    return this.textObject;
  }

  /**
   * Get text width (useful for layout calculations)
   */
  public getWidth(): number {
    return this.textObject.width;
  }

  /**
   * Get text height (useful for layout calculations)
   */
  public getHeight(): number {
    return this.textObject.height;
  }

  /**
   * Destroy the text object and clean up
   */
  public destroy(): void {
    this.textObject.destroy();
  }
}
