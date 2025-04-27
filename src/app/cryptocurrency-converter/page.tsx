import CryptoConverter from "@/components/ cryptocurrency-converter/crypto-converter"
import { ArrowLeft } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Cryptocurrency Converter",
  description: "Convert between cryptocurrencies and fiat currencies",
}

export default function Home() {
  return (
    <main className="min-h-screen pt-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex items-center gap-3">
          <Link href="/" className="text-gray-500 hover:text-gray-400 transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
              Cryptocurrency Converter
            </h1>
            <p className="text-gray-500">Convert between cryptocurrencies and fiat currencies</p>
          </div>
        </header>

        <CryptoConverter />
      </div>
    </main>
  )
} 