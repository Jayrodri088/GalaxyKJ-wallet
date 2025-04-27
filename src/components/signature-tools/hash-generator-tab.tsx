import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle, Shield,  RefreshCw, FileDigit, FileCheck } from 'lucide-react';

// Define supported algorithms compatible with SubtleCrypto
type Algorithm = 'SHA-256' | 'SHA-384' | 'SHA-512';
// const algorithms: Algorithm[] = ['SHA-256', 'SHA-384', 'SHA-512']; // Removed

const HashGeneratorTab: React.FC = () => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>('SHA-256');
  const [inputText, setInputText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('Sign Message'); // State for active tab
  // const [generatedHash, setGeneratedHash] = useState<string>(''); // Removed
  // const [error, setError] = useState<string>(''); // Removed
  // const [isLoading, setIsLoading] = useState<boolean>(false); // Removed
  // State for star positions
  const [starPositions, setStarPositions] = useState<{ top: string; left: string }[]>([]);

  // Generate star positions only on the client side after mount
  useEffect(() => {
    const positions = Array.from({ length: 50 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
    }));
    setStarPositions(positions);
  }, []); // Empty dependency array ensures this runs only once on mount

  // Removed handleGenerateHash function
  // Removed handleReset function

  return (
    <div className="min-h-screen bg-opacity-95 text-gray-200 p-6 flex flex-col items-center relative overflow-hidden">
      {/* Stars background effect */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Map over the state variable for star positions */}
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
          <h1 className="text-2xl font-bold text-indigo-300 mb-1">Signature and Verification Tools</h1>
          <p className="text-sm text-gray-400">Secure tools for cryptographic operations, message signing, and verification</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6 space-x-2 text-sm">
          <button 
            className={`px-3 py-2 rounded flex items-center space-x-2 ${activeTab === 'Sign Message' ? 'bg-indigo-700 bg-opacity-30' : 'bg-transparent'}`}
            onClick={() => setActiveTab('Sign Message')}
          >
            <Lock size={16} />
            <span>Sign Message</span>
          </button>
          <button 
            className={`px-3 py-2 rounded flex items-center space-x-2 ${activeTab === 'Verify Signature' ? 'bg-indigo-700 bg-opacity-30' : 'bg-transparent'}`}
            onClick={() => setActiveTab('Verify Signature')}
          >
            <CheckCircle size={16} />
            <span>Verify Signature</span>
          </button>
          <button 
            className={`px-3 py-2 rounded flex items-center space-x-2 ${activeTab === 'Proof of Ownership' ? 'bg-indigo-700 bg-opacity-30' : 'bg-transparent'}`}
            onClick={() => setActiveTab('Proof of Ownership')}
          >
            <Shield size={16} />
            <span>Proof of Ownership</span>
          </button>
          <button 
            className={`px-3 py-2 rounded flex items-center space-x-2 ${activeTab === 'Key Generator' ? 'bg-indigo-700 bg-opacity-30' : 'bg-transparent'}`}
            onClick={() => setActiveTab('Key Generator')}
          >
          <FileDigit />
            <span>Key Generator</span>
          </button>
        </div>

        {/* Hash Generator Content */}
        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-1">Hash Generator</h2>
          <p className="text-sm text-gray-400 mb-6">Create cryptographic hashes of any text or data</p>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Hash Algorithm</label>
            <div className="relative">
              <select 
                className="w-full p-3 bg-gray-900 rounded text-gray-300 appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value as Algorithm)}
              >
                <option>SHA-256</option>
                <option>SHA-512</option>
                <option>MD5</option>
                <option>RIPEMD-160</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Input Text</label>
            <textarea 
              placeholder="Enter text to hash"
              className="w-full p-3 bg-gray-900 rounded text-gray-300 h-24 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          <div className="flex space-x-2">
            <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded flex items-center justify-center">
              <FileDigit className="mr-2" size={16} />
              Generate Hash
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 text-gray-300 py-3 px-4 rounded flex items-center justify-center">
              <RefreshCw size={16} />
              <span className="ml-2">Reset</span>
            </button>
          </div>
        </div>

        {/* Feature blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 bg-opacity-30 p-4 rounded">
            <div className="flex items-center mb-2">
              <Lock size={18} className="text-purple-400 mr-2" />
              <h3 className="font-medium">Security First</h3>
            </div>
            <p className="text-sm text-gray-400">
              All cryptographic operations are performed locally in your browser. Your private keys never leave your device.
            </p>
          </div>
          
          <div className="bg-gray-800 bg-opacity-30 p-4 rounded">
            <div className="flex items-center mb-2">
              <Shield size={18} className="text-purple-400 mr-2" />
              <h3 className="font-medium">Blockchain Compatible</h3>
            </div>
            <p className="text-sm text-gray-400">
              Our tools are compatible with major blockchain standards including Ethereum, Bitcoin, and Stellar.
            </p>
          </div>
          
          <div className="bg-gray-800 bg-opacity-30 p-4 rounded">
            <div className="flex items-center mb-2">
              <FileCheck size={18} className="text-purple-400 mr-2" />
              <h3 className="font-medium">Verify Anything</h3>
            </div>
            <p className="text-sm text-gray-400">
              From simple messages to complex transactions, verify signatures and prove ownership of blockchain assets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HashGeneratorTab; 