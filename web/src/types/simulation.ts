export interface SimulationParameters {
  asset: string;
  marketScenario: string;
  strategy: string;
  initialInvestment: number;
  timeHorizon: number;
  riskTolerance: number;
  reinvestDividends: boolean;
  assetAllocation: Record<string, number>;
}

export interface SimulationResult {
  finalValue: number;
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  maxDrawdown: number;
  sharpeRatio: number;
  assetAllocation: Record<string, number>;
  monthlyReturns: number[];
}

export interface SimulationResults {
  finalPortfolioValue: number;
  totalContributions: number;
  totalReturns: number;
  annualizedReturn: number;
  maxDrawdown: number;
  monthlyReturns: number[];
  portfolioValueHistory: number[];
}

export interface StrategyInsights {
  riskMetrics: {
    volatility: number;
    sharpeRatio: number;
    sortinoRatio: number;
  };
  performanceMetrics: {
    bestMonth: number;
    worstMonth: number;
    averageReturn: number;
  };
  recommendations: string[];
} 