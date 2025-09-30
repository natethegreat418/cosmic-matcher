// Helper to check if mobile
const isMobile = () => window.innerWidth < 768;

// Calculate responsive tile size and layout
const getTileConfig = () => {
  if (isMobile()) {
    const screenWidth = Math.min(window.innerWidth, 500);
    const maxGridWidth = screenWidth - 20; // 10px padding on each side
    const tileSize = Math.floor((maxGridWidth - (7 * 4)) / 8); // 8 tiles with 4px spacing
    return {
      tileSize: Math.min(tileSize, 50), // Cap at 50px for mobile
      offsetX: 10,
      offsetY: 80 // Reduced space for tighter UI
    };
  }
  return {
    tileSize: 60,
    offsetX: 100,
    offsetY: 120
  };
};

const tileConfig = getTileConfig();

export const GAME_CONFIG = {
  GRID_WIDTH: 8,
  GRID_HEIGHT: 8,
  TILE_SIZE: tileConfig.tileSize,
  TILE_SPACING: 4,
  COLORS: ['deepSpaceBlue', 'nebulaPurple', 'cosmicTeal', 'solarGold', 'meteorSilver', 'plasmaPink'] as const,
  ANIMATION_DURATION: 300,
  BOARD_OFFSET_X: tileConfig.offsetX,
  BOARD_OFFSET_Y: tileConfig.offsetY,
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