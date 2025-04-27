"use client"

import { useState, useEffect } from "react"
import { ArrowRight, FileText, MoveRight, Repeat } from "lucide-react"
import ExchangeRateChart from "@/components/ cryptocurrency-converter/exchange-rate-chart"
import MarketOverview from "@/components/ cryptocurrency-converter/market-overview"
import ConversionHistory from "@/components/ cryptocurrency-converter/conversion-history"
import ConversionTips from "@/components/ cryptocurrency-converter/conversion-tips"
import NetworkFeeCalculator from "@/components/ cryptocurrency-converter/network-fee-calculator"

const cryptoData = [
  { 
    id: "xlm", 
    name: "Stellar Lumens", 
    symbol: "XLM", 
    price: 0.39, 
    change: 2.5, 
    color: "bg-blue-500",
    gradient: "from-blue-500 to-indigo-600", 
    letter: "X" 
  },
  { 
    id: "btc", 
    name: "Bitcoin", 
    symbol: "BTC", 
    price: 68245.12, 
    change: -1.2, 
    color: "bg-purple-600",
    gradient: "from-purple-600 to-yellow-500", 
    letter: "B" 
  },
  { 
    id: "eth", 
    name: "Ethereum", 
    symbol: "ETH", 
    price: 3245.67, 
    change: 0.8, 
    color: "bg-blue-600",
    gradient: "from-blue-600 to-blue-400", 
    letter: "E" 
  },
  { 
    id: "usdc", 
    name: "USD Coin", 
    symbol: "USDC", 
    price: 1.0, 
    change: 0, 
    color: "bg-blue-500",
    gradient: "from-blue-500 to-cyan-400", 
    letter: "U" 
  },
  { 
    id: "sol", 
    name: "Solana", 
    symbol: "SOL", 
    price: 142.35, 
    change: 2.2, 
    color: "bg-purple-500",
    gradient: "from-purple-500 to-fuchsia-500", 
    letter: "S" 
  },
]

export default function CryptoConverter() {
  const [fromCrypto, setFromCrypto] = useState("xlm")
  const [toCrypto, setToCrypto] = useState("btc")
  const [amount, setAmount] = useState("100")
  const [convertedAmount, setConvertedAmount] = useState("0.00057147")
  const [activeTab, setActiveTab] = useState("crypto-to-crypto")
  const [showFromDropdown, setShowFromDropdown] = useState(false)
  const [showToDropdown, setShowToDropdown] = useState(false)

  const getTokenById = (id: string) => {
    return cryptoData.find((crypto) => crypto.id === id) || cryptoData[0]
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
    const from = getTokenById(fromCrypto)
    const to = getTokenById(toCrypto)

    if (from && to && amount) {
      const conversion = (Number.parseFloat(amount) * from.price) / to.price
      setConvertedAmount(conversion.toFixed(8))
    }
  }, [fromCrypto, toCrypto, amount])

  const handleFromCryptoChange = (id: string) => {
    setFromCrypto(id)
    setShowFromDropdown(false)
  }

  const handleToCryptoChange = (id: string) => {
    setToCrypto(id)
    setShowToDropdown(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const dropdowns = document.querySelectorAll(".crypto-dropdown")
      let clickedOutside = true

      // biome-ignore lint/complexity/noForEach: <explanation>
      dropdowns.forEach((dropdown) => {
        if (dropdown.contains(target)) {
          clickedOutside = false
        }
      })

      if (clickedOutside) {
        setShowFromDropdown(false)
        setShowToDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const fromCryptoData = getTokenById(fromCrypto)
  const toCryptoData = getTokenById(toCrypto)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-[#0c1023] border border-[#1a1f35] rounded-xl overflow-hidden">
          <div className="p-6 pb-0">
            <h2 className="text-2xl font-normal text-white mb-6">Currency Converter</h2>
          </div>

          <div className="px-6">
            <div className="flex w-full bg-[#131b31] rounded-lg overflow-hidden">
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
              <button
                className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 ${
                  activeTab === "crypto-to-crypto" ? "bg-[#5b21b6]" : "text-gray-400"
                }`}
                onClick={() => setActiveTab("crypto-to-crypto")}
              >
                <Repeat className="h-4 w-4" /> Crypto to Crypto
              </button>
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
              <button
                className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 ${
                  activeTab === "crypto-to-fiat" ? "bg-[#5b21b6]" : "text-gray-400"
                }`}
                onClick={() => setActiveTab("crypto-to-fiat")}
              >
                <FileText className="h-4 w-4" /> Crypto to Fiat
              </button>
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
              <button
                className={`flex-1 py-2 px-4 flex items-center justify-center gap-2 ${
                  activeTab === "fiat-to-crypto" ? "bg-[#5b21b6]" : "text-gray-400"
                }`}
                onClick={() => setActiveTab("fiat-to-crypto")}
              >
                <MoveRight className="h-4 w-4" /> Fiat to Crypto
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-16 gap-6">
                <div>
                  <p className="mb-2 text-white">From</p>
                  <div className="relative crypto-dropdown">
                    {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                    <button
                      className="w-full flex items-center justify-between bg-[#131b31] border border-[#1e2747] rounded-lg p-2.5 text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowFromDropdown(!showFromDropdown)
                        setShowToDropdown(false)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`bg-gradient-to-r ${fromCryptoData.gradient} rounded-full w-6 h-6 flex items-center justify-center text-xs text-white shadow-[0_0_10px_rgba(80,70,230,0.5)]`}
                        >
                          {fromCryptoData.letter}
                        </div>
                        <span>
                          {fromCryptoData.name} ({fromCryptoData.symbol})
                        </span>
                      </div>
                      {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>

                    {showFromDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-[#131b31] border border-[#1e2747] rounded-lg shadow-lg">
                        {cryptoData.map((crypto) => (
                          // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
<div
                            key={crypto.id}
                            className="flex items-center gap-2 p-2.5 hover:bg-[#1a2544] cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleFromCryptoChange(crypto.id)
                            }}
                          >
                            <div
                              className={`bg-gradient-to-r ${crypto.gradient} rounded-full w-6 h-6 flex items-center justify-center text-xs text-white shadow-[0_0_10px_rgba(80,70,230,0.3)]`}
                            >
                              {crypto.letter}
                            </div>
                            <span className="text-white">
                              {crypto.name} ({crypto.symbol})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-sm flex justify-between">
                    <span className="text-gray-400">
                      1 {fromCryptoData.symbol} = ${fromCryptoData.price.toFixed(2)}
                    </span>
                    <span className={fromCryptoData.change >= 0 ? "text-green-500" : "text-red-500"}>
                      {fromCryptoData.change >= 0 ? "+" : ""}
                      {fromCryptoData.change}%
                    </span>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-white">To</p>
                  <div className="relative crypto-dropdown">
                    {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                    <button
                      className="w-full flex items-center justify-between bg-[#131b31] border border-[#1e2747] rounded-lg p-2.5 text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowToDropdown(!showToDropdown)
                        setShowFromDropdown(false)
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`bg-gradient-to-r ${toCryptoData.gradient} rounded-full w-6 h-6 flex items-center justify-center text-xs text-white shadow-[0_0_10px_rgba(80,70,230,0.5)]`}
                        >
                          {toCryptoData.letter}
                        </div>
                        <span>
                          {toCryptoData.name} ({toCryptoData.symbol})
                        </span>
                      </div>
                      {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>

                    {showToDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-[#131b31] border border-[#1e2747] rounded-lg shadow-lg">
                        {cryptoData.map((crypto) => (
                          // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
<div
                            key={crypto.id}
                            className="flex items-center gap-2 p-2.5 hover:bg-[#1a2544] cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToCryptoChange(crypto.id)
                            }}
                          >
                            <div
                              className={`bg-gradient-to-r ${crypto.gradient} rounded-full w-6 h-6 flex items-center justify-center text-xs text-white shadow-[0_0_10px_rgba(80,70,230,0.3)]`}
                            >
                              {crypto.letter}
                            </div>
                            <span className="text-white">
                              {crypto.name} ({crypto.symbol})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-sm flex justify-between">
                    <span className="text-gray-400">
                      1 {toCryptoData.symbol} = ${toCryptoData.price.toFixed(2)}
                    </span>
                    <span className={toCryptoData.change >= 0 ? "text-green-500" : "text-red-500"}>
                      {toCryptoData.change >= 0 ? "+" : ""}
                      {toCryptoData.change}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-24 gap-8 relative">
                <div>
                  <p className="mb-2 text-white">Amount</p>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[#131b31] border border-[#1e2747] rounded-lg p-3 text-white h-12 text-base"
                  />
                </div>

                <div>
                  <p className="mb-2 text-white">Converted Amount</p>
                  <input
                    type="text"
                    value={convertedAmount}
                    readOnly
                    className="w-full bg-[#131b31] border border-[#1e2747] rounded-lg p-3 text-white h-12 text-base"
                  />
                </div>

                <div className="absolute left-1/2 top-[55%] transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 bg-[#131b31] rounded-full z-10 border border-[#1e2747] shadow-lg mt-1">
                  <div className="text-purple-500">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="bg-[#131b31] rounded-lg p-4 flex justify-between items-center">
                <div className="text-sm">
                  <p className="text-gray-400">Conversion Rate</p>
                  <p className="font-medium text-white text-lg">
                    1 {fromCryptoData.symbol} = {(fromCryptoData.price / toCryptoData.price).toFixed(8)}{" "}
                    {toCryptoData.symbol}
                  </p>
                </div>
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                <button className="bg-[#7e22ce] hover:bg-[#6b21a8] rounded-lg px-6 py-3 text-white">
                  Save Conversion
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0c1023] border border-[#1a1f35] rounded-xl">
          <div className="p-6">
            <div className="flex flex-row items-center justify-between mb-4">
              <h2 className="text-2xl font-normal text-white">Exchange Rate History</h2>
              <div className="flex gap-2">
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                <button className="h-8 border border-[#1e2747] bg-[#131b31] px-3 text-xs rounded-lg text-gray-400">
                  1D
                </button>
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                <button className="h-8 border border-[#1e2747] bg-[#5b21b6]/50 px-3 text-purple-300 text-xs rounded-lg">
                  1W
                </button>
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                <button className="h-8 border border-[#1e2747] bg-[#131b31] px-3 text-xs rounded-lg text-gray-400">
                  1M
                </button>
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                <button className="h-8 border border-[#1e2747] bg-[#131b31] px-3 text-xs rounded-lg text-gray-400">
                  1Y
                </button>
              </div>
            </div>
            <ExchangeRateChart fromSymbol={fromCryptoData.symbol} toSymbol={toCryptoData.symbol} />
          </div>
        </div>

        <NetworkFeeCalculator />
      </div>

      <div className="space-y-6">
        <MarketOverview cryptoData={cryptoData} />
        <ConversionHistory />
        <ConversionTips />
      </div>
    </div>
  )
}
