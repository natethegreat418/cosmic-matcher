/**
 * Design System - Single Source of Truth for Visual Design
 *
 * Centralizes all colors, animations, spacing, and design tokens
 * for consistent UI across all scenes.
 */

/**
 * Color palette with hex and Phaser integer formats
 * Phaser shapes use integer format (0x...), text uses hex strings (#...)
 */
export const COLORS = {
  // Primary colors
  primary: {
    main: 0x00F5FF,        // Bright Cyan (Phaser format)
    hover: 0x66FFFF,       // Lighter Bright Cyan (hover state)
    text: '#00F5FF',       // Bright Cyan (text format)
  },

  // Secondary colors
  secondary: {
    main: 0xF59E0B,        // Solar Gold
    hover: 0xFFBF40,       // Lighter Solar Gold (hover state)
    text: '#F59E0B',       // Solar Gold (text format)
  },

  // Danger/Error colors
  danger: {
    main: 0x8B0000,        // Dark Red
    hover: 0xDC143C,       // Crimson Red (hover state)
    text: '#EC4899',       // Plasma Pink (text format)
    error: '#FF4444',      // Error message red
    cost: '#FF6B6B',       // Cost display red
  },

  // Success colors
  success: {
    main: 0x10B981,        // Emerald green
    text: '#00FF00',       // Bright green for messages
  },

  // Background colors
  background: {
    main: '#2a2a2a',       // Main background
    dark: '#1a1a1a',       // Darker background (inputs, shelves)
    card: 0x333333,        // Card/item backgrounds
    shelf: 0x1a1a1a,       // Sticky shelf background
    border: 0x4a4a4a,      // Border/separator lines
  },

  // Neutral colors (white, gray, black)
  neutral: {
    white: {
      phaser: 0xFFFFFF,
      text: '#ffffff',
    },
    black: {
      phaser: 0x000000,
      text: '#000000',
    },
    gray: {
      dark: {
        phaser: 0x333333,
        text: '#333333',
      },
      medium: {
        phaser: 0x666666,
        text: '#666666',
      },
      mediumLight: {
        phaser: 0x888888,
        text: '#888888',
      },
      light: {
        phaser: 0xcccccc,
        text: '#cccccc',
      },
      border: {
        phaser: 0x444444,
        text: '#444444',
      }
    }
  },

  // UI state colors
  state: {
    disabled: {
      phaser: 0x666666,
      text: '#888888',
    },
    active: {
      phaser: 0x00F5FF,
      text: '#00F5FF',
    },
    inactive: {
      phaser: 0x333333,
      text: '#666666',
    }
  }
} as const;

/**
 * Animation configurations for consistent motion design
 */
export const ANIMATIONS = {
  // Button interactions
  button: {
    hover: {
      duration: 100,
      scaleX: 1.05,
      scaleY: 1.05,
    },
    hoverLarge: {
      duration: 100,
      scaleX: 1.1,
      scaleY: 1.1,
    }
  },

  // Entry animations
  entrance: {
    header: {
      duration: 500,
      ease: 'Back.easeOut',
      from: { scale: 0 },
      to: { scale: 1 }
    },
    popup: {
      duration: 300,
      ease: 'Back.easeOut',
      from: { scale: 0 },
      to: { scale: 1 }
    }
  },

  // Pulse effects
  pulse: {
    timer: {
      duration: 200,
      scaleX: 1.1,
      scaleY: 1.1,
      ease: 'Power2.easeOut',
      yoyo: true
    },
    score: {
      duration: 125,  // duration / 4 from original
      scaleX: 1.2,
      scaleY: 1.2,
      ease: 'Power2.easeOut',
      yoyo: true
    },
    combo: {
      duration: 300,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 1,
      ease: 'Back.easeOut'
    }
  },

  // Fade effects
  fade: {
    out: {
      duration: 1000,
      ease: 'Power2.easeIn',
      alpha: 0
    },
    outSlow: {
      duration: 2000,
      ease: 'Power2.easeIn',
      alpha: 0
    }
  },

  // Score counter animation
  scoreCounter: {
    duration: 500,
    ease: 'Power2.easeOut'
  },

  // Ship/icon animations
  ship: {
    pulse: {
      duration: 500,
      ease: 'Power2',
      yoyo: true,
      repeat: -1  // Infinite
    }
  }
} as const;

/**
 * Spacing system for consistent layout
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40
} as const;

/**
 * Border radius values
 */
export const BORDER_RADIUS = {
  small: 2,
  medium: 6,
  large: 8
} as const;

/**
 * Stroke/border widths
 */
export const STROKE = {
  thin: 1,
  medium: 2,
  thick: 3,
  heavy: 4
} as const;

/**
 * Helper functions for working with colors
 */
export const ColorHelpers = {
  /**
   * Get hover color for a given button color
   */
  getHoverColor(color: number): number {
    switch(color) {
      case COLORS.primary.main:
        return COLORS.primary.hover;
      case COLORS.secondary.main:
        return COLORS.secondary.hover;
      case COLORS.danger.main:
        return COLORS.danger.hover;
      default:
        // Default: slightly lighter (if not recognized)
        return Math.min(color + 0x303030, 0xFFFFFF);
    }
  },

  /**
   * Get text color variant from Phaser color
   */
  phaserToTextColor(phaserColor: number): string {
    switch(phaserColor) {
      case COLORS.primary.main:
        return COLORS.primary.text;
      case COLORS.secondary.main:
        return COLORS.secondary.text;
      case COLORS.danger.main:
        return COLORS.danger.text;
      case COLORS.neutral.white.phaser:
        return COLORS.neutral.white.text;
      case COLORS.neutral.black.phaser:
        return COLORS.neutral.black.text;
      default:
        return '#ffffff';
    }
  }
};
