"use client";

import { useState } from "react";
import { verifyMessage } from "ethers";
import {
  FaPenNib,
  FaCheckCircle,
  FaShieldAlt,
  FaHashtag,
  FaCubes,
  FaRedo,
} from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { StarBackground } from "../effects/star-background";

export default function ProofOwnershipTab() {
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState("");
  const [result, setResult] = useState<null | boolean>(null);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { label: "Sign Message", icon: <FaPenNib /> },
    { label: "Verify Signature", icon: <FaCheckCircle /> },
    { label: "Proof of Ownership", icon: <FaShieldAlt /> },
    { label: "Hash Generator", icon: <FaHashtag /> },
  ];

  const activeTab = "Proof of Ownership";

  const handleVerify = async () => {
    if (!address || !message || !signature) {
      setResult(false);
      return;
    }

    if (!signature.startsWith("0x") || signature.length !== 132) {
      setResult(false);
      return;
    }

    setLoading(true);

    try {
      const signerAddr = verifyMessage(message, signature);
      const isValid = signerAddr.toLowerCase() === address.toLowerCase();
      setResult(isValid);
    } catch (error) {
      console.error("Verification error:", error);
      setResult(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAddress("");
    setMessage("");
    setSignature("");
    setResult(null);
  };

  return (
    <><StarBackground /><div className="min-h-screen relative flex flex-col items-center justify-center text-gray-200 px-4 py-8">

      {/* Header Title */}
      <div className="text-center mb-10">
        <h1 className="text-2xl md:text-2xl font-bold mb-2 text-[#2596be]">
          Signature and Verification Tools
        </h1>
        <p className="text-gray-400 text-sm">
          Secure tools for cryptographic operations, message signing, and
          verification
        </p>
      </div>

      <div className="bg-gray-900 w-full max-w-3xl mx-auto p-3 rounded-sm flex flex-wrap gap-3 justify-center mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            className={`flex items-center gap-2 px-4 py-2  font-semibold transition-all
        ${tab.label === activeTab
                ? "bg-purple-700  text-white"
                : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"}`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Proof of Ownership Card */}
      <div className="w-full max-w-3xl p-6 bg-gray-900/50 backdrop-blur-md border border-gray-800 rounded-lg shadow-lg transition-colors">
        <h2 className="text-2xl font-bold ">Proof of Ownership</h2>
        <p className="text-gray-400 text-sm mb-6">
          Generate of verify proof that you own a particular blockchain
        </p>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter the blockchain address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="p-3 bg-gray-800/30 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />

          <textarea
            placeholder="Enter a message or statement of ownership"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="p-3 bg-gray-800/30 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={4} />

          <textarea
            placeholder="Enter the signature that proves ownership"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            className="p-3 bg-gray-800/30 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={3} />

          <div className="flex items-center justify-between mt-4 gap-4">
            <button
              onClick={handleVerify}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full p-3 bg-purple-600 hover:bg-purple-700 text-white transition rounded-md font-semibold disabled:opacity-50"
            >
              {loading ? (
                <AiOutlineLoading3Quarters className="animate-spin h-5 w-5" />
              ) : (
                <FaShieldAlt className="h-4 w-4 text-white" /> // Show badge when not loading
              )}
              {loading ? "Verifying..." : "Verify Ownership"}
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 p-3 text-gray-400 hover:text-white transition text-sm"
            >
              <FaRedo className="h-4 w-4" />
              Reset
            </button>
          </div>

          {result !== null && (
            <div
              className={`mt-6 p-4 rounded-lg text-center font-bold ${result
                  ? "bg-green-700/30 border border-green-600 text-green-300"
                  : "bg-red-700/30 border border-red-600 text-red-300"}`}
            >
              {result
                ? "Valid Proof of Ownership!"
                : "Invalid Proof of Ownership."}
            </div>
          )}
        </div>

     
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
         
          <div className="p-6 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg hover:border-purple-600 transition">
            <div className="flex items-center mb-4">
              <FaShieldAlt className="text-purple-500 mr-2" />
              <h3 className="text-sm font-semibold">Security First</h3>
            </div>
            <p className="text-sm text-gray-400">
              All cryptographic operations are performed locally in your
              browser. Your private keys never leave your device.
            </p>
          </div>

        
          <div className="p-6 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg hover:border-purple-600 transition">
            <div className="flex items-center mb-4">
              <FaCubes className="text-purple-500 font-semibold mr-2" />
              <h3 className="text-sm">Blockchain Compatible</h3>
            </div>
            <p className="text-sm text-gray-400">
              Our tools are compatible with major blockchain standards including
              Ethereum, Bitcoin, and Stellar.
            </p>
          </div>

        
          <div className="p-6 bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg hover:border-purple-600 transition">
            <div className="flex items-center mb-4">
              <FaCheckCircle className="text-purple-500  mr-2" />
              <h3 className="text-sm font-semibold">Verify Anything</h3>
            </div>
            <p className="text-sm text-gray-400">
              From simple messages to complex transactions, verify signatures
              and prove ownership of blockchain assets.
            </p>
          </div>
        </div>
      </div>
    </div></>
  );
}
