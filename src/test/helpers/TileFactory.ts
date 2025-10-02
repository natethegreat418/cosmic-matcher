import { Tile } from '../../game/Tile';
import type { TileColor } from '../../types';

/**
 * Factory for creating mock Tile objects for testing
 * Bypasses Phaser dependencies
 */
export class TileFactory {
  /**
   * Creates a minimal mock tile for testing
   * @param gridX - Grid column position
   * @param gridY - Grid row position
   * @param color - Tile color
   * @returns Mock tile with only essential properties
   */
  static createMockTile(gridX: number, gridY: number, color: TileColor): Tile {
    // Create a minimal mock that satisfies the Tile interface for testing
    const mockTile = {
      color,
      gridX,
      gridY,
      sprite: {
        x: gridX * 64,
        y: gridY * 64,
        setPosition: () => {},
        destroy: () => {},
      },
      backgroundRect: null,
      destroy: () => {},
      animateToPosition: async () => {},
      animateRemoval: async () => {},
      animateDropIn: async () => {},
      setSelected: () => {},
      setHint: () => {},
      unhighlight: () => {},
    } as unknown as Tile;

    return mockTile;
  }

  /**
   * Creates a grid of mock tiles
   * @param pattern - 2D array where each element is a color initial or null
   * Example: [['R', 'R', 'R'], ['B', 'B', null]]
   * R = deepSpaceBlue, P = nebulaPurple, T = cosmicTeal, G = solarGold, S = meteorSilver, K = plasmaPink
   */
  static createMockGrid(pattern: (string | null)[][]): (Tile | null)[][] {
    const colorMap: Record<string, TileColor> = {
      'R': 'deepSpaceBlue',
      'P': 'nebulaPurple',
      'T': 'cosmicTeal',
      'G': 'solarGold',
      'S': 'meteorSilver',
      'K': 'plasmaPink',
    };

    return pattern.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (cell === null) return null;
        const color = colorMap[cell];
        if (!color) throw new Error(`Unknown color code: ${cell}`);
        return this.createMockTile(colIndex, rowIndex, color);
      })
    );
  }
}
