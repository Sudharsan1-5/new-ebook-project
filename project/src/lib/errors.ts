/**
 * Error handling utilities
 * Converts technical errors into user-friendly messages
 */

/**
 * User-friendly error messages for common error scenarios
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  'network': 'Unable to connect to the server. Please check your internet connection and try again.',
  'timeout': 'The request took too long to complete. Please try again.',
  'fetch': 'Network request failed. Please check your connection and try again.',

  // Authentication errors
  'not authenticated': 'Please log in to continue.',
  'unauthorized': 'You don\'t have permission to perform this action.',
  'invalid credentials': 'Invalid email or password. Please try again.',
  'session expired': 'Your session has expired. Please log in again.',

  // API key errors
  'api key': 'API configuration error. Please contact support.',
  'invalid api key': 'Invalid API key. Please check your configuration.',
  'insufficient credits': 'You\'ve run out of API credits. Please upgrade your plan.',

  // Content generation errors
  'content generation failed': 'Failed to generate content. Please try again with different input.',
  'rate limit': 'Too many requests. Please wait a moment and try again.',

  // Database errors
  'unique constraint': 'This item already exists. Please use a different name.',
  'foreign key': 'Cannot complete this action due to related data.',
  'not found': 'The requested item was not found.',

  // Validation errors
  'invalid input': 'Please check your input and try again.',
  'required field': 'Please fill in all required fields.',
  'invalid format': 'Invalid format. Please check your input.',

  // Server errors
  '500': 'Server error. Our team has been notified. Please try again later.',
  '502': 'Service temporarily unavailable. Please try again in a moment.',
  '503': 'Service is currently undergoing maintenance. Please try again later.',
  '504': 'Gateway timeout. The server took too long to respond. Please try again.',
};

/**
 * Extract a user-friendly error message from an error object
 */
export function getUserFriendlyError(error: unknown, fallback = 'An unexpected error occurred. Please try again.'): string {
  if (!error) return fallback;

  // Get the error message
  let errorMessage = '';
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    return fallback;
  }

  const lowerMessage = errorMessage.toLowerCase();

  // Check for known error patterns
  for (const [key, friendlyMessage] of Object.entries(ERROR_MESSAGES)) {
    if (lowerMessage.includes(key)) {
      return friendlyMessage;
    }
  }

  // Check if it looks like a technical error
  if (
    lowerMessage.includes('undefined') ||
    lowerMessage.includes('null') ||
    lowerMessage.includes('cannot read') ||
    lowerMessage.includes('is not a function') ||
    lowerMessage.includes('stack trace')
  ) {
    return 'A technical error occurred. Our team has been notified. Please try again.';
  }

  // If error message is too technical or long, use fallback
  if (errorMessage.length > 100 || /[{}[\]()<>]/.test(errorMessage)) {
    return fallback;
  }

  // Return the original message if it seems user-friendly
  return errorMessage;
}

/**
 * Custom error classes for better error handling
 */

export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  constructor(message = 'Invalid input') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  if (error instanceof APIError && error.statusCode && error.statusCode >= 500) return true;

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')
    );
  }

  return false;
}
