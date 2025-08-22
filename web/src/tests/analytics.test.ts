/**
 * Analytics System Tests
 * Core analytics functionality tests
 */

import { 
  sanitizeAnalyticsProperties,
  anonymizeWalletAddress,
  generateSessionId
} from '@/lib/analytics/privacy-utils';

describe('Analytics System', () => {
  describe('Privacy Utils', () => {
    it('should sanitize analytics properties', () => {
      const properties = {
        privateKey: 'secret123',
        walletAddress: 'GABCDEF123456789',
        amount: 1000,
        normalData: 'safe'
      };

      const sanitized = sanitizeAnalyticsProperties(properties);

      expect(sanitized.privateKey).toBeUndefined();
      expect(sanitized.walletAddress).toBe('GABC...6789');
      expect(sanitized.amount).toBe('1000-10000');
      expect(sanitized.normalData).toBe('safe');
    });

    it('should anonymize wallet addresses', () => {
      expect(anonymizeWalletAddress('GABCDEF123456789')).toBe('GABC...6789');
      expect(anonymizeWalletAddress('G123')).toBe('***');
      expect(anonymizeWalletAddress('')).toBe('***');
    });

    it('should generate session IDs', () => {
      const sessionId1 = generateSessionId();
      const sessionId2 = generateSessionId();

      expect(sessionId1).toBeDefined();
      expect(sessionId2).toBeDefined();
      expect(sessionId1).not.toBe(sessionId2);
    });
  });
});
