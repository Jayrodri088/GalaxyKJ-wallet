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

class SecureKeyHandler {
  private auditLogs: AuditLogEntry[] = [];

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

  private secureZeroString(str: string): void {
    if (typeof str === 'string' && str.replace) {
      try {
        str.replace(/./g, '\0');
      } catch {
        // Fallback - strings are immutable in JS but this is best effort
      }
    }
  }

  public async secureSignMessage(privateKeyInput: string, message: string): Promise<SecureSignResult> {
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

      this.secureZeroString(privateKeyInput);
      
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
      }
    }
  }

  public getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs];
  }

  public clearAuditLogs(): void {
    this.auditLogs = [];
  }
}

export const secureKeyHandler = new SecureKeyHandler();