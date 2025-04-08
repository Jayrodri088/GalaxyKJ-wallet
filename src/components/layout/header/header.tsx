"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { Menu, HelpCircle, Search, Settings } from "lucide-react"
import { Input } from "@/components/ui/input"
import { MobileMenu } from "./mobile-menu"

export function Header() {
  const router = useRouter()
  const menuOptions = [
    { label: "Settings", icon: <Settings className="h-4 w-4" />, href: "/settings" },
    { label: "Support", icon: <HelpCircle className="h-4 w-4" />, href: "/support" },
  ]

  return (
    <header className="flex items-center justify-between mb-8">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Image
          src="/images/galaxy-smart-wallet-logo.png"
          alt="Galaxy Smart Wallet Logo"
          width={56}
          height={56}
          className="object-contain"
        />
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Galaxy Smart Wallet
        </h1>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-4 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search transactions..."
            className="pl-10 w-64 bg-gray-900/50 border-gray-800 focus:border-purple-500 text-white"
          />
        </div>
        <div className="transition-transform duration-200 hover:scale-105">
          <MobileMenu options={menuOptions} />
        </div>

      </div>
    </header>
  )
}
