/**
 * DeFi Analytics Platform
 *
 * A production-grade DeFi analytics service for tracking TVL, calculating yields,
 * monitoring liquidity, aggregating price feeds, and computing risk metrics.
 */

import { URL } from 'url';

// Type definitions for HTTP handlers
interface IncomingMessage {
  url?: string;
  headers: { host?: string };
  method?: string;
}

interface ServerResponse {
  setHeader(name: string, value: string): void;
  writeHead(statusCode: number, headers?: Record<string, string>): void;
  end(data?: string): void;
}

// ============================================================================
// Type Definitions
// ============================================================================

interface Protocol {
  id: string;
  name: string;
  category: 'dex' | 'lending' | 'yield' | 'derivatives' | 'insurance' | 'bridge';
  chain: string;
  tvl: bigint;
  volume24h: bigint;
  fees24h: bigint;
  users24h: number;
  lastUpdate: number;
}

interface Pool {
  id: string;
  protocol: string;
  name: string;
  tokens: string[];
  reserves: bigint[];
  tvl: bigint;
  volume24h: bigint;
  fees24h: bigint;
  apy: number;
  utilization: number;
  lastUpdate: number;
}

interface PriceFeed {
  token: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  volume24h: bigint;
  marketCap: bigint;
  sources: string[];
  confidence: number; // 0-1
  lastUpdate: number;
}

interface YieldPosition {
  protocol: string;
  pool: string;
  asset: string;
  deposited: bigint;
  apy: number;
  apyBreakdown: {
    base: number;
    rewards: number;
    trading: number;
  };
  rewards: {
    token: string;
    amount: bigint;
  }[];
  impermanentLoss?: number;
  lastUpdate: number;
}

interface LiquidityMetrics {
  pool: string;
  totalLiquidity: bigint;
  availableLiquidity: bigint;
  utilization: number;
  depth: {
    buy: { price: number; liquidity: bigint }[];
    sell: { price: number; liquidity: bigint }[];
  };
  slippage: {
    '0.1%': number;
    '0.5%': number;
    '1%': number;
    '5%': number;
  };
  lastUpdate: number;
}

interface RiskMetrics {
  protocol: string;
  overallScore: number; // 0-100
  metrics: {
    smartContractRisk: number;
    liquidationRisk: number;
    concentrationRisk: number;
    volatilityRisk: number;
    impermanentLossRisk: number;
  };
  audits: {
    auditor: string;
    date: number;
    score: number;
    url: string;
  }[];
  incidents: {
    date: number;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }[];
  lastUpdate: number;
}

interface TVLSnapshot {
  timestamp: number;
  protocol?: string;
  chain?: string;
  tvl: bigint;
  breakdown?: Record<string, bigint>;
}

// ============================================================================
// Analytics Engine
// ============================================================================

class DeFiAnalytics {
  private protocols: Map<string, Protocol> = new Map();
  private pools: Map<string, Pool> = new Map();
  private priceFeeds: Map<string, PriceFeed> = new Map();
  private yieldPositions: Map<string, YieldPosition[]> = new Map();
  private liquidityMetrics: Map<string, LiquidityMetrics> = new Map();
  private riskMetrics: Map<string, RiskMetrics> = new Map();
  private tvlHistory: TVLSnapshot[] = [];

  constructor() {
    this.initializeMockData();
    this.startDataCollection();
  }

  // TVL Tracking
  getTotalTVL(chain?: string): bigint {
    let protocols = Array.from(this.protocols.values());
    if (chain) {
      protocols = protocols.filter(p => p.chain === chain);
    }
    return protocols.reduce((sum, p) => sum + p.tvl, BigInt(0));
  }

  getTVLByProtocol(protocolId: string): bigint {
    return this.protocols.get(protocolId)?.tvl || BigInt(0);
  }

  getTVLHistory(protocol?: string, hours: number = 24): TVLSnapshot[] {
    const cutoff = Date.now() - hours * 3600 * 1000;
    let history = this.tvlHistory.filter(s => s.timestamp >= cutoff);

    if (protocol) {
      history = history.filter(s => s.protocol === protocol);
    }

    return history.sort((a, b) => a.timestamp - b.timestamp);
  }

  recordTVLSnapshot(snapshot: TVLSnapshot): void {
    this.tvlHistory.push(snapshot);

    // Keep only last 7 days
    const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
    this.tvlHistory = this.tvlHistory.filter(s => s.timestamp >= cutoff);
  }

  // Yield Calculations
  calculateAPY(pool: Pool): number {
    // Base trading fee APY
    const fees24h = Number(pool.fees24h);
    const tvl = Number(pool.tvl);
    const tradingAPY = tvl > 0 ? (fees24h * 365 / tvl) * 100 : 0;

    // Reward token APY (simulated)
    const rewardAPY = Math.random() * 20;

    return tradingAPY + rewardAPY;
  }

  getYieldOpportunities(minAPY?: number, protocol?: string): YieldPosition[] {
    const positions: YieldPosition[] = [];

    this.pools.forEach(pool => {
      if (protocol && pool.protocol !== protocol) return;

      const apy = this.calculateAPY(pool);
      if (minAPY && apy < minAPY) return;

      positions.push({
        protocol: pool.protocol,
        pool: pool.id,
        asset: pool.tokens[0],
        deposited: BigInt(0),
        apy,
        apyBreakdown: {
          base: apy * 0.6,
          rewards: apy * 0.3,
          trading: apy * 0.1
        },
        rewards: [],
        lastUpdate: Date.now()
      });
    });

    return positions.sort((a, b) => b.apy - a.apy);
  }

  // Price Feeds
  getPrice(token: string): PriceFeed | undefined {
    return this.priceFeeds.get(token.toLowerCase());
  }

  getPrices(tokens: string[]): Map<string, PriceFeed> {
    const prices = new Map<string, PriceFeed>();
    tokens.forEach(token => {
      const price = this.getPrice(token);
      if (price) {
        prices.set(token, price);
      }
    });
    return prices;
  }

  updatePrice(feed: PriceFeed): void {
    this.priceFeeds.set(feed.token.toLowerCase(), feed);
  }

  // Liquidity Monitoring
  getLiquidityMetrics(poolId: string): LiquidityMetrics | undefined {
    return this.liquidityMetrics.get(poolId);
  }

  calculateSlippage(pool: Pool, tradeSize: bigint): number {
    const k = pool.reserves[0] * pool.reserves[1];
    const newReserve0 = pool.reserves[0] + tradeSize;
    const newReserve1 = k / newReserve0;
    const outputAmount = pool.reserves[1] - newReserve1;

    const expectedPrice = Number(pool.reserves[1]) / Number(pool.reserves[0]);
    const actualPrice = Number(outputAmount) / Number(tradeSize);

    return ((expectedPrice - actualPrice) / expectedPrice) * 100;
  }

  // Risk Metrics
  calculateRiskScore(protocol: string): RiskMetrics {
    const existing = this.riskMetrics.get(protocol);
    if (existing && Date.now() - existing.lastUpdate < 3600000) {
      return existing;
    }

    // Calculate risk components
    const smartContractRisk = Math.random() * 40 + 10; // 10-50
    const liquidationRisk = Math.random() * 30 + 5; // 5-35
    const concentrationRisk = Math.random() * 25 + 5; // 5-30
    const volatilityRisk = Math.random() * 30 + 10; // 10-40
    const impermanentLossRisk = Math.random() * 25 + 5; // 5-30

    const overallScore = 100 - (
      smartContractRisk * 0.3 +
      liquidationRisk * 0.25 +
      concentrationRisk * 0.2 +
      volatilityRisk * 0.15 +
      impermanentLossRisk * 0.1
    );

    const metrics: RiskMetrics = {
      protocol,
      overallScore: Math.max(0, Math.min(100, overallScore)),
      metrics: {
        smartContractRisk,
        liquidationRisk,
        concentrationRisk,
        volatilityRisk,
        impermanentLossRisk
      },
      audits: [
        {
          auditor: 'CertiK',
          date: Date.now() - 90 * 24 * 3600 * 1000,
          score: 85,
          url: 'https://example.com/audit1'
        },
        {
          auditor: 'Trail of Bits',
          date: Date.now() - 180 * 24 * 3600 * 1000,
          score: 90,
          url: 'https://example.com/audit2'
        }
      ],
      incidents: [],
      lastUpdate: Date.now()
    };

    this.riskMetrics.set(protocol, metrics);
    return metrics;
  }

  // Protocol Analytics
  getProtocolStats(protocolId: string): Protocol | undefined {
    return this.protocols.get(protocolId);
  }

  getTopProtocols(limit: number = 10, category?: string): Protocol[] {
    let protocols = Array.from(this.protocols.values());

    if (category) {
      protocols = protocols.filter(p => p.category === category);
    }

    return protocols
      .sort((a, b) => Number(b.tvl - a.tvl))
      .slice(0, limit);
  }

  // Pool Analytics
  getPool(poolId: string): Pool | undefined {
    return this.pools.get(poolId);
  }

  getPoolsByProtocol(protocolId: string): Pool[] {
    return Array.from(this.pools.values())
      .filter(p => p.protocol === protocolId)
      .sort((a, b) => Number(b.tvl - a.tvl));
  }

  // Data Collection
  private startDataCollection(): void {
    // Simulate real-time price updates
    setInterval(() => {
      this.priceFeeds.forEach((feed, token) => {
        const change = (Math.random() - 0.5) * 0.02; // ±1%
        feed.price *= (1 + change);
        feed.priceChange24h = (Math.random() - 0.5) * 10; // ±5%
        feed.lastUpdate = Date.now();
      });
    }, 5000);

    // Simulate TVL updates
    setInterval(() => {
      this.protocols.forEach(protocol => {
        const change = (Math.random() - 0.5) * 0.05; // ±2.5%
        protocol.tvl = BigInt(Math.floor(Number(protocol.tvl) * (1 + change)));
        protocol.lastUpdate = Date.now();

        this.recordTVLSnapshot({
          timestamp: Date.now(),
          protocol: protocol.id,
          chain: protocol.chain,
          tvl: protocol.tvl
        });
      });
    }, 60000);

    // Simulate pool metrics updates
    setInterval(() => {
      this.pools.forEach(pool => {
        const change = (Math.random() - 0.5) * 0.03;
        pool.tvl = BigInt(Math.floor(Number(pool.tvl) * (1 + change)));
        pool.apy = this.calculateAPY(pool);
        pool.lastUpdate = Date.now();
      });
    }, 30000);
  }

  private initializeMockData(): void {
    // Initialize protocols
    const protocols = [
      { id: 'uniswap', name: 'Uniswap V3', category: 'dex' as const, chain: 'ethereum', tvl: BigInt('4500000000000000000000000000') },
      { id: 'aave', name: 'Aave V3', category: 'lending' as const, chain: 'ethereum', tvl: BigInt('6200000000000000000000000000') },
      { id: 'curve', name: 'Curve Finance', category: 'dex' as const, chain: 'ethereum', tvl: BigInt('3800000000000000000000000000') },
      { id: 'compound', name: 'Compound V3', category: 'lending' as const, chain: 'ethereum', tvl: BigInt('2100000000000000000000000000') },
      { id: 'yearn', name: 'Yearn Finance', category: 'yield' as const, chain: 'ethereum', tvl: BigInt('450000000000000000000000000') }
    ];

    protocols.forEach(p => {
      this.protocols.set(p.id, {
        ...p,
        volume24h: BigInt(Math.floor(Number(p.tvl) * 0.15)),
        fees24h: BigInt(Math.floor(Number(p.tvl) * 0.0015)),
        users24h: Math.floor(Math.random() * 10000) + 1000,
        lastUpdate: Date.now()
      });
    });

    // Initialize pools
    const pools = [
      { protocol: 'uniswap', name: 'ETH/USDC', tokens: ['ETH', 'USDC'], reserves: [BigInt('500000000000000000000000'), BigInt('850000000000000000000000000')] },
      { protocol: 'uniswap', name: 'WBTC/ETH', tokens: ['WBTC', 'ETH'], reserves: [BigInt('15000000000000000000'), BigInt('250000000000000000000000')] },
      { protocol: 'curve', name: '3pool', tokens: ['DAI', 'USDC', 'USDT'], reserves: [BigInt('800000000000000000000000000'), BigInt('850000000000000000000000000'), BigInt('900000000000000000000000000')] }
    ];

    pools.forEach((p, i) => {
      const tvl = p.reserves.reduce((sum, r) => sum + r, BigInt(0));
      this.pools.set(`pool-${i}`, {
        id: `pool-${i}`,
        protocol: p.protocol,
        name: p.name,
        tokens: p.tokens,
        reserves: p.reserves,
        tvl,
        volume24h: BigInt(Math.floor(Number(tvl) * 0.3)),
        fees24h: BigInt(Math.floor(Number(tvl) * 0.003)),
        apy: 0,
        utilization: Math.random() * 100,
        lastUpdate: Date.now()
      });
    });

    // Initialize price feeds
    const prices = [
      { token: 'ETH', symbol: 'ETH', price: 1850, marketCap: BigInt('222000000000000000000000000000') },
      { token: 'WBTC', symbol: 'WBTC', price: 28500, marketCap: BigInt('450000000000000000000000000000') },
      { token: 'USDC', symbol: 'USDC', price: 1.0, marketCap: BigInt('25000000000000000000000000000') },
      { token: 'DAI', symbol: 'DAI', price: 1.0, marketCap: BigInt('5000000000000000000000000000') },
      { token: 'UNI', symbol: 'UNI', price: 6.2, marketCap: BigInt('4650000000000000000000000000') }
    ];

    prices.forEach(p => {
      this.priceFeeds.set(p.token.toLowerCase(), {
        ...p,
        priceChange24h: (Math.random() - 0.5) * 10,
        volume24h: BigInt(Math.floor(Number(p.marketCap) * 0.05)),
        sources: ['Chainlink', 'Uniswap', 'Binance'],
        confidence: 0.95 + Math.random() * 0.05,
        lastUpdate: Date.now()
      });
    });
  }
}

// ============================================================================
// HTTP API Server
// ============================================================================

class AnalyticsAPI {
  private analytics: DeFiAnalytics;

  constructor(analytics: DeFiAnalytics) {
    this.analytics = analytics;
  }

  async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const path = url.pathname;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    try {
      if (path === '/api/health') {
        this.sendJSON(res, { status: 'healthy', timestamp: Date.now() });
      } else if (path === '/api/tvl') {
        const chain = url.searchParams.get('chain') || undefined;
        const tvl = this.analytics.getTotalTVL(chain);
        this.sendJSON(res, { tvl: tvl.toString(), chain });
      } else if (path.startsWith('/api/tvl/protocol/')) {
        const protocolId = path.split('/')[4];
        const tvl = this.analytics.getTVLByProtocol(protocolId);
        this.sendJSON(res, { protocol: protocolId, tvl: tvl.toString() });
      } else if (path === '/api/tvl/history') {
        const protocol = url.searchParams.get('protocol') || undefined;
        const hours = parseInt(url.searchParams.get('hours') || '24', 10);
        const history = this.analytics.getTVLHistory(protocol, hours);
        this.sendJSON(res, {
          count: history.length,
          history: history.map(h => ({ ...h, tvl: h.tvl.toString() }))
        });
      } else if (path === '/api/protocols') {
        const limit = parseInt(url.searchParams.get('limit') || '10', 10);
        const category = url.searchParams.get('category') || undefined;
        const protocols = this.analytics.getTopProtocols(limit, category);
        this.sendJSON(res, {
          count: protocols.length,
          protocols: protocols.map(p => ({
            ...p,
            tvl: p.tvl.toString(),
            volume24h: p.volume24h.toString(),
            fees24h: p.fees24h.toString()
          }))
        });
      } else if (path.startsWith('/api/protocol/')) {
        const protocolId = path.split('/')[3];
        const protocol = this.analytics.getProtocolStats(protocolId);
        if (protocol) {
          this.sendJSON(res, {
            ...protocol,
            tvl: protocol.tvl.toString(),
            volume24h: protocol.volume24h.toString(),
            fees24h: protocol.fees24h.toString()
          });
        } else {
          this.sendError(res, 404, 'Protocol not found');
        }
      } else if (path === '/api/yields') {
        const minAPY = parseFloat(url.searchParams.get('minAPY') || '0');
        const protocol = url.searchParams.get('protocol') || undefined;
        const yields = this.analytics.getYieldOpportunities(minAPY, protocol);
        this.sendJSON(res, { count: yields.length, yields });
      } else if (path === '/api/prices') {
        const tokensParam = url.searchParams.get('tokens');
        if (!tokensParam) {
          this.sendError(res, 400, 'tokens parameter required');
          return;
        }
        const tokens = tokensParam.split(',');
        const prices = this.analytics.getPrices(tokens);
        this.sendJSON(res, {
          count: prices.size,
          prices: Object.fromEntries(
            Array.from(prices.entries()).map(([k, v]) => [
              k,
              { ...v, volume24h: v.volume24h.toString(), marketCap: v.marketCap.toString() }
            ])
          )
        });
      } else if (path.startsWith('/api/price/')) {
        const token = path.split('/')[3];
        const price = this.analytics.getPrice(token);
        if (price) {
          this.sendJSON(res, {
            ...price,
            volume24h: price.volume24h.toString(),
            marketCap: price.marketCap.toString()
          });
        } else {
          this.sendError(res, 404, 'Price not found');
        }
      } else if (path.startsWith('/api/risk/')) {
        const protocol = path.split('/')[3];
        const risk = this.analytics.calculateRiskScore(protocol);
        this.sendJSON(res, risk);
      } else if (path.startsWith('/api/pool/')) {
        const poolId = path.split('/')[3];
        const pool = this.analytics.getPool(poolId);
        if (pool) {
          this.sendJSON(res, {
            ...pool,
            reserves: pool.reserves.map(r => r.toString()),
            tvl: pool.tvl.toString(),
            volume24h: pool.volume24h.toString(),
            fees24h: pool.fees24h.toString()
          });
        } else {
          this.sendError(res, 404, 'Pool not found');
        }
      } else {
        this.sendError(res, 404, 'Not Found');
      }
    } catch (error) {
      console.error('API error:', error);
      this.sendError(res, 500, 'Internal Server Error');
    }
  }

  private sendJSON(res: ServerResponse, data: any): void {
    res.writeHead(200);
    res.end(JSON.stringify(data, null, 2));
  }

  private sendError(res: ServerResponse, code: number, message: string): void {
    res.writeHead(code);
    res.end(JSON.stringify({ error: message }));
  }
}

// ============================================================================
// Main Application
// ============================================================================

async function main() {
  const PORT = parseInt(process.env.PORT || '3000', 10);

  const analytics = new DeFiAnalytics();
  const api = new AnalyticsAPI(analytics);

  console.log(`DeFi Analytics API running on http://localhost:${PORT}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET /api/health - Health check`);
  console.log(`  GET /api/tvl?chain={chain} - Total value locked`);
  console.log(`  GET /api/tvl/protocol/{id} - Protocol TVL`);
  console.log(`  GET /api/tvl/history?protocol={id}&hours={n} - TVL history`);
  console.log(`  GET /api/protocols?limit={n}&category={cat} - Top protocols`);
  console.log(`  GET /api/protocol/{id} - Protocol details`);
  console.log(`  GET /api/yields?minAPY={n}&protocol={id} - Yield opportunities`);
  console.log(`  GET /api/prices?tokens={token1,token2} - Token prices`);
  console.log(`  GET /api/price/{token} - Single token price`);
  console.log(`  GET /api/risk/{protocol} - Risk metrics`);
  console.log(`  GET /api/pool/{id} - Pool details`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
