/**
 * Performance Monitoring Utilities
 * Handles Web Vitals tracking and custom performance metrics
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import { PerformanceMetrics, PerformanceThresholds } from '@/types/analytics';
import { trackAnalyticsPerformance } from '../analytics';
import { capturePerformanceMeasurement } from './error-tracker';

/**
 * Default performance thresholds
 */
const DEFAULT_PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  pageLoadTime: 3000, // 3 seconds
  firstContentfulPaint: 1800, // 1.8 seconds
  largestContentfulPaint: 2500, // 2.5 seconds
  timeToInteractive: 3800, // 3.8 seconds
  cumulativeLayoutShift: 0.1 // 0.1 score
};

/**
 * Performance monitoring configuration
 */
const PERFORMANCE_CONFIG = {
  enabled: true,
  thresholds: DEFAULT_PERFORMANCE_THRESHOLDS,
  sampleRate: 1.0, // Track all metrics in development, sample in production
  reportToAnalytics: true,
  reportToSentry: true
};

/**
 * Initialize performance monitoring
 * @param privacySettings - User privacy settings
 * @param customThresholds - Custom performance thresholds
 */
export function initializePerformanceMonitoring(
  privacySettings: {
    performanceMonitoringEnabled: boolean;
    anonymizeData: boolean;
  },
  customThresholds?: Partial<PerformanceThresholds>
): void {
  if (!privacySettings.performanceMonitoringEnabled) {
    console.log('Performance monitoring disabled due to privacy settings');
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Update thresholds if provided
    if (customThresholds) {
      PERFORMANCE_CONFIG.thresholds = { ...PERFORMANCE_CONFIG.thresholds, ...customThresholds };
    }

    // Initialize Web Vitals tracking
    initializeWebVitals();
    
    // Initialize custom performance monitoring
    initializeCustomPerformanceMonitoring();

    console.log('Performance monitoring initialized successfully');
  } catch (error) {
    console.error('Failed to initialize performance monitoring:', error);
  }
}

/**
 * Initialize Web Vitals tracking
 */
function initializeWebVitals(): void {
  // Cumulative Layout Shift (CLS)
  getCLS((metric) => {
    trackWebVitalMetric('CLS', metric);
  });

  // First Input Delay (FID)
  getFID((metric) => {
    trackWebVitalMetric('FID', metric);
  });

  // First Contentful Paint (FCP)
  getFCP((metric) => {
    trackWebVitalMetric('FCP', metric);
  });

  // Largest Contentful Paint (LCP)
  getLCP((metric) => {
    trackWebVitalMetric('LCP', metric);
  });

  // Time to First Byte (TTFB)
  getTTFB((metric) => {
    trackWebVitalMetric('TTFB', metric);
  });
}

/**
 * Track a Web Vital metric
 * @param name - Metric name
 * @param metric - Web Vital metric object
 */
function trackWebVitalMetric(name: string, metric: any): void {
  const isSlow = isMetricSlow(name, metric.value);
  
  const metricData = {
    name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    isSlow,
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    timestamp: Date.now()
  };

  // Report to analytics
  if (PERFORMANCE_CONFIG.reportToAnalytics) {
    trackAnalyticsPerformance({
      metricName: name,
      metricValue: metric.value,
      unit: 'millisecond',
      rating: metric.rating,
      isSlow,
      url: metricData.url
    });
  }

  // Report to Sentry
  if (PERFORMANCE_CONFIG.reportToSentry) {
    capturePerformanceMeasurement(`web_vital.${name.toLowerCase()}`, metric.value, 'millisecond');
  }

  // Log slow metrics
  if (isSlow) {
    console.warn(`Slow ${name} detected:`, metricData);
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`Web Vital ${name} tracked:`, metricData);
  }
}

/**
 * Check if a metric is considered slow
 * @param name - Metric name
 * @param value - Metric value
 * @returns Whether the metric is slow
 */
function isMetricSlow(name: string, value: number): boolean {
  const thresholds = PERFORMANCE_CONFIG.thresholds;
  
  switch (name) {
    case 'CLS':
      return value > thresholds.cumulativeLayoutShift;
    case 'FID':
      return value > 100; // 100ms threshold for FID
    case 'FCP':
      return value > thresholds.firstContentfulPaint;
    case 'LCP':
      return value > thresholds.largestContentfulPaint;
    case 'TTFB':
      return value > 600; // 600ms threshold for TTFB
    default:
      return false;
  }
}

/**
 * Initialize custom performance monitoring
 */
function initializeCustomPerformanceMonitoring(): void {
  // Monitor page load times
  monitorPageLoadTime();
  
  // Monitor API response times
  monitorApiResponseTimes();
  
  // Monitor memory usage
  monitorMemoryUsage();
  
  // Monitor transaction performance
  monitorTransactionPerformance();
}

/**
 * Monitor page load time
 */
function monitorPageLoadTime(): void {
  if (typeof window === 'undefined') return;

  const startTime = performance.now();
  
  window.addEventListener('load', () => {
    const loadTime = performance.now() - startTime;
    const isSlow = loadTime > PERFORMANCE_CONFIG.thresholds.pageLoadTime;
    
    const pageLoadData = {
      metricName: 'page_load_time',
      metricValue: loadTime,
      unit: 'millisecond',
      isSlow,
      url: window.location.href,
      timestamp: Date.now()
    };

    if (PERFORMANCE_CONFIG.reportToAnalytics) {
      trackAnalyticsPerformance(pageLoadData);
    }

    if (PERFORMANCE_CONFIG.reportToSentry) {
      capturePerformanceMeasurement('page_load_time', loadTime, 'millisecond');
    }

    if (isSlow) {
      console.warn('Slow page load detected:', pageLoadData);
    }
  });
}

/**
 * Monitor API response times
 */
function monitorApiResponseTimes(): void {
  if (typeof window === 'undefined') return;

  // Intercept fetch requests
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const startTime = performance.now();
    
    try {
      const response = await originalFetch.apply(this, args);
      const responseTime = performance.now() - startTime;
      
      // Only track successful or client error responses, not network errors
      if (response.status > 0) {
        trackApiResponseTime(responseTime, args[0] as string, response.status);
      }
      
      return response;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      
      // Only track network errors for monitoring purposes, don't re-throw
      // This prevents the performance monitor from interfering with normal error handling
      try {
        trackApiResponseTime(responseTime, args[0] as string, 0, error);
      } catch (trackingError) {
        console.warn('Failed to track API error:', trackingError);
      }
      
      throw error;
    }
  };
}

/**
 * Track API response time
 * @param responseTime - Response time in milliseconds
 * @param url - API URL
 * @param status - HTTP status code
 * @param error - Error object if any
 */
function trackApiResponseTime(
  responseTime: number,
  url: string,
  status: number,
  error?: any
): void {
  const isSlow = responseTime > 1000; // 1 second threshold
  
  const apiData = {
    metricName: 'api_response_time',
    metricValue: responseTime,
    unit: 'millisecond',
    url: sanitizeUrl(url),
    status,
    isSlow,
    hasError: !!error,
    timestamp: Date.now()
  };

  if (PERFORMANCE_CONFIG.reportToAnalytics) {
    trackAnalyticsPerformance(apiData);
  }

  if (PERFORMANCE_CONFIG.reportToSentry) {
    capturePerformanceMeasurement('api_response_time', responseTime, 'millisecond');
  }

  if (isSlow) {
    console.warn('Slow API response detected:', apiData);
  }
}

/**
 * Monitor memory usage
 */
function monitorMemoryUsage(): void {
  if (typeof window === 'undefined' || !('memory' in performance)) return;

  const memoryThreshold = 50 * 1024 * 1024; // 50MB threshold
  
  setInterval(() => {
    const memoryInfo = (performance as any).memory;
    const usedMemory = memoryInfo.usedJSHeapSize;
    const totalMemory = memoryInfo.totalJSHeapSize;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    
    const isHigh = memoryUsage > 80; // 80% threshold
    
    const memoryData = {
      metricName: 'memory_usage',
      metricValue: memoryUsage,
      unit: 'percentage',
      usedMemory: usedMemory / (1024 * 1024), // Convert to MB
      totalMemory: totalMemory / (1024 * 1024), // Convert to MB
      isHigh,
      timestamp: Date.now()
    };

    if (PERFORMANCE_CONFIG.reportToAnalytics) {
      trackAnalyticsPerformance(memoryData);
    }

    if (isHigh) {
      console.warn('High memory usage detected:', memoryData);
    }
  }, 30000); // Check every 30 seconds
}

/**
 * Monitor transaction performance
 */
function monitorTransactionPerformance(): void {
  // This will be called when Stellar transactions are initiated
  // The actual implementation will be in the Stellar utilities
}

/**
 * Track transaction performance
 * @param transactionId - Transaction ID
 * @param startTime - Transaction start time
 * @param endTime - Transaction end time
 * @param status - Transaction status
 */
export function trackTransactionPerformance(
  transactionId: string,
  startTime: number,
  endTime: number,
  status: 'success' | 'failed' | 'pending'
): void {
  const duration = endTime - startTime;
  const isSlow = duration > 5000; // 5 second threshold for transactions
  
  const transactionData = {
    metricName: 'transaction_duration',
    metricValue: duration,
    unit: 'millisecond',
    transactionId,
    status,
    isSlow,
    timestamp: Date.now()
  };

  if (PERFORMANCE_CONFIG.reportToAnalytics) {
    trackAnalyticsPerformance(transactionData);
  }

  if (PERFORMANCE_CONFIG.reportToSentry) {
    capturePerformanceMeasurement('transaction_duration', duration, 'millisecond');
  }

  if (isSlow) {
    console.warn('Slow transaction detected:', transactionData);
  }
}

/**
 * Track custom performance metric
 * @param name - Metric name
 * @param value - Metric value
 * @param unit - Metric unit
 * @param context - Additional context
 */
export function trackCustomMetric(
  name: string,
  value: number,
  unit: string = 'millisecond',
  context: Record<string, any> = {}
): void {
  const metricData = {
    metricName: name,
    metricValue: value,
    unit,
    ...context,
    timestamp: Date.now()
  };

  if (PERFORMANCE_CONFIG.reportToAnalytics) {
    trackAnalyticsPerformance(metricData);
  }

  if (PERFORMANCE_CONFIG.reportToSentry) {
    capturePerformanceMeasurement(name, value, unit);
  }
}

/**
 * Sanitize URL for privacy
 * @param url - URL to sanitize
 * @returns Sanitized URL
 */
function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
  } catch {
    return 'unknown';
  }
}

/**
 * Get current performance configuration
 * @returns Performance configuration
 */
export function getPerformanceConfig(): typeof PERFORMANCE_CONFIG {
  return { ...PERFORMANCE_CONFIG };
}

/**
 * Update performance configuration
 * @param config - New configuration
 */
export function updatePerformanceConfig(config: Partial<typeof PERFORMANCE_CONFIG>): void {
  Object.assign(PERFORMANCE_CONFIG, config);
}

/**
 * Get current performance metrics
 * @returns Current performance metrics
 */
export function getCurrentPerformanceMetrics(): Partial<PerformanceMetrics> {
  if (typeof window === 'undefined') {
    return {};
  }

  return {
    url: window.location.href,
    timestamp: Date.now()
  };
}
