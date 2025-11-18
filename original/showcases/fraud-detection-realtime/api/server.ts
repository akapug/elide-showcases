import express from 'express';
import pino from 'pino';
import dotenv from 'dotenv';
import { FraudDetector } from '../core/fraud-detector.js';
import { TransactionSchema } from '../core/types.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
app.use(express.json());

const detector = new FraudDetector(Number(process.env.FRAUD_SCORE_THRESHOLD) || 0.75);

app.post('/fraud/detect', async (req, res) => {
  try {
    const transaction = TransactionSchema.parse(req.body);
    const result = await detector.detectFraud(transaction);

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ error }, 'Fraud detection failed');
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/fraud/detect-ml', async (req, res) => {
  try {
    const transaction = TransactionSchema.parse(req.body);

    // Fast rule-based detection
    const ruleResult = await detector.detectFraud(transaction);

    // ML prediction (if time permits)
    let mlPrediction = null;
    if (ruleResult.latencyMs < 3) {
      try {
        mlPrediction = await callMLModel(req.body);
      } catch (e) {
        logger.warn('ML prediction failed, using rule-based only');
      }
    }

    res.json({
      success: true,
      data: {
        ...ruleResult,
        mlPrediction,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

function callMLModel(transaction: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../ml/fraud_model.py');
    const python = spawn('python3', [pythonScript, JSON.stringify(transaction)]);

    let output = '';
    python.stdout.on('data', (data) => { output += data.toString(); });
    python.on('close', (code) => {
      if (code !== 0) reject(new Error(`Python exited with code ${code}`));
      else resolve(JSON.parse(output.trim()));
    });
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Fraud Detection Service listening on port ${PORT}`);
});

export { app, detector };
