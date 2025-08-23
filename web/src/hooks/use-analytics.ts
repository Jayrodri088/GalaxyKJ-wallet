/**
 * Analytics Hook for React Components
 * Provides analytics tracking functionality to React components
 */

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  trackAnalyticsEvent, 
  trackAnalyticsError, 
  trackAnalyticsPerformance,
  trackAnalyticsTransaction,
  setAnalyticsUser,
  resetAnalyticsUser,
  getAnalyticsPrivacySettings,
  updateAnalyticsPrivacySettings,
  isAnalyticsEnabled
} from '@/lib/analytics';
import { ANALYTICS_EVENTS } from '@/types/analytics';

/**
 * Analytics hook for React components
 * @returns Analytics functions and state
 */
export function useAnalytics() {
  const router = useRouter();
  const lastPageRef = useRef<string>('');

  // Track page views on route changes
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (lastPageRef.current !== url) {
        trackAnalyticsEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
          page: url,
          fromPage: lastPageRef.current,
          timestamp: Date.now()
        });
        lastPageRef.current = url;
      }
    };

    // Track initial page view
    if (typeof window !== 'undefined') {
      handleRouteChange(window.location.pathname);
    }

    // In App Router, we need to use a different approach for route change tracking
    // For now, we'll just track the initial page view
    // TODO: Implement proper route change tracking for App Router
  }, [router]);

  /**
   * Track a custom event
   */
  const trackEvent = useCallback((event: string, properties?: Record<string, any>) => {
    trackAnalyticsEvent(event, properties);
  }, []);

  /**
   * Track an error
   */
  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    trackAnalyticsError(error, context);
  }, []);

  /**
   * Track performance metrics
   */
  const trackPerformance = useCallback((metrics: Record<string, any>) => {
    trackAnalyticsPerformance(metrics);
  }, []);

  /**
   * Track transaction analytics
   */
  const trackTransaction = useCallback((transaction: Record<string, any>) => {
    trackAnalyticsTransaction(transaction);
  }, []);

  /**
   * Set user identity
   */
  const setUser = useCallback((userId: string, properties?: Record<string, any>) => {
    setAnalyticsUser(userId, properties);
  }, []);

  /**
   * Reset user identity
   */
  const resetUser = useCallback(() => {
    resetAnalyticsUser();
  }, []);

  /**
   * Get privacy settings
   */
  const getPrivacySettings = useCallback(() => {
    return getAnalyticsPrivacySettings();
  }, []);

  /**
   * Update privacy settings
   */
  const updatePrivacySettings = useCallback((settings: Partial<{
    analyticsEnabled: boolean;
    errorReportingEnabled: boolean;
    performanceMonitoringEnabled: boolean;
    dataRetentionDays: number;
    anonymizeData: boolean;
  }>) => {
    updateAnalyticsPrivacySettings(settings);
  }, []);

  /**
   * Check if analytics is enabled
   */
  const isEnabled = useCallback(() => {
    return isAnalyticsEnabled();
  }, []);

  /**
   * Track feature usage
   */
  const trackFeatureUsage = useCallback((feature: string, action: string, properties?: Record<string, any>) => {
    trackAnalyticsEvent(ANALYTICS_EVENTS.FEATURE_ACCESSED, {
      feature,
      action,
      ...properties
    });
  }, []);

  /**
   * Track wallet creation
   */
  const trackWalletCreation = useCallback((walletType: string, method: string, success: boolean, errorMessage?: string) => {
    trackAnalyticsEvent(ANALYTICS_EVENTS.WALLET_CREATED, {
      walletType,
      method,
      success,
      errorMessage
    });
  }, []);

  /**
   * Track wallet recovery
   */
  const trackWalletRecovery = useCallback((walletType: string, method: string, success: boolean, errorMessage?: string) => {
    trackAnalyticsEvent(ANALYTICS_EVENTS.WALLET_RECOVERED, {
      walletType,
      method,
      success,
      errorMessage
    });
  }, []);

  /**
   * Track transaction initiation
   */
  const trackTransactionInitiated = useCallback((transactionType: string, amount?: string, currency?: string) => {
    trackAnalyticsEvent(ANALYTICS_EVENTS.TRANSACTION_INITIATED, {
      transactionType,
      amount,
      currency
    });
  }, []);

  /**
   * Track transaction completion
   */
  const trackTransactionCompleted = useCallback((transactionType: string, success: boolean, errorMessage?: string) => {
    const event = success ? ANALYTICS_EVENTS.TRANSACTION_COMPLETED : ANALYTICS_EVENTS.TRANSACTION_FAILED;
    trackAnalyticsEvent(event, {
      transactionType,
      success,
      errorMessage
    });
  }, []);

  /**
   * Track offline mode usage
   */
  const trackOfflineMode = useCallback((enabled: boolean) => {
    const event = enabled ? ANALYTICS_EVENTS.OFFLINE_MODE_ENABLED : ANALYTICS_EVENTS.OFFLINE_MODE_DISABLED;
    trackAnalyticsEvent(event, {
      enabled
    });
  }, []);

  /**
   * Track invisible wallet usage
   */
  const trackInvisibleWallet = useCallback((action: string, success: boolean, errorMessage?: string) => {
    const event = action === 'created' ? ANALYTICS_EVENTS.INVISIBLE_WALLET_CREATED : ANALYTICS_EVENTS.INVISIBLE_WALLET_USED;
    trackAnalyticsEvent(event, {
      action,
      success,
      errorMessage
    });
  }, []);

  /**
   * Track education content engagement
   */
  const trackEducationEngagement = useCallback((contentType: string, contentId: string, action: string) => {
    const event = contentType === 'video' ? ANALYTICS_EVENTS.EDUCATION_VIDEO_WATCHED : ANALYTICS_EVENTS.EDUCATION_ARTICLE_VIEWED;
    trackAnalyticsEvent(event, {
      contentType,
      contentId,
      action
    });
  }, []);

  /**
   * Track settings changes
   */
  const trackSettingsChange = useCallback((settingCategory: string, settingName: string, newValue: any) => {
    const event = settingCategory === 'privacy' ? ANALYTICS_EVENTS.PRIVACY_SETTINGS_UPDATED : ANALYTICS_EVENTS.SETTINGS_CHANGED;
    trackAnalyticsEvent(event, {
      settingCategory,
      settingName,
      newValue
    });
  }, []);

  return {
    // Core tracking functions
    trackEvent,
    trackError,
    trackPerformance,
    trackTransaction,
    
    // User management
    setUser,
    resetUser,
    
    // Privacy management
    getPrivacySettings,
    updatePrivacySettings,
    isEnabled,
    
    // Specific tracking functions
    trackFeatureUsage,
    trackWalletCreation,
    trackWalletRecovery,
    trackTransactionInitiated,
    trackTransactionCompleted,
    trackOfflineMode,
    trackInvisibleWallet,
    trackEducationEngagement,
    trackSettingsChange
  };
}
