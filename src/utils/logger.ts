/**
 * Safe logging utility
 * Only logs in development mode and never logs sensitive game data
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Log general information (non-sensitive)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log warnings
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log errors (always log errors, even in production)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * NEVER use this - for debugging only, remove before commit
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  }
};
