import React, { useState, useEffect } from "react";
import {
  Lock,
  CheckCircle,
  Shield,
  RefreshCw,
  FileDigit,
  FileCheck,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { keccak256 } from "js-sha3";
import { SignMessageTab } from "@/components/signature-tools/sign-message-tab";
import VerifySignatureTab from "@/components/signature-tools/verify-signature-tab";
import { ProofOfOwnershipTab } from "@/components/signature-tools/proof-of-ownership-tab";

// Define supported algorithms compatible with SubtleCrypto and js-sha3
type Algorithm = "SHA-256" | "SHA-512" | "Keccak-256";
const algorithms: Algorithm[] = ["SHA-256", "SHA-512", "Keccak-256"];

const HashGeneratorTab: React.FC = () => {
  const [selectedAlgorithm, setSelectedAlgorithm] =
    useState<Algorithm>("SHA-256");
  const [inputText, setInputText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("Hash Generator");
  const [generatedHash, setGeneratedHash] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [starPositions, setStarPositions] = useState<
    { top: string; left: string }[]
  >([]);

  useEffect(() => {
    const positions = Array.from({ length: 50 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
    }));
    setStarPositions(positions);
  }, []);

  // Function to convert ArrayBuffer to Hex String
  const bufferToHex = (buffer: ArrayBuffer): string => {
    return Array.prototype.map
      .call(new Uint8Array(buffer), (x) => ("00" + x.toString(16)).slice(-2))
      .join("");
  };

  // Hashing function
  const handleGenerateHash = async () => {
    if (!inputText) {
      setError("Input text cannot be empty.");
      setGeneratedHash("");
      return;
    }
    setIsLoading(true);
    setError("");
    setGeneratedHash("");

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(inputText);
      let hashBuffer: ArrayBuffer | string;

      if (selectedAlgorithm === "Keccak-256") {
        // Use js-sha3 for Keccak-256
        hashBuffer = keccak256(data); // Returns hex string directly
        setGeneratedHash(hashBuffer as string);
      } else {
        // Use SubtleCrypto for SHA algorithms
        hashBuffer = await crypto.subtle.digest(selectedAlgorithm, data);
        setGeneratedHash(bufferToHex(hashBuffer));
      }
    } catch (err) {
      console.error("Hashing error:", err);
      setError(
        `Failed to generate hash: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Reset function
  const handleReset = () => {
    setInputText("");
    setGeneratedHash("");
    setError("");
    setSelectedAlgorithm("SHA-256"); // Reset algorithm to default
  };

  return (
    <div className="min-h-screen bg-opacity-95 text-gray-200 p-6 flex flex-col items-center relative overflow-hidden">
      {/* Stars background effect */}
      <div className="absolute inset-0 overflow-hidden">
        {starPositions.map((pos, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full w-1 h-1 opacity-30"
            style={{
              top: pos.top,
              left: pos.left,
            }}
          />
        ))}
      </div>

      <div className="z-10 w-full max-w-3xl">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-indigo-300 mb-1">
            Signature and Verification Tools
          </h1>
          <p className="text-sm text-gray-400">
            Secure tools for cryptographic operations, message signing, and
            verification
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-between bg-gray-800 bg-opacity-50 backdrop-blur-sm mb-6 p-1 rounded-lg text-sm">
          <button
            className={`flex-1 px-3 py-2 flex items-center justify-center space-x-2 ${
              activeTab === "Sign Message"
                ? "bg-purple-600 bg-opacity-30"
                : "bg-transparent"
            }`}
            onClick={() => setActiveTab("Sign Message")}
          >
            <Lock size={16} />
            <span>Sign Message</span>
          </button>
          <button
            className={`flex-1 px-3 py-2 flex items-center justify-center space-x-2 ${
              activeTab === "Verify Signature"
                ? "bg-purple-600 bg-opacity-30"
                : "bg-transparent"
            }`}
            onClick={() => setActiveTab("Verify Signature")}
          >
            <CheckCircle size={16} />
            <span>Verify Signature</span>
          </button>
          <button
            className={`flex-1 px-3 py-2 flex items-center justify-center space-x-2 ${
              activeTab === "Proof of Ownership"
                ? "bg-purple-600 bg-opacity-30"
                : "bg-transparent"
            }`}
            onClick={() => setActiveTab("Proof of Ownership")}
          >
            <Shield size={16} />
            <span>Proof of Ownership</span>
          </button>
          <button
            className={`flex-1 px-3 py-2 flex items-center justify-center space-x-2 transition-colors ${
              activeTab === "Hash Generator"
                ? "bg-purple-600 bg-opacity-30"
                : "bg-transparent hover:bg-gray-700/50"
            }`}
            onClick={() => setActiveTab("Hash Generator")}
          >
            <FileDigit size={16} />
            <span>Hash Generator</span>
          </button>
        </div>{activeTab === "Sign Message" && <SignMessageTab />}
{activeTab === "Verify Signature" && <VerifySignatureTab />}
{activeTab === "Proof of Ownership" && <ProofOfOwnershipTab />}

        {/* Conditionally render Hash Generator Content based on activeTab */}
        {activeTab === "Hash Generator" && (
          <>
            {/* Hash Generator Content - Apply Glassmorphism */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-1">Hash Generator</h2>
              <p className="text-sm text-gray-400 mb-6">
                Create cryptographic hashes of any text or data
              </p>

              <div className="mb-4">
                <label
                  htmlFor="hash-algorithm"
                  className="block text-sm font-medium mb-2"
                >
                  Hash Algorithm
                </label>
                <div className="relative">
                  <select
                    id="hash-algorithm"
                    className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-gray-300 appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-colors"
                    value={selectedAlgorithm}
                    onChange={(e) =>
                      setSelectedAlgorithm(e.target.value as Algorithm)
                    }
                  >
                    {algorithms.map((algo) => (
                      <option key={algo} value={algo}>
                        {algo}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="input-text"
                  className="block text-sm font-medium mb-2"
                >
                  Input Text
                </label>
                <textarea
                  id="input-text"
                  placeholder="Enter text to hash"
                  className="w-full p-3 bg-gray-900 border border-gray-700 rounded text-gray-300 h-24 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-colors"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded mb-4 flex items-center text-sm">
                  <AlertTriangle size={16} className="mr-2" />
                  {error}
                </div>
              )}

              {/* Hash Result Display */}
              {generatedHash && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Generated Hash
                  </label>
                  <div className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-green-300 break-all font-mono text-sm">
                    {generatedHash}
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={handleGenerateHash}
                  disabled={isLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin mr-2" size={16} />
                  ) : (
                    <FileDigit className="mr-2" size={16} />
                  )}
                  Generate Hash
                </button>
                <button
                  onClick={handleReset}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 py-3 px-4 rounded flex items-center justify-center transition-colors"
                >
                  <RefreshCw size={16} />
                  <span className="ml-2">Reset</span>
                </button>
              </div>
            </div>

            {/* Feature blocks - Apply Glassmorphism */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-800 rounded-lg shadow-lg p-4">
                <div className="flex items-center mb-2">
                  <Lock size={18} className="text-purple-400 mr-2" />
                  <h3 className="font-medium">Security First</h3>
                </div>
                <p className="text-sm text-gray-400">
                  All cryptographic operations are performed locally in your
                  browser. Your private keys never leave your device.
                </p>
              </div>

              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-800 rounded-lg shadow-lg p-4">
                <div className="flex items-center mb-2">
                  <Shield size={18} className="text-purple-400 mr-2" />
                  <h3 className="font-medium">Blockchain Compatible</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Our tools are compatible with major blockchain standards
                  including Ethereum (Keccak-256), Bitcoin (SHA-256), and more.
                </p>
              </div>

              <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-800 rounded-lg shadow-lg p-4">
                <div className="flex items-center mb-2">
                  <FileCheck size={18} className="text-purple-400 mr-2" />
                  <h3 className="font-medium">Verify Anything</h3>
                </div>
                <p className="text-sm text-gray-400">
                  From simple messages to complex transactions, verify
                  signatures and prove ownership of blockchain assets using
                  cryptographic hashes.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HashGeneratorTab;