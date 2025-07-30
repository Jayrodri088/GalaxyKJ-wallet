'use client'; // Required for useState and event handlers

import React from 'react';
import CryptoTools from '@/components/signature-tools/hash-generator-tabs';
// The component from this path now contains the entire toolset including tabs


// No longer need individual tab imports or tab state management here

const SignatureToolsPage: React.FC = () => {
  // The CryptoTools component now handles its own internal state and tabs
  return (
    // The main container might need adjustment depending on CryptoTools styling
    <div className="container mx-auto px-4 py-8">
      {/* Render the main CryptoTools component directly */}
      <CryptoTools />
    </div>
  );
};

export default SignatureToolsPage; 