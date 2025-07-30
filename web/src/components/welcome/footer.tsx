"use client"

import Image from "next/image"

export function Footer() {
  return (
    <footer className="relative py-10 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <Image
              src="/images/galaxy-smart-wallet-logo.png"
              alt="Galaxy Smart Wallet"
              width={50}
              height={50}
              className="h-10 w-auto"
            />
          </div>
          <div className="text-center md:text-right">
            <p className="text-blue-100/50">© {new Date().getFullYear()} Galaxy Wallet. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

