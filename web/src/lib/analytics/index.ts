/**
 * Main Analytics Configuration and Initialization
 * Central hub for analytics setup and management
 */

import { AnalyticsConfig, PrivacySettings, AnalyticsContextType } from '@/types/analytics';
import { initializePostHog, trackEvent, setUserIdentity, resetUserIdentity } from './posthog-config';
import { getDefaultPrivacySettings, validatePrivacySettings } from './privacy-utils';

/**
 * Default analytics configuration
 */
const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
  posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
  privacyMode: (process.env.NEXT_PUBLIC_PRIVACY_MODE as 'strict' | 'standard' | 'minimal') || 'strict'
};

/**
 * Analytics manager class
 */
class AnalyticsManager {
  private config: AnalyticsConfig;
  private privacySettings: PrivacySettings;
  private isInitialized: boolean = false;
  private currentUserId?: string;
  private sessionId: string;

  constructor(config: AnalyticsConfig = DEFAULT_ANALYTICS_CONFIG) {
    this.config = config;
    this.privacySettings = getDefaultPrivacySettings();
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialize analytics with privacy settings
   * @param privacySettings - User privacy preferences
   */
  async initialize(privacySettings?: Partial<PrivacySettings>): Promise<void> {
    if (this.isInitialized) {
      console.warn('Analytics already initialized');
      return;
    }

    // Update privacy settings if provided
    if (privacySettings) {
      this.privacySettings = { ...this.privacySettings, ...privacySettings };
    }

    // Validate privacy settings
    const validation = validatePrivacySettings(this.privacySettings);
    if (!validation.isValid) {
      console.error('Invalid privacy settings:', validation.errors);
      return;
    }

    // Initialize PostHog
    if (this.privacySettings.analyticsEnabled) {
      await this.initializePostHog();
    }

    this.isInitialized = true;
    console.log('Analytics initialized with privacy settings:', this.privacySettings);
  }

  /**
   * Initialize PostHog analytics
   */
  private async initializePostHog(): Promise<void> {
    try {
      const posthog = initializePostHog(this.config, this.privacySettings);
      if (posthog) {
        console.log('PostHog analytics initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
    }
  }

  /**
   * Track an analytics event
   * @param event - Event name
   * @param properties - Event properties
   */
  trackEvent(event: string, properties: Record<string, any> = {}): void {
    if (!this.isInitialized || !this.privacySettings.analyticsEnabled) {
      return;
    }

    try {
      const enrichedProperties = {
        ...properties,
        sessionId: this.sessionId,
        userId: this.currentUserId,
        timestamp: Date.now(),
        environment: this.config.environment
      };

      trackEvent(event, enrichedProperties, this.privacySettings);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Track an error
   * @param error - Error object
   * @param context - Additional context
   */
  trackError(error: Error, context: Record<string, any> = {}): void {
    if (!this.isInitialized || !this.privacySettings.errorReportingEnabled) {
      return;
    }

    try {
      const errorProperties = {
        ...context,
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name,
        sessionId: this.sessionId,
        userId: this.currentUserId,
        timestamp: Date.now()
      };

      trackEvent('error_occurred', errorProperties, this.privacySettings);
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError);
    }
  }

  /**
   * Track performance metrics
   * @param metrics - Performance metrics
   */
  trackPerformance(metrics: Record<string, any>): void {
    if (!this.isInitialized || !this.privacySettings.performanceMonitoringEnabled) {
      return;
    }

    try {
      const performanceProperties = {
        ...metrics,
        sessionId: this.sessionId,
        userId: this.currentUserId,
        timestamp: Date.now()
      };

      trackEvent('performance_metric_recorded', performanceProperties, this.privacySettings);
    } catch (error) {
      console.error('Failed to track performance:', error);
    }
  }

  /**
   * Track transaction analytics
   * @param transaction - Transaction data
   */
  trackTransaction(transaction: Record<string, any>): void {
    if (!this.isInitialized || !this.privacySettings.analyticsEnabled) {
      return;
    }

    try {
      const transactionProperties = {
        ...transaction,
        sessionId: this.sessionId,
        userId: this.currentUserId,
        timestamp: Date.now()
      };

      trackEvent('transaction_analytics', transactionProperties, this.privacySettings);
    } catch (error) {
      console.error('Failed to track transaction:', error);
    }
  }

  /**
   * Set user identity
   * @param userId - User identifier
   * @param properties - User properties
   */
  setUser(userId: string, properties: Record<string, any> = {}): void {
    this.currentUserId = userId;

    if (this.isInitialized && this.privacySettings.analyticsEnabled) {
      try {
        setUserIdentity(userId, properties, this.privacySettings);
      } catch (error) {
        console.error('Failed to set user identity:', error);
      }
    }
  }

  /**
   * Reset user identity
   */
  resetUser(): void {
    this.currentUserId = undefined;

    if (this.isInitialized) {
      try {
        resetUserIdentity();
      } catch (error) {
        console.error('Failed to reset user identity:', error);
      }
    }
  }

  /**
   * Update privacy settings
   * @param settings - New privacy settings
   */
  updatePrivacySettings(settings: Partial<PrivacySettings>): void {
    const newSettings = { ...this.privacySettings, ...settings };
    const validation = validatePrivacySettings(newSettings);

    if (!validation.isValid) {
      console.error('Invalid privacy settings:', validation.errors);
      return;
    }

    this.privacySettings = newSettings;
    console.log('Privacy settings updated:', this.privacySettings);
  }

  /**
   * Get current privacy settings
   * @returns Current privacy settings
   */
  getPrivacySettings(): PrivacySettings {
    return { ...this.privacySettings };
  }

  /**
   * Check if analytics is enabled
   * @returns Whether analytics is enabled
   */
  isEnabled(): boolean {
    return this.isInitialized && this.privacySettings.analyticsEnabled;
  }

  /**
   * Generate a unique session ID
   * @returns Session ID
   */
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Get analytics configuration
   * @returns Analytics configuration
   */
  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  /**
   * Get session ID
   * @returns Current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get current user ID
   * @returns Current user ID or undefined
   */
  getCurrentUserId(): string | undefined {
    return this.currentUserId;
  }
}

/**
 * Global analytics manager instance
 */
let analyticsManager: AnalyticsManager | null = null;

/**
 * Get or create analytics manager instance
 * @param config - Analytics configuration
 * @returns Analytics manager instance
 */
export function getAnalyticsManager(config?: AnalyticsConfig): AnalyticsManager {
  if (!analyticsManager) {
    analyticsManager = new AnalyticsManager(config);
  }
  return analyticsManager;
}

/**
 * Initialize analytics
 * @param config - Analytics configuration
 * @param privacySettings - Privacy settings
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeAnalytics(
  config?: AnalyticsConfig,
  privacySettings?: Partial<PrivacySettings>
): Promise<void> {
  const manager = getAnalyticsManager(config);
  await manager.initialize(privacySettings);
}

/**
 * Track an event
 * @param event - Event name
 * @param properties - Event properties
 */
export function trackAnalyticsEvent(event: string, properties: Record<string, any> = {}): void {
  const manager = getAnalyticsManager();
  manager.trackEvent(event, properties);
}

/**
 * Track an error
 * @param error - Error object
 * @param context - Additional context
 */
export function trackAnalyticsError(error: Error, context: Record<string, any> = {}): void {
  const manager = getAnalyticsManager();
  manager.trackError(error, context);
}

/**
 * Track performance metrics
 * @param metrics - Performance metrics
 */
export function trackAnalyticsPerformance(metrics: Record<string, any>): void {
  const manager = getAnalyticsManager();
  manager.trackPerformance(metrics);
}

/**
 * Track transaction analytics
 * @param transaction - Transaction data
 */
export function trackAnalyticsTransaction(transaction: Record<string, any>): void {
  const manager = getAnalyticsManager();
  manager.trackTransaction(transaction);
}

/**
 * Set user identity
 * @param userId - User identifier
 * @param properties - User properties
 */
export function setAnalyticsUser(userId: string, properties: Record<string, any> = {}): void {
  const manager = getAnalyticsManager();
  manager.setUser(userId, properties);
}

/**
 * Reset user identity
 */
export function resetAnalyticsUser(): void {
  const manager = getAnalyticsManager();
  manager.resetUser();
}

/**
 * Update privacy settings
 * @param settings - New privacy settings
 */
export function updateAnalyticsPrivacySettings(settings: Partial<PrivacySettings>): void {
  const manager = getAnalyticsManager();
  manager.updatePrivacySettings(settings);
}

/**
 * Get privacy settings
 * @returns Current privacy settings
 */
export function getAnalyticsPrivacySettings(): PrivacySettings {
  const manager = getAnalyticsManager();
  return manager.getPrivacySettings();
}

/**
 * Check if analytics is enabled
 * @returns Whether analytics is enabled
 */
export function isAnalyticsEnabled(): boolean {
  const manager = getAnalyticsManager();
  return manager.isEnabled();
}

/**
 * Get analytics manager instance for direct access
 * @returns Analytics manager instance
 */
export function getAnalyticsManagerInstance(): AnalyticsManager {
  return getAnalyticsManager();
}

// Export default configuration
export { DEFAULT_ANALYTICS_CONFIG };
