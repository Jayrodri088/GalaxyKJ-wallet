/**
 * Crash Detection and Reporting
 * Handles unhandled exceptions, promise rejections, and crash reporting
 */

import { ErrorReport, ErrorCategory } from '@/types/analytics';
import { captureError, addBreadcrumb, createErrorReport } from './error-tracker';
import { trackAnalyticsError } from '../analytics';

/**
 * Crash reporter configuration
 */
const CRASH_REPORTER_CONFIG = {
  enabled: true,
  captureUnhandledErrors: true,
  captureUnhandledRejections: true,
  captureResourceErrors: true,
  maxBreadcrumbs: 50,
  reportToAnalytics: true,
  reportToSentry: true
};

/**
 * Initialize crash reporter
 * @param privacySettings - User privacy settings
 */
export function initializeCrashReporter(privacySettings: {
  errorReportingEnabled: boolean;
  anonymizeData: boolean;
}): void {
  if (!privacySettings.errorReportingEnabled) {
    console.log('Crash reporter disabled due to privacy settings');
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Set up unhandled error capture
    if (CRASH_REPORTER_CONFIG.captureUnhandledErrors) {
      setupUnhandledErrorCapture();
    }

    // Set up unhandled promise rejection capture
    if (CRASH_REPORTER_CONFIG.captureUnhandledRejections) {
      setupUnhandledRejectionCapture();
    }

    // Set up resource error capture
    if (CRASH_REPORTER_CONFIG.captureResourceErrors) {
      setupResourceErrorCapture();
    }

    console.log('Crash reporter initialized successfully');
  } catch (error) {
    console.error('Failed to initialize crash reporter:', error);
  }
}

/**
 * Set up unhandled error capture
 */
function setupUnhandledErrorCapture(): void {
  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message);
    const errorReport = createErrorReport(error, {
      type: 'unhandled_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      url: event.filename
    });

    reportCrash(errorReport);
  });
}

/**
 * Set up unhandled promise rejection capture
 */
function setupUnhandledRejectionCapture(): void {
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    const errorReport = createErrorReport(error, {
      type: 'unhandled_rejection',
      promise: event.promise
    });

    reportCrash(errorReport);
  });
}

/**
 * Set up resource error capture
 */
function setupResourceErrorCapture(): void {
  window.addEventListener('error', (event) => {
    // Check if it's a resource loading error
    if (event.target && event.target !== window) {
      const target = event.target as HTMLElement;
      const src = (target as HTMLImageElement).src || (target as HTMLAnchorElement).href || '';
      const error = new Error(`Resource loading failed: ${target.tagName} ${src}`);
      
      const errorReport = createErrorReport(error, {
        type: 'resource_error',
        tagName: target.tagName,
        src: src,
        url: window.location.href
      });

      reportCrash(errorReport);
    }
  }, true); // Use capture phase
}

/**
 * Report a crash
 * @param errorReport - Error report object
 */
function reportCrash(errorReport: ErrorReport): void {
  try {
    // Validate error report
    if (!errorReport || !errorReport.error) {
      console.warn('Invalid error report received:', errorReport);
      return;
    }

    // Add breadcrumb for crash
    addBreadcrumb({
      message: `Crash detected: ${errorReport.error.message || 'Unknown error'}`,
      level: 'error',
      category: 'ui',
      timestamp: Date.now(),
      data: {
        errorType: errorReport.error.name || 'Unknown',
        errorMessage: errorReport.error.message || 'Unknown error',
        severity: errorReport.severity || 'medium'
      }
    });

    // Report to analytics
    if (CRASH_REPORTER_CONFIG.reportToAnalytics) {
      trackAnalyticsError(errorReport.error, {
        type: 'crash',
        severity: errorReport.severity || 'medium',
        category: categorizeError(errorReport.error),
        ...errorReport.context
      });
    }

    // Report to Sentry
    if (CRASH_REPORTER_CONFIG.reportToSentry) {
      const severity = mapSeverityToSentry(errorReport.severity || 'medium');
      captureError(errorReport.error, errorReport.context || {}, severity);
    }

    // Log crash in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Crash detected:', {
        error: errorReport.error.message,
        type: errorReport.error.name,
        severity: errorReport.severity,
        context: errorReport.context
      });
    }
  } catch (reportingError) {
    console.error('Failed to report crash:', reportingError);
  }
}

/**
 * Categorize error for better tracking
 * @param error - Error object
 * @returns Error category
 */
function categorizeError(error: Error): ErrorCategory {
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
 * Map internal severity to Sentry severity
 * @param severity - Internal severity level
 * @returns Sentry severity level
 */
function mapSeverityToSentry(severity: 'low' | 'medium' | 'high' | 'critical'): 'fatal' | 'error' | 'warning' | 'info' {
  switch (severity) {
    case 'critical':
      return 'fatal';
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'error';
  }
}

/**
 * Capture a crash manually
 * @param error - Error object
 * @param context - Additional context
 * @param severity - Error severity
 */
export function captureCrash(
  error: Error,
  context: Record<string, any> = {},
  severity: 'low' | 'medium' | 'high' | 'critical' = 'high'
): void {
  const errorReport = createErrorReport(error, {
    type: 'manual_crash',
    ...context
  });

  errorReport.severity = severity;
  reportCrash(errorReport);
}

/**
 * Add crash breadcrumb
 * @param message - Breadcrumb message
 * @param data - Additional data
 */
export function addCrashBreadcrumb(message: string, data?: Record<string, any>): void {
  addBreadcrumb({
    message,
    level: 'info',
    category: 'ui',
    timestamp: Date.now(),
    data
  });
}

/**
 * Set up React error boundary crash reporting
 * @param error - Error from React error boundary
 * @param errorInfo - React error info
 */
export function reportReactError(error: Error, errorInfo: { componentStack: string }): void {
  const errorReport = createErrorReport(error, {
    type: 'react_error_boundary',
    componentStack: errorInfo.componentStack
  });

  reportCrash(errorReport);
}

/**
 * Set up global error handler for async operations
 * @param error - Error object
 * @param context - Additional context
 */
export function handleAsyncError(error: Error, context: Record<string, any> = {}): void {
  const errorReport = createErrorReport(error, {
    type: 'async_error',
    ...context
  });

  reportCrash(errorReport);
}

/**
 * Monitor for memory leaks and performance issues
 */
export function setupPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;

  // Monitor for memory leaks
  let lastMemoryUsage = 0;
  const memoryThreshold = 10 * 1024 * 1024; // 10MB increase threshold

  setInterval(() => {
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      const currentMemoryUsage = memoryInfo.usedJSHeapSize;
      
      if (lastMemoryUsage > 0) {
        const memoryIncrease = currentMemoryUsage - lastMemoryUsage;
        
        if (memoryIncrease > memoryThreshold) {
          const error = new Error(`Potential memory leak detected: ${memoryIncrease / (1024 * 1024)}MB increase`);
          captureCrash(error, {
            type: 'memory_leak',
            memoryIncrease: memoryIncrease / (1024 * 1024),
            currentMemory: currentMemoryUsage / (1024 * 1024)
          }, 'medium');
        }
      }
      
      lastMemoryUsage = currentMemoryUsage;
    }
  }, 60000); // Check every minute

  // Monitor for long-running tasks
  let longTaskCount = 0;
  const longTaskThreshold = 50; // 50ms threshold

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > longTaskThreshold) {
        longTaskCount++;
        
        if (longTaskCount > 5) { // Alert after 5 long tasks
          const error = new Error(`Multiple long-running tasks detected: ${longTaskCount} tasks over ${longTaskThreshold}ms`);
          captureCrash(error, {
            type: 'long_running_tasks',
            taskCount: longTaskCount,
            threshold: longTaskThreshold
          }, 'medium');
          
          longTaskCount = 0; // Reset counter
        }
      }
    }
  });

  try {
    observer.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    console.warn('Long task monitoring not supported:', error);
  }
}

/**
 * Get crash reporter configuration
 * @returns Crash reporter configuration
 */
export function getCrashReporterConfig(): typeof CRASH_REPORTER_CONFIG {
  return { ...CRASH_REPORTER_CONFIG };
}

/**
 * Update crash reporter configuration
 * @param config - New configuration
 */
export function updateCrashReporterConfig(config: Partial<typeof CRASH_REPORTER_CONFIG>): void {
  Object.assign(CRASH_REPORTER_CONFIG, config);
}

/**
 * Check if crash reporter is enabled
 * @returns Whether crash reporter is enabled
 */
export function isCrashReporterEnabled(): boolean {
  return CRASH_REPORTER_CONFIG.enabled;
}
