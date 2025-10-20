/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    allowedHosts: ['.trycloudflare.com'],
  },
  build: {
    // Enable minification with terser for better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'], // Remove specific console methods
      },
      format: {
        comments: false, // Remove all comments
      },
    } as any, // Type assertion needed due to Vite's terser option types
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        game: resolve(__dirname, 'game.html'),
      },
      output: {
        // Manual chunks for code splitting
        manualChunks: (id) => {
          // Phaser in its own chunk (large library)
          if (id.includes('node_modules/phaser')) {
            return 'phaser';
          }

          // Game logic core (reused across scenes)
          if (id.includes('/src/game/') &&
              (id.includes('Grid.ts') ||
               id.includes('MatchDetector.ts') ||
               id.includes('GameState.ts') ||
               id.includes('Tile.ts') ||
               id.includes('TilePool.ts'))) {
            return 'game-core';
          }

          // Managers (state management)
          if (id.includes('/src/game/') &&
              (id.includes('GameProgressManager.ts') ||
               id.includes('ShopSystem.ts') ||
               id.includes('UpgradeManager.ts'))) {
            return 'game-managers';
          }

          // Scenes (lazy loadable)
          if (id.includes('/src/scenes/')) {
            return 'scenes';
          }

          // Config files
          if (id.includes('/src/config/')) {
            return 'config';
          }

          // Services
          if (id.includes('/src/services/')) {
            return 'services';
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    server: {
      deps: {
        inline: ['phaser'],
      },
    },
  },
});
