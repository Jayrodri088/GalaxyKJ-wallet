interface CryptoData {
  id: string
  name: string
  symbol: string
  price: number
  change: number
  color: string
  gradient?: string
  letter: string
}

interface MarketOverviewProps {
  cryptoData: CryptoData[]
}

export default function MarketOverview({ cryptoData }: MarketOverviewProps) {
  return (
    <div className="bg-[#0c1023] border border-[#1a1f35] rounded-xl">
      <div className="p-6">
        <h2 className="text-2xl font-normal text-white mb-4">Market Overview</h2>
        <div className="space-y-4">
          {cryptoData.map((crypto) => (
            <div key={crypto.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`${crypto.gradient ? `bg-gradient-to-r ${crypto.gradient}` : crypto.color} rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium text-white shadow-[0_0_10px_rgba(80,70,230,0.5)]`}
                >
                  {crypto.letter}
                </div>
                <div>
                  <p className="font-medium text-white">{crypto.symbol}</p>
                  <p className="text-sm text-gray-400">{crypto.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-white">
                  $
                  {crypto.price.toLocaleString(undefined, {
                    minimumFractionDigits: crypto.price < 1 ? 2 : 2,
                    maximumFractionDigits: crypto.price < 1 ? 2 : 2,
                  })}
                </p>
                <p className={`text-sm ${crypto.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {crypto.change >= 0 ? "+" : ""}
                  {crypto.change}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
