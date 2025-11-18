export interface Strategy {
  name: string;
  generateSignal(data: MarketData, position?: Position): Promise<TradeSignal | null>;
}

export interface TradeSignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  strategyId: string;
  stopLoss?: number;
  takeProfit?: number;
}

export interface Order {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  type: 'MARKET' | 'LIMIT';
  timestamp: number;
  strategyId: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  realizedPnL: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

export interface BacktestResult {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
}
