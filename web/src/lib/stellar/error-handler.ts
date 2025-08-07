import {
  StellarErrorCategory,
  StellarErrorInfo,
  StellarErrorContext,
  ProcessedStellarError,
  STELLAR_ERROR_CODES,
  type StellarErrorCode,
} from '@/types/stellar-errors';

class StellarErrorHandler {
  private errorMap: Map<string, StellarErrorInfo>;

  constructor() {
    this.errorMap = new Map();
    this.initializeErrorMap();
  }

  private initializeErrorMap(): void {
    const errorDefinitions: Array<[string, StellarErrorInfo]> = [
      // Network Errors
      [STELLAR_ERROR_CODES.NETWORK_ERROR, {
        code: STELLAR_ERROR_CODES.NETWORK_ERROR,
        category: StellarErrorCategory.NETWORK,
        userMessage: 'Unable to connect to the Stellar network. Please check your internet connection.',
        technicalMessage: 'Network request failed or connection was refused',
        suggestions: [
          'Check your internet connection',
          'Try again in a few moments',
          'Verify the Stellar network status',
          'Contact support if the issue persists'
        ],
        severity: 'high',
        retryable: true
      }],

      [STELLAR_ERROR_CODES.CONNECTION_TIMEOUT, {
        code: STELLAR_ERROR_CODES.CONNECTION_TIMEOUT,
        category: StellarErrorCategory.NETWORK,
        userMessage: 'Request timed out. The Stellar network may be experiencing delays.',
        technicalMessage: 'Network request exceeded timeout threshold',
        suggestions: [
          'Wait a moment and try again',
          'Check network stability',
          'Consider using a different Stellar horizon server'
        ],
        severity: 'medium',
        retryable: true
      }],

      [STELLAR_ERROR_CODES.RATE_LIMITED, {
        code: STELLAR_ERROR_CODES.RATE_LIMITED,
        category: StellarErrorCategory.NETWORK,
        userMessage: 'Too many requests. Please wait before trying again.',
        technicalMessage: 'Rate limit exceeded for API requests',
        suggestions: [
          'Wait 60 seconds before retrying',
          'Reduce the frequency of requests',
          'Consider upgrading to a premium Stellar service'
        ],
        severity: 'medium',
        retryable: true
      }],

      // Validation Errors
      [STELLAR_ERROR_CODES.INVALID_SECRET_KEY, {
        code: STELLAR_ERROR_CODES.INVALID_SECRET_KEY,
        category: StellarErrorCategory.VALIDATION,
        userMessage: 'Invalid private key format. Please check your private key and try again.',
        technicalMessage: 'Secret key does not match Stellar Ed25519 format or checksum validation failed',
        suggestions: [
          'Verify your private key starts with "S" and is 56 characters long',
          'Check for any typing errors or missing characters',
          'Ensure you\'re using a Stellar secret key, not another cryptocurrency\'s key',
          'Generate a new keypair if the key is corrupted'
        ],
        severity: 'high',
        retryable: false
      }],

      [STELLAR_ERROR_CODES.INVALID_PUBLIC_KEY, {
        code: STELLAR_ERROR_CODES.INVALID_PUBLIC_KEY,
        category: StellarErrorCategory.VALIDATION,
        userMessage: 'Invalid public key format. Please verify the account address.',
        technicalMessage: 'Public key does not match Stellar Ed25519 format or checksum validation failed',
        suggestions: [
          'Verify the public key starts with "G" and is 56 characters long',
          'Check for any typing errors or missing characters',
          'Ensure you\'re using a Stellar public key'
        ],
        severity: 'high',
        retryable: false
      }],

      [STELLAR_ERROR_CODES.INVALID_SIGNATURE, {
        code: STELLAR_ERROR_CODES.INVALID_SIGNATURE,
        category: StellarErrorCategory.VALIDATION,
        userMessage: 'Invalid signature format or verification failed.',
        technicalMessage: 'Signature verification failed or signature format is incorrect',
        suggestions: [
          'Verify the signature was created with the correct private key',
          'Check that the message hasn\'t been modified',
          'Ensure the signature is in the correct format (base64)',
          'Re-sign the message if necessary'
        ],
        severity: 'high',
        retryable: false
      }],

      [STELLAR_ERROR_CODES.INVALID_MESSAGE_FORMAT, {
        code: STELLAR_ERROR_CODES.INVALID_MESSAGE_FORMAT,
        category: StellarErrorCategory.VALIDATION,
        userMessage: 'Message format is invalid or contains unsupported characters.',
        technicalMessage: 'Message does not meet format requirements or contains invalid encoding',
        suggestions: [
          'Check that the message contains valid UTF-8 characters',
          'Ensure the message is not empty',
          'Remove any special characters that might cause issues'
        ],
        severity: 'medium',
        retryable: false
      }],

      [STELLAR_ERROR_CODES.MISSING_REQUIRED_FIELD, {
        code: STELLAR_ERROR_CODES.MISSING_REQUIRED_FIELD,
        category: StellarErrorCategory.VALIDATION,
        userMessage: 'Required information is missing. Please fill in all required fields.',
        technicalMessage: 'One or more required fields are empty or null',
        suggestions: [
          'Check that all required fields are filled',
          'Verify that no fields contain only whitespace',
          'Review the form for any validation errors'
        ],
        severity: 'medium',
        retryable: false
      }],

      // Authorization Errors
      [STELLAR_ERROR_CODES.UNAUTHORIZED_OPERATION, {
        code: STELLAR_ERROR_CODES.UNAUTHORIZED_OPERATION,
        category: StellarErrorCategory.AUTHORIZATION,
        userMessage: 'You are not authorized to perform this operation.',
        technicalMessage: 'Account lacks necessary authorization or permissions',
        suggestions: [
          'Verify you have the correct private key for this account',
          'Check that the account has the required permissions',
          'Ensure the account is properly configured for this operation'
        ],
        severity: 'high',
        retryable: false
      }],

      [STELLAR_ERROR_CODES.SIGNATURE_VERIFICATION_FAILED, {
        code: STELLAR_ERROR_CODES.SIGNATURE_VERIFICATION_FAILED,
        category: StellarErrorCategory.AUTHORIZATION,
        userMessage: 'Signature verification failed. The signature may be invalid or tampered with.',
        technicalMessage: 'Cryptographic signature verification failed',
        suggestions: [
          'Verify the signature was created by the expected private key',
          'Check that the message hasn\'t been modified after signing',
          'Ensure the public key matches the private key used for signing',
          'Re-sign the message with the correct private key'
        ],
        severity: 'critical',
        retryable: false
      }],

      // Account Errors
      [STELLAR_ERROR_CODES.ACCOUNT_NOT_FOUND, {
        code: STELLAR_ERROR_CODES.ACCOUNT_NOT_FOUND,
        category: StellarErrorCategory.ACCOUNT,
        userMessage: 'Account not found on the Stellar network.',
        technicalMessage: 'Account does not exist or has not been activated',
        suggestions: [
          'Verify the account address is correct',
          'Check that the account has been activated with a minimum balance',
          'Fund the account with at least 1 XLM to activate it'
        ],
        severity: 'high',
        retryable: true
      }],

      [STELLAR_ERROR_CODES.INSUFFICIENT_BALANCE, {
        code: STELLAR_ERROR_CODES.INSUFFICIENT_BALANCE,
        category: StellarErrorCategory.ACCOUNT,
        userMessage: 'Insufficient balance to complete this operation.',
        technicalMessage: 'Account balance is below the required amount for the operation',
        suggestions: [
          'Add more funds to your account',
          'Reduce the transaction amount',
          'Check that you have enough XLM for network fees'
        ],
        severity: 'high',
        retryable: false
      }],

      // Transaction Errors
      [STELLAR_ERROR_CODES.TRANSACTION_FAILED, {
        code: STELLAR_ERROR_CODES.TRANSACTION_FAILED,
        category: StellarErrorCategory.TRANSACTION,
        userMessage: 'Transaction failed to process on the Stellar network.',
        technicalMessage: 'Transaction was rejected by the network',
        suggestions: [
          'Check transaction details for errors',
          'Verify account balances and permissions',
          'Try submitting the transaction again',
          'Review network fees and sequence numbers'
        ],
        severity: 'high',
        retryable: true
      }],

      [STELLAR_ERROR_CODES.INSUFFICIENT_FEE, {
        code: STELLAR_ERROR_CODES.INSUFFICIENT_FEE,
        category: StellarErrorCategory.TRANSACTION,
        userMessage: 'Transaction fee is too low for current network conditions.',
        technicalMessage: 'Network fee is below the minimum required amount',
        suggestions: [
          'Increase the transaction fee',
          'Wait for network congestion to decrease',
          'Use the recommended fee from the network'
        ],
        severity: 'medium',
        retryable: true
      }],

      // System Errors
      [STELLAR_ERROR_CODES.INTERNAL_ERROR, {
        code: STELLAR_ERROR_CODES.INTERNAL_ERROR,
        category: StellarErrorCategory.SYSTEM,
        userMessage: 'An internal error occurred. Please try again later.',
        technicalMessage: 'Unexpected internal system error',
        suggestions: [
          'Try the operation again',
          'Refresh the page and retry',
          'Contact support if the issue persists'
        ],
        severity: 'high',
        retryable: true
      }],

      [STELLAR_ERROR_CODES.TIMEOUT, {
        code: STELLAR_ERROR_CODES.TIMEOUT,
        category: StellarErrorCategory.SYSTEM,
        userMessage: 'Operation timed out. Please try again.',
        technicalMessage: 'Operation exceeded maximum execution time',
        suggestions: [
          'Try the operation again',
          'Check your network connection',
          'Wait a moment before retrying'
        ],
        severity: 'medium',
        retryable: true
      }],

      [STELLAR_ERROR_CODES.UNKNOWN_ERROR, {
        code: STELLAR_ERROR_CODES.UNKNOWN_ERROR,
        category: StellarErrorCategory.SYSTEM,
        userMessage: 'An unexpected error occurred. Please try again or contact support.',
        technicalMessage: 'Unhandled error condition',
        suggestions: [
          'Try the operation again',
          'Check all input parameters',
          'Contact support with error details'
        ],
        severity: 'medium',
        retryable: true
      }],

      // Keypair Errors
      [STELLAR_ERROR_CODES.KEYPAIR_GENERATION_FAILED, {
        code: STELLAR_ERROR_CODES.KEYPAIR_GENERATION_FAILED,
        category: StellarErrorCategory.KEYPAIR,
        userMessage: 'Failed to generate new keypair. Please try again.',
        technicalMessage: 'Cryptographic keypair generation process failed',
        suggestions: [
          'Try generating a new keypair',
          'Ensure your browser supports cryptographic operations',
          'Refresh the page and try again'
        ],
        severity: 'high',
        retryable: true
      }],
    ];

    errorDefinitions.forEach(([pattern, info]) => {
      this.errorMap.set(pattern, info);
    });
  }

  public processError(
    error: Error,
    context: StellarErrorContext = {}
  ): ProcessedStellarError {
    const correlationId = this.generateCorrelationId();
    const errorInfo = this.identifyError(error);
    
    this.logError(error, errorInfo, context, correlationId);
    
    return {
      errorInfo,
      context: {
        ...context,
        timestamp: Date.now()
      },
      originalError: error,
      correlationId
    };
  }

  private identifyError(error: Error): StellarErrorInfo {
    const errorMessage = error.message.toLowerCase();
    
    // Check for specific Stellar SDK errors
    if (errorMessage.includes('invalid seed') || errorMessage.includes('invalid secret key')) {
      return this.errorMap.get(STELLAR_ERROR_CODES.INVALID_SECRET_KEY)!;
    }
    
    if (errorMessage.includes('invalid public key') || errorMessage.includes('invalid account')) {
      return this.errorMap.get(STELLAR_ERROR_CODES.INVALID_PUBLIC_KEY)!;
    }
    
    if (errorMessage.includes('signature verification failed') || errorMessage.includes('invalid signature')) {
      return this.errorMap.get(STELLAR_ERROR_CODES.SIGNATURE_VERIFICATION_FAILED)!;
    }
    
    // Check account-specific errors before network errors (since they might contain "network" keyword)
    if (errorMessage.includes('account not found') || errorMessage.includes('account does not exist')) {
      return this.errorMap.get(STELLAR_ERROR_CODES.ACCOUNT_NOT_FOUND)!;
    }
    
    if (errorMessage.includes('insufficient balance') || errorMessage.includes('underfunded')) {
      return this.errorMap.get(STELLAR_ERROR_CODES.INSUFFICIENT_BALANCE)!;
    }
    
    // Network errors (check after account errors to avoid conflicts)
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      if (errorMessage.includes('timeout')) {
        return this.errorMap.get(STELLAR_ERROR_CODES.CONNECTION_TIMEOUT)!;
      }
      return this.errorMap.get(STELLAR_ERROR_CODES.NETWORK_ERROR)!;
    }
    
    if (errorMessage.includes('transaction failed') || errorMessage.includes('tx failed')) {
      return this.errorMap.get(STELLAR_ERROR_CODES.TRANSACTION_FAILED)!;
    }
    
    if (errorMessage.includes('fee') && errorMessage.includes('low')) {
      return this.errorMap.get(STELLAR_ERROR_CODES.INSUFFICIENT_FEE)!;
    }
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return this.errorMap.get(STELLAR_ERROR_CODES.RATE_LIMITED)!;
    }
    
    if (errorMessage.includes('timeout')) {
      return this.errorMap.get(STELLAR_ERROR_CODES.TIMEOUT)!;
    }
    
    if (errorMessage.includes('required') && (errorMessage.includes('missing') || errorMessage.includes('empty'))) {
      return this.errorMap.get(STELLAR_ERROR_CODES.MISSING_REQUIRED_FIELD)!;
    }
    
    // Default to unknown error
    return this.errorMap.get(STELLAR_ERROR_CODES.UNKNOWN_ERROR)!;
  }

  private logError(
    error: Error,
    errorInfo: StellarErrorInfo,
    context: StellarErrorContext,
    correlationId: string
  ): void {
    const logData = {
      correlationId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        code: errorInfo.code,
        category: errorInfo.category,
        severity: errorInfo.severity,
        retryable: errorInfo.retryable
      },
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };

    // Log based on severity
    if (errorInfo.severity === 'critical' || errorInfo.severity === 'high') {
      console.error('Stellar Error [High/Critical]:', logData);
    } else if (errorInfo.severity === 'medium') {
      console.warn('Stellar Error [Medium]:', logData);
    } else {
      console.info('Stellar Error [Low]:', logData);
    }
  }

  private generateCorrelationId(): string {
    return `stellar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public getErrorByCode(code: StellarErrorCode): StellarErrorInfo | undefined {
    return this.errorMap.get(code);
  }

  public getErrorCategories(): StellarErrorCategory[] {
    return Object.values(StellarErrorCategory);
  }

  public isRetryableError(error: ProcessedStellarError): boolean {
    return error.errorInfo.retryable;
  }

  public shouldRetryAfterDelay(error: ProcessedStellarError): { shouldRetry: boolean; delayMs?: number } {
    if (!error.errorInfo.retryable) {
      return { shouldRetry: false };
    }

    switch (error.errorInfo.code) {
      case STELLAR_ERROR_CODES.RATE_LIMITED:
        return { shouldRetry: true, delayMs: 60000 }; // 60 seconds
      case STELLAR_ERROR_CODES.CONNECTION_TIMEOUT:
      case STELLAR_ERROR_CODES.NETWORK_ERROR:
        return { shouldRetry: true, delayMs: 5000 }; // 5 seconds
      case STELLAR_ERROR_CODES.TIMEOUT:
        return { shouldRetry: true, delayMs: 3000 }; // 3 seconds
      default:
        return { shouldRetry: true, delayMs: 1000 }; // 1 second
    }
  }
}

export const stellarErrorHandler = new StellarErrorHandler();

export const processStellarError = (
  error: Error,
  context?: StellarErrorContext
): ProcessedStellarError => {
  return stellarErrorHandler.processError(error, context);
};

export const getStellarErrorMessage = (error: Error, context?: StellarErrorContext): string => {
  const processed = processStellarError(error, context);
  return processed.errorInfo.userMessage;
};

export const getStellarErrorSuggestions = (error: Error, context?: StellarErrorContext): string[] => {
  const processed = processStellarError(error, context);
  return processed.errorInfo.suggestions;
};

export const isStellarErrorRetryable = (error: Error, context?: StellarErrorContext): boolean => {
  const processed = processStellarError(error, context);
  return processed.errorInfo.retryable;
};