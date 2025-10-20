/**
 * Game Configuration - Single Source of Truth for Game Balance
 *
 * Centralizes all game balance values, costs, scoring rules, and mechanics
 * for easy tuning and maintenance. Separated from UI/design constants.
 */

/**
 * Scoring configuration for matches and combos
 */
export const SCORING = {
  /** Base score per tile in a match */
  BASE_TILE_SCORE: 10,

  /** Multiplier applied to cascades (compounds per cascade level) */
  COMBO_MULTIPLIER: 1.5,

  /** Bonus points per tile beyond 3 in a single match */
  LONG_MATCH_BONUS: 50,

  /** Cascade level required to start awarding time bonuses (5+ cascades) */
  TIME_BONUS_THRESHOLD: 5,

  /** Seconds awarded per cascade level above threshold (2s per level) */
  COMBO_BONUS_TIME_SECONDS: 2,
} as const;

/**
 * Shop item definitions with costs and limits
 */
export const SHOP_ITEMS = {
  bonus_time: {
    id: 'bonus_time',
    name: 'Radiation Shield',
    description: '+10 seconds to next round',
    baseCost: 150,
    maxPurchases: 5,
    icon: '/shop/radiation-shield.png',
  },
  time_dilation: {
    id: 'time_dilation',
    name: 'Quantum Time Dilation',
    description: 'Slows countdown by 0.5s per tick (one round)',
    baseCost: 500,
    maxPurchases: 5,
    icon: '/shop/quantum-dilation.png',
  },
  phase_gun: {
    id: 'phase_gun',
    name: 'Phase Gun',
    description: 'Enables diagonal 3-tile matches',
    baseCost: 3200,
    maxPurchases: 1,
    icon: '/shop/phaser.png',
  },
  tractor_beam: {
    id: 'tractor_beam',
    name: 'Tractor Beam',
    description: 'Swap tiles from 2 spaces away',
    baseCost: 1800,
    maxPurchases: 1,
    icon: '/shop/tractor-beam.png',
  },
} as const;

/**
 * Shop pricing configuration
 */
export const SHOP_PRICING = {
  /** Multiplier for each additional purchase of the same item */
  COST_SCALING_MULTIPLIER: 1.5,
} as const;

/**
 * Upgrade effect values
 */
export const UPGRADE_EFFECTS = {
  /** Seconds added per bonus_time purchase */
  BONUS_TIME_SECONDS: 10,

  /** Timer slowdown per time_dilation purchase (reduces timer speed) */
  TIME_DILATION_SLOWDOWN: 0.5,

  /** Max swap distance with tractor_beam upgrade */
  TRACTOR_BEAM_DISTANCE: 2,

  /** Default swap distance without tractor_beam */
  DEFAULT_SWAP_DISTANCE: 1,

  /** Whether phase_gun enables diagonal matches */
  PHASE_GUN_ENABLES_DIAGONALS: true,
} as const;

/**
 * Timer and round progression configuration
 */
export const TIMER_CONFIG = {
  /** Base timer duration in production (seconds) */
  PRODUCTION_ROUND_TIMER: 60,

  /** Timer duration in development mode (seconds) */
  DEV_ROUND_TIMER: 15,

  /** Timer speed multipliers by round pair */
  SPEED_MULTIPLIERS: {
    rounds_1_2: 1.0,   // Normal speed
    rounds_3_4: 1.5,   // 50% faster
    rounds_5_6: 2.0,   // 2x faster
    rounds_7_8: 2.5,   // 2.5x faster
    rounds_9_10: 3.0,  // Ludicrous!
  },

  /** Total number of rounds in a complete game */
  TOTAL_ROUNDS: 10,

  /** Timer color thresholds (seconds remaining) */
  COLOR_THRESHOLDS: {
    /** Below this: pink/danger */
    DANGER: 10,
    /** Below this: gold/warning */
    WARNING: 30,
    /** Above: cyan/normal */
  },
} as const;

/**
 * Lives and round threshold configuration
 */
export const LIVES_CONFIG = {
  /** Starting number of lives */
  STARTING_LIVES: 3,

  /** Minimum score required to pass each round */
  ROUND_THRESHOLDS: [
    { round: 1, minScore: 500 },
    { round: 2, minScore: 600 },
    { round: 3, minScore: 800 },
    { round: 4, minScore: 1000 },
    { round: 5, minScore: 1200 },
    { round: 6, minScore: 1400 },
    { round: 7, minScore: 1800 },
    { round: 8, minScore: 2000 },
    { round: 9, minScore: 2500 },
    { round: 10, minScore: 3000 },
  ],
} as const;

/**
 * Input and interaction configuration
 */
export const INPUT_CONFIG = {
  /** Minimum pixels for swipe to register */
  MIN_SWIPE_DISTANCE: 30,

  /** Stroke width for selected tile border */
  SELECTED_BORDER_WIDTH: 4,

  /** Stroke width for normal tile border */
  NORMAL_BORDER_WIDTH: 2,

  /** Stroke width for hint tile border */
  HINT_BORDER_WIDTH: 4,
} as const;

/**
 * Game animation durations (in milliseconds)
 * UI animations are in DesignSystem.ts - these are for game logic
 */
export const GAME_ANIMATIONS = {
  /** Standard tile movement duration */
  TILE_MOVE: 300,

  /** Tile removal/destruction duration */
  TILE_REMOVAL: 240,  // TILE_MOVE * 0.8

  /** Tile drop-in duration */
  TILE_DROP: 360,  // TILE_MOVE * 1.2

  /** Invalid swap animation duration */
  INVALID_SWAP: 200,

  /** Delay between cascade processing */
  CASCADE_PAUSE: 200,

  /** Grid hide animation duration */
  GRID_HIDE: 500,

  /** Pulse animation for tile hints */
  HINT_PULSE: 300,

  /** Swap preview animation */
  SWAP_PREVIEW: 80,
} as const;

/**
 * Grid initialization configuration
 */
export const GRID_CONFIG = {
  /** Maximum attempts to find a non-matching color during initialization */
  MAX_COLOR_ATTEMPTS: 20,
} as const;

/**
 * Helper functions for game configuration
 */
export const GameConfigHelpers = {
  /**
   * Get the timer speed multiplier for a given round
   */
  getSpeedMultiplier(round: number): number {
    if (round <= 2) return TIMER_CONFIG.SPEED_MULTIPLIERS.rounds_1_2;
    if (round <= 4) return TIMER_CONFIG.SPEED_MULTIPLIERS.rounds_3_4;
    if (round <= 6) return TIMER_CONFIG.SPEED_MULTIPLIERS.rounds_5_6;
    if (round <= 8) return TIMER_CONFIG.SPEED_MULTIPLIERS.rounds_7_8;
    return TIMER_CONFIG.SPEED_MULTIPLIERS.rounds_9_10;
  },

  /**
   * Calculate shop item cost based on purchase count
   */
  calculateItemCost(itemId: keyof typeof SHOP_ITEMS, purchaseCount: number): number {
    const item = SHOP_ITEMS[itemId];
    const count = Math.max(0, purchaseCount); // Guard against negative counts
    return Math.round(item.baseCost * Math.pow(SHOP_PRICING.COST_SCALING_MULTIPLIER, count));
  },

  /**
   * Get base round timer (dev vs production)
   * Note: Actual dev/production detection is in DevConfig.ts
   */
  getBaseRoundTimer(isDev: boolean = import.meta.env.DEV): number {
    return isDev ? TIMER_CONFIG.DEV_ROUND_TIMER : TIMER_CONFIG.PRODUCTION_ROUND_TIMER;
  },

  /**
   * Get timer color based on remaining time
   */
  getTimerColor(secondsRemaining: number): string {
    if (secondsRemaining <= TIMER_CONFIG.COLOR_THRESHOLDS.DANGER) {
      return '#EC4899'; // Plasma Pink
    }
    if (secondsRemaining <= TIMER_CONFIG.COLOR_THRESHOLDS.WARNING) {
      return '#F59E0B'; // Solar Gold
    }
    return '#00F5FF'; // Bright Cyan
  },

  /**
   * Get the minimum score threshold for a given round
   */
  getRoundThreshold(round: number): number {
    const threshold = LIVES_CONFIG.ROUND_THRESHOLDS[round - 1];
    return threshold ? threshold.minScore : 0;
  },
};
