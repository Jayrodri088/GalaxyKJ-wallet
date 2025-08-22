/**
 * Performance Monitoring Hook for React Components
 * Provides performance monitoring functionality to React components
 */

import { useCallback, useEffect, useRef } from 'react';
import { trackAnalyticsPerformance } from '@/lib/analytics';
import { trackCustomMetric, trackTransactionPerformance } from '@/lib/monitoring/performance-monitor';

/**
 * Performance monitoring hook for React components
 * @returns Performance monitoring functions
 */
export function usePerformance() {
  const componentStartTime = useRef<number>(Date.now());
  const operationTimers = useRef<Map<string, number>>(new Map());

  /**
   * Track component render performance
   */
  const trackComponentRender = useCallback((componentName: string, renderTime: number) => {
    try {
      const isSlow = renderTime > 16; // 16ms threshold (60fps)
      
      trackAnalyticsPerformance({
        metricName: 'component_render_time',
        metricValue: renderTime,
        unit: 'millisecond',
        componentName,
        isSlow,
        timestamp: Date.now()
      });

      trackCustomMetric('component_render_time', renderTime, 'millisecond', {
        componentName,
        isSlow
      });

      if (isSlow) {
        console.warn(`Slow component render detected: ${componentName} took ${renderTime}ms`);
      }
    } catch (error) {
      console.error('Failed to track component render:', error);
    }
  }, []);

  /**
   * Start timing an operation
   */
  const startOperationTimer = useCallback((operationName: string) => {
    operationTimers.current.set(operationName, Date.now());
  }, []);

  /**
   * End timing an operation and track it
   */
  const endOperationTimer = useCallback((operationName: string, context?: Record<string, any>) => {
    const startTime = operationTimers.current.get(operationName);
    if (!startTime) {
      console.warn(`No start time found for operation: ${operationName}`);
      return;
    }

    const duration = Date.now() - startTime;
    const isSlow = duration > 1000; // 1 second threshold

    try {
      trackAnalyticsPerformance({
        metricName: 'operation_duration',
        metricValue: duration,
        unit: 'millisecond',
        operationName,
        isSlow,
        ...context,
        timestamp: Date.now()
      });

      trackCustomMetric('operation_duration', duration, 'millisecond', {
        operationName,
        isSlow,
        ...context
      });

      if (isSlow) {
        console.warn(`Slow operation detected: ${operationName} took ${duration}ms`);
      }

      // Clean up timer
      operationTimers.current.delete(operationName);
    } catch (error) {
      console.error('Failed to track operation duration:', error);
    }
  }, []);

  /**
   * Track API call performance
   */
  const trackApiPerformance = useCallback((url: string, method: string, duration: number, status: number) => {
    try {
      const isSlow = duration > 1000; // 1 second threshold
      
      trackAnalyticsPerformance({
        metricName: 'api_call_duration',
        metricValue: duration,
        unit: 'millisecond',
        url: sanitizeUrl(url),
        method,
        status,
        isSlow,
        timestamp: Date.now()
      });

      trackCustomMetric('api_call_duration', duration, 'millisecond', {
        url: sanitizeUrl(url),
        method,
        status,
        isSlow
      });

      if (isSlow) {
        console.warn(`Slow API call detected: ${method} ${url} took ${duration}ms`);
      }
    } catch (error) {
      console.error('Failed to track API performance:', error);
    }
  }, []);

  /**
   * Track Stellar transaction performance
   */
  const trackStellarTransactionPerformance = useCallback((
    transactionId: string,
    startTime: number,
    endTime: number,
    status: 'success' | 'failed' | 'pending',
    operation: string
  ) => {
    try {
      trackTransactionPerformance(transactionId, startTime, endTime, status);
      
      trackAnalyticsPerformance({
        metricName: 'stellar_transaction_duration',
        metricValue: endTime - startTime,
        unit: 'millisecond',
        transactionId,
        operation,
        status,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to track Stellar transaction performance:', error);
    }
  }, []);

  /**
   * Track memory usage
   */
  const trackMemoryUsage = useCallback(() => {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return;
    }

    try {
      const memoryInfo = (performance as any).memory;
      const usedMemory = memoryInfo.usedJSHeapSize / (1024 * 1024); // Convert to MB
      const totalMemory = memoryInfo.totalJSHeapSize / (1024 * 1024); // Convert to MB
      const memoryUsage = (usedMemory / totalMemory) * 100;
      
      const isHigh = memoryUsage > 80; // 80% threshold

      trackAnalyticsPerformance({
        metricName: 'memory_usage',
        metricValue: memoryUsage,
        unit: 'percentage',
        usedMemory,
        totalMemory,
        isHigh,
        timestamp: Date.now()
      });

      trackCustomMetric('memory_usage', memoryUsage, 'percentage', {
        usedMemory,
        totalMemory,
        isHigh
      });

      if (isHigh) {
        console.warn(`High memory usage detected: ${memoryUsage.toFixed(2)}%`);
      }
    } catch (error) {
      console.error('Failed to track memory usage:', error);
    }
  }, []);

  /**
   * Track page load performance
   */
  const trackPageLoadPerformance = useCallback((loadTime: number) => {
    try {
      const isSlow = loadTime > 3000; // 3 second threshold
      
      trackAnalyticsPerformance({
        metricName: 'page_load_time',
        metricValue: loadTime,
        unit: 'millisecond',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        isSlow,
        timestamp: Date.now()
      });

      trackCustomMetric('page_load_time', loadTime, 'millisecond', {
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        isSlow
      });

      if (isSlow) {
        console.warn(`Slow page load detected: ${loadTime}ms`);
      }
    } catch (error) {
      console.error('Failed to track page load performance:', error);
    }
  }, []);

  /**
   * Track user interaction performance
   */
  const trackInteractionPerformance = useCallback((interactionType: string, duration: number) => {
    try {
      const isSlow = duration > 100; // 100ms threshold for interactions
      
      trackAnalyticsPerformance({
        metricName: 'user_interaction_duration',
        metricValue: duration,
        unit: 'millisecond',
        interactionType,
        isSlow,
        timestamp: Date.now()
      });

      trackCustomMetric('user_interaction_duration', duration, 'millisecond', {
        interactionType,
        isSlow
      });

      if (isSlow) {
        console.warn(`Slow user interaction detected: ${interactionType} took ${duration}ms`);
      }
    } catch (error) {
      console.error('Failed to track interaction performance:', error);
    }
  }, []);

  /**
   * Track offline operation performance
   */
  const trackOfflineOperationPerformance = useCallback((
    operation: string,
    duration: number,
    success: boolean
  ) => {
    try {
      const isSlow = duration > 5000; // 5 second threshold for offline operations
      
      trackAnalyticsPerformance({
        metricName: 'offline_operation_duration',
        metricValue: duration,
        unit: 'millisecond',
        operation,
        success,
        isSlow,
        timestamp: Date.now()
      });

      trackCustomMetric('offline_operation_duration', duration, 'millisecond', {
        operation,
        success,
        isSlow
      });

      if (isSlow) {
        console.warn(`Slow offline operation detected: ${operation} took ${duration}ms`);
      }
    } catch (error) {
      console.error('Failed to track offline operation performance:', error);
    }
  }, []);

  /**
   * Track custom performance metric
   */
  const trackCustomPerformanceMetric = useCallback((
    name: string,
    value: number,
    unit: string = 'millisecond',
    context?: Record<string, any>
  ) => {
    try {
      trackAnalyticsPerformance({
        metricName: name,
        metricValue: value,
        unit,
        ...context,
        timestamp: Date.now()
      });

      trackCustomMetric(name, value, unit, context);
    } catch (error) {
      console.error('Failed to track custom performance metric:', error);
    }
  }, []);

  // Monitor component lifecycle performance
  useEffect(() => {
    const componentName = 'UnknownComponent'; // This should be passed from the component
    const renderStartTime = Date.now();

    return () => {
      const renderTime = Date.now() - renderStartTime;
      trackComponentRender(componentName, renderTime);
    };
  }, [trackComponentRender]);

  // Monitor memory usage periodically
  useEffect(() => {
    const interval = setInterval(trackMemoryUsage, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [trackMemoryUsage]);

  return {
    // Core performance tracking
    trackComponentRender,
    startOperationTimer,
    endOperationTimer,
    
    // Specific performance tracking
    trackApiPerformance,
    trackStellarTransactionPerformance,
    trackMemoryUsage,
    trackPageLoadPerformance,
    trackInteractionPerformance,
    trackOfflineOperationPerformance,
    trackCustomPerformanceMetric
  };
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
