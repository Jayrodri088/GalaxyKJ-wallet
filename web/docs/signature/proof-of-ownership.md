# Proof of Ownership Feature Documentation

## Overview
The Proof of Ownership feature allows users to cryptographically prove they own a Stellar public key by generating a signature over a predefined message using their secret key.

## Functionality
The feature provides two main operations:
1. **Generate Proof**: Create a cryptographic signature using a Stellar secret key
2. **Verify Proof**: Validate a signature against a public key and message

## Technical Implementation

### Core Components
- Located in: `src/components/signature-tools/proof-of-ownership-tab.tsx`
- Uses `@stellar/stellar-sdk` for cryptographic operations
- All operations performed locally in the browser

### Key Features
- Default message: "I am the owner of this Stellar public key"
- Base64 signature encoding
- Secure secret key input field
- Copy signature functionality
- Clear success/error feedback
- Form validation and error handling

### Security Considerations
- Private keys never leave the browser
- All cryptographic operations performed client-side
- Clear warning about signature sharing implications
- Password-masked secret key input

## Usage Guide

### Generating a Proof
1. Select "Generate Proof" mode
2. Enter your Stellar public key
3. Enter your secret key (starts with 'S')
4. The default message will be pre-filled
5. Click "Generate Proof"
6. Copy the generated signature

### Verifying a Proof
1. Select "Verify Proof" mode
2. Enter the public key
3. Enter/confirm the message
4. Paste the signature
5. Click "Verify Proof"
6. Check the verification result

## Example

```typescript
// Example values for testing
const publicKey = "GBEP36YVDN5MCFT3HRCHLPCCHWF7XQCSFQPVFYSG4LD4DSKSYZ4CRF4Z";
const message = "I am the owner of this Stellar public key";
// Secret key (never share or commit this)
const secretKey = "SBMV4ZUDGWRXD3HLWFHXJYXFAHXQXS2JRGP2OSJPJ4LRXTTEXJVHRRXG";
```

## Error Handling
The component handles various error cases:
- Invalid or missing input fields
- Invalid secret key format
- Secret key not matching public key
- Invalid signature format
- Failed signature verification

## UI/UX Features
- Mode toggle between Generate/Verify
- Clear feedback messages
- Loading states during operations
- Copy to clipboard functionality
- Reset form capability
- Responsive design

## Development Decisions
1. Used `Buffer` for handling binary data
2. Implemented base64 encoding for signature transport
3. Added extensive error handling and user feedback
4. Maintained consistency with other signature tools
5. Focused on security and user experience

## Security Best Practices
- Never store or transmit secret keys
- Clear form data on reset
- Warn users about signature sharing
- Validate key pair matching
- Secure input handling

## Future Improvements
- Add support for custom messages
- Include timestamp in signature
- Add signature expiration option
- Support batch verification
- Add QR code support for signatures