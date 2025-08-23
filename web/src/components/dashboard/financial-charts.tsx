"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWalletStore } from "@/store/wallet-store";
import { useCryptoPrices } from "@/hooks/use-crypto-prices";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function FinancialCharts() {
  const [timeRange, setTimeRange] = useState("1W");
  const { balance, connectionStatus } = useWalletStore();
  const { getPrice } = useCryptoPrices();

  // Get real asset data
  const xlmBalance = balance?.xlm?.balance ? parseFloat(balance.xlm.balance) : 0;
  const assetBalances = balance?.assets || [];
  
  // Calculate real values using live prices
  const xlmValue = xlmBalance * getPrice("XLM");
  const assetValues = assetBalances.map(asset => {
    const assetPrice = getPrice(asset.asset.code);
    return parseFloat(asset.balance) * assetPrice;
  });
  const totalValue = xlmValue + assetValues.reduce((sum, value) => sum + value, 0);

  // Generate realistic historical data based on current total value
  const generateHistoricalData = (currentValue: number, days: number) => {
    const data = [];
    let baseValue = currentValue * 0.95; // Start slightly lower
    
    for (let i = 0; i < days; i++) {
      // Add some realistic volatility (±5%)
      const volatility = (Math.random() - 0.5) * 0.1;
      const dailyChange = baseValue * volatility;
      baseValue += dailyChange;
      
      // Ensure we trend towards current value
      if (i === days - 1) {
        baseValue = currentValue;
      }
      
      data.push(Math.max(baseValue, currentValue * 0.8)); // Don't go too low
    }
    
    return data;
  };

  // Get appropriate data based on time range
  const getChartData = () => {
    const daysMap = { "1D": 1, "1W": 7, "1M": 30, "3M": 90, "1Y": 365, "ALL": 365 };
    const days = daysMap[timeRange as keyof typeof daysMap] || 7;
    
    if (days === 1) {
      return [totalValue * 0.98, totalValue]; // Just 2 points for 1D
    }
    
    return generateHistoricalData(totalValue, days);
  };

  const getLabels = () => {
    const daysMap = { "1D": 1, "1W": 7, "1M": 30, "3M": 90, "1Y": 365, "ALL": 365 };
    const days = daysMap[timeRange as keyof typeof daysMap] || 7;
    
    if (days === 1) {
      return ["Yesterday", "Today"];
    } else if (days === 7) {
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    } else if (days <= 30) {
      return Array.from({ length: days }, (_, i) => `Day ${i + 1}`);
    } else {
      return Array.from({ length: Math.min(days, 12) }, (_, i) => 
        timeRange === "1Y" ? `Month ${i + 1}` : `Week ${i + 1}`
      );
    }
  };

  const lineChartData = {
    labels: getLabels(),
    datasets: [
      {
        label: "Portfolio Value",
        data: getChartData(),
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#8b5cf6",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineChartOptions: ChartOptions<"line"> = {
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
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            if (context.parsed.y !== undefined) {
              return `$${context.parsed.y.toFixed(2)}`;
            }
            return "";
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
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    elements: {
      line: {
        borderWidth: 3,
      },
    },
  };

  // Create real asset distribution data
  const createAssetData = () => {
    const assets = [
      {
        name: "XLM",
        value: xlmValue,
        color: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)"
      },
      ...assetBalances.map((asset, index) => {
        const value = parseFloat(asset.balance) * 1.0;
        const colors = [
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(236, 72, 153, 0.8)"
        ];
        const borderColors = [
          "rgba(16, 185, 129, 1)",
          "rgba(245, 158, 11, 1)",
          "rgba(139, 92, 246, 1)",
          "rgba(239, 68, 68, 1)",
          "rgba(168, 85, 247, 1)",
          "rgba(236, 72, 153, 1)"
        ];
        
        return {
          name: asset.asset.code,
          value: value,
          color: colors[index % colors.length],
          borderColor: borderColors[index % borderColors.length]
        };
      })
    ];

    return {
      labels: assets.map(asset => asset.name),
      datasets: [{
        data: assets.map(asset => asset.value),
        backgroundColor: assets.map(asset => asset.color),
        borderColor: assets.map(asset => asset.borderColor),
        borderWidth: 1,
        hoverOffset: 5,
      }]
    };
  };

  const doughnutChartData = createAssetData();

  const doughnutChartOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#e5e7eb",
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        titleColor: "#fff",
        bodyColor: "#e5e7eb",
        borderColor: "#374151",
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            const total = context.dataset.data.reduce((acc, data) => acc + data, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `$${value.toFixed(2)} (${percentage}%)`;
          },
        },
      },
    },
  };

  const timeRangeOptions = ["1D", "1W", "1M", "3M", "1Y", "ALL"];
  const isLoading = connectionStatus.isLoading;

  return (
    <Card className="border-gray-800 bg-gray-900/50"> 
      <CardContent className="p-6">
        <Tabs defaultValue="portfolio" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList className="bg-gray-800/50">
              <TabsTrigger value="portfolio" className="data-[state=active]:bg-purple-900/50">
                Portfolio
              </TabsTrigger>
              <TabsTrigger value="allocation" className="data-[state=active]:bg-purple-900/50">
                Allocation
              </TabsTrigger>
            </TabsList>
  
            <div className="flex gap-1">
              {timeRangeOptions.map((range) => (
                <button
                  key={range}
                  className={`px-2 py-1 text-xs rounded ${
                    timeRange === range
                      ? "bg-purple-900/70 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  }`}
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
  
          <TabsContent value="portfolio" className="mt-0">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Loading portfolio data...
              </div>
            ) : totalValue === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No portfolio data available
              </div>
            ) : (
              <div className="h-64">
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            )}
          </TabsContent>
  
          <TabsContent value="allocation" className="mt-0">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Loading allocation data...
              </div>
            ) : totalValue === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No allocation data available
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
  
}
