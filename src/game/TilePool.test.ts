import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TileColor } from '../types';

// Mock Phaser completely before importing Tile
vi.mock('phaser', () => ({
  default: {
    GameObjects: {
      Image: class {},
      Rectangle: class {}
    }
  },
  GameObjects: {
    Image: class {},
    Rectangle: class {}
  }
}));

// Mock the Tile class to avoid Phaser dependencies
vi.mock('./Tile', () => {
  return {
    Tile: class {
      gridX: number;
      gridY: number;
      color: TileColor;
      x: number;
      y: number;
      sprite: any;
      backgroundRect: any;

      constructor(gridX: number, gridY: number, color: TileColor, _scene: any) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.color = color;
        this.x = gridX * 64;
        this.y = gridY * 64;
        this.sprite = {
          destroy: vi.fn(),
          setAlpha: vi.fn()
        };
        this.backgroundRect = {
          destroy: vi.fn()
        };
      }

      getGridPosition() {
        return { x: this.gridX, y: this.gridY };
      }

      reset(newX: number, newY: number, newColor: TileColor) {
        this.gridX = newX;
        this.gridY = newY;
        this.color = newColor;
      }

      hide() {}
      unhighlight() {}
      setSelected() {}
      setHint() {}
      destroy() {
        this.sprite?.destroy();
        this.backgroundRect?.destroy();
      }
    }
  };
});

import { TilePool } from './TilePool';

// Mock Phaser Scene
const createMockScene = () => ({
  add: {
    rectangle: vi.fn(),
    image: vi.fn()
  },
  tweens: {
    add: vi.fn()
  },
  scale: {
    width: 900,
    height: 700
  },
  cameras: {
    main: {
      width: 900,
      height: 700
    }
  }
}) as any;

describe('TilePool', () => {
  let scene: any;
  let pool: TilePool;

  beforeEach(() => {
    scene = createMockScene();
    pool = new TilePool(scene);
  });

  describe('initialization', () => {
    it('should prewarm pool with initial tiles', () => {
      const stats = pool.getStats();
      expect(stats.pooled).toBe(20); // INITIAL_POOL_SIZE
      expect(stats.active).toBe(0);
      expect(stats.total).toBe(20);
    });
  });

  describe('acquire', () => {
    it('should reuse tile from pool when available', () => {
      const tile1 = pool.acquire(0, 0, 'deepSpaceBlue');
      expect(tile1).toBeDefined();

      const statsBefore = pool.getStats();
      expect(statsBefore.pooled).toBe(19); // One tile taken
      expect(statsBefore.active).toBe(1);
    });

    it('should track acquired tiles as active', () => {
      pool.acquire(0, 0, 'deepSpaceBlue');
      pool.acquire(1, 1, 'nebulaPurple');
      pool.acquire(2, 2, 'cosmicTeal');

      const stats = pool.getStats();
      expect(stats.active).toBe(3);
      expect(stats.pooled).toBe(17); // 20 - 3
    });

    it('should create new tile when pool is exhausted', () => {
      // Drain the pool
      const tiles = [];
      for (let i = 0; i < 20; i++) {
        tiles.push(pool.acquire(i, 0, 'deepSpaceBlue'));
      }

      const stats = pool.getStats();
      expect(stats.pooled).toBe(0);
      expect(stats.active).toBe(20);

      // Should create new tile when pool is empty
      const newTile = pool.acquire(21, 0, 'solarGold');
      expect(newTile).toBeDefined();

      const statsAfter = pool.getStats();
      expect(statsAfter.active).toBe(21);
      expect(statsAfter.pooled).toBe(0);
    });

    it('should acquire tiles with correct properties', () => {
      const tile = pool.acquire(5, 3, 'plasmaPink');
      expect(tile.color).toBe('plasmaPink');

      const pos = tile.getGridPosition();
      expect(pos.x).toBe(5);
      expect(pos.y).toBe(3);
    });
  });

  describe('release', () => {
    it('should return tile to pool', () => {
      const tile = pool.acquire(0, 0, 'deepSpaceBlue');

      const statsBeforeRelease = pool.getStats();
      expect(statsBeforeRelease.active).toBe(1);
      expect(statsBeforeRelease.pooled).toBe(19);

      pool.release(tile);

      const statsAfterRelease = pool.getStats();
      expect(statsAfterRelease.active).toBe(0);
      expect(statsAfterRelease.pooled).toBe(20);
    });

    it('should hide released tiles', () => {
      const tile = pool.acquire(0, 0, 'deepSpaceBlue');
      const hideSpy = vi.spyOn(tile, 'hide');

      pool.release(tile);

      expect(hideSpy).toHaveBeenCalled();
    });

    it('should unhighlight released tiles', () => {
      const tile = pool.acquire(0, 0, 'deepSpaceBlue');
      const unhighlightSpy = vi.spyOn(tile, 'unhighlight');

      pool.release(tile);

      expect(unhighlightSpy).toHaveBeenCalled();
    });

    it('should not exceed max pool capacity', () => {
      // Pool starts with 20 prewarmed tiles
      // To get 80 tiles in the pool:
      // 1. Acquire 80 tiles (drains 20, creates 60 new)
      // 2. Release all 80 back to pool
      const tiles = [];

      // Acquire 80 tiles
      for (let i = 0; i < 80; i++) {
        tiles.push(pool.acquire(i, 0, 'deepSpaceBlue'));
      }

      // Release all 80 back to pool
      for (const tile of tiles) {
        pool.release(tile);
      }

      expect(pool.getStats().pooled).toBe(80); // MAX_POOL_SIZE

      // Acquire and release more tiles - pool should stay at max
      const moreTiles = [];
      for (let i = 0; i < 10; i++) {
        moreTiles.push(pool.acquire(100 + i, 0, 'cosmicTeal'));
      }

      for (const tile of moreTiles) {
        pool.release(tile);
      }

      // Pool should still be at max, not 90
      expect(pool.getStats().pooled).toBe(80);
    });
  });

  describe('releaseMany', () => {
    it('should release multiple tiles at once', () => {
      const tiles = [
        pool.acquire(0, 0, 'deepSpaceBlue'),
        pool.acquire(1, 1, 'nebulaPurple'),
        pool.acquire(2, 2, 'cosmicTeal')
      ];

      expect(pool.getStats().active).toBe(3);

      pool.releaseMany(tiles);

      const stats = pool.getStats();
      expect(stats.active).toBe(0);
      expect(stats.pooled).toBe(20); // Back to initial
    });

    it('should handle empty array', () => {
      const statsBefore = pool.getStats();
      pool.releaseMany([]);
      const statsAfter = pool.getStats();

      expect(statsAfter).toEqual(statsBefore);
    });
  });

  describe('getStats', () => {
    it('should return accurate pool statistics', () => {
      const tile1 = pool.acquire(0, 0, 'deepSpaceBlue');
      const tile2 = pool.acquire(1, 1, 'nebulaPurple');

      const stats = pool.getStats();
      expect(stats.pooled).toBe(18);
      expect(stats.active).toBe(2);
      expect(stats.total).toBe(20);

      pool.release(tile1);

      const stats2 = pool.getStats();
      expect(stats2.pooled).toBe(19);
      expect(stats2.active).toBe(1);
      expect(stats2.total).toBe(20);
    });
  });

  describe('destroy', () => {
    it('should destroy all pooled tiles', () => {
      const stats = pool.getStats();
      expect(stats.pooled).toBeGreaterThan(0);

      pool.destroy();

      const statsAfter = pool.getStats();
      expect(statsAfter.pooled).toBe(0);
      expect(statsAfter.active).toBe(0);
      expect(statsAfter.total).toBe(0);
    });

    it('should destroy all active tiles', () => {
      pool.acquire(0, 0, 'deepSpaceBlue');
      pool.acquire(1, 1, 'nebulaPurple');

      expect(pool.getStats().active).toBe(2);

      pool.destroy();

      const stats = pool.getStats();
      expect(stats.active).toBe(0);
      expect(stats.pooled).toBe(0);
    });
  });

  describe('reuse behavior', () => {
    it('should reuse the same tile object', () => {
      const tile1 = pool.acquire(0, 0, 'deepSpaceBlue');
      const tileId = tile1;

      pool.release(tile1);

      const tile2 = pool.acquire(5, 5, 'solarGold');

      // Should be the same object reference
      expect(tile2).toBe(tileId);

      // But with updated properties
      expect(tile2.color).toBe('solarGold');
      const pos = tile2.getGridPosition();
      expect(pos.x).toBe(5);
      expect(pos.y).toBe(5);
    });

    it('should properly reset tile state when reused', () => {
      const tile = pool.acquire(0, 0, 'deepSpaceBlue');

      // Modify tile state
      tile.setSelected();
      tile.sprite.setAlpha(0.5);

      pool.release(tile);

      // Acquire again with different properties
      const reusedTile = pool.acquire(3, 3, 'plasmaPink');

      // Should have clean state
      expect(reusedTile.color).toBe('plasmaPink');
      const pos = reusedTile.getGridPosition();
      expect(pos.x).toBe(3);
      expect(pos.y).toBe(3);
    });
  });

  describe('performance simulation', () => {
    it('should handle cascade scenario efficiently', () => {
      // Simulate a 5-cascade combo
      const cascadeTiles: TileColor[] = ['deepSpaceBlue', 'nebulaPurple', 'cosmicTeal', 'solarGold', 'meteorSilver'];

      for (let cascade = 0; cascade < 5; cascade++) {
        // Acquire 8 tiles (one column)
        const tiles = [];
        for (let i = 0; i < 8; i++) {
          tiles.push(pool.acquire(0, i, cascadeTiles[cascade % 5]));
        }

        // Release them (simulating match removal)
        pool.releaseMany(tiles);
      }

      // Pool should have reused tiles, not created 40 new ones
      const stats = pool.getStats();
      expect(stats.total).toBeLessThanOrEqual(20); // Should stay near initial size
      expect(stats.active).toBe(0);
      expect(stats.pooled).toBe(stats.total);
    });
  });
});
