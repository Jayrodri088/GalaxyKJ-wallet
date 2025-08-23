"use client";

import { useState } from "react";
import { Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/store/wallet-store";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";

export function BalanceDisplay() {
  const [hideBalance, setHideBalance] = useState(false);
  const [showTokens, setShowTokens] = useState(false);

  const { balance, connectionStatus } = useWalletStore();
  const { getPrice, getChange24h } = useCryptoPrices();

  // Get real balance data
  const xlmBalance = balance?.xlm?.balance ? parseFloat(balance.xlm.balance) : 0;
  const assetBalances = balance?.assets || [];

  // Create tokens array from real data with live prices
  const tokens = [
    {
      name: "XLM",
      balance: xlmBalance,
      value: xlmBalance * getPrice("XLM"),
      change: getChange24h("XLM"),
      isNative: true,
    },
    // Add other assets from the wallet
    ...assetBalances.map((asset) => ({
      name: asset.asset.code,
      balance: parseFloat(asset.balance),
      value: parseFloat(asset.balance) * getPrice(asset.asset.code),
      change: getChange24h(asset.asset.code),
      isNative: false,
      issuer: asset.asset.issuer,
    })),
  ];

  const totalBalance = tokens.reduce((acc, token) => acc + token.value, 0);
  const isLoading = connectionStatus.isLoading;

  return (
    <Card className="border-gray-800 bg-gray-900/50">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-300">Total Balance</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setHideBalance(!hideBalance)}
            className="h-8 w-8 rounded-full"
          >
            {hideBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            {hideBalance
              ? "••••••"
              : isLoading
              ? "Loading..."
              : `$${totalBalance.toFixed(2)}`}
          </h1>
          <div className="flex items-center mt-1 text-sm">
            <span className="text-green-400 mr-2">+1.8%</span>
            <span className="text-gray-400">Last 24h</span>
          </div>
          {connectionStatus.error && (
            <div className="mt-2 text-sm text-red-400">
              {connectionStatus.error}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-medium">Your Assets</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTokens(!showTokens)}
              className="h-8 flex items-center gap-1 text-sm"
            >
              {showTokens ? "Hide" : "Show All"}
              {showTokens ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          <div className="space-y-3">
            {tokens.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {isLoading ? "Loading assets..." : "No assets found"}
              </div>
            ) : (
              tokens.slice(0, showTokens ? tokens.length : 2).map((token, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-xs font-bold">{token.name.substring(0, 2)}</span>
                    </div>
                    <div>
                      <div className="font-medium">{token.name}</div>
                      <div className="text-sm text-gray-400">
                        {hideBalance ? "•••••" : token.balance.toFixed(token.balance < 1 ? 4 : 2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {hideBalance ? "•••••" : `$${token.value.toFixed(2)}`}
                    </div>
                    <div className={`text-sm ${token.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {token.change >= 0 ? "+" : ""}
                      {token.change}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
