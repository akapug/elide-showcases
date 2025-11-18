import express from 'express';
import pino from 'pino';
import dotenv from 'dotenv';
import { TaskOrchestrator } from '../core/orchestrator.js';

dotenv.config();

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const orchestrator = new TaskOrchestrator(logger);

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

// Execute task
app.post('/api/v1/tasks', async (req, res) => {
  try {
    const { task, agentType, model, streaming } = req.body;
    const result = await orchestrator.executeTask({ task, agentType, model, streaming });
    res.json({ status: 'success', result });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Multi-agent collaboration
app.post('/api/v1/tasks/collaborate', async (req, res) => {
  try {
    const { task, agents } = req.body;
    const result = await orchestrator.collaborate({ task, agents });
    res.json({ status: 'success', result });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get task status
app.get('/api/v1/tasks/:taskId', async (req, res) => {
  try {
    const status = await orchestrator.getTaskStatus(req.params.taskId);
    res.json({ status: 'success', task: status });
  } catch (error: any) {
    res.status(404).json({ status: 'error', message: 'Task not found' });
  }
});

const PORT = parseInt(process.env.PORT || '3000');
app.listen(PORT, () => {
  logger.info(`🤖 LLM Agent Framework listening on port ${PORT}`);
});
