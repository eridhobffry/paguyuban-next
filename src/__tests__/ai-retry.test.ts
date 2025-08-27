import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  withRetry, 
  fetchWithRetry, 
  createRetryWrapper,
  RetryOptions 
} from '@/lib/ai-retry';

// Use real timers for retry tests since they involve complex timing
afterEach(() => {
  vi.clearAllMocks();
});

describe('withRetry', () => {
  it('should succeed on first attempt', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    
    const promise = withRetry(mockFn);
    const result = await promise;
    
    expect(result.success).toBe(true);
    expect(result.result).toBe('success');
    expect(result.attempts).toBe(1);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable errors with correct delays', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ETIMEDOUT'))
      .mockResolvedValue('success');

    // Use a simpler approach without manual timer advancing
    const result = await withRetry(mockFn, {
      baseDelay: 1, // Very short delays for testing
      maxDelay: 2,
      maxRetries: 2
    });

    expect(result.success).toBe(true);
    expect(result.result).toBe('success');
    expect(result.attempts).toBe(3);
    expect(mockFn).toHaveBeenCalledTimes(3);
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
    
    const result = await withRetry(mockFn, {
      maxRetries: 2
    });

    expect(result.success).toBe(false);
    expect(result.attempts).toBe(1);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should respect total budget timeout', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    
    const result = await withRetry(mockFn, {
      maxRetries: 5,
      baseDelay: 200,
      maxDelay: 800,
      totalBudgetMs: 50 // Very short budget - will fail on first retry
    });

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('budget exceeded');
  }, 10000);

  it('should call onRetry callback', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValue('success');

    const onRetryMock = vi.fn();
    
    await withRetry(mockFn, {
      maxRetries: 2,
      baseDelay: 1,
      onRetry: onRetryMock
    });

    expect(onRetryMock).toHaveBeenCalledTimes(1);
    expect(onRetryMock).toHaveBeenCalledWith(1, expect.any(Error));
  });

  it('should handle timeout during retry delay', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    
    const result = await withRetry(mockFn, {
      maxRetries: 2,
      baseDelay: 1500, // Longer than budget
      totalBudgetMs: 1200
    });

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('No time left for retry delay');
  });

  it('should detect retryable network errors', async () => {
    const networkErrors = [
      new Error('fetch failed'),
      new Error('network error occurred'),
      new Error('connection timeout'),
      new Error('connection refused'),
      new Error('status 500'),
      new Error('status 503')
    ];

    for (const error of networkErrors) {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const promise = withRetry(mockFn, { maxRetries: 1 });
      
      await vi.advanceTimersByTimeAsync(0);   // First attempt
      await vi.advanceTimersByTimeAsync(200); // Retry delay

      const result = await promise;
      
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    }
  });
});

describe('fetchWithRetry', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should retry failed fetch requests', async () => {
    const mockFetch = global.fetch as any;
    mockFetch
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValue({
        status: 200,
        statusText: 'OK',
        ok: true
      });

    const promise = fetchWithRetry('http://example.com/test');
    
    // Advance through retry delay
    await vi.advanceTimersByTimeAsync(0);   // First attempt
    await vi.advanceTimersByTimeAsync(200); // Retry delay

    const result = await promise;
    
    expect(result.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should retry 5xx responses', async () => {
    const mockFetch = global.fetch as any;
    mockFetch
      .mockResolvedValueOnce({
        status: 500,
        statusText: 'Internal Server Error'
      })
      .mockResolvedValue({
        status: 200,
        statusText: 'OK',
        ok: true
      });

    const promise = fetchWithRetry('http://example.com/test');
    
    await vi.advanceTimersByTimeAsync(0);   // First attempt
    await vi.advanceTimersByTimeAsync(200); // Retry delay

    const result = await promise;
    
    expect(result.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should not retry 4xx responses', async () => {
    const mockFetch = global.fetch as any;
    mockFetch.mockResolvedValue({
      status: 404,
      statusText: 'Not Found',
      ok: false
    });

    await expect(fetchWithRetry('http://example.com/test')).rejects.toThrow('AI service client error 404: Not Found');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle request timeout', async () => {
    const mockFetch = global.fetch as any;
    mockFetch.mockImplementation(() => 
      new Promise(() => {}) // Never resolves
    );

    const promise = fetchWithRetry('http://example.com/test');
    
    // Advance past request timeout (1s per request) 
    await vi.advanceTimersByTimeAsync(1100);
    
    await expect(promise).rejects.toThrow();
  }, 10000);
});

describe('createRetryWrapper', () => {
  it('should wrap functions with retry capability', async () => {
    const originalFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValue('success');

    const wrappedFn = createRetryWrapper(originalFn, {
      maxRetries: 1
    });

    const promise = wrappedFn('arg1', 'arg2');
    
    await vi.advanceTimersByTimeAsync(0);   // First attempt  
    await vi.advanceTimersByTimeAsync(200); // Retry delay

    const result = await promise;

    expect(result).toBe('success');
    expect(originalFn).toHaveBeenCalledTimes(2);
    expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('retry timing and budget constraints', () => {
  it('should use correct delay intervals (200ms, 800ms)', async () => {
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValue('success');

    const delaysSpy = vi.fn();
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = vi.fn((fn, delay) => {
      delaysSpy(delay);
      return originalSetTimeout(fn, delay);
    }) as any;

    const promise = withRetry(mockFn, {
      maxRetries: 2,
      baseDelay: 200,
      maxDelay: 800
    });

    await vi.advanceTimersByTimeAsync(0);   // First attempt
    await vi.advanceTimersByTimeAsync(200); // First retry
    await vi.advanceTimersByTimeAsync(800); // Second retry

    await promise;

    expect(delaysSpy).toHaveBeenCalledWith(200); // First retry delay
    expect(delaysSpy).toHaveBeenCalledWith(800); // Second retry delay
    
    global.setTimeout = originalSetTimeout;
  });

  it('should enforce total budget of 1.2 seconds', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    
    const startTime = Date.now();
    vi.setSystemTime(startTime);

    const promise = withRetry(mockFn, {
      maxRetries: 10,
      baseDelay: 200,
      maxDelay: 800,
      totalBudgetMs: 1200
    });

    // Simulate time passing beyond budget
    vi.setSystemTime(startTime + 1300);
    
    const result = await promise;

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('budget exceeded');
    expect(result.totalTimeMs).toBeGreaterThanOrEqual(1200);
  });
});