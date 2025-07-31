import { useState } from "react";
import { Keypair } from "@stellar/stellar-sdk";
import { Lock, AlertTriangle, RefreshCw, Key } from "lucide-react";

export function ProofOfOwnershipTab() {
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [signature, setSignature] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const defaultMessage = "I am the owner of this Stellar public key";

  const handleGenerateProof = () => {
    setIsLoading(true);

    try {
      // Validate inputs
      if (!publicKey || !secretKey) {
        alert("Please enter both public and secret keys");
        setIsLoading(false);
        return;
      }

      // Verify the secret key matches the public key
      const keypair = Keypair.fromSecret(secretKey);
      if (keypair.publicKey() !== publicKey) {
        alert("Secret key does not match the provided public key");
        setIsLoading(false);
        return;
      }

      // Sign the default message
      const signatureBuffer = keypair.sign(Buffer.from(defaultMessage));
      const base64Signature = signatureBuffer.toString('base64');

      setSignature(base64Signature);
    } catch (error) {
      console.error("Error generating proof:", error);
      alert("Failed to generate proof. Please check your keys.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPublicKey("");
    setSecretKey("");
    setSignature("");
  };

  const handleCopySignature = () => {
    if (signature) {
      navigator.clipboard.writeText(signature);
      alert("Signature copied to clipboard");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-lg shadow-lg p-6">
        <div>
          <h2 className="text-xl font-bold mb-1">Proof of Ownership</h2>
          <p className="text-sm text-gray-400 mb-6">
            Prove ownership of a Stellar public key by generating a cryptographic signature
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="publicKey"
              className="block text-sm font-medium text-gray-200"
            >
              Public Key
            </label>
            <input
              id="publicKey"
              placeholder="Enter your Stellar public key"
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-colors"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="secretKey"
              className="block text-sm font-medium text-gray-200"
            >
              Secret Key
            </label>
            <input
              id="secretKey"
              type="password"
              placeholder="Enter your Stellar secret key"
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-gray-300 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-colors"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
            />
            <p className="text-amber-400 text-xs flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Warning: Anyone with this proof can confirm you own this public key
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Proof Message
            </label>
            <div className="bg-gray-800/50 p-3 rounded border border-gray-700 text-gray-300">
              {defaultMessage}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleGenerateProof}
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
                  Generating Proof...
                </span>
              ) : (
                <span className="flex items-center">
                  <Key className="mr-2" size={16} />
                  Generate Proof
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
            <div className="mt-4 p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-200">
                  Generated Proof:
                </h3>
                <button
                  onClick={handleCopySignature}
                  className="text-xs bg-purple-600 hover:bg-purple-700 text-white py-1 px-2 rounded transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-300 break-all font-mono">
                {signature}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}