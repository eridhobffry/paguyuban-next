import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { withRetry, createRetryWrapper } from '@/lib/ai-retry';

describe('AI Retry System (Simplified)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Retry Functionality', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      
      const result = await withRetry(mockFn);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(1);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on ECONNREFUSED errors', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValue('success');

      const result = await withRetry(mockFn, {
        baseDelay: 1,
        maxDelay: 2,
        maxRetries: 1
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(2);
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should retry on ETIMEDOUT errors', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('ETIMEDOUT'))
        .mockResolvedValue('success');

      const result = await withRetry(mockFn, {
        baseDelay: 1,
        maxDelay: 2,
        maxRetries: 1
      });

      expect(result.success).toBe(true);
      expect(result.result).toBe('success');
      expect(result.attempts).toBe(2);
    });

    it('should retry on network errors', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');

      const result = await withRetry(mockFn, {
        baseDelay: 1,
        maxRetries: 1
      });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    });

    it('should retry on fetch errors', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockResolvedValue('success');

      const result = await withRetry(mockFn, {
        baseDelay: 1,
        maxRetries: 1
      });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    });

    it('should fail after max retries', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      
      const result = await withRetry(mockFn, {
        maxRetries: 2,
        baseDelay: 1,
        maxDelay: 2
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3);
      expect(result.error?.message).toBe('ECONNREFUSED');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Not retryable error'));
      
      const result = await withRetry(mockFn, { maxRetries: 2 });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValue('success');

      const onRetryMock = vi.fn();
      
      await withRetry(mockFn, {
        maxRetries: 1,
        baseDelay: 1,
        onRetry: onRetryMock
      });

      expect(onRetryMock).toHaveBeenCalledTimes(1);
      expect(onRetryMock).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('should respect total budget timeout', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      
      const result = await withRetry(mockFn, {
        maxRetries: 5,
        baseDelay: 1,
        maxDelay: 2,
        totalBudgetMs: 10 // Very short budget
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toMatch(/budget|time/i);
    });
  });

  describe('Error Classification', () => {
    const retryableErrors = [
      new Error('ECONNREFUSED'),
      new Error('ETIMEDOUT'),
      new Error('ENOTFOUND'),
      new Error('ECONNRESET'),
      new Error('network error'),
      new Error('fetch failed'),
      new Error('connection timeout'),
      new Error('AI service returned 500: Internal Server Error'),
      new Error('AI service returned 503: Service Unavailable'),
    ];

    const nonRetryableErrors = [
      new Error('Invalid input'),
      new Error('Authentication failed'),
      new Error('Not found'),
      new Error('AI service client error 404: Not Found'),
    ];

    retryableErrors.forEach((error, index) => {
      it(`should retry error: ${error.message}`, async () => {
        const mockFn = vi
          .fn()
          .mockRejectedValueOnce(error)
          .mockResolvedValue('success');

        const result = await withRetry(mockFn, {
          maxRetries: 1,
          baseDelay: 1
        });

        expect(result.success).toBe(true);
        expect(result.attempts).toBe(2);
      });
    });

    nonRetryableErrors.forEach((error, index) => {
      it(`should not retry error: ${error.message}`, async () => {
        const mockFn = vi.fn().mockRejectedValue(error);

        const result = await withRetry(mockFn, {
          maxRetries: 2,
          baseDelay: 1
        });

        expect(result.success).toBe(false);
        expect(result.attempts).toBe(1);
      });
    });
  });

  describe('createRetryWrapper', () => {
    it('should wrap functions with retry capability', async () => {
      const originalFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED'))
        .mockResolvedValue('success');

      const wrappedFn = createRetryWrapper(originalFn, {
        maxRetries: 1,
        baseDelay: 1
      });

      const result = await wrappedFn('arg1', 'arg2');

      expect(result).toBe('success');
      expect(originalFn).toHaveBeenCalledTimes(2);
      expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should throw on failure after retries', async () => {
      const originalFn = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const wrappedFn = createRetryWrapper(originalFn, {
        maxRetries: 1,
        baseDelay: 1
      });

      await expect(wrappedFn()).rejects.toThrow('ECONNREFUSED');
      expect(originalFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Timing Configuration', () => {
    it('should use correct default configuration', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      
      const result = await withRetry(mockFn);

      expect(result.maxRetries).toBeUndefined(); // We don't expose this in result
      expect(result.attempts).toBe(3); // maxRetries: 2, so 3 total attempts
      expect(result.success).toBe(false);
    });

    it('should respect custom retry limits', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      
      const result = await withRetry(mockFn, {
        maxRetries: 1
      });

      expect(result.attempts).toBe(2); // maxRetries: 1, so 2 total attempts
      expect(result.success).toBe(false);
    });

    it('should enforce total budget with real timing', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      
      const start = Date.now();
      const result = await withRetry(mockFn, {
        maxRetries: 10,
        baseDelay: 50, // Small delays for testing
        maxDelay: 50,
        totalBudgetMs: 100 // 100ms budget
      });
      const elapsed = Date.now() - start;

      expect(result.success).toBe(false);
      expect(elapsed).toBeLessThan(200); // Should not take too long
      expect(result.totalTimeMs).toBeLessThanOrEqual(150); // Some tolerance
    }, 5000);
  });
});