/**
 * Time-Series Processor API Server
 */

import express from 'express';
import cors from 'cors';
import WebSocket from 'ws';
import pino from 'pino';
import { TimeSeriesProcessor } from '../core/processor.js';

const logger = pino();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const processor = new TimeSeriesProcessor();

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

app.post('/api/v1/ingest', async (req, res) => {
  try {
    const { sensor_id, datapoints } = req.body;
    await processor.ingest(sensor_id, datapoints);
    res.json({ status: 'success', ingested: datapoints.length });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/v1/stats/:sensorId', async (req, res) => {
  try {
    const stats = await processor.getStatistics(req.params.sensorId);
    res.json({ status: 'success', stats });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/v1/anomalies/:sensorId', async (req, res) => {
  try {
    const threshold = parseFloat(req.query.threshold as string) || 3.0;
    const result = await processor.detectAnomalies(req.params.sensorId, threshold);
    res.json({ status: 'success', result });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/v1/trends/:sensorId', async (req, res) => {
  try {
    const result = await processor.getTrends(req.params.sensorId);
    res.json({ status: 'success', result });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

async function start() {
  await processor.initialize();

  const server = app.listen(port, () => {
    logger.info(`Time-Series Processor running on port ${port}`);
  });

  const wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    logger.info('WebSocket client connected');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'ingest') {
          await processor.ingest(data.sensor_id, data.datapoints);
          ws.send(JSON.stringify({ status: 'success' }));
        }
      } catch (error) {
        ws.send(JSON.stringify({ error: (error as Error).message }));
      }
    });
  });

  process.on('SIGTERM', async () => {
    await processor.shutdown();
    process.exit(0);
  });
}

start();
