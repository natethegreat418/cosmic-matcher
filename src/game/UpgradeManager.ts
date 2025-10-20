import { GameProgressManager } from './GameProgressManager';
import { ShopSystem } from './ShopSystem';
import { UPGRADE_EFFECTS } from '../config/GameConfig';

export class UpgradeManager {
  private static instance: UpgradeManager | null = null;

  private constructor() {}

  public static getInstance(): UpgradeManager {
    if (!UpgradeManager.instance) {
      UpgradeManager.instance = new UpgradeManager();
    }
    return UpgradeManager.instance;
  }

  /**
   * Apply bonus time upgrades to base timer
   */
  public applyTimeBonus(baseTime: number): number {
    const shopSystem = ShopSystem.getInstance();

    // Count how many bonus_time upgrades the player has
    const bonusTimeCount = shopSystem.getItemPurchaseCount('bonus_time');

    // Each bonus_time upgrade adds seconds from config
    const bonusTime = bonusTimeCount * UPGRADE_EFFECTS.BONUS_TIME_SECONDS;

    return baseTime + bonusTime;
  }

  /**
   * Get timer slowdown from time dilation upgrades
   * Returns the amount to subtract from the default 1 second per tick
   */
  public getTimerSlowdown(): number {
    const shopSystem = ShopSystem.getInstance();

    // Count how many time_dilation upgrades the player has for this round
    const dilationCount = shopSystem.getItemPurchaseCount('time_dilation');

    // Each time_dilation upgrade slows the timer by the configured amount per tick
    return dilationCount * UPGRADE_EFFECTS.TIME_DILATION_SLOWDOWN;
  }

  /**
   * Apply score multiplier upgrades to base score
   * (Future enhancement - not implemented in Phase 2)
   */
  public applyScoreMultiplier(baseScore: number): number {
    // For now, just return base score
    // In future phases, this would check for score multiplier upgrades
    return baseScore;
  }

  /**
   * Apply combo time bonus upgrades
   * (Future enhancement - not implemented in Phase 2)
   */
  public applyComboTimeBonus(baseComboBonus: number): number {
    // For now, just return base bonus
    // In future phases, this would enhance combo time bonuses
    return baseComboBonus;
  }

  /**
   * Check if player has a specific upgrade
   */
  public hasUpgrade(upgradeId: string): boolean {
    const progressManager = GameProgressManager.getInstance();
    const ownedUpgrades = progressManager.getOwnedUpgrades();
    return ownedUpgrades.includes(upgradeId);
  }

  /**
   * Get count of specific upgrade owned
   */
  public getUpgradeCount(upgradeId: string): number {
    const shopSystem = ShopSystem.getInstance();
    return shopSystem.getItemPurchaseCount(upgradeId);
  }

  /**
   * Generate a board with guaranteed matches
   * (Future enhancement for 'lucky_start' upgrade)
   */
  public shouldGenerateLuckyBoard(): boolean {
    // For Phase 2, always return false
    // Future: return this.hasUpgrade('lucky_start');
    return false;
  }

  /**
   * Reset for new game
   */
  public reset(): void {
    // Reset any cached upgrade state if needed
    // For now, upgrades are stored in GameProgressManager and ShopSystem
  }

  // Reset instance for testing
  public static resetInstance(): void {
    UpgradeManager.instance = null;
  }
}