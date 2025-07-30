import { Clock } from "lucide-react"

const conversionHistory = [
  {
    id: 1,
    fromSymbol: "XLM",
    toSymbol: "BTC",
    fromAmount: "1000",
    toAmount: "0.00573",
    date: "Mar 15, 02:30 PM",
  },
  {
    id: 2,
    fromSymbol: "BTC",
    toSymbol: "USD",
    fromAmount: "0.05",
    toAmount: "3412.26",
    date: "Mar 14, 10:15 AM",
  },
  {
    id: 3,
    fromSymbol: "ETH",
    toSymbol: "XLM",
    fromAmount: "1.2",
    toAmount: "9987.43",
    date: "Mar 13, 04:45 PM",
  },
  {
    id: 4,
    fromSymbol: "USDC",
    toSymbol: "EUR",
    fromAmount: "500",
    toAmount: "460",
    date: "Mar 12, 09:20 AM",
  },
  {
    id: 5,
    fromSymbol: "SOL",
    toSymbol: "BTC",
    fromAmount: "10",
    toAmount: "0.02084",
    date: "Mar 11, 11:05 AM",
  },
]

export default function ConversionHistory() {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl">
      <div className="p-5">
        <h2 className="text-2xl font-normal text-white mb-5">Conversion History</h2>
        <div className="space-y-2">
          {conversionHistory.map((conversion) => (
            <div key={conversion.id} className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Clock className="h-4 w-4 text-purple-400" />
                  <span className="text-white text-lg">
                    {conversion.fromSymbol} → {conversion.toSymbol}
                  </span>
                </div>
                <div className="text-gray-500 text-sm pl-0">
                  {conversion.fromAmount} {conversion.fromSymbol}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end text-white text-xs mb-0.5 bg-gray-800/50 px-3 py-1 rounded-full">
                  <Clock className="h-3 w-3 mr-1 text-white" />
                  <span>{conversion.date}</span>
                </div>
                <div className="text-white text-base">
                  {conversion.toAmount} {conversion.toSymbol}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
