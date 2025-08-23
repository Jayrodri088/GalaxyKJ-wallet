// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  replaysOnErrorSampleRate: 0.0, // Disable session replay for privacy
  replaysSessionSampleRate: 0.0, // Disable session replay for privacy

  // You can remove this option if you're not planning to use the Reasons feature.
  integrations: [
    // Add integrations as needed
  ],

  // Privacy-focused configuration
  beforeSend(event, hint) {
    // Sanitize sensitive data before sending to Sentry
    if (event.request && event.request.headers) {
      // Remove sensitive headers
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }

    if (event.user) {
      // Anonymize user data
      const userId = String(event.user.id || '');
      event.user.id = `user_${userId.substring(0, 8)}...`;
    }

    // Remove sensitive data from extra fields
    if (event.extra) {
      // Filter out sensitive keys
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

      sensitiveKeys.forEach(key => {
        if (event.extra) {
          delete event.extra[key];
        }
      });
    }

    return event;
  },

  beforeBreadcrumb(breadcrumb) {
    // Sanitize breadcrumb data
    if (breadcrumb.data) {
      // Filter out sensitive keys
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

      sensitiveKeys.forEach(key => {
        if (breadcrumb.data) {
          delete breadcrumb.data[key];
        }
      });
    }

    return breadcrumb;
  },

  // Respect user privacy settings
  enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
});
