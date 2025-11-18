import express from 'express';
import pino from 'pino';
import dotenv from 'dotenv';
import { CryptoTrader } from '../core/crypto-trader.js';
import type { MarketTick, TradingSignal } from '../core/types.js';

dotenv.config();

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
app.use(express.json());

const trader = new CryptoTrader(
  Number(process.env.MAX_POSITION_SIZE) || 1000,
  Number(process.env.RISK_PER_TRADE) || 0.02,
  Number(process.env.STOP_LOSS_PERCENT) || 0.03,
  Number(process.env.TAKE_PROFIT_PERCENT) || 0.05
);

app.post('/crypto/tick', async (req, res) => {
  try {
    const tick: MarketTick = req.body;
    await trader.processMarketTick(tick);
    res.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Tick processing failed');
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

app.post('/crypto/trade', async (req, res) => {
  try {
    const { signal, price }: { signal: TradingSignal; price: number } = req.body;
    const trade = await trader.executeTrade(signal, price);
    res.json({ success: true, data: trade });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

app.get('/crypto/positions', (req, res) => {
  res.json({ success: true, data: trader.getAllPositions() });
});

app.get('/crypto/performance', (req, res) => {
  res.json({ success: true, data: trader.getPerformance() });
});

app.get('/crypto/history', (req, res) => {
  res.json({ success: true, data: trader.getTradeHistory() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  logger.info(`Crypto Trading Bot listening on port ${PORT}`);
});

export { app, trader };
