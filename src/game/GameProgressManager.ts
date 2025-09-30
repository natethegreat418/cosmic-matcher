import type { GameProgress, RoundResult } from '../types/Progress';
import { ShopSystem } from './ShopSystem';

export class GameProgressManager {
  private static instance: GameProgressManager | null = null;
  private progress: GameProgress;

  private constructor() {
    this.progress = this.initializeProgress();
  }

  public static getInstance(): GameProgressManager {
    if (!GameProgressManager.instance) {
      GameProgressManager.instance = new GameProgressManager();
    }
    return GameProgressManager.instance;
  }

  private initializeProgress(): GameProgress {
    return {
      currentRound: 1,
      totalScore: 0,
      roundScores: [],
      availablePoints: 0,
      spentPoints: 0,
      ownedUpgrades: [],
      roundTimer: 60, // Always 60 seconds display, speed changes per round
      isComplete: false
    };
  }

  public startNewGame(): void {
    this.progress = this.initializeProgress();

    // Reset shop purchases for new game
    const shopSystem = ShopSystem.getInstance();
    shopSystem.resetPurchases();
  }

  public completeRound(roundScore: number): RoundResult {
    // Save round score
    this.progress.roundScores.push(roundScore);
    this.progress.totalScore += roundScore;
    this.progress.availablePoints += roundScore;

    const result: RoundResult = {
      roundNumber: this.progress.currentRound,
      score: roundScore,
      timeRemaining: 0, // Will be set by GameState
      combosAchieved: 0  // Will be set by GameState
    };

    // Check if game is complete
    if (this.progress.currentRound >= 10) {
      this.progress.isComplete = true;
    } else {
      this.progress.currentRound++;
    }

    return result;
  }

  public getRoundTimer(): number {
    return this.progress.roundTimer; // Always 60
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

  // Reset instance for testing
  public static resetInstance(): void {
    GameProgressManager.instance = null;
  }
}