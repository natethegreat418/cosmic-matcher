import { describe, it, expect } from 'vitest';
import { GameConfigHelpers, TIMER_CONFIG, SHOP_ITEMS } from './GameConfig';

describe('GameConfig Helpers', () => {
  describe('getSpeedMultiplier', () => {
    it('should return 1x speed for rounds 1-2', () => {
      expect(GameConfigHelpers.getSpeedMultiplier(1)).toBe(1.0);
      expect(GameConfigHelpers.getSpeedMultiplier(2)).toBe(1.0);
    });

    it('should return 1.5x speed for rounds 3-4', () => {
      expect(GameConfigHelpers.getSpeedMultiplier(3)).toBe(1.5);
      expect(GameConfigHelpers.getSpeedMultiplier(4)).toBe(1.5);
    });

    it('should return 2x speed for rounds 5-6', () => {
      expect(GameConfigHelpers.getSpeedMultiplier(5)).toBe(2.0);
      expect(GameConfigHelpers.getSpeedMultiplier(6)).toBe(2.0);
    });

    it('should return 2.5x speed for rounds 7-8', () => {
      expect(GameConfigHelpers.getSpeedMultiplier(7)).toBe(2.5);
      expect(GameConfigHelpers.getSpeedMultiplier(8)).toBe(2.5);
    });

    it('should return 3x speed for rounds 9-10', () => {
      expect(GameConfigHelpers.getSpeedMultiplier(9)).toBe(3.0);
      expect(GameConfigHelpers.getSpeedMultiplier(10)).toBe(3.0);
    });

    it('should handle edge case rounds', () => {
      // Round 0 and negative rounds get rounds_1_2 multiplier (1x)
      expect(GameConfigHelpers.getSpeedMultiplier(0)).toBe(1.0);
      expect(GameConfigHelpers.getSpeedMultiplier(-1)).toBe(1.0);

      // Rounds beyond 10 continue at ludicrous speed (3x)
      expect(GameConfigHelpers.getSpeedMultiplier(11)).toBe(3.0);
      expect(GameConfigHelpers.getSpeedMultiplier(100)).toBe(3.0);
    });
  });

  describe('calculateItemCost', () => {
    it('should return base cost for first purchase', () => {
      const bonusTimeCost = GameConfigHelpers.calculateItemCost('bonus_time', 0);
      expect(bonusTimeCost).toBe(SHOP_ITEMS.bonus_time.baseCost);

      const timeDilationCost = GameConfigHelpers.calculateItemCost('time_dilation', 0);
      expect(timeDilationCost).toBe(SHOP_ITEMS.time_dilation.baseCost);
    });

    it('should scale cost by 1.5x for each purchase', () => {
      // bonus_time base cost is 150
      expect(GameConfigHelpers.calculateItemCost('bonus_time', 0)).toBe(150);
      expect(GameConfigHelpers.calculateItemCost('bonus_time', 1)).toBe(225); // 150 * 1.5
      expect(GameConfigHelpers.calculateItemCost('bonus_time', 2)).toBe(338); // 150 * 1.5^2 (rounded)
      expect(GameConfigHelpers.calculateItemCost('bonus_time', 3)).toBe(506); // 150 * 1.5^3 (rounded)
    });

    it('should scale permanent upgrade costs correctly', () => {
      // phase_gun base cost is 3200
      expect(GameConfigHelpers.calculateItemCost('phase_gun', 0)).toBe(3200);
      expect(GameConfigHelpers.calculateItemCost('phase_gun', 1)).toBe(4800); // 3200 * 1.5

      // tractor_beam base cost is 1800
      expect(GameConfigHelpers.calculateItemCost('tractor_beam', 0)).toBe(1800);
      expect(GameConfigHelpers.calculateItemCost('tractor_beam', 1)).toBe(2700); // 1800 * 1.5
    });

    it('should handle zero and negative purchase counts', () => {
      expect(GameConfigHelpers.calculateItemCost('bonus_time', 0)).toBe(150);
      expect(GameConfigHelpers.calculateItemCost('bonus_time', -1)).toBe(150); // Should treat as 0
    });
  });

  describe('getBaseRoundTimer', () => {
    it('should return dev timer when isDev is true', () => {
      const devTimer = GameConfigHelpers.getBaseRoundTimer(true);
      expect(devTimer).toBe(TIMER_CONFIG.DEV_ROUND_TIMER);
      expect(devTimer).toBe(15);
    });

    it('should return production timer when isDev is false', () => {
      const prodTimer = GameConfigHelpers.getBaseRoundTimer(false);
      expect(prodTimer).toBe(TIMER_CONFIG.PRODUCTION_ROUND_TIMER);
      expect(prodTimer).toBe(60);
    });
  });

  describe('getTimerColor', () => {
    it('should return pink for danger zone (≤10 seconds)', () => {
      expect(GameConfigHelpers.getTimerColor(10)).toBe('#EC4899');
      expect(GameConfigHelpers.getTimerColor(5)).toBe('#EC4899');
      expect(GameConfigHelpers.getTimerColor(0)).toBe('#EC4899');
    });

    it('should return gold for warning zone (11-30 seconds)', () => {
      expect(GameConfigHelpers.getTimerColor(11)).toBe('#F59E0B');
      expect(GameConfigHelpers.getTimerColor(20)).toBe('#F59E0B');
      expect(GameConfigHelpers.getTimerColor(30)).toBe('#F59E0B');
    });

    it('should return cyan for safe zone (>30 seconds)', () => {
      expect(GameConfigHelpers.getTimerColor(31)).toBe('#00F5FF');
      expect(GameConfigHelpers.getTimerColor(60)).toBe('#00F5FF');
      expect(GameConfigHelpers.getTimerColor(100)).toBe('#00F5FF');
    });

    it('should handle edge cases at boundaries', () => {
      expect(GameConfigHelpers.getTimerColor(TIMER_CONFIG.COLOR_THRESHOLDS.DANGER)).toBe('#EC4899');
      expect(GameConfigHelpers.getTimerColor(TIMER_CONFIG.COLOR_THRESHOLDS.DANGER + 1)).toBe('#F59E0B');
      expect(GameConfigHelpers.getTimerColor(TIMER_CONFIG.COLOR_THRESHOLDS.WARNING)).toBe('#F59E0B');
      expect(GameConfigHelpers.getTimerColor(TIMER_CONFIG.COLOR_THRESHOLDS.WARNING + 1)).toBe('#00F5FF');
    });
  });
});
