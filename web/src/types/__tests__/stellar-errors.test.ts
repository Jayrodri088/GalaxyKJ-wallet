import {
  StellarErrorCategory,
  STELLAR_ERROR_CODES,
  StellarErrorInfo,
  StellarErrorContext,
  ProcessedStellarError,
  StellarErrorCode,
} from '../stellar-errors';

describe('Stellar Error Types', () => {
  describe('StellarErrorCategory', () => {
    test('should have all expected categories', () => {
      const expectedCategories = [
        'network',
        'validation',
        'authorization',
        'account',
        'transaction',
        'asset',
        'operation',
        'system',
        'keypair'
      ];

      const actualCategories = Object.values(StellarErrorCategory);
      
      expectedCategories.forEach(category => {
        expect(actualCategories).toContain(category);
      });
      
      expect(actualCategories).toHaveLength(expectedCategories.length);
    });
  });

  describe('STELLAR_ERROR_CODES', () => {
    test('should have all network error codes', () => {
      expect(STELLAR_ERROR_CODES.NETWORK_ERROR).toBe('STELLAR_NETWORK_ERROR');
      expect(STELLAR_ERROR_CODES.CONNECTION_TIMEOUT).toBe('STELLAR_CONNECTION_TIMEOUT');
      expect(STELLAR_ERROR_CODES.REQUEST_FAILED).toBe('STELLAR_REQUEST_FAILED');
      expect(STELLAR_ERROR_CODES.SERVER_ERROR).toBe('STELLAR_SERVER_ERROR');
      expect(STELLAR_ERROR_CODES.RATE_LIMITED).toBe('STELLAR_RATE_LIMITED');
    });

    test('should have all validation error codes', () => {
      expect(STELLAR_ERROR_CODES.INVALID_SECRET_KEY).toBe('STELLAR_INVALID_SECRET_KEY');
      expect(STELLAR_ERROR_CODES.INVALID_PUBLIC_KEY).toBe('STELLAR_INVALID_PUBLIC_KEY');
      expect(STELLAR_ERROR_CODES.INVALID_SIGNATURE).toBe('STELLAR_INVALID_SIGNATURE');
      expect(STELLAR_ERROR_CODES.INVALID_MESSAGE_FORMAT).toBe('STELLAR_INVALID_MESSAGE_FORMAT');
      expect(STELLAR_ERROR_CODES.MISSING_REQUIRED_FIELD).toBe('STELLAR_MISSING_REQUIRED_FIELD');
      expect(STELLAR_ERROR_CODES.INVALID_AMOUNT).toBe('STELLAR_INVALID_AMOUNT');
      expect(STELLAR_ERROR_CODES.INVALID_ASSET_CODE).toBe('STELLAR_INVALID_ASSET_CODE');
      expect(STELLAR_ERROR_CODES.INVALID_MEMO).toBe('STELLAR_INVALID_MEMO');
    });

    test('should have all authorization error codes', () => {
      expect(STELLAR_ERROR_CODES.UNAUTHORIZED_OPERATION).toBe('STELLAR_UNAUTHORIZED_OPERATION');
      expect(STELLAR_ERROR_CODES.INSUFFICIENT_PERMISSIONS).toBe('STELLAR_INSUFFICIENT_PERMISSIONS');
      expect(STELLAR_ERROR_CODES.SIGNATURE_VERIFICATION_FAILED).toBe('STELLAR_SIGNATURE_VERIFICATION_FAILED');
    });

    test('should have all account error codes', () => {
      expect(STELLAR_ERROR_CODES.ACCOUNT_NOT_FOUND).toBe('STELLAR_ACCOUNT_NOT_FOUND');
      expect(STELLAR_ERROR_CODES.ACCOUNT_NOT_FUNDED).toBe('STELLAR_ACCOUNT_NOT_FUNDED');
      expect(STELLAR_ERROR_CODES.INSUFFICIENT_BALANCE).toBe('STELLAR_INSUFFICIENT_BALANCE');
      expect(STELLAR_ERROR_CODES.ACCOUNT_MERGE_IMMATURE).toBe('STELLAR_ACCOUNT_MERGE_IMMATURE');
    });

    test('should have all transaction error codes', () => {
      expect(STELLAR_ERROR_CODES.TRANSACTION_FAILED).toBe('STELLAR_TRANSACTION_FAILED');
      expect(STELLAR_ERROR_CODES.TRANSACTION_TOO_EARLY).toBe('STELLAR_TRANSACTION_TOO_EARLY');
      expect(STELLAR_ERROR_CODES.TRANSACTION_TOO_LATE).toBe('STELLAR_TRANSACTION_TOO_LATE');
      expect(STELLAR_ERROR_CODES.TRANSACTION_MALFORMED).toBe('STELLAR_TRANSACTION_MALFORMED');
      expect(STELLAR_ERROR_CODES.BAD_SEQUENCE_NUMBER).toBe('STELLAR_BAD_SEQUENCE_NUMBER');
      expect(STELLAR_ERROR_CODES.INSUFFICIENT_FEE).toBe('STELLAR_INSUFFICIENT_FEE');
    });

    test('should have all system error codes', () => {
      expect(STELLAR_ERROR_CODES.INTERNAL_ERROR).toBe('STELLAR_INTERNAL_ERROR');
      expect(STELLAR_ERROR_CODES.TIMEOUT).toBe('STELLAR_TIMEOUT');
      expect(STELLAR_ERROR_CODES.UNKNOWN_ERROR).toBe('STELLAR_UNKNOWN_ERROR');
    });

    test('should have all keypair error codes', () => {
      expect(STELLAR_ERROR_CODES.KEYPAIR_GENERATION_FAILED).toBe('STELLAR_KEYPAIR_GENERATION_FAILED');
      expect(STELLAR_ERROR_CODES.PRIVATE_KEY_ENCRYPTION_FAILED).toBe('STELLAR_PRIVATE_KEY_ENCRYPTION_FAILED');
      expect(STELLAR_ERROR_CODES.PRIVATE_KEY_DECRYPTION_FAILED).toBe('STELLAR_PRIVATE_KEY_DECRYPTION_FAILED');
    });

    test('should ensure all codes are unique', () => {
      const codes = Object.values(STELLAR_ERROR_CODES);
      const uniqueCodes = new Set(codes);
      
      expect(uniqueCodes.size).toBe(codes.length);
    });

    test('should ensure all codes follow naming convention', () => {
      const codes = Object.values(STELLAR_ERROR_CODES);
      
      codes.forEach(code => {
        expect(code).toMatch(/^STELLAR_[A-Z_]+$/);
      });
    });
  });

  describe('StellarErrorInfo Interface', () => {
    test('should create valid StellarErrorInfo object', () => {
      const errorInfo: StellarErrorInfo = {
        code: STELLAR_ERROR_CODES.INVALID_SECRET_KEY,
        category: StellarErrorCategory.VALIDATION,
        userMessage: 'Invalid private key format',
        technicalMessage: 'Secret key validation failed',
        suggestions: ['Check your private key', 'Verify key format'],
        severity: 'high',
        retryable: false
      };

      expect(errorInfo.code).toBe(STELLAR_ERROR_CODES.INVALID_SECRET_KEY);
      expect(errorInfo.category).toBe(StellarErrorCategory.VALIDATION);
      expect(errorInfo.severity).toBe('high');
      expect(errorInfo.retryable).toBe(false);
      expect(Array.isArray(errorInfo.suggestions)).toBe(true);
      expect(errorInfo.suggestions).toHaveLength(2);
    });

    test('should validate severity levels', () => {
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      
      validSeverities.forEach(severity => {
        const errorInfo: StellarErrorInfo = {
          code: STELLAR_ERROR_CODES.UNKNOWN_ERROR,
          category: StellarErrorCategory.SYSTEM,
          userMessage: 'Test message',
          technicalMessage: 'Test technical message',
          suggestions: [],
          severity: severity as 'low' | 'medium' | 'high' | 'critical',
          retryable: false
        };
        
        expect(errorInfo.severity).toBe(severity);
      });
    });
  });

  describe('StellarErrorContext Interface', () => {
    test('should create valid StellarErrorContext object', () => {
      const context: StellarErrorContext = {
        operation: 'sign_message',
        account: 'GTEST123456789',
        asset: 'XLM',
        amount: '100',
        networkUrl: 'https://horizon-testnet.stellar.org',
        timestamp: Date.now(),
        additionalInfo: {
          messageLength: 256,
          retryCount: 1
        }
      };

      expect(context.operation).toBe('sign_message');
      expect(context.account).toBe('GTEST123456789');
      expect(context.asset).toBe('XLM');
      expect(context.amount).toBe('100');
      expect(typeof context.timestamp).toBe('number');
      expect(context.additionalInfo).toBeDefined();
      expect(context.additionalInfo?.messageLength).toBe(256);
    });

    test('should allow partial context', () => {
      const partialContext: StellarErrorContext = {
        operation: 'test_operation'
      };

      expect(partialContext.operation).toBe('test_operation');
      expect(partialContext.account).toBeUndefined();
      expect(partialContext.asset).toBeUndefined();
    });

    test('should allow empty context', () => {
      const emptyContext: StellarErrorContext = {};

      expect(Object.keys(emptyContext)).toHaveLength(0);
    });
  });

  describe('ProcessedStellarError Interface', () => {
    test('should create valid ProcessedStellarError object', () => {
      const errorInfo: StellarErrorInfo = {
        code: STELLAR_ERROR_CODES.NETWORK_ERROR,
        category: StellarErrorCategory.NETWORK,
        userMessage: 'Network connection failed',
        technicalMessage: 'Unable to connect to Stellar network',
        suggestions: ['Check internet connection'],
        severity: 'high',
        retryable: true
      };

      const context: StellarErrorContext = {
        operation: 'fetch_balance',
        timestamp: Date.now()
      };

      const originalError = new Error('Connection timeout');
      const correlationId = 'stellar-123-abc';

      const processedError: ProcessedStellarError = {
        errorInfo,
        context,
        originalError,
        correlationId
      };

      expect(processedError.errorInfo).toBe(errorInfo);
      expect(processedError.context).toBe(context);
      expect(processedError.originalError).toBe(originalError);
      expect(processedError.correlationId).toBe(correlationId);
    });
  });

  describe('Type Constraints', () => {
    test('StellarErrorCode should be constrained to STELLAR_ERROR_CODES values', () => {
      const validCode: StellarErrorCode = STELLAR_ERROR_CODES.INVALID_SECRET_KEY;
      expect(validCode).toBe('STELLAR_INVALID_SECRET_KEY');

      // TypeScript should prevent invalid codes at compile time
      // const invalidCode: StellarErrorCode = 'INVALID_CODE'; // This would cause a TypeScript error
    });

    test('should ensure type consistency across interfaces', () => {
      const errorInfo: StellarErrorInfo = {
        code: STELLAR_ERROR_CODES.TIMEOUT,
        category: StellarErrorCategory.SYSTEM,
        userMessage: 'Operation timed out',
        technicalMessage: 'Request exceeded timeout threshold',
        suggestions: ['Try again'],
        severity: 'medium',
        retryable: true
      };

      // The code should be assignable to StellarErrorCode type
      const codeVariable: StellarErrorCode = errorInfo.code;
      expect(codeVariable).toBe(STELLAR_ERROR_CODES.TIMEOUT);
    });
  });
});