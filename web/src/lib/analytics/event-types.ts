/**
 * Analytics Event Types and Definitions
 * Defines all analytics events used throughout the application
 */

import { ANALYTICS_EVENTS, ERROR_EVENTS, PERFORMANCE_EVENTS } from '@/types/analytics';

/**
 * Base event properties that are included in all analytics events
 */
export interface BaseEventProperties {
  timestamp: number;
  sessionId: string;
  userId?: string;
  page?: string;
  userAgent?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
}

/**
 * Navigation Events
 */
export interface NavigationEventProperties extends BaseEventProperties {
  fromPage?: string;
  toPage: string;
  navigationMethod: 'click' | 'browser_back' | 'browser_forward' | 'direct_url';
  timeOnPage?: number;
}

/**
 * Feature Usage Events
 */
export interface FeatureUsageEventProperties extends BaseEventProperties {
  feature: string;
  action: 'viewed' | 'clicked' | 'enabled' | 'disabled' | 'configured';
  subFeature?: string;
  success?: boolean;
  errorMessage?: string;
}

/**
 * Wallet Events
 */
export interface WalletEventProperties extends BaseEventProperties {
  walletType: 'standard' | 'invisible' | 'offline';
  action: 'created' | 'recovered' | 'imported' | 'deleted' | 'backed_up';
  method?: 'mnemonic' | 'private_key' | 'keystore';
  success: boolean;
  errorMessage?: string;
}

/**
 * Transaction Events
 */
export interface TransactionEventProperties extends BaseEventProperties {
  transactionType: 'send' | 'receive' | 'swap' | 'payment';
  status: 'initiated' | 'pending' | 'completed' | 'failed' | 'cancelled';
  amount?: string;
  currency?: string;
  fee?: string;
  recipientAddress?: string;
  transactionHash?: string;
  networkLatency?: number;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Offline Mode Events
 */
export interface OfflineModeEventProperties extends BaseEventProperties {
  action: 'enabled' | 'disabled' | 'transaction_attempted' | 'transaction_completed' | 'sync_attempted';
  offlineDuration?: number;
  pendingTransactions?: number;
  syncSuccess?: boolean;
  errorMessage?: string;
}

/**
 * Invisible Wallet Events
 */
export interface InvisibleWalletEventProperties extends BaseEventProperties {
  action: 'created' | 'accessed' | 'transaction_initiated' | 'transaction_completed';
  walletId?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Education Center Events
 */
export interface EducationEventProperties extends BaseEventProperties {
  contentType: 'article' | 'video' | 'tutorial' | 'guide';
  contentId: string;
  contentTitle: string;
  action: 'viewed' | 'completed' | 'shared' | 'bookmarked';
  timeSpent?: number;
  completionPercentage?: number;
}

/**
 * Settings Events
 */
export interface SettingsEventProperties extends BaseEventProperties {
  settingCategory: 'privacy' | 'security' | 'display' | 'notifications' | 'language';
  settingName: string;
  oldValue?: any;
  newValue: any;
}

/**
 * Error Events
 */
export interface ErrorEventProperties extends BaseEventProperties {
  errorType: 'javascript' | 'network' | 'stellar' | 'authentication' | 'validation' | 'offline' | 'unknown';
  errorMessage: string;
  errorStack?: string;
  componentName?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userAction?: string;
  recoverable: boolean;
}

/**
 * Performance Events
 */
export interface PerformanceEventProperties extends BaseEventProperties {
  metricName: string;
  metricValue: number;
  unit: 'milliseconds' | 'bytes' | 'percentage' | 'score';
  threshold?: number;
  isSlow?: boolean;
}

/**
 * Security Events
 */
export interface SecurityEventProperties extends BaseEventProperties {
  securityEvent: 'login_attempt' | 'logout' | 'password_change' | 'backup_created' | 'recovery_attempt';
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  suspiciousActivity?: boolean;
}

/**
 * Event tracking functions for different event types
 */
export const trackNavigation = (properties: NavigationEventProperties) => ({
  event: ANALYTICS_EVENTS.PAGE_VIEW,
  properties
});

export const trackFeatureUsage = (properties: FeatureUsageEventProperties) => ({
  event: ANALYTICS_EVENTS.FEATURE_ACCESSED,
  properties
});

export const trackWalletEvent = (properties: WalletEventProperties) => ({
  event: properties.action === 'created' ? ANALYTICS_EVENTS.WALLET_CREATED : ANALYTICS_EVENTS.WALLET_RECOVERED,
  properties
});

export const trackTransaction = (properties: TransactionEventProperties) => {
  let eventName: string;
  
  switch (properties.status) {
    case 'initiated':
      eventName = ANALYTICS_EVENTS.TRANSACTION_INITIATED;
      break;
    case 'completed':
      eventName = ANALYTICS_EVENTS.TRANSACTION_COMPLETED;
      break;
    case 'failed':
      eventName = ANALYTICS_EVENTS.TRANSACTION_FAILED;
      break;
    case 'cancelled':
      eventName = ANALYTICS_EVENTS.TRANSACTION_CANCELLED;
      break;
    default:
      eventName = ANALYTICS_EVENTS.TRANSACTION_INITIATED;
  }
  
  return {
    event: eventName,
    properties
  };
};

export const trackOfflineMode = (properties: OfflineModeEventProperties) => ({
  event: properties.action === 'enabled' ? ANALYTICS_EVENTS.OFFLINE_MODE_ENABLED : ANALYTICS_EVENTS.OFFLINE_MODE_DISABLED,
  properties
});

export const trackInvisibleWallet = (properties: InvisibleWalletEventProperties) => ({
  event: properties.action === 'created' ? ANALYTICS_EVENTS.INVISIBLE_WALLET_CREATED : ANALYTICS_EVENTS.INVISIBLE_WALLET_USED,
  properties
});

export const trackEducation = (properties: EducationEventProperties) => ({
  event: properties.contentType === 'video' ? ANALYTICS_EVENTS.EDUCATION_VIDEO_WATCHED : ANALYTICS_EVENTS.EDUCATION_ARTICLE_VIEWED,
  properties
});

export const trackSettings = (properties: SettingsEventProperties) => ({
  event: properties.settingCategory === 'privacy' ? ANALYTICS_EVENTS.PRIVACY_SETTINGS_UPDATED : ANALYTICS_EVENTS.SETTINGS_CHANGED,
  properties
});

export const trackError = (properties: ErrorEventProperties) => ({
  event: ANALYTICS_EVENTS.ERROR_OCCURRED,
  properties
});

export const trackPerformance = (properties: PerformanceEventProperties) => ({
  event: ANALYTICS_EVENTS.PERFORMANCE_METRIC_RECORDED,
  properties
});

export const trackCrash = (properties: ErrorEventProperties) => ({
  event: ANALYTICS_EVENTS.CRASH_REPORTED,
  properties
});

/**
 * Event categories for organization
 */
export const EVENT_CATEGORIES = {
  NAVIGATION: 'navigation',
  FEATURE_USAGE: 'feature_usage',
  WALLET: 'wallet',
  TRANSACTION: 'transaction',
  OFFLINE: 'offline',
  INVISIBLE_WALLET: 'invisible_wallet',
  EDUCATION: 'education',
  SETTINGS: 'settings',
  ERROR: 'error',
  PERFORMANCE: 'performance',
  SECURITY: 'security'
} as const;

/**
 * Common event properties that can be reused
 */
export const getCommonEventProperties = (): Partial<BaseEventProperties> => ({
  timestamp: Date.now(),
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  deviceType: getDeviceType(),
  browser: getBrowser(),
  os: getOS()
});

/**
 * Helper function to get device type
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const userAgent = navigator.userAgent;
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    return /iPad/.test(userAgent) ? 'tablet' : 'mobile';
  }
  return 'desktop';
}

/**
 * Helper function to get browser
 */
function getBrowser(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'unknown';
}

/**
 * Helper function to get OS
 */
function getOS(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'unknown';
}
