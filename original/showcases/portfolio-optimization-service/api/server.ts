import express from 'express';
import pino from 'pino';
import dotenv from 'dotenv';
import { PortfolioManager } from '../core/portfolio-manager.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
app.use(express.json());

const manager = new PortfolioManager(
  Number(process.env.DEFAULT_RISK_FREE_RATE) || 0.03,
  Number(process.env.MAX_POSITION_WEIGHT) || 0.25
);

app.post('/portfolio/create', (req, res) => {
  try {
    const { id, assets } = req.body;
    const portfolio = manager.createPortfolio(id, assets);
    res.json({ success: true, data: portfolio });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

app.get('/portfolio/:id', (req, res) => {
  const portfolio = manager.getPortfolio(req.params.id);
  if (!portfolio) {
    return res.status(404).json({ success: false, error: 'Portfolio not found' });
  }
  res.json({ success: true, data: portfolio });
});

app.post('/portfolio/:id/optimize', async (req, res) => {
  try {
    const portfolio = manager.getPortfolio(req.params.id);
    if (!portfolio) {
      return res.status(404).json({ success: false, error: 'Portfolio not found' });
    }

    const request = {
      symbols: portfolio.assets.map(a => a.symbol),
      objective: req.body.objective || 'max_sharpe',
      constraints: req.body.constraints || {},
    };

    const result = await callPythonOptimizer(request);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

function callPythonOptimizer(request: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../ml/optimizer.py');
    const python = spawn('python3', [pythonScript, JSON.stringify(request)]);

    let output = '';
    python.stdout.on('data', (data) => { output += data.toString(); });
    python.on('close', (code) => {
      if (code !== 0) reject(new Error(`Python exited with code ${code}`));
      else resolve(JSON.parse(output.trim()));
    });
  });
}

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  logger.info(`Portfolio Optimization Service listening on port ${PORT}`);
});

export { app, manager };
