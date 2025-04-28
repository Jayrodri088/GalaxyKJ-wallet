import React, { useState } from 'react';
import { SimulationResult } from '@/types/simulation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart, Bar } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';

interface SimulationResultsProps {
  result?: SimulationResult | null;
  isSimulating?: boolean;
}

const TABS = ['Performance', 'Comparison', 'Risk Analysis', 'Portfolio'] as const;

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#F97316']; 

export const SimulationResults: React.FC<SimulationResultsProps> = ({ result, isSimulating }) => {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Performance');

  // Mock data for charts - replace with actual simulation data
  const performanceData = result ? Array.from({ length: 12 }, (_, i) => ({
    month: `Month ${i + 1}`,
    value: result.finalValue * (1 + (i / 12)),
  })) : [];

  const comparisonData = result ? [
    { name: 'Strategy', value: result.totalReturn },
    { name: 'Benchmark', value: result.totalReturn * 0.8 },
  ] : [];

  const riskData = [
    { name: 'Volatility', value: result?.volatility || 0 },
    { name: 'Max Drawdown', value: result?.maxDrawdown || 0 },
    { name: 'Sharpe Ratio', value: result?.sharpeRatio || 0 },
  ];

  const portfolioData = Object.entries(result?.assetAllocation || {}).map(([name, value]) => ({
    name,
    value,
  }));

  const renderTabContent = () => {
    if (isSimulating) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!result) {
      switch (activeTab) {
        case 'Performance':
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-3">
                  <h3 className="text-sm text-gray-400">Total Return</h3>
                  <p className="text-2xl font-semibold text-gray-200">--</p>
                </div>
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-3">
                  <h3 className="text-sm text-gray-400">Final Value</h3>
                  <p className="text-2xl font-semibold text-gray-200">--</p>
                </div>
              </div>
              <div className="h-64 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 flex items-center justify-center text-gray-400">
                Performance Chart
              </div>
            </div>
          );
        case 'Comparison':
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-3">
                  <h3 className="text-sm text-gray-400">Strategy Return</h3>
                  <p className="text-2xl font-semibold text-gray-200">--</p>
                </div>
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-3">
                  <h3 className="text-sm text-gray-400">Benchmark Return</h3>
                  <p className="text-2xl font-semibold text-gray-200">--</p>
                </div>
              </div>
              <div className="h-64 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 flex items-center justify-center text-gray-400">
                Comparison Chart
              </div>
            </div>
          );
        case 'Risk Analysis':
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-3">
                  <h3 className="text-sm text-gray-400">Volatility</h3>
                  <p className="text-2xl font-semibold text-gray-200">--</p>
                </div>
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-3">
                  <h3 className="text-sm text-gray-400">Max Drawdown</h3>
                  <p className="text-2xl font-semibold text-gray-200">--</p>
                </div>
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-3">
                  <h3 className="text-sm text-gray-400">Sharpe Ratio</h3>
                  <p className="text-2xl font-semibold text-gray-200">--</p>
                </div>
              </div>
              <div className="h-64 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 flex items-center justify-center text-gray-400">
                Risk Analysis Chart
              </div>
            </div>
          );
        case 'Portfolio':
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-3">
                  <h3 className="text-sm text-gray-400">Asset Allocation</h3>
                  <p className="text-2xl font-semibold text-gray-200">--</p>
                </div>
              </div>
              <div className="h-64 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 flex items-center justify-center text-gray-400">
                Portfolio Chart
              </div>
            </div>
          );
      }
    }

    // Original content when result is available
    switch (activeTab) {
      case 'Performance':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-3">
                <h3 className="text-sm text-gray-400">Total Return</h3>
                <p className="text-2xl font-semibold text-gray-200">{result?.totalReturn.toFixed(2) || '--'}%</p>
              </div>
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-3">
                <h3 className="text-sm text-gray-400">Final Value</h3>
                <p className="text-2xl font-semibold text-gray-200">${result?.finalValue.toLocaleString() || '--'}</p>
              </div>
            </div>
            <div className="h-64 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'Comparison':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-3">
                <h3 className="text-sm text-gray-400">Strategy Return</h3>
                <p className="text-2xl font-semibold text-gray-200">{result?.totalReturn.toFixed(2) || '--'}%</p>
              </div>
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-3">
                <h3 className="text-sm text-gray-400">Benchmark Return</h3>
                <p className="text-2xl font-semibold text-gray-200">{(result?.totalReturn * 0.8).toFixed(2) || '--'}%</p>
              </div>
            </div>
            <div className="h-64 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'Risk Analysis':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-3">
                <h3 className="text-sm text-gray-400">Volatility</h3>
                <p className="text-2xl font-semibold text-gray-200">{result?.volatility.toFixed(2) || '--'}%</p>
              </div>
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-3">
                <h3 className="text-sm text-gray-400">Max Drawdown</h3>
                <p className="text-2xl font-semibold text-gray-200">{result?.maxDrawdown.toFixed(2) || '--'}%</p>
              </div>
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-3">
                <h3 className="text-sm text-gray-400">Sharpe Ratio</h3>
                <p className="text-2xl font-semibold text-gray-200">{result?.sharpeRatio.toFixed(2) || '--'}</p>
              </div>
            </div>
            <div className="h-64 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'Portfolio':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(result?.assetAllocation || {}).map(([asset, allocation]) => (
                <div key={asset} className="bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800 p-3">
                  <h3 className="text-sm text-gray-400">{asset}</h3>
                  <p className="text-2xl font-semibold text-gray-200">{allocation}%</p>
                </div>
              ))}
            </div>
            <div className="h-64 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-800">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {portfolioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} className={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                    labelStyle={{ color: '#9CA3AF' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-md rounded-lg border border-gray-800 p-6 shadow-lg">
      <nav className="flex flex-wrap justify-center -mb-px space-x-2 sm:space-x-4 md:space-x-8">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              whitespace-nowrap py-4 px-1 sm:px-2 md:px-4 border-b-2 font-medium text-sm transition-colors
              ${activeTab === tab
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-200'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
}; 