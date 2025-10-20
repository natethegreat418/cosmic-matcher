import { describe, it, expect, beforeEach } from 'vitest';
import { LivesManager } from './LivesManager';
import { LIVES_CONFIG } from '../config/GameConfig';

describe('LivesManager', () => {
  beforeEach(() => {
    // Reset singleton instance before each test
    LivesManager.resetInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = LivesManager.getInstance();
      const instance2 = LivesManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initial state', () => {
    it('should start with configured starting lives', () => {
      const manager = LivesManager.getInstance();
      expect(manager.getLives()).toBe(LIVES_CONFIG.STARTING_LIVES);
    });

    it('should not be game over initially', () => {
      const manager = LivesManager.getInstance();
      expect(manager.isGameOver()).toBe(false);
    });
  });

  describe('checkRoundCompletion', () => {
    it('should pass round when score meets threshold', () => {
      const manager = LivesManager.getInstance();
      const result = manager.checkRoundCompletion(1, 500); // Round 1 threshold is 500

      expect(result.passed).toBe(true);
      expect(result.livesRemaining).toBe(LIVES_CONFIG.STARTING_LIVES);
      expect(result.isGameOver).toBe(false);
      expect(result.threshold).toBe(500);
      expect(result.score).toBe(500);
    });

    it('should pass round when score exceeds threshold', () => {
      const manager = LivesManager.getInstance();
      const result = manager.checkRoundCompletion(1, 750);

      expect(result.passed).toBe(true);
      expect(result.livesRemaining).toBe(LIVES_CONFIG.STARTING_LIVES);
    });

    it('should fail round when score below threshold', () => {
      const manager = LivesManager.getInstance();
      const result = manager.checkRoundCompletion(1, 400); // Round 1 threshold is 500

      expect(result.passed).toBe(false);
      expect(result.livesRemaining).toBe(LIVES_CONFIG.STARTING_LIVES - 1);
      expect(result.isGameOver).toBe(false);
    });

    it('should deduct one life on failed round', () => {
      const manager = LivesManager.getInstance();
      const initialLives = manager.getLives();

      manager.checkRoundCompletion(1, 400); // Fail round 1

      expect(manager.getLives()).toBe(initialLives - 1);
    });

    it('should not deduct life on passed round', () => {
      const manager = LivesManager.getInstance();
      const initialLives = manager.getLives();

      manager.checkRoundCompletion(1, 500); // Pass round 1

      expect(manager.getLives()).toBe(initialLives);
    });

    it('should handle multiple failed rounds', () => {
      const manager = LivesManager.getInstance();

      // Fail round 1
      let result = manager.checkRoundCompletion(1, 400);
      expect(result.livesRemaining).toBe(2);
      expect(result.isGameOver).toBe(false);

      // Fail round 1 again
      result = manager.checkRoundCompletion(1, 450);
      expect(result.livesRemaining).toBe(1);
      expect(result.isGameOver).toBe(false);

      // Fail round 1 final time
      result = manager.checkRoundCompletion(1, 499);
      expect(result.livesRemaining).toBe(0);
      expect(result.isGameOver).toBe(true);
    });

    it('should set isGameOver when lives reach zero', () => {
      const manager = LivesManager.getInstance();
      manager.setLives(1); // Set to 1 life

      const result = manager.checkRoundCompletion(1, 400); // Fail

      expect(result.livesRemaining).toBe(0);
      expect(result.isGameOver).toBe(true);
      expect(manager.isGameOver()).toBe(true);
    });

    it('should use correct thresholds for each round', () => {
      const manager = LivesManager.getInstance();

      const result1 = manager.checkRoundCompletion(1, 500);
      expect(result1.threshold).toBe(500);
      expect(result1.passed).toBe(true);

      const result5 = manager.checkRoundCompletion(5, 1200);
      expect(result5.threshold).toBe(1200);
      expect(result5.passed).toBe(true);

      const result10 = manager.checkRoundCompletion(10, 3000);
      expect(result10.threshold).toBe(3000);
      expect(result10.passed).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset lives to starting value', () => {
      const manager = LivesManager.getInstance();
      manager.checkRoundCompletion(1, 400); // Lose a life

      manager.reset();

      expect(manager.getLives()).toBe(LIVES_CONFIG.STARTING_LIVES);
      expect(manager.isGameOver()).toBe(false);
    });
  });

  describe('setLives', () => {
    it('should set lives to specific value', () => {
      const manager = LivesManager.getInstance();
      manager.setLives(1);

      expect(manager.getLives()).toBe(1);
    });

    it('should not allow negative lives', () => {
      const manager = LivesManager.getInstance();
      manager.setLives(-5);

      expect(manager.getLives()).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle round at exact threshold', () => {
      const manager = LivesManager.getInstance();
      const result = manager.checkRoundCompletion(3, 800); // Round 3 threshold is 800

      expect(result.passed).toBe(true);
      expect(result.score).toBe(800);
      expect(result.threshold).toBe(800);
    });

    it('should handle round one point below threshold', () => {
      const manager = LivesManager.getInstance();
      const result = manager.checkRoundCompletion(3, 799); // Round 3 threshold is 800

      expect(result.passed).toBe(false);
      expect(manager.getLives()).toBe(LIVES_CONFIG.STARTING_LIVES - 1);
    });

    it('should handle zero score', () => {
      const manager = LivesManager.getInstance();
      const result = manager.checkRoundCompletion(1, 0);

      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);
      expect(manager.getLives()).toBe(LIVES_CONFIG.STARTING_LIVES - 1);
    });

    it('should not go below 0 lives', () => {
      const manager = LivesManager.getInstance();
      manager.setLives(0);

      const result = manager.checkRoundCompletion(1, 0);

      expect(result.livesRemaining).toBe(0);
      expect(manager.getLives()).toBe(0);
    });
  });

  describe('progression scenario', () => {
    it('should handle realistic game progression', () => {
      const manager = LivesManager.getInstance();

      // Pass round 1
      let result = manager.checkRoundCompletion(1, 600);
      expect(result.passed).toBe(true);
      expect(manager.getLives()).toBe(3);

      // Pass round 2
      result = manager.checkRoundCompletion(2, 700);
      expect(result.passed).toBe(true);
      expect(manager.getLives()).toBe(3);

      // Fail round 3 (need 800)
      result = manager.checkRoundCompletion(3, 750);
      expect(result.passed).toBe(false);
      expect(manager.getLives()).toBe(2);

      // Pass round 3 retry
      result = manager.checkRoundCompletion(3, 850);
      expect(result.passed).toBe(true);
      expect(manager.getLives()).toBe(2);

      // Continue playing with 2 lives
      expect(manager.isGameOver()).toBe(false);
    });
  });
});
