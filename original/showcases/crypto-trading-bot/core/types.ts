export interface Trade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  size: number;
  price: number;
  timestamp: number;
  strategyId: string;
}

export interface Position {
  symbol: string;
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  realizedPnL: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface OrderBook {
  symbol: string;
  bids: Array<[number, number]>; // [price, size]
  asks: Array<[number, number]>;
  timestamp: number;
}

export interface TradingSignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  strategyId: string;
  reason?: string;
}

export interface MarketTick {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
  bids?: Array<[number, number]>;
  asks?: Array<[number, number]>;
}
