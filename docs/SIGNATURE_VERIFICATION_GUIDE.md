# Signature Verification Guide

## Overview

The Verify Signature tool in Galaxy Smart Wallet allows you to verify the authenticity of signed messages using Stellar public keys and digital signatures. All operations are performed locally in your browser for maximum security.

## Features

- ✅ **Stellar Blockchain Support**: Specifically designed for Stellar blockchain signatures
- 🔒 **Local Processing**: All cryptographic operations happen in your browser
- 🛡️ **Input Validation**: Comprehensive validation for public keys and signatures
- 🎨 **Visual Feedback**: Clear success/failure indicators with appropriate styling
- 🔄 **Reset Functionality**: Easy form reset with a single click

## How to Use

### 1. Access the Tool

Navigate to the Signature and Verification Tools page and click on the "Verify Signature" tab.

### 2. Enter the Message

In the "Message" field, enter the original message that was signed. This should be the exact text that was used to create the signature.

**Example:**
```
Hello, Stellar! This is a test message for signature verification.
```

### 3. Enter the Public Key

In the "Public Key" field, enter the Stellar public key that was used to create the signature.

**Format:** Stellar public keys start with 'G' and are 56 characters long.

**Example:**
```
GBNFGPCP64LYNQPHCONQ2HV5TU6N4GM6G7BFL3RS2LVRSOQ5AF4RCMA6
```

### 4. Enter the Signature

In the "Signature" field, enter the base64-encoded signature that you want to verify.

**Example:**
```
YI2vZTqUHKsbfYlprzspprani73VQi10QWNsA5fG2eFv8+4TkQ2UJ808cMYs+RhAxYCar9MybcwaUFjKSmmLBQ==
```

### 5. Verify the Signature

Click the "Verify Signature" button to perform the verification. The system will:

1. Validate the input format
2. Create a Keypair from the public key
3. Convert the message to UTF-8 bytes
4. Convert the signature from base64 to bytes
5. Verify the signature using Stellar's cryptographic functions

### 6. Review the Results

- **✅ Valid Signature**: Green indicator with "Signature is Valid ✅"
- **❌ Invalid Signature**: Red indicator with "Signature is Invalid ❌" and error details
- **⚠️ Input Errors**: Red error messages for malformed inputs

## Input Validation

### Public Key Validation
- Must start with 'G'
- Must be exactly 56 characters long
- Must be a valid Stellar public key format

### Signature Validation
- Must be valid base64-encoded data
- Must be a proper signature format

### Message Validation
- Cannot be empty
- Supports UTF-8 encoding

## Technical Details

### Cryptographic Operations

The verification process uses the `@stellar/stellar-sdk` library:

```typescript
// Create Keypair from public key
const keypair = Keypair.fromPublicKey(publicKey);

// Convert message to Buffer (UTF-8)
const messageBuffer = Buffer.from(message, 'utf8');

// Convert signature from base64 to Buffer
const signatureBuffer = Buffer.from(signature, 'base64');

// Verify the signature
const isValid = keypair.verify(messageBuffer, signatureBuffer);
```

### Security Features

- **Local Processing**: No data is sent to external servers
- **Input Sanitization**: All inputs are validated before processing
- **Error Handling**: Comprehensive error handling prevents crashes
- **Memory Safety**: Proper buffer management and cleanup

## Error Messages

| Error | Description | Solution |
|-------|-------------|----------|
| "Message is required" | Message field is empty | Enter the original message |
| "Public key is required" | Public key field is empty | Enter the Stellar public key |
| "Signature is required" | Signature field is empty | Enter the base64 signature |
| "Invalid Stellar public key format" | Public key doesn't match Stellar format | Ensure key starts with 'G' and is 56 characters |
| "Invalid signature format" | Signature is not valid base64 | Check signature encoding |
| "Verification failed" | Cryptographic verification failed | Check if message, key, and signature match |

## Testing

You can test the verification with the provided test data:

**Message:**
```
Hello, Stellar! This is a test message for signature verification.
```

**Public Key:**
```
GBNFGPCP64LYNQPHCONQ2HV5TU6N4GM6G7BFL3RS2LVRSOQ5AF4RCMA6
```

**Signature:**
```
YI2vZTqUHKsbfYlprzspprani73VQi10QWNsA5fG2eFv8+4TkQ2UJ808cMYs+RhAxYCar9MybcwaUFjKSmmLBQ==
```

This combination should result in a valid signature verification.

## Browser Compatibility

The tool works in all modern browsers that support:
- ES6+ JavaScript features
- Web Crypto API (for base64 operations)
- Buffer API (provided by Node.js polyfills in Next.js)

## Troubleshooting

### Common Issues

1. **"Invalid public key format"**
   - Ensure the public key starts with 'G'
   - Check that it's exactly 56 characters long
   - Verify it's a valid Stellar public key

2. **"Invalid signature format"**
   - Ensure the signature is properly base64-encoded
   - Check for any extra characters or spaces
   - Verify the signature wasn't corrupted during copy/paste

3. **"Verification failed"**
   - Double-check that the message matches exactly what was signed
   - Ensure the public key corresponds to the private key used for signing
   - Verify the signature is complete and not truncated

### Getting Help

If you encounter issues not covered in this guide:
1. Check the browser console for detailed error messages
2. Verify your inputs match the expected format
3. Try with the test data provided above
4. Contact support if the issue persists

## Security Notes

- Never share your private keys
- Always verify signatures before trusting messages
- The tool only verifies signatures; it cannot create them
- All operations are performed locally for maximum privacy 