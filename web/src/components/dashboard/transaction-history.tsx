"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Filter,
  ChevronRight,
} from "lucide-react";
import { useWalletStore } from "@/store/wallet-store";

type TransactionType = "receive" | "send" | "swap";
type TransactionStatus = "completed" | "pending" | "failed";

type Transaction = {
  id: string;
  type: TransactionType;
  asset?: string;
  assetFrom?: string;
  assetTo?: string;
  amount?: string;
  amountFrom?: number;
  amountTo?: number;
  from?: string;
  to?: string;
  date: Date;
  status: TransactionStatus;
};

// Helper function to validate Stellar public key
const isValidStellarPublicKey = (key: string): boolean => {
  return Boolean(key && key.length === 56 && key.startsWith('G'));
};

export function TransactionHistory() {
  const { publicKey, transactions: walletTransactions, connectionStatus } = useWalletStore();
  const [filter, setFilter] = useState<"all" | TransactionType>("all");

  const router = useRouter();

  // Convert wallet transactions to display format
  const transactions: Transaction[] = walletTransactions.map((tx) => ({
    id: tx.id,
    type: "send" as TransactionType, // Default to send, could be enhanced with operation parsing
    asset: tx.asset,
    amount: tx.amount,
    from: tx.from,
    to: tx.to,
    date: tx.timestamp,
    status: "completed" as TransactionStatus, // Default to completed for now
  }));

  const filteredTransactions =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.type === filter);

  const formatDate = (date: Date) => {
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

  // Show message when no wallet is connected
  if (!publicKey || !isValidStellarPublicKey(publicKey)) {
    return (
      <Card className="border-gray-800 bg-gray-900/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-gray-300">
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              Connect a wallet to view transaction history
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-800 bg-gray-900/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium text-gray-300">
          Transaction History
        </CardTitle>
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
                filter === type
                  ? "bg-purple-900/50 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
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
          {connectionStatus.isLoading ? (
            <div className="text-center py-8 text-gray-400">
              Loading transactions...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No transactions found
            </div>
          ) : (
            filteredTransactions.slice(0, 4).map((tx) => (
              <div
                key={tx.id}
                className="p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-all duration-200 cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                    {tx.type === "receive" ? (
                      <ArrowDownLeft className="h-4 w-4 text-green-400" />
                    ) : tx.type === "send" ? (
                      <ArrowUpRight className="h-4 w-4 text-blue-400" />
                    ) : (
                      <RefreshCw className="h-4 w-4 text-purple-400" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium flex items-center">
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
                    <div className="text-xs text-gray-400">
                      {formatDate(tx.date)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-medium">
                      {tx.type === "swap" ? (
                        <span>
                          {tx.amountFrom} → {tx.amountTo}
                        </span>
                      ) : (
                        <span
                          className={
                            tx.type === "receive" ? "text-green-400" : ""
                          }
                        >
                          {tx.type === "receive" ? "+" : "-"}
                          {tx.amount}
                        </span>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        tx.status === "completed"
                          ? "bg-green-900/30 text-green-400 border-green-800"
                          : tx.status === "pending"
                          ? "bg-yellow-900/30 text-yellow-400 border-yellow-800"
                          : "bg-red-900/30 text-red-400 border-red-800"
                      }`}
                    >
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))
          )}
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
