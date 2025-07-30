"use client"

import { motion } from "framer-motion"
import { OutWalletButton } from "@/components/welcome/auth-wallet-button"

interface CTASectionProps {
  onGetStarted: () => void
  isLoading: boolean
}

export function CTASection({ onGetStarted, isLoading }: CTASectionProps) {
  return (
    <section className="relative py-20 md:py-28 bg-transparent">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Ready to{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              explore
            </span>{" "}
            the future of finance?
          </h2>
          <p className="text-xl text-blue-100/70 mb-10 max-w-2xl mx-auto">
            Join thousands of users already managing their digital assets with Galaxy Wallet&#39;s cutting-edge technology.
          </p>

          <div className="flex justify-center">
            <OutWalletButton
              onClick={onGetStarted}
              label="GET STARTED NOW"
              loadingLabel="Loading..."
              isLoading={isLoading}
              size="large"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
