"use client";

import { useState, useEffect, useRef } from "react";
import { Keypair } from "@stellar/stellar-sdk";
import { secureKeyHandler } from "@/lib/secure-key-handler";
import {
  validateStellarSecretKey,
  getValidationClassName,
} from "@/lib/stellar/validation";
import {
  processStellarError,
  getStellarErrorMessage,
  getStellarErrorSuggestions,
} from "@/lib/stellar/error-handler";
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
  const [errorSuggestions, setErrorSuggestions] = useState<string[]>([]);
  const [signedSuccessfully, setSignedSuccessfully] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [privateKeyValidation, setPrivateKeyValidation] = useState<{
    isValid: boolean;
    error?: string;
  } | null>(null);

  const privateKeyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (privateKey.trim()) {
      const validation = validateStellarSecretKey(privateKey);
      setPrivateKeyValidation(validation);
    } else {
      setPrivateKeyValidation(null);
    }
  }, [privateKey]);

  const handleSignMessage = async () => {
    setIsLoading(true);
    setError(null);
    setErrorSuggestions([]);
    setSignature("");
    setSignedSuccessfully(false);
    setCopySuccess(false);

    try {
      const privateKeyValue = privateKeyInputRef.current?.value || "";

      if (!message || !privateKeyValue) {
        throw new Error("Please fill in all required fields");
      }

      const validation = validateStellarSecretKey(privateKeyValue);
      if (!validation.isValid) {
        throw new Error(validation.error || "Invalid private key");
      }

      const result = await secureKeyHandler.secureSignMessage(
        privateKeyValue,
        message
      );

      if (result.success) {
        setSignature(result.signature);
        setSignedSuccessfully(true);
      } else {
        setError(result.error || "Failed to sign message");
      }

      if (privateKeyInputRef.current) {
        privateKeyInputRef.current.value = "";
      }
      setPrivateKey("");
    } catch (error) {
      if (error instanceof Error) {
        const stellarErrorMessage = getStellarErrorMessage(error, {
          operation: 'sign_message',
          additionalInfo: { messageLength: message.length }
        });
        const suggestions = getStellarErrorSuggestions(error, {
          operation: 'sign_message',
          additionalInfo: { messageLength: message.length }
        });
        
        setError(stellarErrorMessage);
        setErrorSuggestions(suggestions);
      } else {
        setError("Failed to sign message. Please check your inputs and try again.");
        setErrorSuggestions([
          'Verify your private key is correct',
          'Check that the message is not empty',
          'Try refreshing the page and trying again'
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessage("");
    if (privateKeyInputRef.current) {
      privateKeyInputRef.current.value = "";
    }
    setPrivateKey("");
    setSignature("");
    setError(null);
    setErrorSuggestions([]);
    setSignedSuccessfully(false);
    setCopySuccess(false);
  };

  const handleCopySignature = async () => {
    if (signature) {
      try {
        await navigator.clipboard.writeText(signature);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error("Failed to copy signature:", err);
        const error = err instanceof Error ? err : new Error("Clipboard operation failed");
        const stellarErrorMessage = getStellarErrorMessage(error, {
          operation: 'copy_signature'
        });
        const suggestions = getStellarErrorSuggestions(error, {
          operation: 'copy_signature'
        });
        
        setError(stellarErrorMessage);
        setErrorSuggestions(suggestions);
      }
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
              ref={privateKeyInputRef}
              type="password"
              placeholder="Enter your private key"
              className={`w-full p-3 bg-gray-900 rounded text-gray-300 focus:outline-none focus:ring-1 transition-colors ${
                getValidationClassName(
                  privateKeyValidation?.isValid,
                  privateKey.length > 0
                )
              } ${
                privateKeyValidation?.isValid === false
                  ? "focus:ring-red-400"
                  : "focus:ring-purple-400"
              }`}
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
            />
            <div className="space-y-1">
              {privateKeyValidation && !privateKeyValidation.isValid && (
                <p className="text-red-400 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {privateKeyValidation.error}
                </p>
              )}
              {privateKeyValidation?.isValid && (
                <p className="text-green-400 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Valid Stellar secret key
                </p>
              )}
              <p className="text-amber-400 text-xs flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Warning: Never share your private key with anyone
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-200 p-4 rounded space-y-3">
              <div className="flex items-start text-sm">
                <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium mb-2">{error}</p>
                  {errorSuggestions.length > 0 && (
                    <div>
                      <p className="text-red-300 text-xs mb-2 font-medium">Suggested solutions:</p>
                      <ul className="text-red-300 text-xs space-y-1">
                        {errorSuggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
                  className={`absolute right-2 top-2 p-2 rounded-md transition-colors ${
                    copySuccess
                      ? "bg-green-700 hover:bg-green-600"
                      : "bg-gray-800 hover:bg-gray-700"
                  }`}
                  title={copySuccess ? "Copied!" : "Copy signature"}
                >
                  {copySuccess ? (
                    <CheckCircle2 size={16} className="text-green-200" />
                  ) : (
                    <Copy size={16} className="text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                This signature can be used to verify the message was signed by
                the owner of the private key.
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
