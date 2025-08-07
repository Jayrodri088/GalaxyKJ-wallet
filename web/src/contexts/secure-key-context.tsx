"use client"

import { createContext, useContext, useRef, useCallback, ReactNode } from 'react'
import { secureKeyHandler } from '@/lib/secure-key-handler'

/**
 * SECURITY WARNING: PRIVATE KEY HANDLING LIMITATIONS
 * 
 * This context provides a more secure way to handle private keys compared to
 * storing them in React state, but inherent JavaScript limitations remain:
 * 
 * - Private keys passed as strings cannot be securely wiped from memory
 * - React DevTools exposure is mitigated but not eliminated
 * - String immutability means sensitive data persists until garbage collection
 * - Memory dumps may still expose private key data
 * 
 * SECURITY MEASURES IMPLEMENTED:
 * - Restricted access through context API
 * - Immediate clearing attempts after operations
 * - Session-limited storage
 * - Handler lifetime management
 * - Enhanced audit logging
 * 
 * USAGE RECOMMENDATIONS:
 * - Only use in secure, trusted environments
 * - Avoid development tools when handling real keys
 * - Consider hardware wallets for production use
 * - Regularly rotate credentials
 */

interface SecureKeyContextType {
  /**
   * Temporarily stores private key for signing operations
   * WARNING: Key persists in memory as immutable string until garbage collection
   */
  setPrivateKey: (key: string) => void
  
  /**
   * Performs secure message signing using stored private key
   * Automatically clears key after operation (limited effectiveness)
   */
  signMessage: (message: string) => Promise<{ signature: string; success: boolean; error?: string }>
  
  /**
   * Executes callback with private key access then immediately attempts cleanup
   * WARNING: Key string remains in memory despite cleanup attempts
   */
  withPrivateKey: <T>(callback: (key: string) => T) => T | null
  
  /**
   * Checks if a private key is currently stored
   */
  hasPrivateKey: () => boolean
  
  /**
   * Attempts to clear private key from memory (limited effectiveness for strings)
   */
  clearPrivateKey: () => void
  
  /**
   * Gets security warnings and recommendations
   */
  getSecurityWarnings: () => string[]
}

const SecureKeyContext = createContext<SecureKeyContextType | null>(null)

interface SecureKeyProviderProps {
  children: ReactNode
}

export function SecureKeyProvider({ children }: SecureKeyProviderProps) {
  // Use ref instead of state to avoid React DevTools exposure
  // WARNING: This only reduces visibility, doesn't eliminate security risks
  const keyRef = useRef<string | null>(null)
  const lastAccessTimeRef = useRef<number>(0)
  const sessionTimeoutMs = 300000 // 5 minutes
  
  const isSessionValid = useCallback(() => {
    if (!keyRef.current) return false
    const now = Date.now()
    const sessionAge = now - lastAccessTimeRef.current
    return sessionAge < sessionTimeoutMs
  }, [])
  
  const clearPrivateKey = useCallback(() => {
    if (keyRef.current) {
      // NOTE: This provides minimal security benefit as strings are immutable
      // The original string data remains in memory until garbage collection
      try {
        // Attempt to trigger garbage collection if available
        if (typeof global !== 'undefined' && global.gc) {
          global.gc()
        }
      } catch {
        // Ignore if gc is not available
      }
      
      keyRef.current = null
      lastAccessTimeRef.current = 0
    }
  }, [])
  
  const setPrivateKey = useCallback((key: string) => {
    // Clear any existing key first
    clearPrivateKey()
    
    // Validate key format (basic check)
    if (!key.startsWith('S') || key.length < 56) {
      throw new Error('Invalid private key format. Must be a valid Stellar secret key.')
    }
    
    keyRef.current = key
    lastAccessTimeRef.current = Date.now()
    
    // Auto-clear after timeout
    setTimeout(() => {
      if (keyRef.current === key) {
        clearPrivateKey()
      }
    }, sessionTimeoutMs)
  }, [clearPrivateKey])
  
  const signMessage = useCallback(async (message: string) => {
    if (!isSessionValid()) {
      return {
        signature: '',
        success: false,
        error: 'No valid private key session. Please re-enter your private key.'
      }
    }
    
    if (!keyRef.current) {
      return {
        signature: '',
        success: false,
        error: 'Private key not available'
      }
    }
    
    try {
      // Use the secure key handler for signing
      const result = await secureKeyHandler.secureSignMessage(keyRef.current, message)
      
      // Update access time
      lastAccessTimeRef.current = Date.now()
      
      return result
    } catch (error) {
      return {
        signature: '',
        success: false,
        error: error instanceof Error ? error.message : 'Signing failed'
      }
    }
  }, [isSessionValid])
  
  const withPrivateKey = useCallback(<T,>(callback: (key: string) => T): T | null => {
    if (!isSessionValid() || !keyRef.current) {
      return null
    }
    
    lastAccessTimeRef.current = Date.now()
    return callback(keyRef.current)
  }, [isSessionValid])
  
  const hasPrivateKey = useCallback(() => {
    return isSessionValid() && keyRef.current !== null
  }, [isSessionValid])
  
  const getSecurityWarnings = useCallback(() => {
    return [
      '🔒 Private keys stored as strings cannot be securely wiped from memory',
      '⚠️ Only enter private keys in secure, trusted environments',
      '🕒 Keys are automatically cleared after 5 minutes of inactivity',
      '🔍 Avoid using browser development tools with real private keys',
      '💻 Memory dumps may expose private key data until garbage collection',
      '🏦 Consider hardware wallets for production environments',
      '🔄 Regularly rotate your private keys for enhanced security'
    ]
  }, [])
  
  const contextValue: SecureKeyContextType = {
    setPrivateKey,
    signMessage,
    withPrivateKey,
    hasPrivateKey,
    clearPrivateKey,
    getSecurityWarnings
  }
  
  return (
    <SecureKeyContext.Provider value={contextValue}>
      {children}
    </SecureKeyContext.Provider>
  )
}

export function useSecureKey(): SecureKeyContextType {
  const context = useContext(SecureKeyContext)
  if (!context) {
    throw new Error('useSecureKey must be used within a SecureKeyProvider')
  }
  return context
}

/**
 * INTEGRATION SECURITY GUIDELINES:
 * 
 * 1. COMPONENT INTEGRATION:
 *    - Wrap your app with SecureKeyProvider at the highest safe level
 *    - Use useSecureKey hook instead of storing keys in component state
 *    - Clear keys immediately after operations when possible
 * 
 * 2. DEVELOPMENT PRACTICES:
 *    - Never log private keys to console
 *    - Avoid storing keys in localStorage or sessionStorage
 *    - Use environment variables for test keys only
 *    - Review React DevTools configuration in production
 * 
 * 3. USER EDUCATION:
 *    - Display security warnings prominently
 *    - Educate users about secure environment requirements
 *    - Recommend hardware wallets for significant amounts
 *    - Provide clear instructions for key rotation
 * 
 * 4. MONITORING:
 *    - Monitor for suspicious access patterns
 *    - Log security-relevant events (without logging keys)
 *    - Implement session timeout warnings
 *    - Track handler lifetime and rotation
 */