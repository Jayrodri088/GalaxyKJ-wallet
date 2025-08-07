import {
  stellarErrorHandler,
  processStellarError,
  getStellarErrorMessage,
  getStellarErrorSuggestions,
  isStellarErrorRetryable,
} from '../error-handler';
import {
  StellarErrorCategory,
  STELLAR_ERROR_CODES,
  StellarErrorContext,
} from '@/types/stellar-errors';

describe('Stellar Error Handler', () => {
  describe('Error Processing', () => {
    test('should process invalid secret key error', () => {
      const error = new Error('Invalid seed phrase provided');
      const context: StellarErrorContext = {
        operation: 'sign_message',
        account: 'GTEST123',
      };

      const processed = processStellarError(error, context);

      expect(processed.errorInfo.code).toBe(STELLAR_ERROR_CODES.INVALID_SECRET_KEY);
      expect(processed.errorInfo.category).toBe(StellarErrorCategory.VALIDATION);
      expect(processed.errorInfo.userMessage).toContain('Invalid private key format');
      expect(processed.errorInfo.severity).toBe('high');
      expect(processed.errorInfo.retryable).toBe(false);
      expect(processed.errorInfo.suggestions).toContain('Verify your private key starts with "S" and is 56 characters long');
      expect(processed.context.operation).toBe('sign_message');
      expect(processed.context.account).toBe('GTEST123');
      expect(processed.correlationId).toMatch(/^stellar-\d+-[a-z0-9]+$/);
    });

    test('should process network error', () => {
      const error = new Error('Network connection failed');
      const processed = processStellarError(error);

      expect(processed.errorInfo.code).toBe(STELLAR_ERROR_CODES.NETWORK_ERROR);
      expect(processed.errorInfo.category).toBe(StellarErrorCategory.NETWORK);
      expect(processed.errorInfo.userMessage).toContain('Unable to connect to the Stellar network');
      expect(processed.errorInfo.severity).toBe('high');
      expect(processed.errorInfo.retryable).toBe(true);
      expect(processed.errorInfo.suggestions).toContain('Check your internet connection');
    });

    test('should process account not found error', () => {
      const error = new Error('Account not found on network');
      const processed = processStellarError(error);

      expect(processed.errorInfo.code).toBe(STELLAR_ERROR_CODES.ACCOUNT_NOT_FOUND);
      expect(processed.errorInfo.category).toBe(StellarErrorCategory.ACCOUNT);
      expect(processed.errorInfo.userMessage).toContain('Account not found on the Stellar network');
      expect(processed.errorInfo.retryable).toBe(true);
    });

    test('should process insufficient balance error', () => {
      const error = new Error('Insufficient balance for transaction');
      const processed = processStellarError(error);

      expect(processed.errorInfo.code).toBe(STELLAR_ERROR_CODES.INSUFFICIENT_BALANCE);
      expect(processed.errorInfo.category).toBe(StellarErrorCategory.ACCOUNT);
      expect(processed.errorInfo.userMessage).toContain('Insufficient balance to complete this operation');
      expect(processed.errorInfo.retryable).toBe(false);
    });

    test('should process rate limit error', () => {
      const error = new Error('Rate limit exceeded, too many requests');
      const processed = processStellarError(error);

      expect(processed.errorInfo.code).toBe(STELLAR_ERROR_CODES.RATE_LIMITED);
      expect(processed.errorInfo.category).toBe(StellarErrorCategory.NETWORK);
      expect(processed.errorInfo.userMessage).toContain('Too many requests');
      expect(processed.errorInfo.retryable).toBe(true);
    });

    test('should process signature verification failed error', () => {
      const error = new Error('Signature verification failed');
      const processed = processStellarError(error);

      expect(processed.errorInfo.code).toBe(STELLAR_ERROR_CODES.SIGNATURE_VERIFICATION_FAILED);
      expect(processed.errorInfo.category).toBe(StellarErrorCategory.AUTHORIZATION);
      expect(processed.errorInfo.severity).toBe('critical');
      expect(processed.errorInfo.retryable).toBe(false);
    });

    test('should process timeout error', () => {
      const error = new Error('Operation timeout exceeded');
      const processed = processStellarError(error);

      expect(processed.errorInfo.code).toBe(STELLAR_ERROR_CODES.TIMEOUT);
      expect(processed.errorInfo.category).toBe(StellarErrorCategory.SYSTEM);
      expect(processed.errorInfo.retryable).toBe(true);
    });

    test('should process unknown error', () => {
      const error = new Error('Some completely unknown error message');
      const processed = processStellarError(error);

      expect(processed.errorInfo.code).toBe(STELLAR_ERROR_CODES.UNKNOWN_ERROR);
      expect(processed.errorInfo.category).toBe(StellarErrorCategory.SYSTEM);
      expect(processed.errorInfo.userMessage).toContain('An unexpected error occurred');
      expect(processed.errorInfo.retryable).toBe(true);
    });

    test('should include context timestamp', () => {
      const error = new Error('Test error');
      const processed = processStellarError(error);

      expect(processed.context.timestamp).toBeDefined();
      expect(typeof processed.context.timestamp).toBe('number');
      expect(processed.context.timestamp).toBeGreaterThan(Date.now() - 1000);
    });
  });

  describe('Helper Functions', () => {
    test('getStellarErrorMessage should return user-friendly message', () => {
      const error = new Error('Invalid seed phrase');
      const message = getStellarErrorMessage(error);

      expect(message).toBe('Invalid private key format. Please check your private key and try again.');
    });

    test('getStellarErrorSuggestions should return suggestion array', () => {
      const error = new Error('Network connection failed');
      const suggestions = getStellarErrorSuggestions(error);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain('Check your internet connection');
    });

    test('isStellarErrorRetryable should return boolean', () => {
      const retryableError = new Error('Network timeout');
      const nonRetryableError = new Error('Invalid secret key');

      expect(isStellarErrorRetryable(retryableError)).toBe(true);
      expect(isStellarErrorRetryable(nonRetryableError)).toBe(false);
    });
  });

  describe('Retry Logic', () => {
    test('should recommend retry with appropriate delay for rate limit', () => {
      const error = new Error('Rate limit exceeded');
      const processed = processStellarError(error);
      const retryInfo = stellarErrorHandler.shouldRetryAfterDelay(processed);

      expect(retryInfo.shouldRetry).toBe(true);
      expect(retryInfo.delayMs).toBe(60000); // 60 seconds for rate limit
    });

    test('should recommend retry with shorter delay for network error', () => {
      const error = new Error('Network connection failed');
      const processed = processStellarError(error);
      const retryInfo = stellarErrorHandler.shouldRetryAfterDelay(processed);

      expect(retryInfo.shouldRetry).toBe(true);
      expect(retryInfo.delayMs).toBe(5000); // 5 seconds for network error
    });

    test('should not recommend retry for validation errors', () => {
      const error = new Error('Invalid secret key format');
      const processed = processStellarError(error);
      const retryInfo = stellarErrorHandler.shouldRetryAfterDelay(processed);

      expect(retryInfo.shouldRetry).toBe(false);
      expect(retryInfo.delayMs).toBeUndefined();
    });
  });

  describe('Error Handler Instance Methods', () => {
    test('should get error by code', () => {
      const errorInfo = stellarErrorHandler.getErrorByCode(STELLAR_ERROR_CODES.INVALID_SECRET_KEY);

      expect(errorInfo).toBeDefined();
      expect(errorInfo?.code).toBe(STELLAR_ERROR_CODES.INVALID_SECRET_KEY);
      expect(errorInfo?.category).toBe(StellarErrorCategory.VALIDATION);
    });

    test('should return undefined for non-existent error code', () => {
      const errorInfo = stellarErrorHandler.getErrorByCode('NON_EXISTENT_CODE' as StellarErrorCode);

      expect(errorInfo).toBeUndefined();
    });

    test('should get all error categories', () => {
      const categories = stellarErrorHandler.getErrorCategories();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories).toContain(StellarErrorCategory.NETWORK);
      expect(categories).toContain(StellarErrorCategory.VALIDATION);
      expect(categories).toContain(StellarErrorCategory.AUTHORIZATION);
    });

    test('should check if error is retryable', () => {
      const retryableError = new Error('Network timeout');
      const nonRetryableError = new Error('Invalid secret key');

      const retryableProcessed = processStellarError(retryableError);
      const nonRetryableProcessed = processStellarError(nonRetryableError);

      expect(stellarErrorHandler.isRetryableError(retryableProcessed)).toBe(true);
      expect(stellarErrorHandler.isRetryableError(nonRetryableProcessed)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty error message', () => {
      const error = new Error('');
      const processed = processStellarError(error);

      expect(processed.errorInfo.code).toBe(STELLAR_ERROR_CODES.UNKNOWN_ERROR);
      expect(processed.errorInfo.userMessage).toContain('An unexpected error occurred');
    });

    test('should handle error with only whitespace', () => {
      const error = new Error('   \n\t   ');
      const processed = processStellarError(error);

      expect(processed.errorInfo.code).toBe(STELLAR_ERROR_CODES.UNKNOWN_ERROR);
    });

    test('should handle multiple error patterns in message', () => {
      const error = new Error('Invalid seed and network connection failed');
      const processed = processStellarError(error);

      // Should match the first pattern (invalid seed)
      expect(processed.errorInfo.code).toBe(STELLAR_ERROR_CODES.INVALID_SECRET_KEY);
    });

    test('should generate unique correlation IDs', () => {
      const error1 = new Error('Test error 1');
      const error2 = new Error('Test error 2');

      const processed1 = processStellarError(error1);
      const processed2 = processStellarError(error2);

      expect(processed1.correlationId).not.toBe(processed2.correlationId);
      expect(processed1.correlationId).toMatch(/^stellar-\d+-[a-z0-9]+$/);
      expect(processed2.correlationId).toMatch(/^stellar-\d+-[a-z0-9]+$/);
    });
  });
});