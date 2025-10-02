import type { SavedGameState } from '../types/Storage';
import { GameProgressManager } from '../game/GameProgressManager';
import { ShopSystem } from '../game/ShopSystem';

/**
 * Manages local storage operations for game persistence
 * Handles saving/loading game state to browser localStorage
 */
export class LocalStorageManager {
  private static readonly STORAGE_KEY = 'cosmic_matcher_save';
  private static readonly VERSION = '1.0.0';

  /**
   * Saves the current game state to localStorage
   * Captures GameProgressManager and ShopSystem state
   */
  public static saveGame(): void {
    try {
      const progressManager = GameProgressManager.getInstance();
      const shopSystem = ShopSystem.getInstance();

      const progress = progressManager.getProgress();

      // Get or create game ID
      const existingSave = this.loadGame();
      const gameId = existingSave?.gameId || this.generateGameId();

      const savedState: SavedGameState = {
        currentRound: progress.currentRound,
        totalScore: progress.totalScore,
        roundScores: progress.roundScores,
        availablePoints: progress.availablePoints,
        spentPoints: progress.spentPoints,
        ownedUpgrades: progress.ownedUpgrades,
        isComplete: progress.isComplete,
        shopPurchaseCounts: shopSystem.getPurchaseCounts(),
        gameId,
        timestamp: new Date().toISOString(),
        version: this.VERSION
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(savedState));
    } catch (error) {
      console.error('Failed to save game:', error);
      // Silently fail - game continues without persistence
    }
  }

  /**
   * Loads saved game state from localStorage
   * Returns null if no save exists or save is invalid
   */
  public static loadGame(): SavedGameState | null {
    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);

      if (!savedData) {
        return null;
      }

      const parsed = JSON.parse(savedData) as SavedGameState;

      // Validate structure
      if (!this.isValidSave(parsed)) {
        console.warn('Invalid save data structure, discarding');
        this.clearSave();
        return null;
      }

      // Check version compatibility
      if (parsed.version !== this.VERSION) {
        console.warn(`Save version mismatch (${parsed.version} vs ${this.VERSION}), discarding`);
        this.clearSave();
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  /**
   * Checks if a valid save game exists
   */
  public static hasSaveGame(): boolean {
    return this.loadGame() !== null;
  }

  /**
   * Deletes the saved game from localStorage
   */
  public static clearSave(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear save:', error);
    }
  }

  /**
   * Validates the structure of a saved game state
   */
  private static isValidSave(data: any): data is SavedGameState {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.currentRound === 'number' &&
      typeof data.totalScore === 'number' &&
      Array.isArray(data.roundScores) &&
      typeof data.availablePoints === 'number' &&
      typeof data.spentPoints === 'number' &&
      Array.isArray(data.ownedUpgrades) &&
      typeof data.isComplete === 'boolean' &&
      typeof data.shopPurchaseCounts === 'object' &&
      typeof data.gameId === 'string' &&
      typeof data.timestamp === 'string' &&
      typeof data.version === 'string'
    );
  }

  /**
   * Generates a unique game ID
   */
  private static generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
