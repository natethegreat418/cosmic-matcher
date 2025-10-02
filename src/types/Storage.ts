/**
 * Local storage type definitions for game persistence
 */

export interface SavedGameState {
  // Core progress
  currentRound: number;              // Which round they're on (1-10)
  totalScore: number;                // Cumulative score across all rounds
  roundScores: number[];             // Array of completed round scores
  availablePoints: number;           // Unspent points for shop
  spentPoints: number;               // Total spent in shop
  ownedUpgrades: string[];           // Upgrade IDs they own
  isComplete: boolean;               // Whether they've finished all 10 rounds

  // Shop state
  shopPurchaseCounts: {              // How many times each item was purchased
    [itemId: string]: number;
  };

  // Metadata
  gameId: string;                    // Unique ID for this playthrough
  timestamp: string;                 // When the save was created (ISO string)
  version: string;                   // For future migration compatibility
}
