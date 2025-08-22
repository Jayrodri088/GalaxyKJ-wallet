/**
 * Privacy Consent Banner Component
 * Handles GDPR compliance and user privacy consent
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAnalyticsContext } from './analytics-provider';
import { trackAnalyticsEvent } from '@/lib/analytics';
import { ANALYTICS_EVENTS } from '@/types/analytics';

/**
 * Privacy Consent Banner Props
 */
interface PrivacyConsentBannerProps {
  onConsentChange?: (consent: boolean) => void;
  showAlways?: boolean;
  className?: string;
}

/**
 * Privacy Consent Banner Component
 * Displays privacy consent banner for GDPR compliance
 */
export function PrivacyConsentBanner({ 
  onConsentChange, 
  showAlways = false,
  className = '' 
}: PrivacyConsentBannerProps) {
  const { privacySettings, updatePrivacySettings, isEnabled } = useAnalyticsContext();
  const [showBanner, setShowBanner] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if consent banner should be shown
  useEffect(() => {
    if (showAlways) {
      setShowBanner(true);
      return;
    }

    // Check if user has already given consent
    const hasConsent = localStorage.getItem('analytics-consent');
    if (!hasConsent) {
      setShowBanner(true);
    }
  }, [showAlways]);

  // Handle accept all
  const handleAcceptAll = () => {
    const newSettings = {
      analyticsEnabled: true,
      errorReportingEnabled: true,
      performanceMonitoringEnabled: true,
      anonymizeData: true
    };

    updatePrivacySettings(newSettings);
    localStorage.setItem('analytics-consent', 'accepted-all');
    localStorage.setItem('analytics-settings', JSON.stringify(newSettings));
    
    setShowBanner(false);
    onConsentChange?.(true);

    // Track consent event
    trackAnalyticsEvent(ANALYTICS_EVENTS.PRIVACY_SETTINGS_UPDATED, {
      action: 'accept_all',
      settings: newSettings
    });
  };

  // Handle accept essential only
  const handleAcceptEssential = () => {
    const newSettings = {
      analyticsEnabled: false,
      errorReportingEnabled: true,
      performanceMonitoringEnabled: false,
      anonymizeData: true
    };

    updatePrivacySettings(newSettings);
    localStorage.setItem('analytics-consent', 'accepted-essential');
    localStorage.setItem('analytics-settings', JSON.stringify(newSettings));
    
    setShowBanner(false);
    onConsentChange?.(false);

    // Track consent event
    trackAnalyticsEvent(ANALYTICS_EVENTS.PRIVACY_SETTINGS_UPDATED, {
      action: 'accept_essential',
      settings: newSettings
    });
  };

  // Handle reject all
  const handleRejectAll = () => {
    const newSettings = {
      analyticsEnabled: false,
      errorReportingEnabled: false,
      performanceMonitoringEnabled: false,
      anonymizeData: true
    };

    updatePrivacySettings(newSettings);
    localStorage.setItem('analytics-consent', 'rejected');
    localStorage.setItem('analytics-settings', JSON.stringify(newSettings));
    
    setShowBanner(false);
    onConsentChange?.(false);

    // Track consent event (if analytics is still enabled)
    if (isEnabled) {
      trackAnalyticsEvent(ANALYTICS_EVENTS.PRIVACY_SETTINGS_UPDATED, {
        action: 'reject_all',
        settings: newSettings
      });
    }
  };

  // Handle custom settings
  const handleCustomSettings = () => {
    setIsExpanded(true);
  };

  // Handle save custom settings
  const handleSaveCustomSettings = (settings: {
    analyticsEnabled: boolean;
    errorReportingEnabled: boolean;
    performanceMonitoringEnabled: boolean;
    anonymizeData: boolean;
  }) => {
    updatePrivacySettings(settings);
    localStorage.setItem('analytics-consent', 'custom');
    localStorage.setItem('analytics-settings', JSON.stringify(settings));
    
    setShowBanner(false);
    setIsExpanded(false);
    onConsentChange?.(settings.analyticsEnabled);

    // Track consent event
    trackAnalyticsEvent(ANALYTICS_EVENTS.PRIVACY_SETTINGS_UPDATED, {
      action: 'custom_settings',
      settings
    });
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {!isExpanded ? (
          // Main consent banner
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Privacy & Analytics
              </h3>
              <p className="text-sm text-gray-600">
                We use cookies and analytics to improve your experience. 
                Your data is anonymized and protected. You can customize your preferences below.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={handleRejectAll}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Reject All
              </button>
              <button
                onClick={handleAcceptEssential}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Essential Only
              </button>
              <button
                onClick={handleCustomSettings}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Customize
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          // Custom settings form
          <CustomSettingsForm
            currentSettings={privacySettings}
            onSave={handleSaveCustomSettings}
            onCancel={() => setIsExpanded(false)}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Custom Settings Form Props
 */
interface CustomSettingsFormProps {
  currentSettings: {
    analyticsEnabled: boolean;
    errorReportingEnabled: boolean;
    performanceMonitoringEnabled: boolean;
    anonymizeData: boolean;
  };
  onSave: (settings: {
    analyticsEnabled: boolean;
    errorReportingEnabled: boolean;
    performanceMonitoringEnabled: boolean;
    anonymizeData: boolean;
  }) => void;
  onCancel: () => void;
}

/**
 * Custom Settings Form Component
 */
function CustomSettingsForm({ currentSettings, onSave, onCancel }: CustomSettingsFormProps) {
  const [settings, setSettings] = useState(currentSettings);

  const handleSave = () => {
    onSave(settings);
  };

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Customize Privacy Settings
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        {/* Essential Settings */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Essential (Required)</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Error Reporting</p>
                <p className="text-xs text-gray-500">Help us fix bugs and improve reliability</p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.errorReportingEnabled}
                  onChange={() => handleToggle('errorReportingEnabled')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Optional Settings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Analytics</p>
              <p className="text-xs text-gray-500">Help us understand how you use the app</p>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.analyticsEnabled}
                onChange={() => handleToggle('analyticsEnabled')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Performance Monitoring</p>
              <p className="text-xs text-gray-500">Help us optimize app performance</p>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.performanceMonitoringEnabled}
                onChange={() => handleToggle('performanceMonitoringEnabled')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Data Anonymization</p>
              <p className="text-xs text-gray-500">Always enabled for your privacy</p>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.anonymizeData}
                disabled
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded bg-gray-100"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
