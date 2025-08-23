/**
 * Sentry Error Tracking Configuration
 * Handles Sentry setup, error tracking, and crash reporting
 */

import * as Sentry from '@sentry/nextjs';
import { ErrorReport, ErrorCategory, Breadcrumb } from '@/types/analytics';
import { sanitizeAnalyticsProperties, generateSessionId } from '../analytics/privacy-utils';

/**
 * Sentry configuration options
 */
const SENTRY_CONFIG = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  debug: process.env.NODE_ENV === 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.0, // Disable session replay for privacy
  replaysOnErrorSampleRate: 0.0, // Disable error replay for privacy
  integrations: [
    // Add integrations as needed
  ],
  beforeSend(event: any, hint: any) {
    // Sanitize sensitive data before sending to Sentry
    if (event.request && event.request.headers) {
      // Remove sensitive headers
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }

    if (event.user) {
      // Anonymize user data
      event.user.id = `user_${event.user.id?.substring(0, 8)}...`;
    }

    // Remove sensitive data from extra fields
    if (event.extra) {
      event.extra = sanitizeAnalyticsProperties(event.extra);
    }

    return event;
  },
  beforeBreadcrumb(breadcrumb: any) {
    // Sanitize breadcrumb data
    if (breadcrumb.data) {
      breadcrumb.data = sanitizeAnalyticsProperties(breadcrumb.data);
    }
    return breadcrumb;
  }
};

/**
 * Initialize Sentry with configuration
 * @param privacySettings - User privacy settings
 * @returns Whether Sentry was initialized successfully
 */
export function initializeSentry(privacySettings: {
  errorReportingEnabled: boolean;
  anonymizeData: boolean;
}): boolean {
  // Check if error reporting should be enabled
  if (!privacySettings.errorReportingEnabled) {
    console.log('Sentry error reporting disabled due to privacy settings');
    return false;
  }

  // Check if Sentry DSN is configured
  if (!SENTRY_CONFIG.dsn) {
    // Only log warning in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry not configured - error tracking disabled');
    }
    return false;
  }

  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    // Initialize Sentry
    Sentry.init(SENTRY_CONFIG);
    console.log('Sentry error tracking initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
    return false;
  }
}

/**
 * Capture an error with Sentry
 * @param error - Error object
 * @param context - Additional context
 * @param severity - Error severity level
 */
export function captureError(
  error: Error,
  context: Record<string, any> = {},
  severity: 'fatal' | 'error' | 'warning' | 'info' = 'error'
): void {
  try {
    // Sanitize context data
    const sanitizedContext = sanitizeAnalyticsProperties(context);
    
    // Add session information
    const enrichedContext = {
      ...sanitizedContext,
      sessionId: generateSessionId(),
      timestamp: Date.now(),
      environment: process.env.NODE_ENV
    };

    // Capture the error
    Sentry.captureException(error, {
      level: severity,
      contexts: {
        app: enrichedContext
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Error captured by Sentry:', error.message, enrichedContext);
    }
  } catch (captureError) {
    console.error('Failed to capture error with Sentry:', captureError);
  }
}

/**
 * Capture a message with Sentry
 * @param message - Message to capture
 * @param level - Message level
 * @param context - Additional context
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context: Record<string, any> = {}
): void {
  try {
    const sanitizedContext = sanitizeAnalyticsProperties(context);
    
    const enrichedContext = {
      ...sanitizedContext,
      sessionId: generateSessionId(),
      timestamp: Date.now(),
      environment: process.env.NODE_ENV
    };

    Sentry.captureMessage(message, {
      level,
      contexts: {
        app: enrichedContext
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Message captured by Sentry:', message, enrichedContext);
    }
  } catch (error) {
    console.error('Failed to capture message with Sentry:', error);
  }
}

/**
 * Add breadcrumb for error tracking
 * @param breadcrumb - Breadcrumb data
 */
export function addBreadcrumb(breadcrumb: Breadcrumb): void {
  try {
    const sanitizedData = breadcrumb.data ? sanitizeAnalyticsProperties(breadcrumb.data) : undefined;
    
    Sentry.addBreadcrumb({
      message: breadcrumb.message,
      level: breadcrumb.level,
      category: breadcrumb.category,
      data: sanitizedData,
      timestamp: breadcrumb.timestamp
    });
  } catch (error) {
    console.error('Failed to add breadcrumb:', error);
  }
}

/**
 * Set user context in Sentry
 * @param userId - User identifier
 * @param properties - User properties
 * @param anonymize - Whether to anonymize user data
 */
export function setUserContext(
  userId: string,
  properties: Record<string, any> = {},
  anonymize: boolean = true
): void {
  try {
    const sanitizedProperties = sanitizeAnalyticsProperties(properties);
    
    const userContext = {
      id: anonymize ? `user_${userId.substring(0, 8)}...` : userId,
      ...sanitizedProperties
    };

    Sentry.setUser(userContext);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry user context set:', userContext);
    }
  } catch (error) {
    console.error('Failed to set Sentry user context:', error);
  }
}

/**
 * Clear user context in Sentry
 */
export function clearUserContext(): void {
  try {
    Sentry.setUser(null);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry user context cleared');
    }
  } catch (error) {
    console.error('Failed to clear Sentry user context:', error);
  }
}

/**
 * Set tags for error tracking
 * @param tags - Tags to set
 */
export function setTags(tags: Record<string, string>): void {
  try {
    Sentry.setTags(tags);
  } catch (error) {
    console.error('Failed to set Sentry tags:', error);
  }
}

/**
 * Set extra context for error tracking
 * @param context - Extra context data
 */
export function setExtraContext(context: Record<string, any>): void {
  try {
    const sanitizedContext = sanitizeAnalyticsProperties(context);
    Sentry.setContext('extra', sanitizedContext);
  } catch (error) {
    console.error('Failed to set Sentry extra context:', error);
  }
}

/**
 * Create a Sentry transaction for performance monitoring
 * @param name - Transaction name
 * @param operation - Operation type
 * @returns Sentry transaction
 */
export function startTransaction(name: string, operation: string): any {
  try {
    // startTransaction is not available in current Sentry version
    console.warn('startTransaction not available in current Sentry version');
    return null;
  } catch (error) {
    console.error('Failed to start Sentry transaction:', error);
    return null;
  }
}

/**
 * Capture a performance measurement
 * @param name - Measurement name
 * @param value - Measurement value
 * @param unit - Measurement unit
 */
export function capturePerformanceMeasurement(
  name: string,
  value: number,
  unit: string = 'millisecond'
): void {
  try {
    // metrics API is not available in current Sentry version
    // Only log warning in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry metrics API not available in current version');
    }
  } catch (error) {
    console.error('Failed to capture performance measurement:', error);
  }
}

/**
 * Capture a counter measurement
 * @param name - Counter name
 * @param value - Counter value
 */
export function captureCounterMeasurement(name: string, value: number = 1): void {
  try {
    // metrics API is not available in current Sentry version
    // Only log warning in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry metrics API not available in current version');
    }
  } catch (error) {
    console.error('Failed to capture counter measurement:', error);
  }
}

/**
 * Categorize error for better tracking
 * @param error - Error object
 * @returns Error category
 */
export function categorizeError(error: Error): ErrorCategory {
  const errorMessage = error.message.toLowerCase();
  const errorStack = error.stack?.toLowerCase() || '';

  if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('http')) {
    return ErrorCategory.NETWORK;
  }

  if (errorMessage.includes('stellar') || errorMessage.includes('blockchain') || errorMessage.includes('transaction')) {
    return ErrorCategory.STELLAR;
  }

  if (errorMessage.includes('auth') || errorMessage.includes('login') || errorMessage.includes('permission')) {
    return ErrorCategory.AUTHENTICATION;
  }

  if (errorMessage.includes('offline') || errorMessage.includes('sync')) {
    return ErrorCategory.OFFLINE;
  }

  if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return ErrorCategory.VALIDATION;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Create a comprehensive error report
 * @param error - Error object
 * @param context - Additional context
 * @returns Error report object
 */
export function createErrorReport(
  error: Error,
  context: Record<string, any> = {}
): ErrorReport {
  const category = categorizeError(error);
  const severity = determineErrorSeverity(error, category);

  return {
    error,
    context: {
      userId: context.userId,
      sessionId: generateSessionId(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      timestamp: Date.now(),
      componentStack: context.componentStack
    },
    breadcrumbs: [],
    severity
  };
}

/**
 * Determine error severity based on error type and category
 * @param error - Error object
 * @param category - Error category
 * @returns Error severity
 */
function determineErrorSeverity(error: Error, category: ErrorCategory): 'low' | 'medium' | 'high' | 'critical' {
  // Critical errors
  if (error.message.includes('out of memory') || error.message.includes('stack overflow')) {
    return 'critical';
  }

  // High severity errors
  if (category === ErrorCategory.AUTHENTICATION || category === ErrorCategory.STELLAR) {
    return 'high';
  }

  // Medium severity errors
  if (category === ErrorCategory.NETWORK || category === ErrorCategory.VALIDATION) {
    return 'medium';
  }

  // Low severity errors
  return 'low';
}

/**
 * Get Sentry configuration for debugging
 * @returns Current Sentry configuration
 */
export function getSentryConfig(): Record<string, any> {
  return {
    dsn: SENTRY_CONFIG.dsn ? 'configured' : 'not configured',
    environment: SENTRY_CONFIG.environment,
    debug: SENTRY_CONFIG.debug,
    tracesSampleRate: SENTRY_CONFIG.tracesSampleRate,
    replaysSessionSampleRate: SENTRY_CONFIG.replaysSessionSampleRate,
    replaysOnErrorSampleRate: SENTRY_CONFIG.replaysOnErrorSampleRate
  };
}

/**
 * Check if Sentry is initialized
 * @returns Whether Sentry is initialized
 */
export function isSentryInitialized(): boolean {
  return typeof Sentry !== 'undefined' && Sentry.getCurrentHub().getClient() !== undefined;
}
