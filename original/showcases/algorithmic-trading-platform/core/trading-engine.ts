import type { Strategy, Order, Position, MarketData, TradeSignal } from './types.js';

/**
 * High-Performance Trading Engine
 * Executes strategies with low-latency order management
 */
export class TradingEngine {
  private positions: Map<string, Position> = new Map();
  private pendingOrders: Map<string, Order> = new Map();
  private strategies: Map<string, Strategy> = new Map();
  private marketData: Map<string, MarketData> = new Map();

  constructor(
    private maxPositionSize: number,
    private riskPerTrade: number
  ) {}

  registerStrategy(name: string, strategy: Strategy): void {
    this.strategies.set(name, strategy);
  }

  async processMarketData(data: MarketData): Promise<void> {
    this.marketData.set(data.symbol, data);

    // Run all strategies
    for (const [name, strategy] of this.strategies) {
      const signal = await strategy.generateSignal(data, this.getPosition(data.symbol));

      if (signal) {
        await this.executeSignal(signal, data);
      }
    }
  }

  private async executeSignal(signal: TradeSignal, data: MarketData): Promise<void> {
    const position = this.getPosition(signal.symbol);
    const positionSize = this.calculatePositionSize(signal, data);

    if (signal.action === 'BUY' && (!position || position.quantity === 0)) {
      await this.createOrder({
        id: `ORD-${Date.now()}`,
        symbol: signal.symbol,
        side: 'BUY',
        quantity: positionSize,
        price: data.price,
        type: 'MARKET',
        timestamp: Date.now(),
        strategyId: signal.strategyId,
      });
    } else if (signal.action === 'SELL' && position && position.quantity > 0) {
      await this.createOrder({
        id: `ORD-${Date.now()}`,
        symbol: signal.symbol,
        side: 'SELL',
        quantity: position.quantity,
        price: data.price,
        type: 'MARKET',
        timestamp: Date.now(),
        strategyId: signal.strategyId,
      });
    }
  }

  private calculatePositionSize(signal: TradeSignal, data: MarketData): number {
    // Kelly Criterion-based position sizing
    const accountValue = this.getTotalAccountValue();
    const riskAmount = accountValue * this.riskPerTrade;
    const stopLoss = signal.stopLoss || data.price * 0.98;
    const riskPerShare = Math.abs(data.price - stopLoss);

    const shares = Math.floor(riskAmount / riskPerShare);
    const maxShares = Math.floor(this.maxPositionSize / data.price);

    return Math.min(shares, maxShares);
  }

  private async createOrder(order: Order): Promise<void> {
    this.pendingOrders.set(order.id, order);

    // Simulate execution (in production: send to broker API)
    setTimeout(() => {
      this.executeOrder(order);
    }, 100);
  }

  private executeOrder(order: Order): void {
    const position = this.getPosition(order.symbol);

    if (order.side === 'BUY') {
      const newQty = (position?.quantity || 0) + order.quantity;
      const newAvgPrice =
        ((position?.averagePrice || 0) * (position?.quantity || 0) +
          order.price * order.quantity) /
        newQty;

      this.positions.set(order.symbol, {
        symbol: order.symbol,
        quantity: newQty,
        averagePrice: newAvgPrice,
        currentPrice: order.price,
        unrealizedPnL: 0,
        realizedPnL: 0,
      });
    } else if (order.side === 'SELL' && position) {
      const realizedPnL = (order.price - position.averagePrice) * order.quantity;

      this.positions.set(order.symbol, {
        ...position,
        quantity: position.quantity - order.quantity,
        realizedPnL: position.realizedPnL + realizedPnL,
      });
    }

    this.pendingOrders.delete(order.id);
  }

  private getPosition(symbol: string): Position | undefined {
    return this.positions.get(symbol);
  }

  private getTotalAccountValue(): number {
    let total = 100000; // Starting cash

    for (const position of this.positions.values()) {
      total += position.quantity * position.currentPrice;
    }

    return total;
  }

  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  getPerformance(): {
    totalValue: number;
    totalPnL: number;
    positions: Position[];
  } {
    const positions = this.getPositions();
    const totalValue = this.getTotalAccountValue();
    const totalPnL = positions.reduce((sum, p) => sum + p.realizedPnL + p.unrealizedPnL, 0);

    return { totalValue, totalPnL, positions };
  }
}
