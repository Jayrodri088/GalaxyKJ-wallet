"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { CreateWalletButton } from "./create-wallet-button"
import { LoginButton } from "@/components/layout/header/login-button"

interface HeaderProps {
  onCreateWallet: () => void
  isCreating: boolean
}

export function Header({ onCreateWallet, isCreating }: HeaderProps) {
  return (
    <header className="relative z-50 w-full py-6 px-6 flex justify-between items-center">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center"
      >
        <Image
          src="/images/galaxy-smart-wallet-logo.png"
          alt="Galaxy Smart Wallet"
          width={120}
          height={120}
          className="h-16 w-auto"
        />
      </motion.div>

      {/* Buttons Container */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex items-center gap-4"
      >
        <LoginButton />
        <CreateWalletButton onClick={onCreateWallet} isCreating={isCreating} />
      </motion.div>
    </header>
  )
}

