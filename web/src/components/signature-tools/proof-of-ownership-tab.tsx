import { useState } from "react";
import { Keypair } from "@stellar/stellar-sdk";
import { Shield, AlertTriangle, RefreshCw, Copy, Lock } from "lucide-react";

const DEFAULT_MESSAGE = "I am the owner of this Stellar public key";

export function ProofOfOwnershipTab() {
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [signature, setSignature] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"success" | "error" | null>(null);
  const [mode, setMode] = useState<"verify" | "generate">("generate");

  const handleGenerateProof = async () => {
    setIsLoading(true);
    setError(null);
    setSignature("");

    try {
      if (!publicKey || !secretKey || !message) {
        throw new Error("Please fill in all required fields");
      }

      console.log('Attempting to generate proof with:', {
        publicKeyLength: publicKey.length,
        secretKeyLength: secretKey.length,
        messageLength: message.length
      });

      // Create keypair from secret key
      const keypair = Keypair.fromSecret(secretKey);
      
      // Log information for debugging
      console.log('Successfully created keypair');
      console.log('Derived public key:', keypair.publicKey());
      console.log('Provided public key:', publicKey);
      console.log('Keys match:', keypair.publicKey() === publicKey);

      // Create message buffer
      const messageBuffer = Buffer.from(message);
      console.log('Message buffer created:', messageBuffer.length, 'bytes');

      // Sign the message
      const signatureBuffer = keypair.sign(messageBuffer);
      console.log('Signature buffer created:', signatureBuffer.length, 'bytes');

      // Convert to base64
      const base64Signature = signatureBuffer.toString('base64');
      console.log('Base64 signature length:', base64Signature.length);
      
      setSignature(base64Signature);
    } catch (error) {
      console.error("Error generating proof:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySignature = () => {
    setIsLoading(true);
    setError(null);
    setVerificationStatus(null);

    try {
      if (!publicKey || !message || !signature) {
        throw new Error("Please fill in all required fields");
      }

      console.log('Verifying signature with:', {
        publicKeyLength: publicKey.length,
        messageLength: message.length,
        signatureLength: signature.length
      });

      // Convert inputs to proper buffers
      const messageBuffer = Buffer.from(message);
      console.log('Message buffer created:', messageBuffer.length, 'bytes');

      const signatureBuffer = Buffer.from(signature, 'base64');
      console.log('Signature buffer decoded:', signatureBuffer.length, 'bytes');

      // Verify the signature using Stellar SDK
      const keypair = Keypair.fromPublicKey(publicKey);
      console.log('Keypair created from public key');

      const isValid = keypair.verify(messageBuffer, signatureBuffer);
      console.log('Signature verification result:', isValid);

      if (isValid) {
        setVerificationStatus("success");
        setError(null);
      } else {
        setVerificationStatus("error");
        throw new Error("Invalid signature - The signature does not match the provided public key and message");
      }
    } catch (error) {
      console.error("Error verifying signature:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      setVerificationStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySignature = () => {
    navigator.clipboard.writeText(signature);
  };

  const handleReset = () => {
    setPublicKey("");
    setSecretKey("");
    setMessage(DEFAULT_MESSAGE);
    setSignature("");
    setError(null);
    setVerificationStatus(null);
    setMode("generate");
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-lg shadow-lg p-6">
        <div>
          <h2 className="text-xl font-bold mb-1">Proof of Ownership</h2>
          <p className="text-sm text-gray-400 mb-2">
            Generate or verify proof that you own a Stellar public key
          </p>
          
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setMode("generate")}
              className={`px-4 py-2 rounded-md text-sm ${
                mode === "generate"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              Generate Proof
            </button>
            <button
              onClick={() => setMode("verify")}
              className={`px-4 py-2 rounded-md text-sm ${
                mode === "verify"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              Verify Proof
            </button>
          </div>
        </div>

        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="text-red-400 mr-2" size={20} />
            <p className="text-red-200 text-sm">
              Anyone with this proof can confirm you own this public key
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="publicKey"
              className="block text-sm font-medium text-gray-200"
            >
              Stellar Public Key
            </label>
            <input
              id="publicKey"
              placeholder="Enter your Stellar public key"
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-colors"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
            />
          </div>

          {mode === "generate" && (
            <div className="space-y-2">
              <label
                htmlFor="secretKey"
                className="block text-sm font-medium text-gray-200"
              >
                Secret Key
              </label>
              <div className="relative">
                <input
                  id="secretKey"
                  type="password"
                  placeholder="Enter your secret key"
                  className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-colors"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                />
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-200"
            >
              Message
            </label>
            <textarea
              id="message"
              placeholder="Enter the message to sign"
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-gray-300 h-24 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-colors"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {(mode === "verify" || signature) && (
            <div className="space-y-2">
              <label
                htmlFor="signature"
                className="block text-sm font-medium text-gray-200"
              >
                Signature
              </label>
              <div className="relative">
                <textarea
                  id="signature"
                  placeholder={mode === "verify" ? "Enter the signature to verify" : "Generated signature will appear here"}
                  className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-gray-300 h-24 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-colors"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  readOnly={mode === "generate"}
                />
                {mode === "generate" && signature && (
                  <button
                    onClick={handleCopySignature}
                    className="absolute right-2 top-2 p-2 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
                    title="Copy signature"
                  >
                    <Copy size={16} className="text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          )}

          {(error || verificationStatus) && (
            <div className={`${
              verificationStatus === "success" 
                ? "bg-green-900/30 border-green-700" 
                : "bg-red-900/30 border-red-700"
              } border rounded-lg p-4`}>
              <div className="flex items-center">
                {verificationStatus === "success" ? (
                  <>
                    <Shield className="text-green-400 mr-2" size={16} />
                    <p className="text-green-200 text-sm">
                      Signature verification successful! The proof of ownership is valid.
                    </p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="text-red-400 mr-2" size={16} />
                    <p className="text-red-200 text-sm">{error}</p>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={mode === "generate" ? handleGenerateProof : handleVerifySignature}
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
                  {mode === "generate" ? "Generating..." : "Verifying..."}
                </span>
              ) : (
                <span className="flex items-center">
                  <Shield className="mr-2" size={16} />
                  {mode === "generate" ? "Generate Proof" : "Verify Proof"}
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
        </div>
      </div>
    </div>
  );
}