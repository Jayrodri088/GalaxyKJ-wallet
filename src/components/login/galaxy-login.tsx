"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Eye, EyeOff, Shield, X, ArrowRight, LockKeyhole } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock Stellar SDK functions - replace with actual Stellar SDK imports
const mockStellarDecrypt = async (encryptedKey: string, password: string): Promise<string> => {
  // Simulate decryption process
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Simple validation - in real implementation, use proper crypto
  if (password === "wrongpassword") {
    throw new Error("Invalid password")
  }

  return "decrypted_private_key_" + Date.now()
}

// IndexedDB utilities
const getEncryptedPrivateKey = async (): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("GalaxyWallet", 1)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction(["wallet"], "readonly")
      const store = transaction.objectStore("wallet")
      const getRequest = store.get("encryptedPrivateKey")

      getRequest.onsuccess = () => {
        resolve(getRequest.result?.value || null)
      }

      getRequest.onerror = () => reject(getRequest.error)
    }

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains("wallet")) {
        const store = db.createObjectStore("wallet", { keyPath: "key" })
        // Mock encrypted key for demo
        store.add({ key: "encryptedPrivateKey", value: "mock_encrypted_key_12345" })
      }
    }
  })
}

interface GalaxyLoginProps {
  onLoginSuccess?: (privateKey: string) => void
  onRecoveryClick?: () => void
  onClose?: () => void
}

export default function GalaxyLogin({ onLoginSuccess, onRecoveryClick, onClose }: GalaxyLoginProps) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasWallet, setHasWallet] = useState(false)

  useEffect(() => {
    // Check if wallet exists in IndexedDB
    const checkWallet = async () => {
      try {
        const encryptedKey = await getEncryptedPrivateKey()
        setHasWallet(!!encryptedKey)
      } catch (err) {
        console.error("Error checking wallet:", err)
        setHasWallet(false)
      }
    }

    checkWallet()
  }, [])

  const handleUnlock = async () => {
    if (!password.trim()) {
      setError("Please enter your password")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Get encrypted private key from IndexedDB
      const encryptedPrivateKey = await getEncryptedPrivateKey()

      if (!encryptedPrivateKey) {
        throw new Error("No wallet found on this device")
      }

      // Attempt to decrypt the private key
      const decryptedPrivateKey = await mockStellarDecrypt(encryptedPrivateKey, password)

      // Success - call the success callback
      onLoginSuccess?.(decryptedPrivateKey)
    } catch (err) {
      console.error("Login error:", err)
      setError("Incorrect password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleUnlock()
    }
  }

  if (!hasWallet) {
    return (
      <div className="relative w-full max-w-md bg-slate-800/60 border border-slate-700 backdrop-blur-sm p-8 shadow-lg rounded-xl">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-slate-800/90 border border-slate-700 rounded-md p-1 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <div className="text-white mb-4 text-center">No wallet found on this device</div>
        <Button onClick={onRecoveryClick} className="w-full">
          Create or Recover Wallet
        </Button>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-md bg-slate-800/60 border border-slate-700 backdrop-blur-sm p-8 shadow-lg rounded-xl">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-800/90 border border-slate-700 rounded-md p-1 text-slate-300 hover:bg-slate-700 hover:text-white transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/galaxy-smart-wallet-logo-bKLKEPP9uprTRG7QEmXdYGEOH0ohGD.png"
            alt="Galaxy Smart Wallet Logo"
            className="w-8 h-8 object-contain"
          />
          <span className="text-white font-semibold text-lg">Galaxy Smart Wallet</span>
        </div>

        {/* Galaxy Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/galaxy-text-logo-yUK24blxdpHzgYDPpBqKDwtWQ0rO9f.png"
            alt="Galaxy Smart Wallet"
            className="w-32 h-auto object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-slate-400">Enter your password to access your wallet</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 bg-red-500/10 border-red-500/20 text-red-400">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Password Input */}
      <div className="space-y-4 mb-6">
        <div>
          <Label htmlFor="password" className="text-slate-300 mb-2 block">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your wallet password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 pr-12 focus:border-purple-400 focus:ring-purple-400"
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-white"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Unlock Button */}
      <Button
        onClick={handleUnlock}
        disabled={isLoading || !password.trim()}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 mb-6"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Unlocking...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Unlock Wallet
            <ArrowRight className="h-4 w-4" />
          </div>
        )}
      </Button>

      {/* Recovery Link */}
      <div className="text-center mb-6">
        <button
          onClick={onRecoveryClick}
          className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1 mx-auto"
        >
          Can't access your wallet? Recover it here
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* Security Notice */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
          <LockKeyhole className="h-3 w-3" />
          Your wallet is encrypted and stored locally
        </div>
        <div className="text-xs text-slate-500">Galaxy Wallet never has access to your password</div>
      </div>
    </div>
  )
}
