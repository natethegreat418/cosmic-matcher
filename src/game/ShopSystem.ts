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
    this.items = [
      {
        id: 'bonus_time',
        name: 'Radiation Shield',
        description: '+10 seconds to next round',
        cost: 150,
        maxPurchases: 5, // Allow multiple purchases but at increasing cost
        purchaseCount: 0,
        icon: '/shop/radiation-shield.png'
      },
      {
        id: 'time_dilation',
        name: 'Quantum Time Dilation',
        description: 'Slows countdown by 0.5s per tick (one round)',
        cost: 500,
        maxPurchases: 5, // Single-use per round, but can stack
        purchaseCount: 0,
        icon: '/shop/quantum-dilation.png'
      },
      {
        id: 'phase_gun',
        name: 'Phase Gun',
        description: 'Enables diagonal 3-tile matches',
        cost: 3200,
        maxPurchases: 1, // Permanent upgrade, one-time purchase
        purchaseCount: 0,
        icon: '/shop/phaser.png'
      },
      {
        id: 'tractor_beam',
        name: 'Tractor Beam',
        description: 'Swap tiles from 2 spaces away',
        cost: 1800,
        maxPurchases: 1, // Permanent upgrade, one-time purchase
        purchaseCount: 0,
        icon: '/shop/tractor-beam.png'
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

    const dilationItem = this.items.find(i => i.id === 'time_dilation');
    if (dilationItem) {
      dilationItem.purchaseCount = 0;
    }
  }

  // Reset instance for testing
  public static resetInstance(): void {
    ShopSystem.instance = null;
  }
}