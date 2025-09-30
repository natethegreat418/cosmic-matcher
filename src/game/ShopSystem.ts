import type { ShopItem, PurchaseResult } from '../types/Progress';
import { GameProgressManager } from './GameProgressManager';

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
    // Start with just one simple item as specified
    this.items = [
      {
        id: 'bonus_time',
        name: 'Quantum Time Dilation',
        description: '+10 seconds to next round',
        cost: 150,
        maxPurchases: 5, // Allow multiple purchases but at increasing cost
        purchaseCount: 0
      }
    ];
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

    // Base cost increases by 50% with each purchase for game balance
    return Math.round(item.cost * Math.pow(1.5, item.purchaseCount));
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
  }

  // Reset instance for testing
  public static resetInstance(): void {
    ShopSystem.instance = null;
  }
}