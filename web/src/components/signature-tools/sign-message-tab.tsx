"use client";

import { useState } from "react";
import { Keypair } from "@stellar/stellar-sdk";
import {
  Lock,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  CheckCircle,
  FileCheck,
  Copy,
  CheckCircle2,
} from "lucide-react";

export function SignMessageTab() {
  const [message, setMessage] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [signature, setSignature] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedSuccessfully, setSignedSuccessfully] = useState(false);

  const handleSignMessage = async () => {
    setIsLoading(true);
    setError(null);
    setSignature("");
    setSignedSuccessfully(false);

    try {
      if (!message || !privateKey) {
        throw new Error("Please fill in all required fields");
      }

      console.log('Attempting to sign message with:', {
        privateKeyLength: privateKey.length,
        messageLength: message.length
      });

      // Create keypair from private key (secret key)
      const keypair = Keypair.fromSecret(privateKey);
      
      // Log information for debugging
      console.log('Successfully created keypair');
      console.log('Derived public key:', keypair.publicKey());

      // Create message buffer from UTF-8 string
      const messageBuffer = Buffer.from(message, 'utf8');
      console.log('Message buffer created:', messageBuffer.length, 'bytes');

      // Sign the message
      const signatureBuffer = keypair.sign(messageBuffer);
      console.log('Signature buffer created:', signatureBuffer.length, 'bytes');

      // Convert to base64
      const base64Signature = signatureBuffer.toString('base64');
      console.log('Base64 signature length:', base64Signature.length);
      
      setSignature(base64Signature);
      setSignedSuccessfully(true);
    } catch (error) {
      console.error("Error signing message:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred while signing");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessage("");
    setPrivateKey("");
    setSignature("");
    setError(null);
    setSignedSuccessfully(false);
  };

  const handleCopySignature = () => {
    if (signature) {
      navigator.clipboard.writeText(signature);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-lg shadow-lg p-6">
        <div>
          <h2 className="text-xl font-bold mb-1">Sign a Message</h2>
          <p className="text-sm text-gray-400 mb-6">
            Create a cryptographic signature using your private key
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-200"
            >
              Message
            </label>
            <textarea
              id="message"
              placeholder="Enter the message you want to sign"
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-gray-300 h-24 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-colors"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="privateKey"
              className="block text-sm font-medium text-gray-200"
            >
              Private Key
            </label>
            <input
              id="privateKey"
              type="password"
              placeholder="Enter your private key"
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-colors"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
            />
            <p className="text-amber-400 text-xs flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Warning: Never share your private key with anyone
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-200 p-3 rounded flex items-center text-sm">
              <AlertTriangle size={16} className="mr-2" />
              {error}
            </div>
          )}

          {/* Success Display */}
          {signedSuccessfully && signature && (
            <div className="bg-green-900/30 border border-green-700 text-green-200 p-3 rounded flex items-center text-sm">
              <CheckCircle2 size={16} className="mr-2" />
              Message signed successfully! Your signature is ready to use.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSignMessage}
              disabled={isLoading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded flex items-center justify-center transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing...
                </span>
              ) : (
                <span className="flex items-center">
                  <Lock className="mr-2" size={16} />
                  Sign Message
                </span>
              )}
            </button>
            <button
              onClick={handleReset}
              className="bg-transparent border border-gray-700 hover:bg-gray-800 text-gray-300 py-3 px-4 rounded flex items-center justify-center transition-colors"
            >
              <RefreshCw size={16} />
              <span className="ml-2">Reset</span>
            </button>
          </div>

          {signature && (
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Generated Signature (Base64):
              </label>
              <div className="relative">
                <textarea
                  value={signature}
                  readOnly
                  className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-gray-300 h-24 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-purple-400 transition-colors"
                />
                <button
                  onClick={handleCopySignature}
                  className="absolute right-2 top-2 p-2 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
                  title="Copy signature"
                >
                  <Copy size={16} className="text-gray-400" />
                </button>
              </div>
              <p className="text-xs text-gray-500">
                This signature can be used to verify the message was signed by the owner of the private key.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-800 rounded-lg shadow-lg p-4">
          <div className="flex items-center mb-2">
            <ShieldCheck size={18} className="text-purple-400 mr-2" />
            <h3 className="font-medium text-gray-200">Security First</h3>
          </div>
          <p className="text-sm text-gray-400">
            All cryptographic operations are performed locally in your browser.
            Your private keys never leave your device.
          </p>
        </div>

        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-800 rounded-lg shadow-lg p-4">
          <div className="flex items-center mb-2">
            <CheckCircle size={18} className="text-purple-400 mr-2" />
            <h3 className="font-medium text-gray-200">Blockchain Compatible</h3>
          </div>
          <p className="text-sm text-gray-400">
            Our tools are compatible with major blockchain standards including
            Ethereum, Bitcoin, and Stellar.
          </p>
        </div>

        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-800 rounded-lg shadow-lg p-4">
          <div className="flex items-center mb-2">
            <FileCheck size={18} className="text-purple-400 mr-2" />
            <h3 className="font-medium text-gray-200">Verify Anything</h3>
          </div>
          <p className="text-sm text-gray-400">
            From simple messages to complex transactions, verify signatures and
            prove ownership of blockchain assets.
          </p>
        </div>
      </div>
    </div>
  );
}
