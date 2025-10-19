import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageManager } from './LocalStorageManager';
import { GameProgressManager } from '../game/GameProgressManager';
import { ShopSystem } from '../game/ShopSystem';
import { DEV_CONFIG } from '../game/DevConfig';

describe('LocalStorageManager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Reset singleton instances
    GameProgressManager.resetInstance();
    ShopSystem.resetInstance();
  });

  describe('saveGame', () => {
    it('should save game state to localStorage', () => {
      const progressManager = GameProgressManager.getInstance();
      const shopSystem = ShopSystem.getInstance();

      // Setup some game state
      progressManager.completeRound(500);
      shopSystem.purchaseItem('bonus_time');

      LocalStorageManager.saveGame();

      const saved = localStorage.getItem('cosmic_matcher_save');
      expect(saved).not.toBeNull();

      const parsed = JSON.parse(saved!);
      expect(parsed.currentRound).toBe(2);
      expect(parsed.totalScore).toBe(DEV_CONFIG.startingScore + 350); // startingScore + 500 - 150 (bonus_time cost)
      expect(parsed.roundScores).toEqual([500]);
    });

    it('should include shop purchase counts', () => {
      const progressManager = GameProgressManager.getInstance();
      const shopSystem = ShopSystem.getInstance();

      // Need to have points to purchase
      progressManager.completeRound(500);
      shopSystem.purchaseItem('bonus_time');

      LocalStorageManager.saveGame();

      const saved = localStorage.getItem('cosmic_matcher_save');
      const parsed = JSON.parse(saved!);

      expect(parsed.shopPurchaseCounts).toBeDefined();
      expect(parsed.shopPurchaseCounts.bonus_time).toBe(1);
    });

    it('should include metadata fields', () => {
      LocalStorageManager.saveGame();

      const saved = localStorage.getItem('cosmic_matcher_save');
      const parsed = JSON.parse(saved!);

      expect(parsed.gameId).toBeDefined();
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.version).toBe('1.0.0');
    });

    it('should reuse gameId on subsequent saves', () => {
      LocalStorageManager.saveGame();
      const firstSave = JSON.parse(localStorage.getItem('cosmic_matcher_save')!);
      const firstGameId = firstSave.gameId;

      LocalStorageManager.saveGame();
      const secondSave = JSON.parse(localStorage.getItem('cosmic_matcher_save')!);

      expect(secondSave.gameId).toBe(firstGameId);
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw
      expect(() => LocalStorageManager.saveGame()).not.toThrow();
    });
  });

  describe('loadGame', () => {
    it('should return null if no save exists', () => {
      const result = LocalStorageManager.loadGame();
      expect(result).toBeNull();
    });

    it('should load saved game state', () => {
      // Save a game first
      const progressManager = GameProgressManager.getInstance();
      progressManager.completeRound(500);
      LocalStorageManager.saveGame();

      // Clear and reload
      GameProgressManager.resetInstance();
      const loaded = LocalStorageManager.loadGame();

      expect(loaded).not.toBeNull();
      expect(loaded!.currentRound).toBe(2);
      expect(loaded!.totalScore).toBe(DEV_CONFIG.startingScore + 500);
      expect(loaded!.roundScores).toEqual([500]);
    });

    it('should return null for invalid JSON', () => {
      localStorage.setItem('cosmic_matcher_save', 'invalid json');

      const result = LocalStorageManager.loadGame();
      expect(result).toBeNull();
    });

    it('should return null for invalid structure', () => {
      localStorage.setItem('cosmic_matcher_save', JSON.stringify({
        currentRound: 1,
        // Missing required fields
      }));

      const result = LocalStorageManager.loadGame();
      expect(result).toBeNull();
    });

    it('should clear save if version mismatch', () => {
      const validSave = {
        currentRound: 1,
        totalScore: 100,
        roundScores: [],
        availablePoints: 100,
        spentPoints: 0,
        ownedUpgrades: [],
        isComplete: false,
        shopPurchaseCounts: {},
        gameId: 'test-id',
        timestamp: new Date().toISOString(),
        version: '0.9.0' // Old version
      };

      localStorage.setItem('cosmic_matcher_save', JSON.stringify(validSave));

      const result = LocalStorageManager.loadGame();
      expect(result).toBeNull();
      expect(localStorage.getItem('cosmic_matcher_save')).toBeNull();
    });
  });

  describe('hasSaveGame', () => {
    it('should return false if no save exists', () => {
      expect(LocalStorageManager.hasSaveGame()).toBe(false);
    });

    it('should return true if valid save exists', () => {
      LocalStorageManager.saveGame();
      expect(LocalStorageManager.hasSaveGame()).toBe(true);
    });

    it('should return false if save is invalid', () => {
      localStorage.setItem('cosmic_matcher_save', 'invalid');
      expect(LocalStorageManager.hasSaveGame()).toBe(false);
    });
  });

  describe('clearSave', () => {
    it('should remove save from localStorage', () => {
      LocalStorageManager.saveGame();
      expect(localStorage.getItem('cosmic_matcher_save')).not.toBeNull();

      LocalStorageManager.clearSave();
      expect(localStorage.getItem('cosmic_matcher_save')).toBeNull();
    });

    it('should handle errors gracefully', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Cannot access storage');
      });

      expect(() => LocalStorageManager.clearSave()).not.toThrow();
    });
  });

  describe('full save/load cycle', () => {
    it('should restore complete game state', () => {
      // Setup game state
      const progressManager = GameProgressManager.getInstance();
      const shopSystem = ShopSystem.getInstance();

      progressManager.completeRound(500);
      progressManager.completeRound(600);
      shopSystem.purchaseItem('bonus_time');
      progressManager.addUpgrade('phase_gun');

      // Save
      LocalStorageManager.saveGame();

      // Reset instances
      GameProgressManager.resetInstance();
      ShopSystem.resetInstance();

      // Load
      const savedState = LocalStorageManager.loadGame();
      expect(savedState).not.toBeNull();

      const newProgressManager = GameProgressManager.getInstance();
      const newShopSystem = ShopSystem.getInstance();

      newProgressManager.loadFromSave(savedState!);
      newShopSystem.loadPurchaseCounts(savedState!.shopPurchaseCounts);

      // Verify restored state
      expect(newProgressManager.getCurrentRound()).toBe(3);
      expect(newProgressManager.getTotalScore()).toBe(DEV_CONFIG.startingScore + 950); // startingScore + 500 + 600 - 150
      expect(newProgressManager.getRoundScores()).toEqual([500, 600]);
      expect(newProgressManager.getOwnedUpgrades()).toContain('bonus_time');
      expect(newProgressManager.getOwnedUpgrades()).toContain('phase_gun');
      expect(newShopSystem.getItemPurchaseCount('bonus_time')).toBe(1);
    });
  });
});
