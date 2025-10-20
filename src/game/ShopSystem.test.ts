import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ShopSystem } from './ShopSystem';
import { GameProgressManager } from './GameProgressManager';
import { SHOP_ITEMS } from '../config/GameConfig';

describe('ShopSystem', () => {
  let shopSystem: ShopSystem;
  let progressManager: GameProgressManager;

  beforeEach(() => {
    // Reset singletons before each test
    ShopSystem.resetInstance();
    GameProgressManager.resetInstance();

    shopSystem = ShopSystem.getInstance();
    progressManager = GameProgressManager.getInstance();
  });

  afterEach(() => {
    ShopSystem.resetInstance();
    GameProgressManager.resetInstance();
  });

  describe('Initialization', () => {
    it('should initialize items from GameConfig', () => {
      const items = shopSystem.getAllItems();
      const configItemCount = Object.keys(SHOP_ITEMS).length;

      expect(items).toHaveLength(configItemCount);
      expect(items.length).toBe(4); // bonus_time, time_dilation, phase_gun, tractor_beam
    });

    it('should initialize items with correct base costs from config', () => {
      const bonusTime = shopSystem.getAllItems().find(i => i.id === 'bonus_time');
      const timeDilation = shopSystem.getAllItems().find(i => i.id === 'time_dilation');
      const phaseGun = shopSystem.getAllItems().find(i => i.id === 'phase_gun');
      const tractorBeam = shopSystem.getAllItems().find(i => i.id === 'tractor_beam');

      expect(bonusTime?.cost).toBe(SHOP_ITEMS.bonus_time.baseCost);
      expect(timeDilation?.cost).toBe(SHOP_ITEMS.time_dilation.baseCost);
      expect(phaseGun?.cost).toBe(SHOP_ITEMS.phase_gun.baseCost);
      expect(tractorBeam?.cost).toBe(SHOP_ITEMS.tractor_beam.baseCost);
    });

    it('should initialize all items with zero purchase count', () => {
      const items = shopSystem.getAllItems();
      items.forEach(item => {
        expect(item.purchaseCount).toBe(0);
      });
    });

    it('should maintain singleton pattern', () => {
      const instance1 = ShopSystem.getInstance();
      const instance2 = ShopSystem.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Cost Calculation Integration', () => {
    it('should return base cost for first purchase', () => {
      expect(shopSystem.getItemCost('bonus_time')).toBe(150);
      expect(shopSystem.getItemCost('time_dilation')).toBe(500);
      expect(shopSystem.getItemCost('phase_gun')).toBe(3200);
      expect(shopSystem.getItemCost('tractor_beam')).toBe(1800);
    });

    it('should scale cost by 1.5x after each purchase', () => {
      // Give enough points
      progressManager.completeRound(10000);

      // First purchase at base cost
      expect(shopSystem.getItemCost('bonus_time')).toBe(150);
      shopSystem.purchaseItem('bonus_time');

      // Second purchase at 1.5x
      expect(shopSystem.getItemCost('bonus_time')).toBe(225);
      shopSystem.purchaseItem('bonus_time');

      // Third purchase at 1.5^2x
      expect(shopSystem.getItemCost('bonus_time')).toBe(338);
    });

    it('should return 0 for invalid item ID', () => {
      expect(shopSystem.getItemCost('invalid_item')).toBe(0);
    });
  });

  describe('Purchase Mechanics', () => {
    beforeEach(() => {
      // Give player enough points for testing
      progressManager.completeRound(10000);
    });

    it('should successfully purchase an available item', () => {
      const result = shopSystem.purchaseItem('bonus_time');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Purchased');
      expect(shopSystem.getItemPurchaseCount('bonus_time')).toBe(1);
    });

    it('should deduct points from progress manager', () => {
      const initialPoints = progressManager.getAvailablePoints();
      const cost = shopSystem.getItemCost('bonus_time');

      shopSystem.purchaseItem('bonus_time');

      expect(progressManager.getAvailablePoints()).toBe(initialPoints - cost);
    });

    it('should add upgrade to progress manager', () => {
      shopSystem.purchaseItem('phase_gun');

      expect(progressManager.getOwnedUpgrades()).toContain('phase_gun');
    });

    it('should fail purchase if not enough points', () => {
      // Reset to zero points
      GameProgressManager.resetInstance();
      ShopSystem.resetInstance();
      progressManager = GameProgressManager.getInstance();
      shopSystem = ShopSystem.getInstance();

      // Spend starting dev points to ensure insufficient balance
      const currentPoints = progressManager.getAvailablePoints();
      progressManager.spendPoints(currentPoints);

      const result = shopSystem.purchaseItem('phase_gun'); // costs 3200

      expect(result.success).toBe(false);
      expect(result.message).toBe('Not enough score');
    });

    it('should fail purchase at max purchases', () => {
      // Buy phase_gun (max 1)
      shopSystem.purchaseItem('phase_gun');

      // Try to buy again
      const result = shopSystem.purchaseItem('phase_gun');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Maximum purchases reached');
    });

    it('should fail purchase for invalid item', () => {
      const result = shopSystem.purchaseItem('invalid_item');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Item not found');
    });

    it('should respect max purchase limits from config', () => {
      // bonus_time has max 5 purchases
      for (let i = 0; i < 5; i++) {
        const result = shopSystem.purchaseItem('bonus_time');
        expect(result.success).toBe(true);
      }

      // 6th purchase should fail
      const result = shopSystem.purchaseItem('bonus_time');
      expect(result.success).toBe(false);
      expect(result.message).toBe('Maximum purchases reached');
    });
  });

  describe('Available Items', () => {
    it('should return all items when none purchased', () => {
      const available = shopSystem.getAvailableItems();
      const all = shopSystem.getAllItems();

      expect(available).toHaveLength(all.length);
    });

    it('should exclude items at max purchases', () => {
      // Give points and buy phase_gun (max 1)
      progressManager.completeRound(10000);
      shopSystem.purchaseItem('phase_gun');

      const available = shopSystem.getAvailableItems();
      const phaseGunAvailable = available.find(i => i.id === 'phase_gun');

      expect(phaseGunAvailable).toBeUndefined();
    });
  });

  describe('State Management', () => {
    beforeEach(() => {
      progressManager.completeRound(10000);
    });

    it('should reset all purchase counts on new game', () => {
      shopSystem.purchaseItem('bonus_time');
      shopSystem.purchaseItem('phase_gun');

      shopSystem.resetPurchases();

      expect(shopSystem.getItemPurchaseCount('bonus_time')).toBe(0);
      expect(shopSystem.getItemPurchaseCount('phase_gun')).toBe(0);
    });

    it('should consume only time upgrades', () => {
      shopSystem.purchaseItem('bonus_time');
      shopSystem.purchaseItem('time_dilation');
      shopSystem.purchaseItem('phase_gun');

      shopSystem.consumeTimeUpgrades();

      expect(shopSystem.getItemPurchaseCount('bonus_time')).toBe(0);
      expect(shopSystem.getItemPurchaseCount('time_dilation')).toBe(0);
      expect(shopSystem.getItemPurchaseCount('phase_gun')).toBe(1); // Not consumed
    });

    it('should export purchase counts', () => {
      shopSystem.purchaseItem('bonus_time');
      shopSystem.purchaseItem('phase_gun');

      const counts = shopSystem.getPurchaseCounts();

      expect(counts['bonus_time']).toBe(1);
      expect(counts['phase_gun']).toBe(1);
      expect(counts['tractor_beam']).toBe(0);
    });

    it('should load purchase counts from save', () => {
      const savedCounts = {
        bonus_time: 3,
        time_dilation: 2,
        phase_gun: 1,
        tractor_beam: 1,
      };

      shopSystem.loadPurchaseCounts(savedCounts);

      expect(shopSystem.getItemPurchaseCount('bonus_time')).toBe(3);
      expect(shopSystem.getItemPurchaseCount('time_dilation')).toBe(2);
      expect(shopSystem.getItemPurchaseCount('phase_gun')).toBe(1);
      expect(shopSystem.getItemPurchaseCount('tractor_beam')).toBe(1);
    });

    it('should handle missing items in loaded counts', () => {
      const partialCounts = {
        bonus_time: 2,
      };

      shopSystem.loadPurchaseCounts(partialCounts);

      expect(shopSystem.getItemPurchaseCount('bonus_time')).toBe(2);
      expect(shopSystem.getItemPurchaseCount('phase_gun')).toBe(0); // Defaults to 0
    });
  });

  describe('Purchase Count Queries', () => {
    it('should return 0 for unpurchased items', () => {
      expect(shopSystem.getItemPurchaseCount('bonus_time')).toBe(0);
    });

    it('should return correct count after purchases', () => {
      progressManager.completeRound(10000);

      shopSystem.purchaseItem('bonus_time');
      shopSystem.purchaseItem('bonus_time');

      expect(shopSystem.getItemPurchaseCount('bonus_time')).toBe(2);
    });

    it('should return 0 for invalid item ID', () => {
      expect(shopSystem.getItemPurchaseCount('invalid_item')).toBe(0);
    });
  });
});
