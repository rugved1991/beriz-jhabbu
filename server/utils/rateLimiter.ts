/**
 * Rate Limiter
 * Implements per-socket rate limiting to prevent spam and DoS attacks
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private maxRequests: number;
  private windowMs: number;

  /**
   * Creates a new rate limiter
   * @param maxRequests - Maximum number of requests allowed in the time window
   * @param windowMs - Time window in milliseconds
   */
  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Checks if a request should be allowed
   * @param identifier - Unique identifier (e.g., socket ID)
   * @returns true if request is allowed, false if rate limit exceeded
   */
  checkLimit(identifier: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || now > entry.resetTime) {
      // First request or window expired - allow and reset
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      // Rate limit exceeded
      return false;
    }

    // Increment count and allow
    entry.count++;
    return true;
  }

  /**
   * Removes rate limit entry for an identifier
   * @param identifier - Unique identifier to remove
   */
  remove(identifier: string): void {
    this.limits.delete(identifier);
  }

  /**
   * Gets current request count for an identifier
   * @param identifier - Unique identifier
   * @returns Current request count or 0 if not found
   */
  getCount(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return 0;
    }
    return entry.count;
  }

  /**
   * Cleans up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [identifier, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(identifier);
      }
    }
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute
