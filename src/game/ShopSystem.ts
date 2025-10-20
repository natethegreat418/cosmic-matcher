import type { ShopItem, PurchaseResult } from '../types/Progress';
import { GameProgressManager } from './GameProgressManager';
import { SHOP_ITEMS, GameConfigHelpers } from '../config/GameConfig';

export class ShopSystem {
  private static instance: ShopSystem | null = null;
  private items: ShopItem[] = [];

  private constructor() {
    this.initializeItems();
  }

  public static getInstance(): ShopSystem {
    if (!ShopSystem.instance) {
      ShopSystem.instance = new ShopSystem();
    }
    return ShopSystem.instance;
  }

  private initializeItems(): void {
    // Initialize items from centralized config
    this.items = Object.values(SHOP_ITEMS).map(itemConfig => ({
      id: itemConfig.id,
      name: itemConfig.name,
      description: itemConfig.description,
      cost: itemConfig.baseCost,
      maxPurchases: itemConfig.maxPurchases,
      purchaseCount: 0,
      icon: itemConfig.icon,
    }));
  }

  public getAvailableItems(): ShopItem[] {
    // Return items that can still be purchased
    return this.items.filter(item => item.purchaseCount < item.maxPurchases);
  }

  public getAllItems(): ShopItem[] {
    return [...this.items];
  }

  public purchaseItem(itemId: string): PurchaseResult {
    const progressManager = GameProgressManager.getInstance();
    const item = this.items.find(i => i.id === itemId);

    if (!item) {
      return { success: false, message: 'Item not found' };
    }

    if (item.purchaseCount >= item.maxPurchases) {
      return { success: false, message: 'Maximum purchases reached' };
    }

    // Calculate cost (increases with each purchase for balance)
    const currentCost = this.getItemCost(itemId);

    if (!progressManager.canAfford(currentCost)) {
      return { success: false, message: 'Not enough score' };
    }

    // Make the purchase
    if (progressManager.spendPoints(currentCost)) {
      item.purchaseCount++;
      progressManager.addUpgrade(itemId);

      return {
        success: true,
        message: `Purchased ${item.name}!`
      };
    }

    return { success: false, message: 'Purchase failed' };
  }

  public getItemCost(itemId: string): number {
    const item = this.items.find(i => i.id === itemId);
    if (!item) return 0;

    // Use centralized cost calculation from GameConfig
    return GameConfigHelpers.calculateItemCost(itemId as keyof typeof SHOP_ITEMS, item.purchaseCount);
  }

  public getItemPurchaseCount(itemId: string): number {
    const item = this.items.find(i => i.id === itemId);
    return item ? item.purchaseCount : 0;
  }

  // Reset for new game
  public resetPurchases(): void {
    this.items.forEach(item => {
      item.purchaseCount = 0;
    });
  }

  // Consume time upgrades after they're used for a round
  public consumeTimeUpgrades(): void {
    const timeItem = this.items.find(i => i.id === 'bonus_time');
    if (timeItem) {
      timeItem.purchaseCount = 0;
    }

    const dilationItem = this.items.find(i => i.id === 'time_dilation');
    if (dilationItem) {
      dilationItem.purchaseCount = 0;
    }
  }

  /**
   * Exports current purchase counts for saving
   */
  public getPurchaseCounts(): { [itemId: string]: number } {
    const counts: { [itemId: string]: number } = {};
    this.items.forEach(item => {
      counts[item.id] = item.purchaseCount;
    });
    return counts;
  }

  /**
   * Loads purchase counts from a saved game
   */
  public loadPurchaseCounts(counts: { [itemId: string]: number }): void {
    this.items.forEach(item => {
      item.purchaseCount = counts[item.id] || 0;
    });
  }

  // Reset instance for testing
  public static resetInstance(): void {
    ShopSystem.instance = null;
  }
}