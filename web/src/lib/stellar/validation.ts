import { StrKey } from "@stellar/stellar-sdk";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface AddressValidationResult extends ValidationResult {
  type?: 'public_key' | 'muxed_account';
}

const STELLAR_PUBLIC_KEY_PATTERN = /^G[A-Z2-7]{55}$/;
const STELLAR_MUXED_ACCOUNT_PATTERN = /^M[A-Z2-7]{68}$/;

export function validateStellarAddress(address: string): AddressValidationResult {
  if (!address) {
    return {
      isValid: false,
      error: "Address is required"
    };
  }

  if (typeof address !== 'string') {
    return {
      isValid: false,
      error: "Address must be a string"
    };
  }

  const trimmedAddress = address.trim();

  if (trimmedAddress.length === 0) {
    return {
      isValid: false,
      error: "Address cannot be empty"
    };
  }

  try {
    if (STELLAR_PUBLIC_KEY_PATTERN.test(trimmedAddress)) {
      if (StrKey.isValidEd25519PublicKey(trimmedAddress)) {
        return {
          isValid: true,
          type: 'public_key'
        };
      } else {
        return {
          isValid: false,
          error: "Invalid Stellar address checksum"
        };
      }
    }

    if (STELLAR_MUXED_ACCOUNT_PATTERN.test(trimmedAddress)) {
      return {
        isValid: false,
        error: "Muxed accounts are not currently supported"
      };
    }

    if (trimmedAddress.startsWith('G')) {
      if (trimmedAddress.length !== 56) {
        return {
          isValid: false,
          error: `Invalid Stellar address length. Expected 56 characters, got ${trimmedAddress.length}`
        };
      }
      
      if (!STELLAR_PUBLIC_KEY_PATTERN.test(trimmedAddress)) {
        return {
          isValid: false,
          error: "Invalid Stellar address format. Must contain only uppercase letters and numbers 2-7"
        };
      }
      
      return {
        isValid: false,
        error: "Invalid Stellar address checksum"
      };
    }

    if (trimmedAddress.startsWith('M')) {
      if (trimmedAddress.length !== 69) {
        return {
          isValid: false,
          error: `Invalid muxed account length. Expected 69 characters, got ${trimmedAddress.length}`
        };
      }
      
      return {
        isValid: false,
        error: "Invalid muxed account checksum"
      };
    }

    return {
      isValid: false,
      error: "Invalid Stellar address format. Must start with 'G' (public key) or 'M' (muxed account)"
    };

  } catch {
    return {
      isValid: false,
      error: "Invalid Stellar address format"
    };
  }
}

export function validateStellarSecretKey(secretKey: string): ValidationResult {
  if (!secretKey) {
    return {
      isValid: false,
      error: "Secret key is required"
    };
  }

  if (typeof secretKey !== 'string') {
    return {
      isValid: false,
      error: "Secret key must be a string"
    };
  }

  const trimmedSecretKey = secretKey.trim();

  if (trimmedSecretKey.length === 0) {
    return {
      isValid: false,
      error: "Secret key cannot be empty"
    };
  }

  try {
    if (!trimmedSecretKey.startsWith('S')) {
      return {
        isValid: false,
        error: "Invalid secret key format. Must start with 'S'"
      };
    }

    if (trimmedSecretKey.length !== 56) {
      return {
        isValid: false,
        error: `Invalid secret key length. Expected 56 characters, got ${trimmedSecretKey.length}`
      };
    }

    if (!/^S[A-Z2-7]{55}$/.test(trimmedSecretKey)) {
      return {
        isValid: false,
        error: "Invalid secret key format. Must contain only uppercase letters and numbers 2-7"
      };
    }

    if (StrKey.isValidEd25519SecretSeed(trimmedSecretKey)) {
      return {
        isValid: true
      };
    } else {
      return {
        isValid: false,
        error: "Invalid secret key checksum"
      };
    }

  } catch {
    return {
      isValid: false,
      error: "Invalid secret key format"
    };
  }
}

export function getValidationClassName(isValid: boolean | undefined, hasValue: boolean): string {
  if (!hasValue) {
    return "border-gray-700";
  }
  
  return isValid ? "border-green-500 focus:ring-green-400" : "border-red-500 focus:ring-red-400";
}

export function formatStellarAddress(address: string): string {
  const trimmed = address.trim().toUpperCase();
  
  if (trimmed.length <= 12) {
    return trimmed;
  }
  
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-6)}`;
}