/**
 * Tests for Rate Limiter
 * Validates rate limiting functionality for security
 */

import { RateLimiter } from './rateLimiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const limiter = new RateLimiter(5, 60000); // 5 requests per minute
      
      expect(limiter.checkLimit('user1')).toBe(true);
      expect(limiter.checkLimit('user1')).toBe(true);
      expect(limiter.checkLimit('user1')).toBe(true);
      expect(limiter.checkLimit('user1')).toBe(true);
      expect(limiter.checkLimit('user1')).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      const limiter = new RateLimiter(3, 60000); // 3 requests per minute
      
      expect(limiter.checkLimit('user1')).toBe(true);
      expect(limiter.checkLimit('user1')).toBe(true);
      expect(limiter.checkLimit('user1')).toBe(true);
      expect(limiter.checkLimit('user1')).toBe(false); // 4th request blocked
      expect(limiter.checkLimit('user1')).toBe(false); // 5th request blocked
    });

    it('should track different identifiers separately', () => {
      const limiter = new RateLimiter(2, 60000);
      
      expect(limiter.checkLimit('user1')).toBe(true);
      expect(limiter.checkLimit('user1')).toBe(true);
      expect(limiter.checkLimit('user1')).toBe(false); // user1 blocked
      
      expect(limiter.checkLimit('user2')).toBe(true); // user2 still allowed
      expect(limiter.checkLimit('user2')).toBe(true);
      expect(limiter.checkLimit('user2')).toBe(false); // user2 now blocked
    });
  });

  describe('Time Window Reset', () => {
    it('should reset limit after time window expires', () => {
      const limiter = new RateLimiter(2, 1000); // 2 requests per second
      
      expect(limiter.checkLimit('user1')).toBe(true);
      expect(limiter.checkLimit('user1')).toBe(true);
      expect(limiter.checkLimit('user1')).toBe(false); // Blocked
      
      // Advance time past window
      jest.advanceTimersByTime(1001);
      
      expect(limiter.checkLimit('user1')).toBe(true); // Allowed again
      expect(limiter.checkLimit('user1')).toBe(true);
      expect(limiter.checkLimit('user1')).toBe(false); // Blocked again
    });

    it('should not reset before window expires', () => {
      const limiter = new RateLimiter(2, 1000);
      
      expect(limiter.checkLimit('user1')).toBe(true);
      expect(limiter.checkLimit('user1')).toBe(true);
      expect(limiter.checkLimit('user1')).toBe(false);
      
      // Advance time but not past window
      jest.advanceTimersByTime(500);
      
      expect(limiter.checkLimit('user1')).toBe(false); // Still blocked
    });
  });

  describe('Request Count Tracking', () => {
    it('should return correct request count', () => {
      const limiter = new RateLimiter(10, 60000);
      
      expect(limiter.getCount('user1')).toBe(0);
      
      limiter.checkLimit('user1');
      expect(limiter.getCount('user1')).toBe(1);
      
      limiter.checkLimit('user1');
      limiter.checkLimit('user1');
      expect(limiter.getCount('user1')).toBe(3);
    });

    it('should return 0 for expired entries', () => {
      const limiter = new RateLimiter(5, 1000);
      
      limiter.checkLimit('user1');
      expect(limiter.getCount('user1')).toBe(1);
      
      jest.advanceTimersByTime(1001);
      expect(limiter.getCount('user1')).toBe(0);
    });
  });

  describe('Manual Management', () => {
    it('should remove rate limit entry', () => {
      const limiter = new RateLimiter(2, 60000);
      
      limiter.checkLimit('user1');
      limiter.checkLimit('user1');
      expect(limiter.checkLimit('user1')).toBe(false);
      
      limiter.remove('user1');
      expect(limiter.checkLimit('user1')).toBe(true); // Allowed after removal
    });

    it('should cleanup expired entries', () => {
      const limiter = new RateLimiter(5, 1000);
      
      limiter.checkLimit('user1');
      limiter.checkLimit('user2');
      limiter.checkLimit('user3');
      
      jest.advanceTimersByTime(1001);
      
      limiter.cleanup();
      
      // All should be reset after cleanup
      expect(limiter.getCount('user1')).toBe(0);
      expect(limiter.getCount('user2')).toBe(0);
      expect(limiter.getCount('user3')).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very low max requests', () => {
      const limiter = new RateLimiter(1, 60000);
      expect(limiter.checkLimit('user1')).toBe(true);
      expect(limiter.checkLimit('user1')).toBe(false);
    });

    it('should handle very short time windows', () => {
      const limiter = new RateLimiter(1, 1);
      
      expect(limiter.checkLimit('user1')).toBe(true);
      expect(limiter.checkLimit('user1')).toBe(false);
      
      jest.advanceTimersByTime(2);
      expect(limiter.checkLimit('user1')).toBe(true);
    });

    it('should handle high request volumes', () => {
      const limiter = new RateLimiter(100, 60000);
      
      for (let i = 0; i < 100; i++) {
        expect(limiter.checkLimit('user1')).toBe(true);
      }
      
      expect(limiter.checkLimit('user1')).toBe(false);
    });
  });
});
