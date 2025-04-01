"use client";

import { useRouter } from "next/navigation"; 
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Filter } from "lucide-react";

type TransactionType = "receive" | "send" | "swap";
type TransactionStatus = "completed" | "pending" | "failed";

type Transaction = {
  id: number;
  type: TransactionType;
  asset?: string;
  assetFrom?: string;
  assetTo?: string;
  amount?: number;
  amountFrom?: number;
  amountTo?: number;
  from?: string;
  to?: string;
  date: string;
  status: TransactionStatus;
};

const transactions: Transaction[] = [
  {
    id: 1,
    type: "receive",
    asset: "XLM",
    amount: 125.5,
    from: "G7J2...X9P3",
    date: "2025-03-11T14:32:00",
    status: "completed",
  },
  {
    id: 2,
    type: "send",
    asset: "USDC",
    amount: 50,
    to: "H8K3...L7M2",
    date: "2025-03-10T09:15:00",
    status: "completed",
  },
  {
    id: 3,
    type: "swap",
    assetFrom: "XLM",
    assetTo: "USDC",
    amountFrom: 200,
    amountTo: 78.25,
    date: "2025-03-09T16:45:00",
    status: "completed",
  },
  {
    id: 4,
    type: "send",
    asset: "XLM",
    amount: 75,
    to: "P9Q2...R5S7",
    date: "2025-03-08T11:20:00",
    status: "pending",
  },
];

export function TransactionHistory() {
  const [filter, setFilter] = useState<"all" | TransactionType>("all");
  const router = useRouter();

  const filteredTransactions =
    filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const viewAllTransactions = () => {
    router.push("/transactions");
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case "receive":
        return <ArrowDownLeft className="h-4 w-4 text-[#10B981]" />;
      case "send":
        return <ArrowUpRight className="h-4 w-4 text-[#60A5FA]" />;
      case "swap":
        return <RefreshCw className="h-4 w-4 text-[#A78BFA]" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case "completed":
        return "bg-[#059669] bg-opacity-20 text-[#34D399]";
      case "pending":
        return "bg-[#D97706] bg-opacity-20 text-[#FBBF24]";
      case "failed":
        return "bg-[#DC2626] bg-opacity-20 text-[#F87171]";
      default:
        return "bg-gray-600 bg-opacity-20 text-gray-400";
    }
  };

  return (
    <Card className="bg-[#0F1225] border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium text-gray-300">Transaction History</CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300"
        >
          <Filter className="h-3.5 w-3.5 mr-1" />
          Filter
        </Button>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin">
          {["all", "receive", "send", "swap"].map((type) => (
            <Button
              key={type}
              variant="ghost"
              size="sm"
              className={`rounded-full px-3 py-1 text-xs ${
                filter === type ? "bg-purple-900/50 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
              onClick={() => setFilter(type as "all" | TransactionType)}
            >
              {type === "all"
                ? "All"
                : type === "receive"
                ? "Received"
                : type === "send"
                ? "Sent"
                : "Swaps"}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="p-3 rounded-lg bg-[#1F2937] bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1F2937] bg-opacity-50 flex items-center justify-center">
                  {getTransactionIcon(tx.type)}
                </div>
                <div>
                  <div className="font-medium text-gray-200">
                    {tx.type === "swap" ? (
                      <span>
                        {tx.assetFrom} → {tx.assetTo}
                      </span>
                    ) : (
                      <span>
                        {tx.type === "send" ? "Sent" : "Received"} {tx.asset}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{formatDate(tx.date)}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-medium text-gray-200">
                  {tx.type === "swap" ? (
                    <span>
                      {tx.amountFrom} → {tx.amountTo}
                    </span>
                  ) : (
                    <span className={tx.type === "receive" ? "text-[#10B981]" : "text-[#60A5FA]"}>
                      {tx.type === "receive" ? "+" : "-"}
                      {tx.amount}
                    </span>
                  )}
                </div>
                <div className={`text-xs px-2 py-1 rounded-full inline-block ${getStatusColor(tx.status)}`}>
                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <Button
            variant="ghost"
            className="w-full text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
            onClick={viewAllTransactions}
          >
            View All Transactions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
