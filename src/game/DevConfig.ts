/**
 * Development configuration for debugging and testing.
 * These settings only apply when running in local development mode.
 */

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
   * Production: 60
   * Dev: 15 (for faster iteration)
   */
  timerSeconds: isDev ? 15 : 60,
} as const;
