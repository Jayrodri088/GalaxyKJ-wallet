import React, { useState } from 'react';
import { SimulationParameters, SimulationResult } from '@/types/simulation';
import { ToggleSlider } from '@/components/ui/toggle-slider';

interface SimulationFormProps {
  onSubmit: (parameters: SimulationParameters) => Promise<SimulationResult>;
  initialValues?: Partial<SimulationParameters>;
  onReset?: () => void;
}

const CRYPTO_ASSETS = [
  { value: 'XLM', label: 'Stellar Lumens (XLM)', description: 'Fast, efficient cross-border payments' },
  { value: 'BTC', label: 'Bitcoin (BTC)', description: 'The original cryptocurrency' },
  { value: 'ETH', label: 'Ethereum (ETH)', description: 'Smart contract platform' },
  { value: 'ADA', label: 'Cardano (ADA)', description: 'Research-driven blockchain platform' }
];

const MARKET_SCENARIOS = [
  { value: 'bull', label: 'Bull Market', description: 'Rising market with strong growth' },
  { value: 'bear', label: 'Bear Market', description: 'Declining market with reduced activity' },
  { value: 'sideways', label: 'Sideways Market', description: 'Stable market with minimal movement' },
  { value: 'volatile', label: 'Volatile Market', description: 'High fluctuation with rapid changes' }
];

const INVESTMENT_STRATEGIES = [
  { value: 'hodl', label: 'HODL', description: 'Long-term holding strategy' },
  { value: 'dca', label: 'Dollar Cost Averaging (DCA)', description: 'Regular investment over time' },
  { value: 'swing', label: 'Swing Trading', description: 'Short to medium-term trading' },
  { value: 'momentum', label: 'Momentum Trading', description: 'Following market trends' }
];

export const SimulationForm: React.FC<SimulationFormProps> = ({
  onSubmit,
  initialValues = {},
  onReset,
}) => {
  const [parameters, setParameters] = useState<SimulationParameters>({
    asset: initialValues.asset ?? 'XLM',
    marketScenario: initialValues.marketScenario ?? 'bull',
    strategy: initialValues.strategy ?? 'hodl',
    initialInvestment: initialValues.initialInvestment ?? 1000,
    timeHorizon: initialValues.timeHorizon ?? 12,
    riskTolerance: initialValues.riskTolerance ?? 50,
    reinvestDividends: initialValues.reinvestDividends ?? true,
    assetAllocation: initialValues.assetAllocation ?? { 'XLM': 100 }
  });

  const [selectedAsset, setSelectedAsset] = useState(CRYPTO_ASSETS[0]);
  const [selectedScenario, setSelectedScenario] = useState(MARKET_SCENARIOS[0]);
  const [selectedStrategy, setSelectedStrategy] = useState(INVESTMENT_STRATEGIES[0]);
  const [activeDropdown, setActiveDropdown] = useState<'asset' | 'scenario' | 'strategy' | null>(null);

  const handleDropdownToggle = (type: 'asset' | 'scenario' | 'strategy') => {
    setActiveDropdown(activeDropdown === type ? null : type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(parameters);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setParameters(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
      return;
    }

    if (name === 'initialInvestment' || name === 'timeHorizon' || name === 'riskTolerance') {
      setParameters(prev => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value)
      }));
      return;
    }

    setParameters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReset = () => {
    setParameters({
      asset: 'XLM',
      marketScenario: 'bull',
      strategy: 'hodl',
      initialInvestment: 1000,
      timeHorizon: 12,
      riskTolerance: 50,
      reinvestDividends: true,
      assetAllocation: { 'XLM': 100 }
    });
    setSelectedAsset(CRYPTO_ASSETS[0]);
    setSelectedScenario(MARKET_SCENARIOS[0]);
    setSelectedStrategy(INVESTMENT_STRATEGIES[0]);
    setActiveDropdown(null);
    onReset?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <div className="relative">
          <label htmlFor="asset" className="block text-sm font-medium text-gray-300 mb-2">
            Cryptocurrency Asset
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => handleDropdownToggle('asset')}
              className="w-full rounded-md bg-gray-800/30 border-gray-700 text-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-12 px-4 flex items-center justify-between"
            >
              <span>{selectedAsset.label}</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {activeDropdown === 'asset' && (
              <div className="absolute z-10 w-full mt-1 bg-gray-900/90 backdrop-blur-md rounded-lg border border-gray-700 shadow-xl">
                {CRYPTO_ASSETS.map((asset) => (
                  <div
                    key={asset.value}
                    onClick={() => {
                      setSelectedAsset(asset);
                      setParameters(prev => ({ ...prev, asset: asset.value }));
                      setActiveDropdown(null);
                    }}
                    className="px-4 py-3 hover:bg-gray-800/50 cursor-pointer transition-colors duration-150 border-b border-gray-800 last:border-b-0"
                  >
                    <div className="font-medium text-gray-200">{asset.label}</div>
                    <div className="text-sm text-gray-400 mt-1">{asset.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <label htmlFor="marketScenario" className="block text-sm font-medium text-gray-300 mb-2">
            Market Scenario
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => handleDropdownToggle('scenario')}
              className="w-full rounded-md bg-gray-800/30 border-gray-700 text-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-12 px-4 flex items-center justify-between"
            >
              <span>{selectedScenario.label}</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {activeDropdown === 'scenario' && (
              <div className="absolute z-10 w-full mt-1 bg-gray-900/90 backdrop-blur-md rounded-lg border border-gray-700 shadow-xl">
                {MARKET_SCENARIOS.map((scenario) => (
                  <div
                    key={scenario.value}
                    onClick={() => {
                      setSelectedScenario(scenario);
                      setParameters(prev => ({ ...prev, marketScenario: scenario.value }));
                      setActiveDropdown(null);
                    }}
                    className="px-4 py-3 hover:bg-gray-800/50 cursor-pointer transition-colors duration-150 border-b border-gray-800 last:border-b-0"
                  >
                    <div className="font-medium text-gray-200">{scenario.label}</div>
                    <div className="text-sm text-gray-400 mt-1">{scenario.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <label htmlFor="strategy" className="block text-sm font-medium text-gray-300 mb-2">
            Investment Strategy
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => handleDropdownToggle('strategy')}
              className="w-full rounded-md bg-gray-800/30 border-gray-700 text-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-12 px-4 flex items-center justify-between"
            >
              <span>{selectedStrategy.label}</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {activeDropdown === 'strategy' && (
              <div className="absolute z-10 w-full mt-1 bg-gray-900/90 backdrop-blur-md rounded-lg border border-gray-700 shadow-xl">
                {INVESTMENT_STRATEGIES.map((strategy) => (
                  <div
                    key={strategy.value}
                    onClick={() => {
                      setSelectedStrategy(strategy);
                      setParameters(prev => ({ ...prev, strategy: strategy.value }));
                      setActiveDropdown(null);
                    }}
                    className="px-4 py-3 hover:bg-gray-800/50 cursor-pointer transition-colors duration-150 border-b border-gray-800 last:border-b-0"
                  >
                    <div className="font-medium text-gray-200">{strategy.label}</div>
                    <div className="text-sm text-gray-400 mt-1">{strategy.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="initialInvestment" className="block text-sm font-medium text-gray-300 mb-2">
            Initial Investment (USD)
          </label>
          <input
            type="number"
            id="initialInvestment"
            name="initialInvestment"
            value={parameters.initialInvestment || ''}
            onChange={handleChange}
            min="0"
            step="100"
            className="mt-1 block w-full rounded-md bg-gray-800/30 border-gray-700 text-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-12 px-4 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>

        <div>
          <label htmlFor="timeHorizon" className="block text-sm font-medium text-gray-300 mb-2">
            Time Horizon (Months)
          </label>
          <div className="relative">
            <input
              type="range"
              id="timeHorizon"
              name="timeHorizon"
              min="1"
              max="60"
              value={parameters.timeHorizon}
              onChange={handleChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>1 month</span>
              <span className="text-gray-200 font-medium">{parameters.timeHorizon} months</span>
              <span>5 years</span>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="riskTolerance" className="block text-sm font-medium text-gray-300 mb-2">
            Risk Tolerance
          </label>
          <div className="relative">
            <input
              type="range"
              id="riskTolerance"
              name="riskTolerance"
              min="0"
              max="100"
              value={parameters.riskTolerance}
              onChange={handleChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>Conservative</span>
              <span className="text-gray-200 font-medium">{parameters.riskTolerance}%</span>
              <span>Aggressive</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="reinvestDividends" className="text-sm font-medium text-gray-300">
            Reinvest Dividends/Rewards
          </label>
          <ToggleSlider
            value={parameters.reinvestDividends}
            onChange={(value) => {
              setParameters(prev => ({
                ...prev,
                reinvestDividends: value
              }));
            }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors duration-200"
        >
          Run Simulation
        </button>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 rounded-md bg-gray-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700 transition-colors duration-200"
          >
            Reset
          </button>
          <button
            type="button"
            className="flex-1 rounded-md bg-gray-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-700 transition-colors duration-200"
          >
            Export
          </button>
        </div>
      </div>
    </form>
  );
}; 