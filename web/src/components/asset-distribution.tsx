"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletStore } from "@/store/wallet-store";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";

export function AssetDistribution() {
  const { balance, connectionStatus } = useWalletStore();
  const { getPrice } = useCryptoPrices();

  // Get real asset data
  const xlmBalance = balance?.xlm?.balance ? parseFloat(balance.xlm.balance) : 0;
  const assetBalances = balance?.assets || [];
  
  // Calculate values using real-time prices
  const xlmValue = xlmBalance * getPrice("XLM");
  const assetValues = assetBalances.map(asset => {
    const assetPrice = getPrice(asset.asset.code);
    return parseFloat(asset.balance) * assetPrice;
  });
  const totalValue = xlmValue + assetValues.reduce((sum, value) => sum + value, 0);

  // Create asset distribution data
  const assets = [
    {
      name: "XLM",
      value: xlmValue,
      percentage: totalValue > 0 ? (xlmValue / totalValue) * 100 : 0,
      color: "#4ADD80"
    },
    ...assetBalances.map((asset, index) => {
      const value = parseFloat(asset.balance) * 1.0;
      return {
        name: asset.asset.code,
        value: value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
        color: `hsl(${120 + index * 60}, 70%, 60%)` // Generate different colors
      };
    })
  ];

  const isLoading = connectionStatus.isLoading;

  return (
    <Card className="border-gray-800 bg-gray-900/50">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-300">
          Asset Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">
            Loading asset distribution...
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No assets found
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pie chart representation */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 32 32">
                  {assets.map((asset, index) => {
                    const previousAssets = assets.slice(0, index);
                    const previousPercentage = previousAssets.reduce((sum, a) => sum + a.percentage, 0);
                    const circumference = 2 * Math.PI * 14; // radius = 14
                    const strokeDasharray = (asset.percentage / 100) * circumference;
                    const strokeDashoffset = (previousPercentage / 100) * circumference;
                    
                    return (
                      <circle
                        key={asset.name}
                        cx="16"
                        cy="16"
                        r="14"
                        fill="none"
                        stroke={asset.color}
                        strokeWidth="4"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Asset list */}
            <div className="space-y-3">
              {assets.map((asset) => (
                <div key={asset.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: asset.color }}
                    />
                    <span className="text-sm font-medium text-gray-300">
                      {asset.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-300">
                      ${asset.value.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {asset.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total value */}
            <div className="pt-4 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-300">Total Value</span>
                <span className="text-lg font-bold text-white">
                  ${totalValue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}