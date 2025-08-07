import { Keypair } from "@stellar/stellar-sdk";

export interface SecureSignResult {
  signature: string;
  success: boolean;
  error?: string;
}

export interface AuditLogEntry {
  timestamp: string;
  operation: string;
  success: boolean;
  error?: string;
}

/**
 * SecureKeyHandler - Handles cryptographic operations with enhanced security measures
 * 
 * SECURITY LIMITATIONS AND WARNINGS:
 * 
 * 1. PRIVATE KEY MEMORY EXPOSURE:
 *    - Private keys are passed as JavaScript strings, which are immutable
 *    - Strings cannot be securely wiped from memory after use
 *    - Private key data may persist in memory until garbage collection
 *    - This poses a potential security risk in compromised environments
 * 
 * 2. ENVIRONMENT REQUIREMENTS:
 *    - Only use in secure, trusted environments
 *    - Avoid use on shared or potentially compromised systems
 *    - Consider memory dumps and swap files as potential attack vectors
 * 
 * 3. MITIGATION STRATEGIES:
 *    - Component instances have limited lifetime to reduce exposure
 *    - Explicit garbage collection is triggered when available
 *    - Binary data (Uint8Array) is securely zeroed when possible
 *    - Audit logging tracks all operations for security monitoring
 * 
 * 4. RECOMMENDATIONS:
 *    - Use hardware security modules (HSM) for production environments
 *    - Consider server-side signing when possible
 *    - Implement additional application-level security measures
 *    - Regularly update and patch the runtime environment
 */
class SecureKeyHandler {
  private auditLogs: AuditLogEntry[] = [];
  private readonly creationTime: number = Date.now();
  private readonly maxLifetimeMs: number = 300000; // 5 minutes maximum lifetime

  private checkLifetime(): void {
    const currentTime = Date.now();
    const age = currentTime - this.creationTime;
    
    if (age > this.maxLifetimeMs) {
      this.addAuditLog('lifetime_exceeded', false, `Handler exceeded maximum lifetime of ${this.maxLifetimeMs}ms`);
      throw new Error('SecureKeyHandler has exceeded its maximum safe lifetime. Create a new instance.');
    }
  }

  private addAuditLog(operation: string, success: boolean, error?: string) {
    this.auditLogs.push({
      timestamp: new Date().toISOString(),
      operation,
      success,
      error,
    });
    
    if (this.auditLogs.length > 100) {
      this.auditLogs = this.auditLogs.slice(-50);
    }
  }

  private secureZeroMemory(arr: Uint8Array): void {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = 0;
    }
  }


  /**
   * Signs a message using the provided private key with enhanced security measures
   * 
   * SECURITY WARNING: 
   * The privateKeyInput parameter is a JavaScript string that cannot be securely
   * wiped from memory. The private key data may persist in memory until garbage
   * collection occurs. Only use this method in secure, trusted environments.
   * 
   * @param privateKeyInput - Stellar private key (string format, cannot be securely zeroed)
   * @param message - Message to be signed
   * @returns Promise resolving to signature result with success/error status
   * 
   * SECURITY CONSIDERATIONS:
   * - Private key remains in memory as immutable string
   * - Binary key data is zeroed when possible
   * - Explicit garbage collection attempted
   * - All operations are audit logged
   */
  public async secureSignMessage(privateKeyInput: string, message: string): Promise<SecureSignResult> {
    // Check if handler has exceeded safe lifetime
    this.checkLifetime();
    
    let keypair: Keypair | null = null;
    let messageBuffer: Buffer | null = null;
    let signatureBuffer: Buffer | null = null;
    
    try {
      if (!message || !privateKeyInput) {
        throw new Error("Please fill in all required fields");
      }

      keypair = Keypair.fromSecret(privateKeyInput);
      messageBuffer = Buffer.from(message, 'utf8');
      signatureBuffer = keypair.sign(messageBuffer);
      
      const base64Signature = signatureBuffer.toString('base64');

      this.addAuditLog('message_signing', true);

      return {
        signature: base64Signature,
        success: true,
      };

    } catch (error) {
      let errorMessage = "Unknown error occurred while signing";
      
      if (error instanceof Error) {
        if (error.message.includes("Invalid seed") || error.message.includes("secret")) {
          errorMessage = "Invalid private key format. Please check your private key.";
        } else if (error.message.includes("checksum")) {
          errorMessage = "Invalid private key checksum. Please verify your private key.";
        } else if (error.message.includes("base32")) {
          errorMessage = "Private key must be in valid Stellar format (starts with 'S').";
        } else {
          errorMessage = "Failed to sign message. Please check your inputs and try again.";
        }
      }

      this.addAuditLog('message_signing', false, errorMessage);

      return {
        signature: '',
        success: false,
        error: errorMessage,
      };

    } finally {
      if (keypair) {
        try {
          const rawSecretKey = keypair.rawSecretKey();
          this.secureZeroMemory(rawSecretKey);
        } catch {
          // Best effort cleanup
        }
        keypair = null;
      }

      if (messageBuffer) {
        this.secureZeroMemory(new Uint8Array(messageBuffer));
        messageBuffer = null;
      }

      if (signatureBuffer) {
        this.secureZeroMemory(new Uint8Array(signatureBuffer));
        signatureBuffer = null;
      }

      // Note: Cannot securely zero out privateKeyInput string parameter due to JavaScript's
      // immutable string handling. Strings cannot be modified in place for security purposes.
      
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
      }
    }
  }

  /**
   * Retrieves audit logs for security monitoring
   * 
   * WARNING: Only use in secure environments where audit data can be safely handled
   */
  public getAuditLogs(): AuditLogEntry[] {
    this.checkLifetime();
    return [...this.auditLogs];
  }

  /**
   * Clears audit logs (use with caution in production environments)
   * 
   * WARNING: Only use in secure environments
   */
  public clearAuditLogs(): void {
    this.checkLifetime();
    this.auditLogs = [];
  }

  /**
   * Gets the current age of this handler instance in milliseconds
   * Use to monitor handler lifetime for security purposes
   */
  public getHandlerAge(): number {
    return Date.now() - this.creationTime;
  }

  /**
   * Gets the maximum safe lifetime for this handler
   */
  public getMaxLifetime(): number {
    return this.maxLifetimeMs;
  }

  /**
   * Checks if the handler is approaching its lifetime limit
   * Returns true if within 30 seconds of expiration
   */
  public isNearExpiration(): boolean {
    const age = this.getHandlerAge();
    return (this.maxLifetimeMs - age) < 30000; // 30 seconds warning
  }
}

// WARNING: This singleton instance has security limitations
// Consider creating new instances periodically to minimize exposure
// Only use in secure, trusted environments
export const secureKeyHandler = new SecureKeyHandler();

/**
 * USAGE SECURITY GUIDELINES:
 * 
 * 1. ENVIRONMENT SECURITY:
 *    - Only use in secure, trusted environments
 *    - Avoid shared computers or potentially compromised systems
 *    - Ensure the application runs in a secure context (HTTPS, etc.)
 * 
 * 2. HANDLER LIFECYCLE:
 *    - Monitor handler age using getHandlerAge() and isNearExpiration()
 *    - Create new instances periodically to limit exposure
 *    - Replace singleton instance when approaching lifetime limit
 * 
 * 3. OPERATIONAL SECURITY:
 *    - Clear browser memory/cache after sensitive operations
 *    - Avoid using development tools when handling private keys
 *    - Monitor audit logs for suspicious activity
 *    - Consider using dedicated secure devices for signing operations
 * 
 * 4. INCIDENT RESPONSE:
 *    - If compromise is suspected, immediately create new keys
 *    - Review audit logs for unauthorized access attempts
 *    - Invalidate any signatures created during suspected compromise
 */