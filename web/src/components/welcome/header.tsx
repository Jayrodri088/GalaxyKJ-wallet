"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { OutWalletButton } from "@/components/welcome/auth-wallet-button"

interface HeaderProps {
  onGetStarted: () => void
  isLoading: boolean
}

export function Header({ onGetStarted, isLoading }: HeaderProps) {
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

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex items-center gap-4"
      >
        <OutWalletButton
          onClick={onGetStarted}
          label="GET STARTED"
          loadingLabel="Loading..."
          isLoading={isLoading}
        />
      </motion.div>
    </header>
  )
}
