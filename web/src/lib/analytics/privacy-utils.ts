/**
 * Privacy Utilities for Analytics
 * Handles data anonymization, GDPR compliance, and privacy protection
 */

import crypto from 'crypto';

/**
 * Hash sensitive data to maintain privacy while preserving analytics value
 * @param data - The data to hash
 * @param salt - Optional salt for additional security
 * @returns Hashed string
 */
export function hashSensitiveData(data: string, salt?: string): string {
  const hash = crypto.createHash('sha256');
  const saltedData = salt ? `${data}${salt}` : data;
  return hash.update(saltedData).digest('hex');
}

/**
 * Anonymize user identifiers while maintaining session consistency
 * @param userId - Original user ID
 * @param sessionId - Session identifier
 * @returns Anonymized user identifier
 */
export function anonymizeUserId(userId: string, sessionId: string): string {
  return hashSensitiveData(userId, sessionId);
}

/**
 * Anonymize wallet addresses for analytics
 * @param address - Stellar wallet address
 * @returns Anonymized address (first 4, last 4 characters)
 */
export function anonymizeWalletAddress(address: string): string {
  if (!address || address.length < 8) return '***';
  return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
}

/**
 * Anonymize transaction amounts while preserving relative scale
 * @param amount - Transaction amount
 * @returns Anonymized amount range
 */
export function anonymizeTransactionAmount(amount: number): string {
  if (amount === 0) return '0';
  if (amount < 1) return '< 1';
  if (amount < 10) return '1-10';
  if (amount < 100) return '10-100';
  if (amount < 1000) return '100-1000';
  if (amount < 10000) return '1000-10000';
  return '> 10000';
}

/**
 * Remove sensitive data from analytics properties
 * @param properties - Original properties object
 * @returns Sanitized properties object
 */
export function sanitizeAnalyticsProperties(properties: Record<string, any>): Record<string, any> {
  const sensitiveKeys = [
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
  ];

  const sanitized = { ...properties };

  // Remove or anonymize sensitive data
  sensitiveKeys.forEach(key => {
    if (sanitized[key]) {
      if (key === 'walletAddress') {
        sanitized[key] = anonymizeWalletAddress(sanitized[key]);
      } else if (key === 'amount' || key === 'balance') {
        sanitized[key] = anonymizeTransactionAmount(Number(sanitized[key]));
      } else {
        delete sanitized[key];
      }
    }
  });

  return sanitized;
}

/**
 * Generate a unique session ID for analytics
 * @returns Session ID string
 */
export function generateSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Check if analytics should be enabled based on privacy settings
 * @param privacySettings - User privacy preferences
 * @returns Whether analytics should be enabled
 */
export function shouldEnableAnalytics(privacySettings: {
  analyticsEnabled: boolean;
  anonymizeData: boolean;
}): boolean {
  return privacySettings.analyticsEnabled;
}

/**
 * Check if error reporting should be enabled
 * @param privacySettings - User privacy preferences
 * @returns Whether error reporting should be enabled
 */
export function shouldEnableErrorReporting(privacySettings: {
  errorReportingEnabled: boolean;
  anonymizeData: boolean;
}): boolean {
  return privacySettings.errorReportingEnabled;
}

/**
 * Check if performance monitoring should be enabled
 * @param privacySettings - User privacy preferences
 * @returns Whether performance monitoring should be enabled
 */
export function shouldEnablePerformanceMonitoring(privacySettings: {
  performanceMonitoringEnabled: boolean;
  anonymizeData: boolean;
}): boolean {
  return privacySettings.performanceMonitoringEnabled;
}

/**
 * Get device information for analytics (anonymized)
 * @returns Anonymized device information
 */
export function getAnonymizedDeviceInfo(): {
  type: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
} {
  if (typeof window === 'undefined') {
    return { type: 'desktop', browser: 'unknown', os: 'unknown' };
  }

  const userAgent = navigator.userAgent;
  
  // Determine device type
  let type: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    type = /iPad/.test(userAgent) ? 'tablet' : 'mobile';
  }

  // Determine browser
  let browser = 'unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  // Determine OS
  let os = 'unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  return { type, browser, os };
}

/**
 * Create a privacy-compliant user identifier
 * @param userId - Original user ID
 * @param sessionId - Session ID
 * @param anonymize - Whether to anonymize the ID
 * @returns Privacy-compliant user identifier
 */
export function createPrivacyCompliantUserId(
  userId: string,
  sessionId: string,
  anonymize: boolean = true
): string {
  if (!anonymize) return userId;
  return anonymizeUserId(userId, sessionId);
}

/**
 * Validate privacy settings for compliance
 * @param settings - Privacy settings to validate
 * @returns Validation result
 */
export function validatePrivacySettings(settings: {
  analyticsEnabled: boolean;
  errorReportingEnabled: boolean;
  performanceMonitoringEnabled: boolean;
  dataRetentionDays: number;
  anonymizeData: boolean;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (settings.dataRetentionDays < 1 || settings.dataRetentionDays > 365) {
    errors.push('Data retention days must be between 1 and 365');
  }

  if (typeof settings.analyticsEnabled !== 'boolean') {
    errors.push('Analytics enabled must be a boolean');
  }

  if (typeof settings.errorReportingEnabled !== 'boolean') {
    errors.push('Error reporting enabled must be a boolean');
  }

  if (typeof settings.performanceMonitoringEnabled !== 'boolean') {
    errors.push('Performance monitoring enabled must be a boolean');
  }

  if (typeof settings.anonymizeData !== 'boolean') {
    errors.push('Anonymize data must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get default privacy settings
 * @returns Default privacy configuration
 */
export function getDefaultPrivacySettings() {
  return {
    analyticsEnabled: true,
    errorReportingEnabled: true,
    performanceMonitoringEnabled: true,
    dataRetentionDays: 90,
    anonymizeData: true
  };
}

/**
 * Check if current environment requires strict privacy mode
 * @returns Whether strict privacy mode is required
 */
export function requiresStrictPrivacyMode(): boolean {
  // Check for GDPR compliance requirements
  const isEU = typeof navigator !== 'undefined' && 
    navigator.language && 
    navigator.language.toLowerCase().startsWith('eu');
  
  // Check for development environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return isEU || isDevelopment;
}
