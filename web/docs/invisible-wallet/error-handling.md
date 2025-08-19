# Error Handling Guide

## 🚨 Error Management System

The Invisible Wallets system implements comprehensive error handling to provide clear feedback and graceful degradation when issues occur.

## 📋 Error Types & Codes

### Core Error Enumeration

```typescript
export enum InvisibleWalletError {
  // Wallet Management Errors
  WALLET_ALREADY_EXISTS = 'WALLET_ALREADY_EXISTS',
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Validation Errors
  INVALID_EMAIL = 'INVALID_EMAIL',
  WEAK_PASSPHRASE = 'WEAK_PASSPHRASE',
  INVALID_NETWORK = 'INVALID_NETWORK',
  INVALID_PLATFORM_ID = 'INVALID_PLATFORM_ID',
  
  // Cryptographic Errors
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  KEY_DERIVATION_FAILED = 'KEY_DERIVATION_FAILED',
  KEY_GENERATION_FAILED = 'KEY_GENERATION_FAILED',
  
  // Stellar Network Errors
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  SEQUENCE_NUMBER_MISMATCH = 'SEQUENCE_NUMBER_MISMATCH',
  BAD_AUTH = 'BAD_AUTH',
  TX_FAILED = 'TX_FAILED',
  TX_TIMEOUT = 'TX_TIMEOUT',
  INVALID_TRANSACTION_XDR = 'INVALID_TRANSACTION_XDR',
  
  // Storage Errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  INDEXEDDB_UNAVAILABLE = 'INDEXEDDB_UNAVAILABLE',
  
  // Network & Connectivity Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  HORIZON_TIMEOUT = 'HORIZON_TIMEOUT',
  FUNDING_FAILED = 'FUNDING_FAILED',
  
  // Browser Compatibility Errors
  WEB_CRYPTO_UNAVAILABLE = 'WEB_CRYPTO_UNAVAILABLE',
  UNSUPPORTED_BROWSER = 'UNSUPPORTED_BROWSER',
  HTTPS_REQUIRED = 'HTTPS_REQUIRED',
  
  // Generic Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  OPERATION_CANCELLED = 'OPERATION_CANCELLED',
}
```

## 🛠️ Error Handler Implementation

### Core Error Handler

```typescript
// lib/invisible-wallet/error-handler.ts
export interface ErrorContext {
  operation: string;
  walletId?: string;
  email?: string;
  platformId?: string;
  network?: NetworkType;
  metadata?: Record<string, unknown>;
}

export class InvisibleWalletErrorHandler {
  /**
   * Converts raw errors into standardized InvisibleWallet errors
   */
  static handleError(error: unknown, context: ErrorContext): Error {
    console.error('InvisibleWallet Error:', error, context);
    
    // If it's already an InvisibleWallet error, return as-is
    if (error instanceof Error && this.isInvisibleWalletError(error)) {
      return error;
    }
    
    // Convert known error types
    if (error instanceof Error) {
      const convertedError = this.convertKnownError(error, context);
      if (convertedError) return convertedError;
    }
    
    // Default to unknown error
    return new Error(InvisibleWalletError.UNKNOWN_ERROR);
  }
  
  /**
   * Checks if an error is a specific InvisibleWallet error type
   */
  static isInvisibleWalletError(error: unknown, errorType?: string): boolean {
    if (!(error instanceof Error)) return false;
    
    const errorCode = this.extractErrorCode(error);
    if (!errorCode) return false;
    
    if (errorType) {
      return errorCode === errorType;
    }
    
    return Object.values(InvisibleWalletError).includes(errorCode as InvisibleWalletError);
  }
  
  /**
   * Extracts error code from error message
   */
  static extractErrorCode(error: Error): string | null {
    // Check if error message starts with error code
    for (const code of Object.values(InvisibleWalletError)) {
      if (error.message.startsWith(code)) {
        return code;
      }
    }
    return null;
  }
  
  /**
   * Converts known error patterns to InvisibleWallet errors
   */
  private static convertKnownError(error: Error, context: ErrorContext): Error | null {
    const message = error.message.toLowerCase();
    
    // Web Crypto API errors
    if (message.includes('crypto') || message.includes('subtle')) {
      if (message.includes('secure context') || message.includes('https')) {
        return new Error(InvisibleWalletError.HTTPS_REQUIRED);
      }
      return new Error(InvisibleWalletError.WEB_CRYPTO_UNAVAILABLE);
    }
    
    // IndexedDB errors
    if (message.includes('indexeddb') || message.includes('database')) {
      if (message.includes('quota') || message.includes('storage')) {
        return new Error(InvisibleWalletError.STORAGE_QUOTA_EXCEEDED);
      }
      return new Error(InvisibleWalletError.STORAGE_ERROR);
    }
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      if (message.includes('horizon')) {
        return new Error(InvisibleWalletError.HORIZON_TIMEOUT);
      }
      return new Error(InvisibleWalletError.NETWORK_ERROR);
    }
    
    // Stellar SDK errors
    if (message.includes('account not found')) {
      return new Error(InvisibleWalletError.ACCOUNT_NOT_FOUND);
    }
    
    if (message.includes('insufficient balance')) {
      return new Error(InvisibleWalletError.INSUFFICIENT_BALANCE);
    }
    
    if (message.includes('sequence')) {
      return new Error(InvisibleWalletError.SEQUENCE_NUMBER_MISMATCH);
    }
    
    if (message.includes('bad_auth') || message.includes('authentication')) {
      return new Error(InvisibleWalletError.BAD_AUTH);
    }
    
    // Transaction errors
    if (message.includes('transaction') && message.includes('failed')) {
      return new Error(InvisibleWalletError.TX_FAILED);
    }
    
    return null;
  }
  
  /**
   * Gets user-friendly error message
   */
  static getUserFriendlyMessage(error: unknown): string {
    if (!(error instanceof Error)) {
      return 'An unknown error occurred. Please try again.';
    }
    
    const errorCode = this.extractErrorCode(error);
    if (!errorCode) {
      return error.message || 'An unknown error occurred. Please try again.';
    }
    
    const friendlyMessages: Record<string, string> = {
      [InvisibleWalletError.WALLET_ALREADY_EXISTS]: 
        'A wallet with this email already exists. Try recovering your wallet instead.',
      
      [InvisibleWalletError.WALLET_NOT_FOUND]: 
        'No wallet found with these credentials. Please check your email and passphrase, or create a new wallet.',
      
      [InvisibleWalletError.INVALID_CREDENTIALS]: 
        'Invalid email or passphrase. Please check your credentials and try again.',
      
      [InvisibleWalletError.WEAK_PASSPHRASE]: 
        'Your passphrase is too weak. Please use at least 12 characters with uppercase, lowercase, numbers, and special characters.',
      
      [InvisibleWalletError.INVALID_EMAIL]: 
        'Please enter a valid email address.',
      
      [InvisibleWalletError.WEB_CRYPTO_UNAVAILABLE]: 
        'Your browser doesn\'t support the required security features. Please use a modern browser like Chrome, Firefox, or Safari.',
      
      [InvisibleWalletError.HTTPS_REQUIRED]: 
        'Secure connection (HTTPS) is required for wallet operations. Please access the site using HTTPS.',
      
      [InvisibleWalletError.STORAGE_QUOTA_EXCEEDED]: 
        'Your browser storage is full. Please clear some data or use the cleanup tools.',
      
      [InvisibleWalletError.NETWORK_ERROR]: 
        'Network connection error. Please check your internet connection and try again.',
      
      [InvisibleWalletError.ACCOUNT_NOT_FOUND]: 
        'This account doesn\'t exist on the Stellar network yet. For testnet, it should be funded automatically.',
      
      [InvisibleWalletError.INSUFFICIENT_BALANCE]: 
        'Insufficient balance to complete this transaction.',
      
      [InvisibleWalletError.TX_FAILED]: 
        'Transaction failed to submit to the network. Please try again.',
      
      [InvisibleWalletError.FUNDING_FAILED]: 
        'Failed to fund testnet account. Please try again or fund manually.',
      
      [InvisibleWalletError.UNKNOWN_ERROR]: 
        'An unexpected error occurred. Please try again or contact support if the problem persists.',
    };
    
    return friendlyMessages[errorCode] || error.message;
  }
  
  /**
   * Gets error recovery suggestions
   */
  static getRecoverySuggestions(error: unknown): string[] {
    if (!(error instanceof Error)) return [];
    
    const errorCode = this.extractErrorCode(error);
    if (!errorCode) return [];
    
    const suggestions: Record<string, string[]> = {
      [InvisibleWalletError.WALLET_ALREADY_EXISTS]: [
        'Try recovering your existing wallet instead',
        'Use a different email address',
        'Check if you\'re using the correct platform/network'
      ],
      
      [InvisibleWalletError.WALLET_NOT_FOUND]: [
        'Double-check your email address for typos',
        'Verify you\'re using the correct passphrase',
        'Make sure you\'re on the correct network (testnet/mainnet)',
        'Try the wallet recovery tool'
      ],
      
      [InvisibleWalletError.WEAK_PASSPHRASE]: [
        'Use at least 12 characters',
        'Include uppercase and lowercase letters',
        'Add numbers and special characters',
        'Avoid common words or personal information'
      ],
      
      [InvisibleWalletError.WEB_CRYPTO_UNAVAILABLE]: [
        'Update your browser to the latest version',
        'Try using Chrome, Firefox, or Safari',
        'Disable browser extensions that might interfere',
        'Ensure you\'re using HTTPS'
      ],
      
      [InvisibleWalletError.STORAGE_QUOTA_EXCEEDED]: [
        'Clear browser cache and data',
        'Use the wallet cleanup tools',
        'Remove unused wallets',
        'Free up storage space on your device'
      ],
      
      [InvisibleWalletError.NETWORK_ERROR]: [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again',
        'Check if Stellar network services are operational'
      ],
      
      [InvisibleWalletError.INSUFFICIENT_BALANCE]: [
        'Add funds to your account',
        'Reduce the transaction amount',
        'For testnet, use the friendbot to get free XLM',
        'Check your account balance'
      ]
    };
    
    return suggestions[errorCode] || [
      'Try refreshing the page',
      'Check your internet connection',
      'Contact support if the problem persists'
    ];
  }
}
```

## 🎯 Error Handling in Components

### React Error Boundary

```typescript
// components/error-boundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { InvisibleWalletErrorHandler } from '@/lib/invisible-wallet/error-handler';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WalletErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Wallet Error Boundary caught an error:', error, errorInfo);
    
    // Log to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to error monitoring service
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Implementation depends on your monitoring service
    // Example with Sentry:
    // Sentry.captureException(error, { extra: errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-4">
                {InvisibleWalletErrorHandler.getUserFriendlyMessage(this.state.error)}
              </p>
              
              <div className="text-left mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Try these solutions:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {InvisibleWalletErrorHandler.getRecoverySuggestions(this.state.error).map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Hook-Level Error Handling

```typescript
// hooks/use-error-handler.ts
import { useState, useCallback } from 'react';
import { InvisibleWalletErrorHandler } from '@/lib/invisible-wallet/error-handler';

export interface UseErrorHandlerResult {
  error: string | null;
  isError: boolean;
  handleError: (error: unknown, context?: any) => void;
  clearError: () => void;
  getUserFriendlyMessage: (error: unknown) => string;
  getRecoverySuggestions: (error: unknown) => string[];
}

export function useErrorHandler(): UseErrorHandlerResult {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: unknown, context?: any) => {
    console.error('Handling error:', error, context);
    
    const processedError = InvisibleWalletErrorHandler.handleError(error, context || {});
    const friendlyMessage = InvisibleWalletErrorHandler.getUserFriendlyMessage(processedError);
    
    setError(friendlyMessage);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getUserFriendlyMessage = useCallback((error: unknown) => {
    return InvisibleWalletErrorHandler.getUserFriendlyMessage(error);
  }, []);

  const getRecoverySuggestions = useCallback((error: unknown) => {
    return InvisibleWalletErrorHandler.getRecoverySuggestions(error);
  }, []);

  return {
    error,
    isError: error !== null,
    handleError,
    clearError,
    getUserFriendlyMessage,
    getRecoverySuggestions,
  };
}
```

### Service-Level Error Handling

```typescript
// lib/invisible-wallet/wallet-service.ts (enhanced error handling)
export class InvisibleWalletService {
  // ... existing code

  async createWallet(request: CreateWalletRequest): Promise<WalletResponse> {
    try {
      // Validate request first
      this.validateCreateRequest(request);
      
      // ... existing implementation
      
    } catch (error) {
      const context = {
        operation: 'createWallet',
        email: request.email,
        platformId: request.platformId,
        network: request.network,
      };
      
      const processedError = InvisibleWalletErrorHandler.handleError(error, context);
      
      // Log audit entry for failed operation
      await this.logAuditEntry({
        id: CryptoService.generateSecureId(),
        walletId: '', // No wallet ID for failed creation
        operation: 'create',
        timestamp: new Date().toISOString(),
        platformId: request.platformId,
        ipAddress: 'unknown',
        userAgent: 'unknown',
        success: false,
        errorMessage: processedError.message,
      });
      
      throw processedError;
    }
  }

  private validateCreateRequest(request: CreateWalletRequest): void {
    if (!request.email || !this.isValidEmail(request.email)) {
      throw new Error(InvisibleWalletError.INVALID_EMAIL);
    }
    
    if (!request.passphrase || !this.isStrongPassphrase(request.passphrase)) {
      throw new Error(InvisibleWalletError.WEAK_PASSPHRASE);
    }
    
    if (!request.platformId || request.platformId.length < 1) {
      throw new Error(InvisibleWalletError.INVALID_PLATFORM_ID);
    }
    
    if (!['testnet', 'mainnet'].includes(request.network)) {
      throw new Error(InvisibleWalletError.INVALID_NETWORK);
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  private isStrongPassphrase(passphrase: string): boolean {
    if (passphrase.length < 12) return false;
    
    const hasUpper = /[A-Z]/.test(passphrase);
    const hasLower = /[a-z]/.test(passphrase);
    const hasNumber = /[0-9]/.test(passphrase);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passphrase);
    
    return hasUpper && hasLower && hasNumber && hasSpecial;
  }
}
```

## 🎨 Error Display Components

### Error Alert Component

```typescript
// components/ui/error-alert.tsx
import React from 'react';
import { InvisibleWalletErrorHandler } from '@/lib/invisible-wallet/error-handler';

interface ErrorAlertProps {
  error: unknown;
  onDismiss?: () => void;
  onRetry?: () => void;
  showSuggestions?: boolean;
  className?: string;
}

export function ErrorAlert({ 
  error, 
  onDismiss, 
  onRetry, 
  showSuggestions = true,
  className = ''
}: ErrorAlertProps) {
  if (!error) return null;

  const message = InvisibleWalletErrorHandler.getUserFriendlyMessage(error);
  const suggestions = InvisibleWalletErrorHandler.getRecoverySuggestions(error);
  const isInvisibleWalletError = InvisibleWalletErrorHandler.isInvisibleWalletError(error);

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {isInvisibleWalletError ? 'Wallet Operation Failed' : 'Error'}
          </h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
          
          {showSuggestions && suggestions.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-red-800 mb-2">Try these solutions:</p>
              <ul className="text-sm text-red-700 space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {(onRetry || onDismiss) && (
            <div className="mt-4 flex gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
                >
                  Try Again
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Toast Error Notifications

```typescript
// hooks/use-error-toast.ts
import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { InvisibleWalletErrorHandler } from '@/lib/invisible-wallet/error-handler';

export function useErrorToast() {
  const showError = useCallback((error: unknown, options?: { 
    duration?: number;
    showSuggestions?: boolean;
  }) => {
    const message = InvisibleWalletErrorHandler.getUserFriendlyMessage(error);
    const suggestions = InvisibleWalletErrorHandler.getRecoverySuggestions(error);
    
    if (options?.showSuggestions && suggestions.length > 0) {
      toast.error(
        <div>
          <div className="font-medium mb-1">{message}</div>
          <div className="text-sm opacity-75">
            Try: {suggestions[0]}
          </div>
        </div>,
        {
          duration: options?.duration || 6000,
          style: {
            maxWidth: '400px',
          },
        }
      );
    } else {
      toast.error(message, {
        duration: options?.duration || 4000,
      });
    }
  }, []);

  const showSuccess = useCallback((message: string) => {
    toast.success(message);
  }, []);

  return { showError, showSuccess };
}
```

## 📊 Error Monitoring & Analytics

### Error Tracking

```typescript
// lib/error-tracking.ts
interface ErrorEvent {
  id: string;
  timestamp: string;
  errorCode: string;
  errorMessage: string;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId: string;
  context: Record<string, unknown>;
}

export class ErrorTracker {
  private static sessionId = crypto.randomUUID();
  
  static trackError(error: unknown, context: Record<string, unknown> = {}) {
    if (!(error instanceof Error)) return;
    
    const errorCode = InvisibleWalletErrorHandler.extractErrorCode(error) || 'UNKNOWN';
    
    const errorEvent: ErrorEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      errorCode,
      errorMessage: error.message,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      context,
    };
    
    // Store locally for debugging
    this.storeErrorLocally(errorEvent);
    
    // Send to analytics service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(errorEvent);
    }
    
    console.error('Error tracked:', errorEvent);
  }
  
  private static storeErrorLocally(errorEvent: ErrorEvent) {
    try {
      const errors = JSON.parse(localStorage.getItem('wallet-errors') || '[]');
      errors.push(errorEvent);
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      localStorage.setItem('wallet-errors', JSON.stringify(errors));
    } catch {
      // Ignore storage errors
    }
  }
  
  private static sendToAnalytics(errorEvent: ErrorEvent) {
    // Implementation depends on your analytics service
    fetch('/api/analytics/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorEvent),
    }).catch(() => {
      // Ignore analytics failures
    });
  }
  
  static getLocalErrors(): ErrorEvent[] {
    try {
      return JSON.parse(localStorage.getItem('wallet-errors') || '[]');
    } catch {
      return [];
    }
  }
  
  static clearLocalErrors() {
    localStorage.removeItem('wallet-errors');
  }
}
```

## 🧪 Testing Error Scenarios

### Error Simulation for Testing

```typescript
// lib/error-simulator.ts (for development/testing only)
export class ErrorSimulator {
  static simulateNetworkError() {
    throw new Error('Network request failed');
  }
  
  static simulateStorageError() {
    throw new Error('IndexedDB quota exceeded');
  }
  
  static simulateWeakPassphrase() {
    throw new Error(InvisibleWalletError.WEAK_PASSPHRASE);
  }
  
  static simulateWalletExists() {
    throw new Error(InvisibleWalletError.WALLET_ALREADY_EXISTS);
  }
  
  static simulateInsufficientBalance() {
    throw new Error(InvisibleWalletError.INSUFFICIENT_BALANCE);
  }
}

// Usage in development
if (process.env.NODE_ENV === 'development') {
  (window as any).errorSimulator = ErrorSimulator;
}
```

This comprehensive error handling system ensures that users receive clear, actionable feedback when things go wrong, while providing developers with the tools they need to diagnose and fix issues effectively.
