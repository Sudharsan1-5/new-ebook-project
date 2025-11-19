/**
 * Retry utility with exponential backoff and timeout
 * Provides resilient API calls that can recover from transient failures
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  timeoutMs: 30000,
  shouldRetry: (error: unknown) => {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('fetch') ||
        message.includes('econnrefused') ||
        message.includes('500') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504')
      );
    }
    return false;
  }
};

/**
 * Sleep utility for delays
 */
const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
const calculateDelay = (attempt: number, initialDelay: number, maxDelay: number): number => {
  const exponentialDelay = initialDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 0.3 * exponentialDelay; // Add 0-30% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
};

/**
 * Wrap a promise with timeout
 */
const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError: Error = new Error(`Operation timed out after ${timeoutMs}ms`)
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(timeoutError), timeoutMs)
    )
  ]);
};

/**
 * Retry a function with exponential backoff
 *
 * @example
 * ```typescript
 * const data = await retryWithBackoff(
 *   async () => {
 *     const response = await fetch('/api/data');
 *     if (!response.ok) throw new Error(`HTTP ${response.status}`);
 *     return response.json();
 *   },
 *   {
 *     maxAttempts: 3,
 *     timeoutMs: 5000,
 *     onRetry: (attempt, error) => {
 *       console.log(`Retry attempt ${attempt}:`, error);
 *     }
 *   }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      // Wrap the function call with timeout
      const result = await withTimeout(
        fn(),
        opts.timeoutMs,
        new Error(`Request timed out after ${opts.timeoutMs}ms (attempt ${attempt}/${opts.maxAttempts})`)
      );
      return result;
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts
      if (attempt >= opts.maxAttempts) {
        break;
      }

      // Check if we should retry this error
      const shouldRetry = options.shouldRetry
        ? options.shouldRetry(error)
        : opts.shouldRetry(error);

      if (!shouldRetry) {
        throw error;
      }

      // Call retry callback if provided
      if (options.onRetry) {
        options.onRetry(attempt, error);
      }

      // Calculate and wait for backoff delay
      const delay = calculateDelay(attempt, opts.initialDelayMs, opts.maxDelayMs);
      await sleep(delay);
    }
  }

  // If we get here, all retries failed
  throw lastError;
}

/**
 * Fetch with retry and timeout
 * Convenience wrapper for fetch API calls
 *
 * @example
 * ```typescript
 * const response = await fetchWithRetry('/api/data', {
 *   method: 'POST',
 *   body: JSON.stringify({ foo: 'bar' })
 * });
 * ```
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  return retryWithBackoff(
    async () => {
      const response = await fetch(input, init);

      // Throw on 5xx errors (will trigger retry)
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      return response;
    },
    retryOptions
  );
}
