export const GAME_CONFIG = {
  GRID_WIDTH: 8,
  GRID_HEIGHT: 8,
  TILE_SIZE: 60,
  TILE_SPACING: 4,
  COLORS: ['deepSpaceBlue', 'nebulaPurple', 'cosmicTeal', 'solarGold', 'meteorSilver', 'plasmaPink'] as const,
  ANIMATION_DURATION: 300,
  BOARD_OFFSET_X: 100,
  BOARD_OFFSET_Y: 120
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