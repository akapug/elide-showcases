import type { Trade, Position, OrderBook, TradingSignal, MarketTick } from './types.js';

/**
 * High-Performance Crypto Trading Engine
 * Executes trades across multiple exchanges with low latency
 */
export class CryptoTrader {
  private positions: Map<string, Position> = new Map();
  private tradeHistory: Trade[] = [];
  private orderBooks: Map<string, OrderBook> = new Map();

  constructor(
    private maxPositionSize: number,
    private riskPerTrade: number,
    private stopLossPercent: number = 0.03,
    private takeProfitPercent: number = 0.05
  ) {}

  async processMarketTick(tick: MarketTick): Promise<void> {
    // Update order book
    this.orderBooks.set(tick.symbol, {
      symbol: tick.symbol,
      bids: tick.bids || [],
      asks: tick.asks || [],
      timestamp: tick.timestamp,
    });

    // Check existing positions for stop-loss/take-profit
    await this.checkPositions(tick);
  }

  async executeTrade(signal: TradingSignal, price: number): Promise<Trade | null> {
    const position = this.positions.get(signal.symbol);

    // Calculate position size
    const size = this.calculatePositionSize(signal, price);

    if (signal.action === 'BUY' && (!position || position.size === 0)) {
      const trade: Trade = {
        id: `TRADE-${Date.now()}`,
        symbol: signal.symbol,
        side: 'BUY',
        size,
        price,
        timestamp: Date.now(),
        strategyId: signal.strategyId,
      };

      // Create position
      this.positions.set(signal.symbol, {
        symbol: signal.symbol,
        size,
        entryPrice: price,
        currentPrice: price,
        unrealizedPnL: 0,
        realizedPnL: 0,
        stopLoss: price * (1 - this.stopLossPercent),
        takeProfit: price * (1 + this.takeProfitPercent),
      });

      this.tradeHistory.push(trade);
      return trade;
    } else if (signal.action === 'SELL' && position && position.size > 0) {
      const trade: Trade = {
        id: `TRADE-${Date.now()}`,
        symbol: signal.symbol,
        side: 'SELL',
        size: position.size,
        price,
        timestamp: Date.now(),
        strategyId: signal.strategyId,
      };

      // Calculate realized P&L
      const pnl = (price - position.entryPrice) * position.size;

      // Close position
      this.positions.set(signal.symbol, {
        ...position,
        size: 0,
        realizedPnL: position.realizedPnL + pnl,
      });

      this.tradeHistory.push(trade);
      return trade;
    }

    return null;
  }

  private async checkPositions(tick: MarketTick): Promise<void> {
    const position = this.positions.get(tick.symbol);
    if (!position || position.size === 0) return;

    // Update current price and unrealized P&L
    position.currentPrice = tick.price;
    position.unrealizedPnL = (tick.price - position.entryPrice) * position.size;

    // Check stop-loss
    if (position.stopLoss && tick.price <= position.stopLoss) {
      await this.executeTrade(
        {
          symbol: tick.symbol,
          action: 'SELL',
          confidence: 1.0,
          strategyId: 'STOP_LOSS',
          reason: 'Stop-loss triggered',
        },
        tick.price
      );
    }

    // Check take-profit
    if (position.takeProfit && tick.price >= position.takeProfit) {
      await this.executeTrade(
        {
          symbol: tick.symbol,
          action: 'SELL',
          confidence: 1.0,
          strategyId: 'TAKE_PROFIT',
          reason: 'Take-profit triggered',
        },
        tick.price
      );
    }
  }

  private calculatePositionSize(signal: TradingSignal, price: number): number {
    // Risk-based position sizing
    const accountValue = this.getTotalAccountValue();
    const riskAmount = accountValue * this.riskPerTrade;

    // Calculate size based on stop-loss distance
    const stopDistance = price * this.stopLossPercent;
    const shares = riskAmount / stopDistance;

    // Apply max position limit
    const maxShares = this.maxPositionSize / price;

    return Math.min(shares, maxShares);
  }

  private getTotalAccountValue(): number {
    let total = 10000; // Starting capital

    for (const position of this.positions.values()) {
      total += position.unrealizedPnL + position.realizedPnL;
    }

    return total;
  }

  getPosition(symbol: string): Position | undefined {
    return this.positions.get(symbol);
  }

  getAllPositions(): Position[] {
    return Array.from(this.positions.values()).filter(p => p.size > 0);
  }

  getTradeHistory(): Trade[] {
    return this.tradeHistory;
  }

  getPerformance(): {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    totalPnL: number;
    winRate: number;
    profitFactor: number;
  } {
    const closedTrades = this.tradeHistory.filter(t => t.side === 'SELL');
    const totalTrades = closedTrades.length;

    let totalPnL = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let grossProfit = 0;
    let grossLoss = 0;

    // Calculate from positions
    for (const position of this.positions.values()) {
      const pnl = position.realizedPnL;
      totalPnL += pnl;

      if (pnl > 0) {
        winningTrades++;
        grossProfit += pnl;
      } else if (pnl < 0) {
        losingTrades++;
        grossLoss += Math.abs(pnl);
      }
    }

    const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      totalPnL,
      winRate,
      profitFactor,
    };
  }
}
