'use client';

import React from 'react';
import { SimulationResult, StrategyInsights as StrategyInsightsType } from '@/types/simulation';

interface StrategyInsightsProps {
  result?: SimulationResult | null;
  placeholderHeight?: string;
  placeholderMessage?: string;
}

export const StrategyInsights: React.FC<StrategyInsightsProps> = ({ 
  result,
  placeholderHeight = 'h-38',
  placeholderMessage = 'Run a simulation to receive strategy insights'
}) => {
  if (!result) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-md rounded-lg border border-gray-800 p-6 shadow-lg">
        <div className={`flex items-center justify-center ${placeholderHeight}`}>
          <p className="text-gray-400">{placeholderMessage}</p>
        </div>
      </div>
    );
  }

  const getRiskProfile = () => {
    if (result.volatility < 10) return 'Conservative';
    if (result.volatility < 20) return 'Moderate';
    return 'Aggressive';
  };

  const getRecommendation = (): StrategyInsightsType => {
    const riskProfile = getRiskProfile();

    return {
      riskMetrics: {
        volatility: result.volatility,
        sharpeRatio: result.sharpeRatio,
        sortinoRatio: result.sharpeRatio * 1.2 // Example calculation
      },
      performanceMetrics: {
        bestMonth: Math.max(...result.monthlyReturns),
        worstMonth: Math.min(...result.monthlyReturns),
        averageReturn: result.monthlyReturns.reduce((a: number, b: number) => a + b, 0) / result.monthlyReturns.length
      },
      recommendations: [
        riskProfile === 'Aggressive' && result.sharpeRatio < 1
          ? 'Consider rebalancing to reduce risk exposure'
          : riskProfile === 'Conservative' && result.sharpeRatio > 1.5
          ? 'Consider increasing risk exposure for better returns'
          : 'Current strategy appears well-balanced'
      ]
    };
  };

  const insights = getRecommendation();

  return (
    <div className="bg-gray-900/50 backdrop-blur-md rounded-lg border border-gray-800 p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-gray-200 mb-4">Strategy Insights</h2>
      
      <div className="space-y-4">
        <div className="bg-gray-800/30 p-4 rounded-lg">
          <h3 className="text-sm text-gray-400">Risk Metrics</h3>
          <p className="text-lg text-gray-200">Volatility: {insights.riskMetrics.volatility.toFixed(2)}%</p>
          <p className="text-sm text-gray-400 mt-2">
            Sharpe Ratio: {insights.riskMetrics.sharpeRatio.toFixed(2)} | 
            Sortino Ratio: {insights.riskMetrics.sortinoRatio.toFixed(2)}
          </p>
        </div>

        <div className="bg-gray-800/30 p-4 rounded-lg">
          <h3 className="text-sm text-gray-400">Performance Metrics</h3>
          <p className="text-lg text-gray-200">
            Best Month: {insights.performanceMetrics.bestMonth.toFixed(2)}% | 
            Worst Month: {insights.performanceMetrics.worstMonth.toFixed(2)}%
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Average Return: {insights.performanceMetrics.averageReturn.toFixed(2)}%
          </p>
        </div>

        <div className="bg-gray-800/30 p-4 rounded-lg">
          <h3 className="text-sm text-gray-400">Recommendations</h3>
          {insights.recommendations.map((recommendation, index) => (
            <p key={index} className="text-lg text-gray-200">{recommendation}</p>
          ))}
        </div>
      </div>
    </div>
  );
}; 