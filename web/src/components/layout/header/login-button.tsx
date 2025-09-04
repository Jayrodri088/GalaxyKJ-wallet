"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { GalaxyLogin } from "@/components/login/galaxy-login"
import { ArrowRight, Wallet } from "lucide-react"
import { Keypair } from "@stellar/stellar-sdk"
import { useWalletStore } from "@/store/wallet-store"
import { useSecureKey } from "@/contexts/secure-key-context"

export function LoginButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const setPublicKey = useWalletStore((state) => state.setPublicKey)
  const { setPrivateKey, hasPrivateKey } = useSecureKey()

  const handleLoginSuccess = (decryptedPrivateKey: string) => {
    const keypair = Keypair.fromSecret(decryptedPrivateKey)
    const publicKey = keypair.publicKey()

    // Set the private key in the secure context
    setPrivateKey(decryptedPrivateKey)
    
    // Set the public key in the wallet store
    setPublicKey(publicKey)
    setIsLoggedIn(true)
    setIsLoginModalOpen(false)
  }

  const handleRecoveryClick = () => {
    // TODO: implement recovery flow
    console.log("Recovery flow triggered")
  }

  const handleClose = () => {
    setIsLoginModalOpen(false)
  }

  // Check if wallet is connected via secure context
  const isWalletConnected = hasPrivateKey()

  return (
    <>
      <motion.div
        className="relative group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Button
          className="relative bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full transition-all duration-300 font-bold shadow-[0_0_15px_rgba(124,58,237,0.5)] hover:shadow-[0_0_20px_rgba(124,58,237,0.7)] flex items-center justify-center gap-2 px-6 py-3 text-base border-none"
          onClick={() => setIsLoginModalOpen(true)}
        >
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            <span>{isWalletConnected ? "WALLET CONNECTED" : "LOGIN"}</span>
            <motion.div animate={{ x: isHovered ? 5 : 0 }} transition={{ duration: 0.2 }}>
              <ArrowRight className="h-5 w-5" />
            </motion.div>
          </div>
        </Button>
      </motion.div>

      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <GalaxyLogin
            onLoginSuccess={handleLoginSuccess}
            onRecoveryClick={handleRecoveryClick}
            onClose={handleClose}
          />
        </div>
      )}
    </>
  )
}
