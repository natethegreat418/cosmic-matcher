// Helper to check if mobile
const isMobile = () => window.innerWidth < 768;

// Calculate responsive tile size and layout
const getTileConfig = () => {
  const GRID_SIZE = 8;
  const TILE_SPACING = 4;

  if (isMobile()) {
    const screenWidth = Math.min(window.innerWidth, 500);
    const maxGridWidth = screenWidth - 20; // 10px padding on each side
    const tileSize = Math.floor((maxGridWidth - ((GRID_SIZE - 1) * TILE_SPACING)) / GRID_SIZE);
    return {
      tileSize: Math.min(tileSize, 50), // Cap at 50px for mobile
      offsetX: 10,
      offsetY: 80 // Reduced space for tighter UI
    };
  }

  // Desktop: Truly center the grid in the canvas
  // Canvas: 900px, Grid: 508px
  // Center: (900 - 508) / 2 = 196px
  const tileSize = 60;
  const canvasWidth = 900;
  const gridWidth = (GRID_SIZE * tileSize) + ((GRID_SIZE - 1) * TILE_SPACING);
  const offsetX = Math.floor((canvasWidth - gridWidth) / 2);

  return {
    tileSize: tileSize,
    offsetX: offsetX,
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