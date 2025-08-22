/**
 * Error Tracking Hook for React Components
 * Provides error tracking functionality to React components
 */

import { useCallback, useEffect } from 'react';
import { captureError, addBreadcrumb, setUserContext, clearUserContext } from '@/lib/monitoring/error-tracker';
import { reportReactError, captureCrash } from '@/lib/monitoring/crash-reporter';
import { trackAnalyticsError } from '@/lib/analytics';

/**
 * Error tracking hook for React components
 * @returns Error tracking functions
 */
export function useErrorTracking() {
  /**
   * Capture an error
   */
  const captureErrorEvent = useCallback((error: Error, context?: Record<string, any>, severity?: 'fatal' | 'error' | 'warning' | 'info') => {
    try {
      // Capture with Sentry
      captureError(error, context, severity);
      
      // Track with analytics
      trackAnalyticsError(error, context);
      
      console.error('Error captured:', error, context);
    } catch (captureError) {
      console.error('Failed to capture error:', captureError);
    }
  }, []);

  /**
   * Add breadcrumb for error tracking
   */
  const addErrorBreadcrumb = useCallback((message: string, data?: Record<string, any>, level?: 'info' | 'warning' | 'error') => {
    try {
      addBreadcrumb({
        message,
        level: level || 'info',
        category: 'user',
        timestamp: Date.now(),
        data
      });
    } catch (error) {
      console.error('Failed to add breadcrumb:', error);
    }
  }, []);

  /**
   * Set user context for error tracking
   */
  const setErrorUserContext = useCallback((userId: string, properties?: Record<string, any>, anonymize?: boolean) => {
    try {
      setUserContext(userId, properties, anonymize);
    } catch (error) {
      console.error('Failed to set user context:', error);
    }
  }, []);

  /**
   * Clear user context for error tracking
   */
  const clearErrorUserContext = useCallback(() => {
    try {
      clearUserContext();
    } catch (error) {
      console.error('Failed to clear user context:', error);
    }
  }, []);

  /**
   * Report React error from error boundary
   */
  const reportReactErrorEvent = useCallback((error: Error, errorInfo: { componentStack: string }) => {
    try {
      reportReactError(error, errorInfo);
    } catch (reportError) {
      console.error('Failed to report React error:', reportError);
    }
  }, []);

  /**
   * Capture a crash
   */
  const captureCrashEvent = useCallback((error: Error, context?: Record<string, any>, severity?: 'low' | 'medium' | 'high' | 'critical') => {
    try {
      captureCrash(error, context, severity);
    } catch (crashError) {
      console.error('Failed to capture crash:', crashError);
    }
  }, []);

  /**
   * Handle async errors
   */
  const handleAsyncError = useCallback((error: Error, context?: Record<string, any>) => {
    try {
      captureErrorEvent(error, { ...context, type: 'async_error' });
    } catch (handleError) {
      console.error('Failed to handle async error:', handleError);
    }
  }, [captureErrorEvent]);

  /**
   * Wrap async function with error handling
   */
  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: Record<string, any>
  ) => {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error) {
        handleAsyncError(error as Error, context);
        throw error;
      }
    };
  }, [handleAsyncError]);

  /**
   * Track user actions for error context
   */
  const trackUserAction = useCallback((action: string, data?: Record<string, any>) => {
    addErrorBreadcrumb(`User action: ${action}`, data, 'info');
  }, [addErrorBreadcrumb]);

  /**
   * Track navigation for error context
   */
  const trackNavigation = useCallback((from: string, to: string) => {
    addErrorBreadcrumb('Navigation', { from, to }, 'info');
  }, [addErrorBreadcrumb]);

  /**
   * Track API calls for error context
   */
  const trackApiCall = useCallback((method: string, url: string, status?: number) => {
    addErrorBreadcrumb('API call', { method, url, status }, 'info');
  }, [addErrorBreadcrumb]);

  /**
   * Track Stellar operations for error context
   */
  const trackStellarOperation = useCallback((operation: string, success: boolean, errorMessage?: string) => {
    addErrorBreadcrumb('Stellar operation', { operation, success, errorMessage }, success ? 'info' : 'error');
  }, [addErrorBreadcrumb]);

  /**
   * Track offline operations for error context
   */
  const trackOfflineOperation = useCallback((operation: string, success: boolean, errorMessage?: string) => {
    addErrorBreadcrumb('Offline operation', { operation, success, errorMessage }, success ? 'info' : 'error');
  }, [addErrorBreadcrumb]);

  // Set up global error handlers
  useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      const error = event.error || new Error(event.message);
      captureErrorEvent(error, {
        type: 'unhandled_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      captureErrorEvent(error, {
        type: 'unhandled_rejection',
        promise: event.promise
      });
    };

    // Add global error handlers
    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [captureErrorEvent]);

  return {
    // Core error tracking functions
    captureError: captureErrorEvent,
    addBreadcrumb: addErrorBreadcrumb,
    setUserContext: setErrorUserContext,
    clearUserContext: clearErrorUserContext,
    
    // React-specific error tracking
    reportReactError: reportReactErrorEvent,
    captureCrash: captureCrashEvent,
    
    // Async error handling
    handleAsyncError,
    withErrorHandling,
    
    // Context tracking functions
    trackUserAction,
    trackNavigation,
    trackApiCall,
    trackStellarOperation,
    trackOfflineOperation
  };
}
