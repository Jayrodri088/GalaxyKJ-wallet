/**
 * PostHog Analytics Configuration
 * Handles PostHog setup, configuration, and initialization
 */

import posthog from 'posthog-js';
import { AnalyticsConfig, PrivacySettings } from '@/types/analytics';
import { sanitizeAnalyticsProperties, generateSessionId } from './privacy-utils';

/**
 * PostHog configuration options
 */
const POSTHOG_CONFIG = {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
  loaded: (posthog: any) => {
    if (process.env.NODE_ENV === 'development') {
      posthog.debug();
    }
  },
  autocapture: false, // Disable automatic event capture for privacy
  capture_pageview: false, // Disable automatic page view capture
  capture_pageleave: false, // Disable automatic page leave capture
  disable_session_recording: true, // Disable session recording for privacy
  opt_out_capturing_by_default: true, // Opt out by default, require explicit consent
  respect_dnt: true, // Respect Do Not Track headers
  persistence: 'localStorage' as const, // Use localStorage for persistence
  cross_subdomain_cookie: false, // Don't set cross-subdomain cookies
  secure_cookie: true, // Use secure cookies in production
  property_blacklist: [
    // Blacklist sensitive properties
    'privateKey',
    'secretKey',
    'seed',
    'mnemonic',
    'password',
    'token',
    'apiKey',
    'walletAddress',
    'transactionHash',
    'amount',
    'balance'
  ]
};

/**
 * Initialize PostHog with configuration
 * @param config - Analytics configuration
 * @param privacySettings - User privacy settings
 * @returns PostHog instance or null if disabled
 */
export function initializePostHog(
  config: AnalyticsConfig,
  privacySettings: PrivacySettings
): typeof posthog | null {
  // Check if PostHog should be enabled
  if (!shouldEnablePostHog(config, privacySettings)) {
    console.log('PostHog analytics disabled due to privacy settings or configuration');
    return null;
  }

  // Check if PostHog is already initialized
  if (posthog.isFeatureEnabled('test')) {
    return posthog;
  }

  try {
    // Initialize PostHog
    posthog.init(config.posthogKey, POSTHOG_CONFIG);
    
    // Set up user identification if available
    if (config.environment === 'production') {
      posthog.identify();
    }

    console.log('PostHog analytics initialized successfully');
    return posthog;
  } catch (error) {
    console.error('Failed to initialize PostHog:', error);
    return null;
  }
}

/**
 * Check if PostHog should be enabled based on configuration and privacy settings
 * @param config - Analytics configuration
 * @param privacySettings - User privacy settings
 * @returns Whether PostHog should be enabled
 */
function shouldEnablePostHog(
  config: AnalyticsConfig,
  privacySettings: PrivacySettings
): boolean {
  // Check if analytics is enabled in privacy settings
  if (!privacySettings.analyticsEnabled) {
    return false;
  }

  // Check if PostHog key is configured
  if (!config.posthogKey) {
    // Only log warning in development
    if (process.env.NODE_ENV === 'development') {
      console.log('PostHog not configured - analytics disabled');
    }
    return false;
  }

  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for Do Not Track header
  if (navigator.doNotTrack === '1') {
    console.log('PostHog disabled due to Do Not Track header');
    return false;
  }

  return true;
}

/**
 * Track an event with PostHog
 * @param event - Event name
 * @param properties - Event properties
 * @param privacySettings - Privacy settings for data sanitization
 */
export function trackEvent(
  event: string,
  properties: Record<string, any> = {},
  privacySettings: PrivacySettings
): void {
  if (!posthog.isFeatureEnabled('test')) {
    // Only log warning in development
    if (process.env.NODE_ENV === 'development') {
      console.log('PostHog not initialized, event not tracked:', event);
    }
    return;
  }

  try {
    // Sanitize properties for privacy
    const sanitizedProperties = sanitizeAnalyticsProperties(properties);
    
    // Add common properties
    const enrichedProperties = {
      ...sanitizedProperties,
      timestamp: Date.now(),
      sessionId: generateSessionId(),
      environment: process.env.NODE_ENV,
      anonymized: privacySettings.anonymizeData
    };

    // Track the event
    posthog.capture(event, enrichedProperties);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('PostHog event tracked:', event, enrichedProperties);
    }
  } catch (error) {
    console.error('Failed to track PostHog event:', error);
  }
}

/**
 * Set user identity in PostHog
 * @param userId - User identifier
 * @param properties - User properties
 * @param privacySettings - Privacy settings
 */
export function setUserIdentity(
  userId: string,
  properties: Record<string, any> = {},
  privacySettings: PrivacySettings
): void {
  if (!posthog.isFeatureEnabled('test')) {
    return;
  }

  try {
    // Sanitize user properties
    const sanitizedProperties = sanitizeAnalyticsProperties(properties);
    
    // Set user identity
    posthog.identify(userId, sanitizedProperties);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('PostHog user identity set:', userId);
    }
  } catch (error) {
    console.error('Failed to set PostHog user identity:', error);
  }
}

/**
 * Reset user identity in PostHog
 */
export function resetUserIdentity(): void {
  if (!posthog.isFeatureEnabled('test')) {
    return;
  }

  try {
    posthog.reset();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('PostHog user identity reset');
    }
  } catch (error) {
    console.error('Failed to reset PostHog user identity:', error);
  }
}

/**
 * Track page view with PostHog
 * @param page - Page URL or identifier
 * @param properties - Additional properties
 * @param privacySettings - Privacy settings
 */
export function trackPageView(
  page: string,
  properties: Record<string, any> = {},
  privacySettings: PrivacySettings
): void {
  if (!posthog.isFeatureEnabled('test')) {
    return;
  }

  try {
    const sanitizedProperties = sanitizeAnalyticsProperties(properties);
    
    const enrichedProperties = {
      ...sanitizedProperties,
      page,
      timestamp: Date.now(),
      sessionId: generateSessionId(),
      environment: process.env.NODE_ENV
    };

    posthog.capture('$pageview', enrichedProperties);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('PostHog page view tracked:', page);
    }
  } catch (error) {
    console.error('Failed to track PostHog page view:', error);
  }
}

/**
 * Get PostHog instance
 * @returns PostHog instance or null if not initialized
 */
export function getPostHog(): typeof posthog | null {
  if (posthog.isFeatureEnabled('test')) {
    return posthog;
  }
  return null;
}

/**
 * Check if PostHog is initialized
 * @returns Whether PostHog is initialized
 */
export function isPostHogInitialized(): boolean {
  return posthog.isFeatureEnabled('test') ?? false;
}

/**
 * Opt out of PostHog tracking
 */
export function optOutOfPostHog(): void {
  if (posthog.isFeatureEnabled('test')) {
    posthog.opt_out_capturing();
    console.log('PostHog tracking opted out');
  }
}

/**
 * Opt in to PostHog tracking
 */
export function optInToPostHog(): void {
  if (posthog.isFeatureEnabled('test')) {
    posthog.opt_in_capturing();
    console.log('PostHog tracking opted in');
  }
}

/**
 * Check if user has opted out of PostHog tracking
 * @returns Whether user has opted out
 */
export function hasOptedOutOfPostHog(): boolean {
  if (posthog.isFeatureEnabled('test')) {
    return posthog.has_opted_out_capturing();
  }
  return true; // Default to opted out if not initialized
}

/**
 * Get PostHog configuration for debugging
 * @returns Current PostHog configuration
 */
export function getPostHogConfig(): Record<string, any> {
  return {
    isInitialized: isPostHogInitialized(),
    hasOptedOut: hasOptedOutOfPostHog(),
    apiHost: POSTHOG_CONFIG.api_host,
    environment: process.env.NODE_ENV,
    autocapture: POSTHOG_CONFIG.autocapture,
    sessionRecording: POSTHOG_CONFIG.disable_session_recording
  };
}
