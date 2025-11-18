export interface Asset {
  symbol: string;
  quantity: number;
  currentPrice: number;
  value: number;
  expectedReturn?: number;
}

export interface Portfolio {
  id: string;
  assets: Asset[];
  totalValue: number;
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  lastRebalance: number;
}

export interface OptimizationRequest {
  portfolioId: string;
  objective: 'max_sharpe' | 'min_volatility' | 'max_return' | 'risk_parity';
  constraints?: {
    maxWeight?: number;
    minWeight?: number;
    targetReturn?: number;
    maxVolatility?: number;
  };
}

export interface OptimizationResult {
  weights: Map<string, number>;
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  optimizationTime: number;
}
