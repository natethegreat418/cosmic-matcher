/**
 * Leaderboard types for score submissions and display
 */

/**
 * Leaderboard entry as stored in database
 */
export interface LeaderboardEntry {
  id?: string;
  playerName: string;
  totalScore: number;
  roundsCompleted: number;
  livesRemaining: number;
  gameCompleted: boolean;
  upgradesPurchased: PurchasedUpgrade[];
  playDate: string;
  gameDurationSeconds?: number;
}

/**
 * Purchased upgrade info for leaderboard tracking
 */
export interface PurchasedUpgrade {
  upgradeId: string;
  purchaseCount: number;
  roundPurchased: number;
}

/**
 * Database row structure (matches Supabase schema)
 */
export interface LeaderboardRow {
  id: string;
  player_name: string;
  total_score: number;
  rounds_completed: number;
  lives_remaining: number;
  game_completed: boolean;
  upgrades_purchased: PurchasedUpgrade[];
  play_date: string;
  game_duration_seconds: number | null;
  created_at: string;
}

/**
 * Score submission payload
 */
export interface ScoreSubmission {
  playerName: string;
  totalScore: number;
  roundsCompleted: number;
  livesRemaining: number;
  gameCompleted: boolean;
  upgradesPurchased: PurchasedUpgrade[];
  gameDurationSeconds?: number;
}

/**
 * Leaderboard filter options
 */
export type LeaderboardFilter = 'all-time' | 'today' | 'this-week';

/**
 * Leaderboard sort options
 */
export type LeaderboardSort = 'score' | 'recent';
