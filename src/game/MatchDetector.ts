import { Tile } from './Tile';
import { type TilePosition } from '../types';

/**
 * Utility class for detecting matches in the grid
 * A match is 3 or more tiles of the same color in a row (horizontal or vertical)
 */
export class MatchDetector {
  /**
   * Finds all matches in the current grid state
   * @param tiles - 2D array representing the current grid
   * @returns Array of match groups, where each group is an array of tile positions
   */
  public static findMatches(tiles: (Tile | null)[][]): TilePosition[][] {
    const matches: TilePosition[][] = [];
    const gridHeight = tiles.length;
    const gridWidth = tiles[0]?.length || 0;

    // Check horizontal matches (rows)
    for (let row = 0; row < gridHeight; row++) {
      let currentMatch: TilePosition[] = [];
      let currentColor: string | null = null;

      for (let col = 0; col < gridWidth; col++) {
        const tile = tiles[row][col];

        if (tile && tile.color === currentColor) {
          // Continue current match
          currentMatch.push({ row, col });
        } else {
          // Check if previous match was valid (3+ tiles)
          if (currentMatch.length >= 3) {
            matches.push([...currentMatch]);
          }

          // Start new potential match
          if (tile) {
            currentMatch = [{ row, col }];
            currentColor = tile.color;
          } else {
            currentMatch = [];
            currentColor = null;
          }
        }
      }

      // Check final match in row
      if (currentMatch.length >= 3) {
        matches.push([...currentMatch]);
      }
    }

    // Check vertical matches (columns)
    for (let col = 0; col < gridWidth; col++) {
      let currentMatch: TilePosition[] = [];
      let currentColor: string | null = null;

      for (let row = 0; row < gridHeight; row++) {
        const tile = tiles[row][col];

        if (tile && tile.color === currentColor) {
          // Continue current match
          currentMatch.push({ row, col });
        } else {
          // Check if previous match was valid (3+ tiles)
          if (currentMatch.length >= 3) {
            matches.push([...currentMatch]);
          }

          // Start new potential match
          if (tile) {
            currentMatch = [{ row, col }];
            currentColor = tile.color;
          } else {
            currentMatch = [];
            currentColor = null;
          }
        }
      }

      // Check final match in column
      if (currentMatch.length >= 3) {
        matches.push([...currentMatch]);
      }
    }

    return matches;
  }

  /**
   * Checks if swapping two specific tiles would create any matches
   * @param tiles - Current grid state
   * @param pos1 - Position of first tile to swap
   * @param pos2 - Position of second tile to swap
   * @returns true if the swap would create at least one match
   */
  public static wouldSwapCreateMatch(
    tiles: (Tile | null)[][],
    pos1: TilePosition,
    pos2: TilePosition
  ): boolean {
    // Create a copy of the grid with the tiles swapped
    const testGrid = tiles.map(row => [...row]);

    // Perform the swap in our test grid
    const temp = testGrid[pos1.row][pos1.col];
    testGrid[pos1.row][pos1.col] = testGrid[pos2.row][pos2.col];
    testGrid[pos2.row][pos2.col] = temp;

    // Check if this creates any matches
    const matches = this.findMatches(testGrid);
    return matches.length > 0;
  }

  /**
   * Checks if two positions are adjacent (horizontally or vertically)
   * @param pos1 - First position
   * @param pos2 - Second position
   * @returns true if positions are adjacent
   */
  public static areAdjacent(pos1: TilePosition, pos2: TilePosition): boolean {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);

    // Adjacent means exactly one step away in one direction, zero in the other
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }
}