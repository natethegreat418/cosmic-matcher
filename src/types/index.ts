import { getGridConfig, isMobile } from '../config/ResponsiveConfig';

const gridConfig = getGridConfig();

export const GAME_CONFIG = {
  GRID_WIDTH: gridConfig.gridSize,
  GRID_HEIGHT: gridConfig.gridSize,
  TILE_SIZE: gridConfig.tileSize,
  TILE_SPACING: gridConfig.tileSpacing,
  TILE_BORDER_RADIUS: gridConfig.tileBorderRadius,
  COLORS: ['deepSpaceBlue', 'nebulaPurple', 'cosmicTeal', 'solarGold', 'meteorSilver', 'plasmaPink'] as const,
  ANIMATION_DURATION: 300,
  BOARD_OFFSET_X: gridConfig.offsetX,
  BOARD_OFFSET_Y: gridConfig.offsetY,
  IS_MOBILE: isMobile()
} as const;

export type TileColor = typeof GAME_CONFIG.COLORS[number];

export interface TilePosition {
  row: number;
  col: number;
}

export interface GameState {
  score: number;
  moves: number;
  isSwapping: boolean;
  selectedTile: TilePosition | null;
}

/**
 * Represents a group of matched tiles
 */
export interface MatchGroup {
  tiles: TilePosition[];
  color: TileColor;
  direction: 'horizontal' | 'vertical' | 'diagonal';
  length: number; // Convenience field for scoring
}

/**
 * Result of a cascade processing cycle
 */
export interface CascadeResult {
  matchGroups: MatchGroup[];
  cascadeLevel: number;
  scoreAwarded: number;
  timeBonus: number;
  totalTilesMatched: number;
}

/**
 * Statistics for a single match processing operation
 */
export interface MatchStats {
  totalMatches: number;
  totalCascades: number;
  highestCascade: number;
  totalScore: number;
  longestMatch: number;
}