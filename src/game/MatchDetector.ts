import { Tile } from './Tile';
import { UpgradeManager } from './UpgradeManager';
import type { TilePosition, MatchGroup, TileColor } from '../types';

/**
 * Utility class for detecting matches in the grid
 * A match is 3 or more tiles of the same color in a row (horizontal, vertical, or diagonal with Phase Gun)
 */
export class MatchDetector {
  /**
   * Finds all matches in the current grid state
   * @param tiles - 2D array representing the current grid
   * @returns Array of match groups with full type information
   */
  public static findMatches(tiles: (Tile | null)[][]): MatchGroup[] {
    const matches: MatchGroup[] = [];
    const gridHeight = tiles.length;
    const gridWidth = tiles[0]?.length || 0;

    // Check horizontal matches (rows)
    for (let row = 0; row < gridHeight; row++) {
      let currentMatch: TilePosition[] = [];
      let currentColor: TileColor | null = null;

      for (let col = 0; col < gridWidth; col++) {
        const tile = tiles[row][col];

        if (tile && tile.color === currentColor) {
          // Continue current match
          currentMatch.push({ row, col });
        } else {
          // Check if previous match was valid (3+ tiles)
          if (currentMatch.length >= 3 && currentColor) {
            matches.push({
              tiles: [...currentMatch],
              color: currentColor,
              direction: 'horizontal',
              length: currentMatch.length
            });
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
      if (currentMatch.length >= 3 && currentColor) {
        matches.push({
          tiles: [...currentMatch],
          color: currentColor,
          direction: 'horizontal',
          length: currentMatch.length
        });
      }
    }

    // Check vertical matches (columns)
    for (let col = 0; col < gridWidth; col++) {
      let currentMatch: TilePosition[] = [];
      let currentColor: TileColor | null = null;

      for (let row = 0; row < gridHeight; row++) {
        const tile = tiles[row][col];

        if (tile && tile.color === currentColor) {
          // Continue current match
          currentMatch.push({ row, col });
        } else {
          // Check if previous match was valid (3+ tiles)
          if (currentMatch.length >= 3 && currentColor) {
            matches.push({
              tiles: [...currentMatch],
              color: currentColor,
              direction: 'vertical',
              length: currentMatch.length
            });
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
      if (currentMatch.length >= 3 && currentColor) {
        matches.push({
          tiles: [...currentMatch],
          color: currentColor,
          direction: 'vertical',
          length: currentMatch.length
        });
      }
    }

    // Check diagonal matches if Phase Gun is active
    const upgradeManager = UpgradeManager.getInstance();
    if (upgradeManager.hasUpgrade('phase_gun')) {
      const diagonalMatches = this.findDiagonalMatches(tiles);
      matches.push(...diagonalMatches);
    }

    return matches;
  }

  /**
   * Finds diagonal matches in the grid (only active with Phase Gun upgrade)
   * @param tiles - 2D array representing the current grid
   * @returns Array of diagonal match groups
   */
  private static findDiagonalMatches(tiles: (Tile | null)[][]): MatchGroup[] {
    const matches: MatchGroup[] = [];
    const gridHeight = tiles.length;
    const gridWidth = tiles[0]?.length || 0;

    // Check diagonal matches (top-left to bottom-right)
    for (let startRow = 0; startRow < gridHeight; startRow++) {
      for (let startCol = 0; startCol < gridWidth; startCol++) {
        let currentMatch: TilePosition[] = [];
        let currentColor: TileColor | null = null;

        // Traverse diagonal
        let row = startRow;
        let col = startCol;
        while (row < gridHeight && col < gridWidth) {
          const tile = tiles[row][col];

          if (tile && tile.color === currentColor) {
            currentMatch.push({ row, col });
          } else {
            if (currentMatch.length >= 3 && currentColor) {
              matches.push({
                tiles: [...currentMatch],
                color: currentColor,
                direction: 'diagonal',
                length: currentMatch.length
              });
            }

            if (tile) {
              currentMatch = [{ row, col }];
              currentColor = tile.color;
            } else {
              currentMatch = [];
              currentColor = null;
            }
          }

          row++;
          col++;
        }

        if (currentMatch.length >= 3 && currentColor) {
          matches.push({
            tiles: [...currentMatch],
            color: currentColor,
            direction: 'diagonal',
            length: currentMatch.length
          });
        }
      }
    }

    // Check diagonal matches (top-right to bottom-left)
    for (let startRow = 0; startRow < gridHeight; startRow++) {
      for (let startCol = gridWidth - 1; startCol >= 0; startCol--) {
        let currentMatch: TilePosition[] = [];
        let currentColor: TileColor | null = null;

        // Traverse diagonal
        let row = startRow;
        let col = startCol;
        while (row < gridHeight && col >= 0) {
          const tile = tiles[row][col];

          if (tile && tile.color === currentColor) {
            currentMatch.push({ row, col });
          } else {
            if (currentMatch.length >= 3 && currentColor) {
              matches.push({
                tiles: [...currentMatch],
                color: currentColor,
                direction: 'diagonal',
                length: currentMatch.length
              });
            }

            if (tile) {
              currentMatch = [{ row, col }];
              currentColor = tile.color;
            } else {
              currentMatch = [];
              currentColor = null;
            }
          }

          row++;
          col--;
        }

        if (currentMatch.length >= 3 && currentColor) {
          matches.push({
            tiles: [...currentMatch],
            color: currentColor,
            direction: 'diagonal',
            length: currentMatch.length
          });
        }
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
   * With Tractor Beam upgrade, tiles can be 2 spaces apart
   * @param pos1 - First position
   * @param pos2 - Second position
   * @returns true if positions are within valid swap distance
   */
  public static areAdjacent(pos1: TilePosition, pos2: TilePosition): boolean {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);

    // Determine max distance based on Tractor Beam upgrade
    const upgradeManager = UpgradeManager.getInstance();
    const maxDistance = upgradeManager.hasUpgrade('tractor_beam') ? 2 : 1;

    // Valid swap means within maxDistance in one direction, zero in the other
    return (rowDiff <= maxDistance && colDiff === 0) || (rowDiff === 0 && colDiff <= maxDistance);
  }
}