import { supabase } from './SupabaseClient';
import type {
  LeaderboardEntry,
  LeaderboardRow,
  ScoreSubmission,
  LeaderboardFilter
} from '../types/Leaderboard';

/**
 * Service for managing leaderboard operations
 * Handles score submissions and retrievals from Supabase
 */
export class LeaderboardService {
  private static instance: LeaderboardService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  /**
   * Submit a score to the leaderboard
   */
  public async submitScore(submission: ScoreSubmission): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .insert({
          player_name: submission.playerName,
          total_score: submission.totalScore,
          rounds_completed: submission.roundsCompleted,
          lives_remaining: submission.livesRemaining,
          game_completed: submission.gameCompleted,
          upgrades_purchased: submission.upgradesPurchased,
          game_duration_seconds: submission.gameDurationSeconds || null,
          play_date: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to submit score:', error);
        return { success: false, error: error.message };
      }

      return { success: true, id: data.id };
    } catch (err) {
      console.error('Unexpected error submitting score:', err);
      return { success: false, error: 'Failed to submit score' };
    }
  }

  /**
   * Get top scores with optional filtering
   */
  public async getTopScores(limit: number = 10, filter: LeaderboardFilter = 'all-time'): Promise<LeaderboardEntry[]> {
    try {
      let query = supabase
        .from('leaderboard')
        .select('*')
        .order('total_score', { ascending: false })
        .limit(limit);

      // Apply date filters
      if (filter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('play_date', today.toISOString());
      } else if (filter === 'this-week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('play_date', weekAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch leaderboard:', error);
        return [];
      }

      return this.mapRowsToEntries(data || []);
    } catch (err) {
      console.error('Unexpected error fetching leaderboard:', err);
      return [];
    }
  }

  /**
   * Get recent scores (sorted by date)
   */
  public async getRecentScores(limit: number = 20): Promise<LeaderboardEntry[]> {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('play_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch recent scores:', error);
        return [];
      }

      return this.mapRowsToEntries(data || []);
    } catch (err) {
      console.error('Unexpected error fetching recent scores:', err);
      return [];
    }
  }

  /**
   * Get player's rank for a given score
   */
  public async getPlayerRank(score: number): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('leaderboard')
        .select('*', { count: 'exact', head: true })
        .gt('total_score', score);

      if (error) {
        console.error('Failed to calculate rank:', error);
        return -1;
      }

      // Rank is number of scores higher + 1
      return (count || 0) + 1;
    } catch (err) {
      console.error('Unexpected error calculating rank:', err);
      return -1;
    }
  }

  /**
   * Get total number of leaderboard entries
   */
  public async getTotalEntries(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('leaderboard')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('Failed to count entries:', error);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error('Unexpected error counting entries:', err);
      return 0;
    }
  }

  /**
   * Map database rows to LeaderboardEntry objects
   */
  private mapRowsToEntries(rows: LeaderboardRow[]): LeaderboardEntry[] {
    return rows.map(row => ({
      id: row.id,
      playerName: row.player_name,
      totalScore: row.total_score,
      roundsCompleted: row.rounds_completed,
      livesRemaining: row.lives_remaining,
      gameCompleted: row.game_completed,
      upgradesPurchased: row.upgrades_purchased || [],
      playDate: row.play_date,
      gameDurationSeconds: row.game_duration_seconds || undefined
    }));
  }

  /**
   * Reset instance (for testing)
   */
  public static resetInstance(): void {
    LeaderboardService.instance = undefined as any;
  }
}
