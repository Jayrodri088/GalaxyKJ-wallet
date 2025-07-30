"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface OutWalletButtonProps {
  onClick: () => void
  isLoading?: boolean
  label: string
  loadingLabel?: string
  size?: "default" | "large"
  className?: string
}

export function OutWalletButton({
  onClick,
  isLoading = false,
  label,
  loadingLabel = "Loading...",
  size = "default",
  className = "",
}: OutWalletButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const sizeClasses = {
    default: "px-6 py-3 text-base",
    large: "px-10 py-5 text-xl",
  }

  return (
    <motion.div
      className={`relative group ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-md opacity-70 group-hover:opacity-100 transition duration-300"></div>

      <Button
        onClick={onClick}
        disabled={isLoading}
        className={`relative bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full transition-all duration-300 font-bold shadow-[0_0_15px_rgba(124,58,237,0.5)] hover:shadow-[0_0_20px_rgba(124,58,237,0.7)] flex items-center justify-center gap-2 ${sizeClasses[size]}`}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
            <span>{loadingLabel}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>{label}</span>
            <motion.div animate={{ x: isHovered ? 5 : 0 }} transition={{ duration: 0.2 }}>
              <ArrowRight className={size === "large" ? "h-6 w-6" : "h-5 w-5"} />
            </motion.div>
          </div>
        )}
      </Button>
    </motion.div>
  )
}
