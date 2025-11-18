import express from 'express';
import pino from 'pino';
import dotenv from 'dotenv';
import { ExperimentManager } from '../core/experiment-manager.js';

dotenv.config();

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const experimentManager = new ExperimentManager(logger);

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

// Create AutoML experiment
app.post('/api/v1/experiments', async (req, res) => {
  try {
    const { name, dataset, target, taskType, timeLimit, engine, config } = req.body;

    const experiment = await experimentManager.createExperiment({
      name,
      dataset,
      target,
      taskType,
      timeLimit,
      engine,
      config
    });

    res.json({ status: 'success', experiment });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get experiment status
app.get('/api/v1/experiments/:id', async (req, res) => {
  try {
    const experiment = await experimentManager.getExperiment(req.params.id);
    if (!experiment) {
      res.status(404).json({ status: 'error', message: 'Experiment not found' });
      return;
    }
    res.json({ status: 'success', experiment });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// List all experiments
app.get('/api/v1/experiments', async (req, res) => {
  try {
    const experiments = await experimentManager.listExperiments();
    res.json({ status: 'success', experiments });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Deploy best model
app.post('/api/v1/experiments/:id/deploy', async (req, res) => {
  try {
    const { environment, endpoint } = req.body;
    const deployment = await experimentManager.deployBestModel(req.params.id, { environment, endpoint });
    res.json({ status: 'success', deployment });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const PORT = parseInt(process.env.PORT || '3000');
app.listen(PORT, () => {
  logger.info(`🤖 AutoML Service listening on port ${PORT}`);
});
