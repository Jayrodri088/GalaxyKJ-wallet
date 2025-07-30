"use client";

import React, { useState } from "react";
import { Keypair } from "@stellar/stellar-sdk";
import { CheckCircle, RefreshCw, AlertTriangle, Shield, FileCheck, Lock } from "lucide-react";

interface VerifySignatureForm {
  message: string;
  publicKey: string;
  signature: string;
}

const initialState: VerifySignatureForm = {
  message: "",
  publicKey: "",
  signature: "",
};

const VerifySignatureTab: React.FC = () => {
  const [form, setForm] = useState<VerifySignatureForm>(initialState);
  const [result, setResult] = useState<null | boolean>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear previous results when user starts typing
    setError(null);
    setResult(null);
  };

  const resetForm = () => {
    setForm(initialState);
    setResult(null);
    setError(null);
  };

  const validateInputs = (): string | null => {
    if (!form.message.trim()) {
      return "Message is required.";
    }
    
    if (!form.publicKey.trim()) {
      return "Public key is required.";
    }
    
    if (!form.signature.trim()) {
      return "Signature is required.";
    }

    // Validate Stellar public key format (G...)
    if (!form.publicKey.startsWith('G') || form.publicKey.length !== 56) {
      return "Invalid Stellar public key format. Expected a 56-character key starting with 'G'.";
    }

    // Additional validation for public key format
    if (!/^G[A-Z2-7]{55}$/.test(form.publicKey)) {
      return "Invalid Stellar public key format. The key contains invalid characters.";
    }

    // Validate base64 signature format
    try {
      // Check if it's valid base64
      const decoded = atob(form.signature);
      // Check if decoded signature has reasonable size (Stellar signatures are typically 64 bytes)
      if (decoded.length < 32 || decoded.length > 128) {
        return "Invalid signature size. Expected a base64-encoded signature of reasonable length.";
      }
    } catch {
      return "Invalid signature format. Expected base64-encoded signature.";
    }

    return null;
  };

  const verifySignature = async () => {
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Create Keypair from public key
      const keypair = Keypair.fromPublicKey(form.publicKey);
      
      // Convert message to Buffer (UTF-8)
      const messageBuffer = Buffer.from(form.message, 'utf8');
      
      // Convert signature from base64 to Buffer
      const signatureBuffer = Buffer.from(form.signature, 'base64');
      
      // Verify the signature
      const isValid = keypair.verify(messageBuffer, signatureBuffer);
      
      setResult(isValid);
      
      if (!isValid) {
        setError("Signature verification failed. The signature does not match the message and public key.");
      }
    } catch (err) {
      console.error("Verification error:", err);
      
      // Set result to false for any verification error
      setResult(false);
      
      if (err instanceof Error) {
        // Handle specific Stellar SDK errors with user-friendly messages
        if (err.message.includes("bad signature size")) {
          setError("Invalid signature: The signature size is incorrect for this public key.");
        } else if (err.message.includes("invalid encoded string")) {
          setError("Invalid public key format: Please check that the public key is correct.");
        } else if (err.message.includes("signature")) {
          setError("Invalid signature format: Please check that the signature is properly base64-encoded.");
        } else if (err.message.includes("key")) {
          setError("Invalid public key: Please check that the Stellar public key is correct.");
        } else {
          setError(`Verification failed: ${err.message}`);
        }
      } else {
        setError("Verification failed: Unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-1">Verify Signature</h2>
      <p className="text-sm text-gray-400 mb-6">
        Verify the validity of a message using a Stellar public key and a signature.
      </p>

      <div className="space-y-4">
        {/* Message Input */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2 text-purple-400">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Enter the message that was signed"
            className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-gray-300 h-24 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-colors resize-none"
            rows={4}
          />
        </div>

        {/* Public Key Input */}
        <div>
          <label htmlFor="publicKey" className="block text-sm font-medium mb-2 text-purple-400">
            Public Key
          </label>
          <input
            id="publicKey"
            name="publicKey"
            type="text"
            value={form.publicKey}
            onChange={handleChange}
            placeholder="Enter the Stellar public key used for verification"
            className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-colors"
          />
        </div>

        {/* Signature Input */}
        <div>
          <label htmlFor="signature" className="block text-sm font-medium mb-2 text-purple-400">
            Signature
          </label>
          <textarea
            id="signature"
            name="signature"
            value={form.signature}
            onChange={handleChange}
            placeholder="Enter the base64-encoded signature to verify"
            className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-gray-300 h-20 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-colors resize-none"
            rows={3}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded flex items-center text-sm">
            <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success/Failure Display */}
        {result !== null && (
          <div className={`p-4 rounded-lg text-center font-semibold ${
            result 
              ? "bg-green-900/50 border border-green-700 text-green-300" 
              : "bg-red-900/50 border border-red-700 text-red-300"
          }`}>
            <div className="flex items-center justify-center">
              {result ? (
                <CheckCircle size={20} className="mr-2" />
              ) : (
                <AlertTriangle size={20} className="mr-2" />
              )}
              <span>
                {result ? "Signature is Valid ✅" : "Signature is Invalid ❌"}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={verifySignature}
            disabled={isLoading}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <CheckCircle size={16} className="mr-2" />
            )}
            {isLoading ? "Verifying..." : "Verify Signature"}
          </button>
          <button
            onClick={resetForm}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 py-3 px-4 rounded flex items-center justify-center transition-colors"
          >
            <RefreshCw size={16} className="mr-2" />
            Reset
          </button>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-800 rounded-lg shadow-lg p-4">
          <div className="flex items-center mb-2">
            <Lock size={18} className="text-purple-400 mr-2" />
            <h3 className="font-medium text-gray-200">Security First</h3>
          </div>
          <p className="text-sm text-gray-400">
            All cryptographic operations are performed locally in your browser. Your private keys never leave your device.
          </p>
        </div>

        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-800 rounded-lg shadow-lg p-4">
          <div className="flex items-center mb-2">
            <Shield size={18} className="text-purple-400 mr-2" />
            <h3 className="font-medium text-gray-200">Stellar Compatible</h3>
          </div>
          <p className="text-sm text-gray-400">
            Our verification tools are specifically designed for Stellar blockchain signatures and public keys.
          </p>
        </div>

        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-800 rounded-lg shadow-lg p-4">
          <div className="flex items-center mb-2">
            <FileCheck size={18} className="text-purple-400 mr-2" />
            <h3 className="font-medium text-gray-200">Verify Anything</h3>
          </div>
          <p className="text-sm text-gray-400">
            From simple messages to complex transactions, verify signatures and prove ownership of Stellar assets.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifySignatureTab;
