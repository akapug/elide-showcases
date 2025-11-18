import express from 'express';
import pino from 'pino';
import { z } from 'zod';
import dotenv from 'dotenv';
import { RiskEngine } from '../core/risk-engine.js';
import { OrderSchema, type RiskLimits } from '../core/types.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss.l',
    },
  },
});

const app = express();
app.use(express.json());

// Initialize Risk Engine with default limits
const defaultLimits: RiskLimits = {
  maxPositionSize: Number(process.env.MAX_POSITION_SIZE) || 1000000,
  maxOrderValue: Number(process.env.MAX_ORDER_VALUE) || 100000,
  maxPortfolioValue: Number(process.env.MAX_PORTFOLIO_VALUE) || 10000000,
  maxLeverage: Number(process.env.MAX_LEVERAGE) || 10,
  maxConcentration: 30, // 30%
  maxDailyLoss: 100000,
  maxOrdersPerSecond: 100,
  priceDeviationThreshold: 0.05, // 5%
};

const riskEngine = new RiskEngine(defaultLimits);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: Date.now() - start,
    });
  });
  next();
});

/**
 * POST /risk/check
 * Ultra-fast risk check endpoint - target <1ms response time
 */
app.post('/risk/check', async (req, res) => {
  try {
    const order = OrderSchema.parse(req.body);

    const result = await riskEngine.checkOrder(order);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({ error }, 'Risk check failed');
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /risk/check-batch
 * Batch risk checking for multiple orders
 */
app.post('/risk/check-batch', async (req, res) => {
  try {
    const orders = z.array(OrderSchema).parse(req.body);

    const results = await riskEngine.checkOrderBatch(orders);

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    logger.error({ error }, 'Batch risk check failed');
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /risk/predict-ml
 * Advanced ML-based risk prediction using Python
 */
app.post('/risk/predict-ml', async (req, res) => {
  try {
    const orderData = req.body;

    // Call Python ML predictor
    const prediction = await callPythonPredictor(orderData);

    res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    logger.error({ error }, 'ML prediction failed');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /risk/metrics
 * Get performance metrics
 */
app.get('/risk/metrics', (req, res) => {
  const metrics = riskEngine.getMetrics();

  res.json({
    success: true,
    data: {
      ...metrics,
      violationsByType: Object.fromEntries(metrics.violationsByType),
    },
  });
});

/**
 * POST /risk/market-data
 * Update market data for price deviation checks
 */
app.post('/risk/market-data', (req, res) => {
  try {
    const marketDataSchema = z.object({
      symbol: z.string(),
      price: z.number(),
      bid: z.number(),
      ask: z.number(),
      volume: z.number(),
      timestamp: z.number(),
      volatility: z.number().optional(),
    });

    const data = marketDataSchema.parse(req.body);
    riskEngine.updateMarketData(data);

    res.json({
      success: true,
      message: 'Market data updated',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
});

/**
 * Helper function to call Python ML predictor
 */
function callPythonPredictor(orderData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../ml/risk_predictor.py');
    const python = spawn('python3', [pythonScript, JSON.stringify(orderData)]);

    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python process exited with code ${code}: ${error}`));
      } else {
        try {
          const result = JSON.parse(output.trim());
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${output}`));
        }
      }
    });
  });
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`HFT Risk Engine listening on port ${PORT}`);
  logger.info('Risk Limits:', defaultLimits);
});

export { app, riskEngine };
