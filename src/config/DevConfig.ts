/**
 * Development configuration for debugging and testing.
 * These settings only apply when running in local development mode.
 */

import { TIMER_CONFIG } from './GameConfig';

const isDev = import.meta.env.DEV;

export const DEV_CONFIG = {
  /**
   * Whether dev mode features are enabled
   */
  enabled: isDev,

  /**
   * Starting score for new games in dev mode
   * Production: 0
   * Dev: 5000 (for testing shop purchases)
   */
  startingScore: isDev ? 5000 : 0,

  /**
   * Round timer duration in seconds
   * Production: Uses TIMER_CONFIG.BASE_ROUND_DURATION (60s)
   * Dev: 15s (for faster iteration)
   */
  timerSeconds: isDev ? 15 : TIMER_CONFIG.BASE_ROUND_DURATION,
} as const;
