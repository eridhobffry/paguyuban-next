/**
 * Retry mechanism with exponential backoff for AI service requests
 * Total budget: <1.2s, with 2 retries at 200ms/800ms intervals
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  totalBudgetMs?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryResult<T> {
  result?: T;
  error?: Error;
  attempts: number;
  totalTimeMs: number;
  success: boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 2,
  baseDelay: 200, // First retry after 200ms
  maxDelay: 800,  // Second retry after 800ms  
  totalBudgetMs: 1200, // Total budget 1.2 seconds
  retryableErrors: [
    'ECONNREFUSED',
    'ENOTFOUND', 
    'ETIMEDOUT',
    'ECONNRESET',
    'NETWORK_ERROR',
    'AI_SERVICE_UNAVAILABLE'
  ],
  onRetry: () => {} // No-op by default
};

/**
 * Determines if an error is retryable based on its type and message
 */
function isRetryableError(error: Error, retryableErrors: string[]): boolean {
  const errorMessage = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();
  
  // Check for specific error codes in the retryableErrors list
  if (retryableErrors.some(code => 
    errorMessage.includes(code.toLowerCase()) || 
    errorName.includes(code.toLowerCase())
  )) {
    return true;
  }
  
  // Check for specific error types in cause
  if (error.cause && typeof error.cause === 'object' && 'code' in error.cause) {
    const errorCode = (error.cause as any).code;
    if (retryableErrors.includes(errorCode)) {
      return true;
    }
  }
  
  // Check for network-related errors
  const networkErrors = ['fetch', 'network', 'timeout', 'connection', 'refused', 'reset'];
  const hasNetworkError = networkErrors.some(term => 
    errorMessage.includes(term) || errorName.includes(term)
  );
  
  // Check for specific status codes (if it's a fetch error)
  if (error.message.includes('AI service returned 50') || 
      error.message.includes('status 50')) {
    return true; // 5xx errors are retryable
  }
  
  return hasNetworkError;
}

/**
 * Calculate delay for exponential backoff with specific intervals
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  if (attempt === 1) return baseDelay; // 200ms
  if (attempt === 2) return maxDelay;  // 800ms
  return maxDelay;
}

/**
 * Retry wrapper for async functions with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const startTime = Date.now();
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    // Check if we're within time budget
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= opts.totalBudgetMs) {
      return {
        error: new Error(`Retry budget exceeded (${opts.totalBudgetMs}ms). Last error: ${lastError?.message}`),
        attempts: attempt - 1,
        totalTimeMs: elapsedTime,
        success: false
      };
    }
    
    try {
      const result = await fn();
      return {
        result,
        attempts: attempt,
        totalTimeMs: Date.now() - startTime,
        success: true
      };
    } catch (error) {
      lastError = error as Error;
      
      // If this was the last attempt, return the error
      if (attempt > opts.maxRetries) {
        return {
          error: lastError,
          attempts: attempt,
          totalTimeMs: Date.now() - startTime,
          success: false
        };
      }
      
      // Check if error is retryable
      if (!isRetryableError(lastError, opts.retryableErrors)) {
        return {
          error: lastError,
          attempts: attempt,
          totalTimeMs: Date.now() - startTime,
          success: false
        };
      }
      
      // Calculate delay and check if we have time for it
      const delay = calculateDelay(attempt, opts.baseDelay, opts.maxDelay);
      const timeAfterDelay = Date.now() - startTime + delay;
      
      if (timeAfterDelay >= opts.totalBudgetMs) {
        return {
          error: new Error(`No time left for retry delay. Budget: ${opts.totalBudgetMs}ms`),
          attempts: attempt,
          totalTimeMs: Date.now() - startTime,
          success: false
        };
      }
      
      // Call retry callback
      opts.onRetry(attempt, lastError);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached
  return {
    error: lastError || new Error('Unknown retry error'),
    attempts: opts.maxRetries + 1,
    totalTimeMs: Date.now() - startTime,
    success: false
  };
}

/**
 * Enhanced fetch with retry mechanism for AI service requests
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & { retryOptions?: RetryOptions } = {}
): Promise<Response> {
  const { retryOptions, ...fetchOptions } = options;
  
  const retryResult = await withRetry(
    async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s timeout per request
      
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Consider 5xx errors as retryable, but 4xx are not
        if (response.status >= 500) {
          throw new Error(`AI service returned ${response.status}: ${response.statusText}`);
        }
        
        if (!response.ok && response.status >= 400 && response.status < 500) {
          throw new Error(`AI service client error ${response.status}: ${response.statusText}`);
        }
        
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    {
      ...retryOptions,
      onRetry: (attempt, error) => {
        console.warn(`AI service request retry ${attempt}:`, error.message);
        retryOptions?.onRetry?.(attempt, error);
      }
    }
  );
  
  if (!retryResult.success) {
    throw new Error(
      `AI service request failed after ${retryResult.attempts} attempts (${retryResult.totalTimeMs}ms): ${retryResult.error?.message}`
    );
  }
  
  return retryResult.result!;
}

/**
 * Retry-enabled wrapper for makeAIServiceRequest
 */
export async function makeReliableAIRequest(
  endpoint: string,
  options: RequestInit & { retryOptions?: RetryOptions } = {}
): Promise<Response> {
  const { makeAIServiceRequest } = await import('./ai-auth');
  const { retryOptions, ...requestOptions } = options;
  
  const retryResult = await withRetry(
    () => makeAIServiceRequest(endpoint, requestOptions),
    {
      ...retryOptions,
      onRetry: (attempt, error) => {
        console.warn(`AI service request to ${endpoint} retry ${attempt}:`, error.message);
        retryOptions?.onRetry?.(attempt, error);
      }
    }
  );
  
  if (!retryResult.success) {
    throw new Error(
      `AI service request to ${endpoint} failed after ${retryResult.attempts} attempts (${retryResult.totalTimeMs}ms): ${retryResult.error?.message}`
    );
  }
  
  return retryResult.result!;
}

/**
 * Utility for adding retry to any async function
 */
export function createRetryWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return (async (...args: any[]) => {
    const retryResult = await withRetry(() => fn(...args), options);
    
    if (!retryResult.success) {
      throw retryResult.error;
    }
    
    return retryResult.result;
  }) as T;
}

/**
 * Example usage and testing utilities
 */
export const retryExamples = {
  // Basic retry with defaults
  async basicRetry<T>(fn: () => Promise<T>): Promise<T> {
    const result = await withRetry(fn);
    if (!result.success) throw result.error;
    return result.result!;
  },
  
  // Custom retry for AI endpoints
  async aiEndpointRetry<T>(fn: () => Promise<T>): Promise<T> {
    const result = await withRetry(fn, {
      maxRetries: 2,
      baseDelay: 200,
      maxDelay: 800,
      totalBudgetMs: 1200,
      onRetry: (attempt, error) => console.log(`Retry ${attempt}: ${error.message}`)
    });
    if (!result.success) throw result.error;
    return result.result!;
  }
};