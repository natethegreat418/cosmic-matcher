import { describe, it, expect, beforeEach } from 'vitest';
import { LeaderboardService } from './LeaderboardService';

describe('LeaderboardService', () => {
  let service: LeaderboardService;

  beforeEach(() => {
    LeaderboardService.resetInstance();
    service = LeaderboardService.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = LeaderboardService.getInstance();
      const instance2 = LeaderboardService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = LeaderboardService.getInstance();
      LeaderboardService.resetInstance();
      const instance2 = LeaderboardService.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Service methods', () => {
    it('should have submitScore method', () => {
      expect(service.submitScore).toBeDefined();
      expect(typeof service.submitScore).toBe('function');
    });

    it('should have getTopScores method', () => {
      expect(service.getTopScores).toBeDefined();
      expect(typeof service.getTopScores).toBe('function');
    });

    it('should have getRecentScores method', () => {
      expect(service.getRecentScores).toBeDefined();
      expect(typeof service.getRecentScores).toBe('function');
    });

    it('should have getPlayerRank method', () => {
      expect(service.getPlayerRank).toBeDefined();
      expect(typeof service.getPlayerRank).toBe('function');
    });

    it('should have getTotalEntries method', () => {
      expect(service.getTotalEntries).toBeDefined();
      expect(typeof service.getTotalEntries).toBe('function');
    });
  });
});
