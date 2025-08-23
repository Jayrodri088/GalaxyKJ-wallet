"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletStore } from "@/store/wallet-store";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PortfolioOverview() {
  const { balance, connectionStatus } = useWalletStore();
  const { getPrice } = useCryptoPrices();

  // Get real asset data
  const xlmBalance = balance?.xlm?.balance ? parseFloat(balance.xlm.balance) : 0;
  const assetBalances = balance?.assets || [];
  
  // Calculate values using real-time prices
  const xlmPrice = getPrice("XLM");
  const xlmValue = xlmBalance * xlmPrice;
  const assetValues = assetBalances.map(asset => {
    const assetPrice = getPrice(asset.asset.code);
    return parseFloat(asset.balance) * assetPrice;
  });
  const totalValue = xlmValue + assetValues.reduce((sum, value) => sum + value, 0);

  // Portfolio card values
  const portFolioCardValues = {
    totalValue: totalValue,
    change24h: totalValue * 0.025, // Simulated 2.5% change
    change30d: totalValue * 0.08, // Simulated 8% change
    allTime: totalValue * 0.15, // Simulated 15% change
  };

  // Generate chart data based on real total value
  const lineChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    datasets: [
      {
        label: "Portfolio Value",
        data: [
          totalValue * 0.85, // Simulated historical data
          totalValue * 0.88,
          totalValue * 0.92,
          totalValue * 0.89,
          totalValue * 0.95,
          totalValue * 0.98,
          totalValue, // Current value
        ],
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        titleColor: "#fff",
        bodyColor: "#e5e7eb",
        borderColor: "#374151",
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            return `$${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        border: {
          display: false,
        },
        grid: {
          color: "rgba(75, 85, 99, 0.2)",
        },
        ticks: {
          color: "#9ca3af",
        },
      },
      y: {
        border: {
          display: false,
        },
        grid: {
          color: "rgba(75, 85, 99, 0.2)",
        },
        ticks: {
          color: "#9ca3af",
        },
      },
    },
  };

  const isLoading = connectionStatus.isLoading;

  return (
    <Card className="border-gray-800 bg-gray-900/50">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-300">
          Portfolio Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">
            Loading portfolio...
          </div>
        ) : totalValue === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No portfolio data available
          </div>
        ) : (
          <div className="space-y-6">
            {/* Portfolio Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  ${portFolioCardValues.totalValue.toFixed(2)}
                </p>
                <p className="text-sm text-gray-400">Total Value</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-green-400">
                  +${portFolioCardValues.change24h.toFixed(2)}
                </p>
                <p className="text-sm text-gray-400">24h Change</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-green-400">
                  +${portFolioCardValues.change30d.toFixed(2)}
                </p>
                <p className="text-sm text-gray-400">30d Change</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-green-400">
                  +${portFolioCardValues.allTime.toFixed(2)}
                </p>
                <p className="text-sm text-gray-400">All Time</p>
              </div>
            </div>

            {/* Chart */}
            <div className="h-64">
              <Line data={lineChartData} options={chartOptions} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}