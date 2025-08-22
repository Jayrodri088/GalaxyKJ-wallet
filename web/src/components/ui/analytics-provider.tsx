/**
 * Analytics Provider Component
 * Provides analytics context to the entire application
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { initializeAnalytics, getAnalyticsManagerInstance } from '@/lib/analytics';
import { initializeSentry } from '@/lib/monitoring/error-tracker';
import { initializePerformanceMonitoring } from '@/lib/monitoring/performance-monitor';
import { initializeCrashReporter } from '@/lib/monitoring/crash-reporter';
import { AnalyticsContextType, PrivacySettings } from '@/types/analytics';
import { getDefaultPrivacySettings } from '@/lib/analytics/privacy-utils';

// Create analytics context
const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

/**
 * Analytics Provider Props
 */
interface AnalyticsProviderProps {
  children: ReactNode;
  initialPrivacySettings?: Partial<PrivacySettings>;
  userId?: string;
  userProperties?: Record<string, any>;
}

/**
 * Analytics Provider Component
 * Wraps the application and provides analytics functionality
 */
export function AnalyticsProvider({ 
  children, 
  initialPrivacySettings,
  userId,
  userProperties 
}: AnalyticsProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(getDefaultPrivacySettings());
  const [isEnabled, setIsEnabled] = useState(false);

  // Initialize analytics on mount
  useEffect(() => {
    const initializeAnalyticsSystem = async () => {
      try {
        // Update privacy settings if provided
        if (initialPrivacySettings) {
          const updatedSettings = { ...privacySettings, ...initialPrivacySettings };
          setPrivacySettings(updatedSettings);
        }

        // Initialize analytics
        await initializeAnalytics(undefined, privacySettings);
        
        // Initialize Sentry
        initializeSentry(privacySettings);
        
        // Initialize performance monitoring
        initializePerformanceMonitoring(privacySettings);
        
        // Initialize crash reporter
        initializeCrashReporter(privacySettings);

        setIsInitialized(true);
        setIsEnabled(privacySettings.analyticsEnabled);

        console.log('Analytics system initialized successfully');
      } catch (error) {
        console.error('Failed to initialize analytics system:', error);
        setIsInitialized(true); // Mark as initialized even if failed
      }
    };

    initializeAnalyticsSystem();
  }, [initialPrivacySettings]);

  // Set user identity when provided
  useEffect(() => {
    if (isInitialized && userId && privacySettings.analyticsEnabled) {
      const manager = getAnalyticsManagerInstance();
      manager.setUser(userId, userProperties);
    }
  }, [isInitialized, userId, userProperties, privacySettings.analyticsEnabled]);

  // Analytics context functions
  const trackEvent = (event: string, properties?: Record<string, any>) => {
    if (!isEnabled) return;
    
    try {
      const manager = getAnalyticsManagerInstance();
      manager.trackEvent(event, properties);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  };

  const trackError = (error: Error, context?: Record<string, any>) => {
    if (!isEnabled || !privacySettings.errorReportingEnabled) return;
    
    try {
      const manager = getAnalyticsManagerInstance();
      manager.trackError(error, context);
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError);
    }
  };

  const trackPerformance = (metrics: Record<string, any>) => {
    if (!isEnabled || !privacySettings.performanceMonitoringEnabled) return;
    
    try {
      const manager = getAnalyticsManagerInstance();
      manager.trackPerformance(metrics);
    } catch (error) {
      console.error('Failed to track performance:', error);
    }
  };

  const trackTransaction = (transaction: Record<string, any>) => {
    if (!isEnabled) return;
    
    try {
      const manager = getAnalyticsManagerInstance();
      manager.trackTransaction(transaction);
    } catch (error) {
      console.error('Failed to track transaction:', error);
    }
  };

  const setUser = (userId: string, properties?: Record<string, any>) => {
    if (!isEnabled) return;
    
    try {
      const manager = getAnalyticsManagerInstance();
      manager.setUser(userId, properties);
    } catch (error) {
      console.error('Failed to set user:', error);
    }
  };

  const resetUser = () => {
    try {
      const manager = getAnalyticsManagerInstance();
      manager.resetUser();
    } catch (error) {
      console.error('Failed to reset user:', error);
    }
  };

  const updatePrivacySettings = (settings: Partial<PrivacySettings>) => {
    try {
      const manager = getAnalyticsManagerInstance();
      manager.updatePrivacySettings(settings);
      
      const newSettings = { ...privacySettings, ...settings };
      setPrivacySettings(newSettings);
      setIsEnabled(newSettings.analyticsEnabled);
      
      console.log('Privacy settings updated:', newSettings);
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
    }
  };

  // Create context value
  const contextValue: AnalyticsContextType = {
    trackEvent,
    trackError,
    trackPerformance,
    trackTransaction,
    setUser,
    resetUser,
    isEnabled,
    privacySettings,
    updatePrivacySettings
  };

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

/**
 * Hook to use analytics context
 * @returns Analytics context
 */
export function useAnalyticsContext(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  
  return context;
}

/**
 * Hook to check if analytics is available
 * @returns Whether analytics is available
 */
export function useAnalyticsAvailable(): boolean {
  const context = useContext(AnalyticsContext);
  return context !== null && context.isEnabled;
}
