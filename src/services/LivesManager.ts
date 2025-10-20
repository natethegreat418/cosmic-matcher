/**
 * LivesManager - Tracks player lives and validates round completion
 *
 * Manages the lives system where players lose a life if they fail to meet
 * the minimum score threshold for a round. Game ends when lives reach 0.
 */

import { LIVES_CONFIG, GameConfigHelpers } from '../config/GameConfig';

/**
 * Result of a round completion check against lives/threshold system
 */
export interface RoundCompletionResult {
  /** Whether the player passed the round (met score threshold) */
  passed: boolean;

  /** Number of lives remaining after this round */
  livesRemaining: number;

  /** Whether the game is over (lives reached 0) */
  isGameOver: boolean;

  /** The minimum score threshold for this round */
  threshold: number;

  /** The actual score achieved by the player */
  score: number;
}

/**
 * Manages player lives and round completion validation
 */
export class LivesManager {
  private static instance: LivesManager | null = null;
  private lives: number;

  private constructor() {
    this.lives = LIVES_CONFIG.STARTING_LIVES;
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): LivesManager {
    if (!LivesManager.instance) {
      LivesManager.instance = new LivesManager();
    }
    return LivesManager.instance;
  }

  /**
   * Reset the singleton instance (for testing)
   */
  public static resetInstance(): void {
    LivesManager.instance = null;
  }

  /**
   * Check if the player passed the round and update lives accordingly
   *
   * @param round - The round number (1-10)
   * @param score - The score achieved by the player
   * @returns RoundCompletionResult with pass/fail status and game state
   */
  public checkRoundCompletion(round: number, score: number): RoundCompletionResult {
    const threshold = GameConfigHelpers.getRoundThreshold(round);
    const passed = score >= threshold;

    if (!passed) {
      this.lives = Math.max(0, this.lives - 1);
    }

    return {
      passed,
      livesRemaining: this.lives,
      isGameOver: this.lives <= 0,
      threshold,
      score,
    };
  }

  /**
   * Get the current number of lives
   */
  public getLives(): number {
    return this.lives;
  }

  /**
   * Check if the game is over (lives reached 0)
   */
  public isGameOver(): boolean {
    return this.lives <= 0;
  }

  /**
   * Reset lives to starting value (for new game)
   */
  public reset(): void {
    this.lives = LIVES_CONFIG.STARTING_LIVES;
  }

  /**
   * Set lives to a specific value (for testing/debugging)
   */
  public setLives(lives: number): void {
    this.lives = Math.max(0, lives);
  }
}
