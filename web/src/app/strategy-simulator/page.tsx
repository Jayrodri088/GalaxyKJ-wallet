'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SimulationForm } from '@/components/strategy-simulator/SimulationForm';
import { SimulationResults } from '@/components/strategy-simulator/SimulationResults';
import { StrategyInsights } from '@/components/strategy-simulator/StrategyInsights';
import { StarBackground } from '@/components/effects/star-background';
import { SimulationResult, SimulationParameters } from '@/types/simulation';

export default function StrategySimulator() {
  const [simulationData, setSimulationData] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulation = async (parameters: SimulationParameters): Promise<SimulationResult> => {
    setIsSimulating(true);
    try {
      // Mock simulation - replace with actual client-side calculation
      const result: SimulationResult = {
        finalValue: parameters.initialInvestment * (1 + (parameters.timeHorizon / 12) * 0.1),
        totalReturn: (parameters.timeHorizon / 12) * 10,
        annualizedReturn: 10,
        volatility: parameters.riskTolerance / 5,
        maxDrawdown: parameters.riskTolerance / 10,
        sharpeRatio: 1.2,
        assetAllocation: parameters.assetAllocation,
        monthlyReturns: Array(parameters.timeHorizon).fill(0.83)
      };
      setSimulationData(result);
      return result;
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = () => {
    setSimulationData(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6 relative">
      <StarBackground />
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 sm:mb-12 mt-8 sm:mt-12 text-center sm:text-left"
        >
          <h1 className="text-3xl sm:text-4xl font-bold relative inline-block">
            <span className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 to-purple-500/20 blur-xl -z-10"></span>
            <span className="relative text-white">Strategy Simulator</span>
          </h1>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-900/50 backdrop-blur-md rounded-lg border border-gray-800 p-4 sm:p-6 shadow-lg h-fit"
          >
            <SimulationForm 
              onSubmit={handleSimulation}
              initialValues={simulationData ? {
                initialInvestment: simulationData.finalValue,
                assetAllocation: simulationData.assetAllocation
              } : undefined}
              onReset={handleReset}
            />
          </motion.div>

          <div className="space-y-4 sm:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-900/50 backdrop-blur-md rounded-lg border border-gray-800 p-4 sm:p-6 shadow-lg"
            >
              {simulationData ? (
                <SimulationResults result={simulationData} isSimulating={isSimulating} />
              ) : (
                <SimulationResults result={null} isSimulating={isSimulating} />
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gray-900/50 backdrop-blur-md rounded-lg border border-gray-800 p-6 shadow-lg"
            >
              <StrategyInsights result={simulationData} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
} 