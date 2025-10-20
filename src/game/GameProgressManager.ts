import type { GameProgress, RoundResult } from '../types/Progress';
import type { SavedGameState } from '../types/Storage';
import { ShopSystem } from './ShopSystem';
import { LocalStorageManager } from '../services/LocalStorageManager';
import { DEV_CONFIG } from '../config/DevConfig';
import { LivesManager, type RoundCompletionResult } from '../services/LivesManager';
import { GameConfigHelpers } from '../config/GameConfig';

// Re-export for convenience
export type { RoundCompletionResult };

export class GameProgressManager {
  private static instance: GameProgressManager | null = null;
  private progress: GameProgress;
  private livesManager: LivesManager;
  private lastRoundCompletion: RoundCompletionResult | null = null;

  private constructor() {
    this.progress = this.initializeProgress();
    this.livesManager = LivesManager.getInstance();
  }

  public static getInstance(): GameProgressManager {
    if (!GameProgressManager.instance) {
      GameProgressManager.instance = new GameProgressManager();
    }
    return GameProgressManager.instance;
  }

  private initializeProgress(): GameProgress {
    const startingScore = DEV_CONFIG.startingScore;
    return {
      currentRound: 1,
      totalScore: startingScore,
      roundScores: [],
      availablePoints: startingScore,
      spentPoints: 0,
      ownedUpgrades: [],
      roundTimer: DEV_CONFIG.timerSeconds,
      isComplete: false
    };
  }

  public startNewGame(): void {
    this.progress = this.initializeProgress();

    // Reset shop purchases for new game
    const shopSystem = ShopSystem.getInstance();
    shopSystem.resetPurchases();

    // Reset lives for new game
    this.livesManager.reset();

    // Clear saved game from localStorage
    LocalStorageManager.clearSave();
  }

  /**
   * Loads game state from a saved game
   * Used when continuing a saved game
   */
  public loadFromSave(savedState: SavedGameState): void {
    this.progress = {
      currentRound: savedState.currentRound,
      totalScore: savedState.totalScore,
      roundScores: savedState.roundScores,
      availablePoints: savedState.availablePoints,
      spentPoints: savedState.spentPoints,
      ownedUpgrades: savedState.ownedUpgrades,
      roundTimer: DEV_CONFIG.timerSeconds,
      isComplete: savedState.isComplete
    };
  }

  public completeRound(roundScore: number): RoundResult {
    // Check lives system before saving score
    const livesCheck = this.livesManager.checkRoundCompletion(this.progress.currentRound, roundScore);
    this.lastRoundCompletion = livesCheck;

    // Always save round score (even if failed - it goes toward total)
    this.progress.roundScores.push(roundScore);
    this.progress.totalScore += roundScore;
    this.progress.availablePoints += roundScore;

    const result: RoundResult = {
      roundNumber: this.progress.currentRound,
      score: roundScore,
      timeRemaining: 0, // Will be set by GameState
      combosAchieved: 0  // Will be set by GameState
    };

    // Check if game is over (ran out of lives)
    if (livesCheck.isGameOver) {
      this.progress.isComplete = true;
    } else if (livesCheck.passed) {
      // Only advance to next round if passed
      if (this.progress.currentRound >= 10) {
        this.progress.isComplete = true;
      } else {
        this.progress.currentRound++;
      }
    }
    // If failed but still have lives, stay on same round (replay)

    return result;
  }

  public getRoundTimer(): number {
    return this.progress.roundTimer; // 60 in production, configurable in dev
  }

  /**
   * Gets the speed multiplier for the current round's timer
   * Round 1-2: 1x speed
   * Round 3-4: 1.5x speed
   * Round 5-6: 2x speed
   * Round 7-8: 2.5x speed
   * Round 9-10: 3x speed
   */
  public getTimerSpeedMultiplier(): number {
    const round = this.progress.currentRound;

    if (round <= 2) return 1.0;
    if (round <= 4) return 1.5;
    if (round <= 6) return 2.0;
    if (round <= 8) return 2.5;
    return 3.0; // Rounds 9-10
  }

  public getCurrentRound(): number {
    return this.progress.currentRound;
  }

  public getTotalScore(): number {
    return this.progress.totalScore;
  }

  public getRoundScores(): number[] {
    return [...this.progress.roundScores];
  }

  public getAvailablePoints(): number {
    return this.progress.availablePoints;
  }

  public canAfford(cost: number): boolean {
    return this.progress.availablePoints >= cost;
  }

  public spendPoints(cost: number): boolean {
    if (!this.canAfford(cost)) {
      return false;
    }
    this.progress.availablePoints -= cost;
    this.progress.spentPoints += cost;
    // Spending reduces your total score - strategic tradeoff!
    this.progress.totalScore -= cost;
    return true;
  }

  public addUpgrade(upgradeId: string): void {
    if (!this.progress.ownedUpgrades.includes(upgradeId)) {
      this.progress.ownedUpgrades.push(upgradeId);
    }
  }

  public getOwnedUpgrades(): string[] {
    return [...this.progress.ownedUpgrades];
  }

  public isGameComplete(): boolean {
    return this.progress.isComplete;
  }

  public getProgress(): GameProgress {
    return { ...this.progress };
  }

  /**
   * Get the current number of lives remaining
   */
  public getLives(): number {
    return this.livesManager.getLives();
  }

  /**
   * Get the result of the last round completion check
   * Returns null if no round has been completed yet
   */
  public getLastRoundCompletion(): RoundCompletionResult | null {
    return this.lastRoundCompletion;
  }

  /**
   * Get the minimum score threshold for the current round
   */
  public getCurrentRoundThreshold(): number {
    return GameConfigHelpers.getRoundThreshold(this.progress.currentRound);
  }

  // Reset instance for testing
  public static resetInstance(): void {
    GameProgressManager.instance = null;
    LivesManager.resetInstance();
  }
}