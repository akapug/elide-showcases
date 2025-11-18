import express from 'express';
import pino from 'pino';
import dotenv from 'dotenv';
import { TradingEngine } from '../core/trading-engine.js';
import type { MarketData } from '../core/types.js';

dotenv.config();

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
app.use(express.json());

const engine = new TradingEngine(
  Number(process.env.MAX_POSITION_SIZE) || 10000,
  Number(process.env.RISK_PER_TRADE) || 0.01
);

app.post('/trading/market-data', async (req, res) => {
  try {
    const data: MarketData = req.body;
    await engine.processMarketData(data);
    res.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Market data processing failed');
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

app.get('/trading/positions', (req, res) => {
  res.json({ success: true, data: engine.getPositions() });
});

app.get('/trading/performance', (req, res) => {
  res.json({ success: true, data: engine.getPerformance() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  logger.info(`Trading Platform listening on port ${PORT}`);
});

export { app, engine };
