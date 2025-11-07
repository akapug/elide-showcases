# DeFi Analytics Platform

A production-grade DeFi analytics service for tracking Total Value Locked (TVL), calculating yields, monitoring liquidity, aggregating price feeds, and computing comprehensive risk metrics across protocols.

## Features

- **TVL Tracking**: Real-time tracking of Total Value Locked across protocols and chains
- **Yield Calculations**: APY calculations with breakdown by source (trading fees, rewards, etc.)
- **Price Feeds**: Multi-source price aggregation with confidence scoring
- **Liquidity Monitoring**: Pool liquidity metrics, utilization, and slippage analysis
- **Risk Metrics**: Comprehensive risk scoring across multiple dimensions
- **Protocol Analytics**: Volume, fees, and user metrics
- **Historical Data**: Time-series data for trend analysis

## Architecture

### Components

1. **DeFiAnalytics**: Core analytics engine
   - TVL aggregation and tracking
   - Yield opportunity identification
   - Price feed management
   - Liquidity analysis
   - Risk assessment
   - Real-time data updates

2. **AnalyticsAPI**: RESTful HTTP interface
   - TVL endpoints
   - Protocol analytics
   - Yield queries
   - Price feeds
   - Risk metrics

## API Endpoints

### TVL Tracking

#### Get Total TVL
```
GET /api/tvl?chain={chain}
```

Response:
```json
{
  "tvl": "17050000000000000000000000000",
  "chain": "ethereum"
}
```

#### Get Protocol TVL
```
GET /api/tvl/protocol/{protocolId}
```

#### Get TVL History
```
GET /api/tvl/history?protocol={id}&hours={n}
```

Response:
```json
{
  "count": 144,
  "history": [
    {
      "timestamp": 1699200000000,
      "protocol": "uniswap",
      "chain": "ethereum",
      "tvl": "4500000000000000000000000000"
    }
  ]
}
```

### Protocol Analytics

#### Get Top Protocols
```
GET /api/protocols?limit={n}&category={dex|lending|yield|derivatives|insurance|bridge}
```

Response:
```json
{
  "count": 5,
  "protocols": [
    {
      "id": "aave",
      "name": "Aave V3",
      "category": "lending",
      "chain": "ethereum",
      "tvl": "6200000000000000000000000000",
      "volume24h": "930000000000000000000000000",
      "fees24h": "9300000000000000000000000",
      "users24h": 5432,
      "lastUpdate": 1699200000000
    }
  ]
}
```

#### Get Protocol Details
```
GET /api/protocol/{protocolId}
```

### Yield Opportunities

#### Get Yields
```
GET /api/yields?minAPY={n}&protocol={id}
```

Response:
```json
{
  "count": 15,
  "yields": [
    {
      "protocol": "curve",
      "pool": "pool-2",
      "asset": "DAI",
      "deposited": "0",
      "apy": 45.8,
      "apyBreakdown": {
        "base": 27.48,
        "rewards": 13.74,
        "trading": 4.58
      },
      "rewards": [],
      "lastUpdate": 1699200000000
    }
  ]
}
```

### Price Feeds

#### Get Multiple Prices
```
GET /api/prices?tokens={token1,token2,token3}
```

Response:
```json
{
  "count": 3,
  "prices": {
    "eth": {
      "token": "ETH",
      "symbol": "ETH",
      "price": 1850.25,
      "priceChange24h": 2.35,
      "volume24h": "11100000000000000000000000000",
      "marketCap": "222000000000000000000000000000",
      "sources": ["Chainlink", "Uniswap", "Binance"],
      "confidence": 0.98,
      "lastUpdate": 1699200000000
    }
  }
}
```

#### Get Single Price
```
GET /api/price/{token}
```

### Risk Metrics

#### Get Protocol Risk Assessment
```
GET /api/risk/{protocolId}
```

Response:
```json
{
  "protocol": "uniswap",
  "overallScore": 78.5,
  "metrics": {
    "smartContractRisk": 15.2,
    "liquidationRisk": 12.8,
    "concentrationRisk": 18.5,
    "volatilityRisk": 22.3,
    "impermanentLossRisk": 14.7
  },
  "audits": [
    {
      "auditor": "CertiK",
      "date": 1691424000000,
      "score": 85,
      "url": "https://example.com/audit1"
    }
  ],
  "incidents": [],
  "lastUpdate": 1699200000000
}
```

### Pool Analytics

#### Get Pool Details
```
GET /api/pool/{poolId}
```

Response:
```json
{
  "id": "pool-0",
  "protocol": "uniswap",
  "name": "ETH/USDC",
  "tokens": ["ETH", "USDC"],
  "reserves": [
    "500000000000000000000000",
    "850000000000000000000000000"
  ],
  "tvl": "850500000000000000000000000",
  "volume24h": "255150000000000000000000000",
  "fees24h": "2551500000000000000000000",
  "apy": 35.2,
  "utilization": 67.5,
  "lastUpdate": 1699200000000
}
```

## Usage Examples

### Get Total DeFi TVL
```bash
curl http://localhost:3000/api/tvl
```

### Get Top DEX Protocols
```bash
curl "http://localhost:3000/api/protocols?limit=5&category=dex"
```

### Find High-Yield Opportunities
```bash
curl "http://localhost:3000/api/yields?minAPY=20"
```

### Get Token Prices
```bash
curl "http://localhost:3000/api/prices?tokens=ETH,WBTC,UNI"
```

### Assess Protocol Risk
```bash
curl http://localhost:3000/api/risk/aave
```

### Get TVL History
```bash
curl "http://localhost:3000/api/tvl/history?protocol=uniswap&hours=168"
```

## Data Models

### Protocol
- ID, name, category
- Chain identifier
- TVL, 24h volume, 24h fees
- Active users count
- Last update timestamp

### Pool
- ID, protocol, name
- Token list and reserves
- TVL and utilization
- Volume and fee metrics
- APY calculation
- Last update timestamp

### Price Feed
- Token identifier and symbol
- Current price
- 24h price change
- Volume and market cap
- Data sources
- Confidence score
- Last update timestamp

### Risk Metrics
- Overall risk score (0-100)
- Component risks:
  - Smart contract risk
  - Liquidation risk
  - Concentration risk
  - Volatility risk
  - Impermanent loss risk
- Audit history
- Incident records

## Real-Time Updates

The platform continuously updates:
- **Price Feeds**: Every 5 seconds
- **Pool Metrics**: Every 30 seconds
- **TVL Snapshots**: Every 60 seconds

Historical data is retained for 7 days by default.

## Risk Score Calculation

The overall risk score is a weighted combination:
- Smart Contract Risk: 30%
- Liquidation Risk: 25%
- Concentration Risk: 20%
- Volatility Risk: 15%
- Impermanent Loss Risk: 10%

Score interpretation:
- 80-100: Low risk
- 60-79: Medium risk
- 40-59: High risk
- 0-39: Very high risk

## Configuration

Environment variables:
- `PORT`: Server port (default: 3000)

## Production Considerations

1. **Data Sources**: Integrate with real blockchain nodes and oracles
2. **Database**: Use TimescaleDB for time-series data
3. **Caching**: Implement Redis for frequently accessed data
4. **Rate Limiting**: Protect API endpoints from abuse
5. **WebSockets**: Add real-time data streaming
6. **Monitoring**: Track data freshness and API performance
7. **Alerts**: Notify on significant TVL or price changes
8. **Historical Storage**: Archive old data to cheaper storage
9. **Indexing**: Optimize database queries with proper indexes
10. **API Keys**: Implement authentication for premium features

## Use Cases

- Portfolio tracking and management
- Yield farming optimization
- Risk assessment and due diligence
- Market research and analysis
- Trading strategy development
- DeFi dashboard applications
- Investment decision support

## License

MIT
