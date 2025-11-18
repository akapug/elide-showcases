/**
 * WebSocket Handler for Real-Time Streaming Transcription
 */

import { WebSocketServer, WebSocket } from 'ws';
import { TranscriptionBridge } from '../transcription/bridge.js';
import { AudioProcessor } from '../shared/audio-processor.js';
import { StreamingChunk } from '../shared/types.js';
import logger from '../shared/logger.js';

interface StreamingSession {
  id: string;
  ws: WebSocket;
  bridge: TranscriptionBridge;
  audioChunks: Buffer[];
  language?: string;
  isActive: boolean;
  chunkCount: number;
  startTime: number;
}

const sessions = new Map<string, StreamingSession>();

const CHUNK_DURATION = parseFloat(process.env.CHUNK_DURATION || '30');
const OVERLAP_DURATION = parseFloat(process.env.OVERLAP_DURATION || '2');
const HEARTBEAT_INTERVAL = parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000');
const MAX_CONNECTIONS = parseInt(process.env.WS_MAX_CONNECTIONS || '100');

export function setupWebSocket(wss: WebSocketServer) {
  logger.info('WebSocket server initialized', {
    maxConnections: MAX_CONNECTIONS,
    chunkDuration: CHUNK_DURATION,
    overlapDuration: OVERLAP_DURATION,
  });

  // Connection handling
  wss.on('connection', (ws: WebSocket, req) => {
    const clientIp = req.socket.remoteAddress;

    // Check connection limit
    if (sessions.size >= MAX_CONNECTIONS) {
      logger.warn('Max connections reached, rejecting new connection', {
        clientIp,
        currentConnections: sessions.size,
      });

      ws.send(
        JSON.stringify({
          type: 'error',
          error: 'Maximum connections reached. Please try again later.',
        })
      );
      ws.close();
      return;
    }

    const sessionId = generateSessionId();

    logger.info('WebSocket connection established', {
      sessionId,
      clientIp,
      totalSessions: sessions.size + 1,
    });

    // Create session
    const session: StreamingSession = {
      id: sessionId,
      ws,
      bridge: new TranscriptionBridge(),
      audioChunks: [],
      isActive: true,
      chunkCount: 0,
      startTime: Date.now(),
    };

    sessions.set(sessionId, session);

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: 'connected',
        sessionId,
        message: 'Connected to speech-to-text streaming service',
        config: {
          chunkDuration: CHUNK_DURATION,
          overlapDuration: OVERLAP_DURATION,
          supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'],
        },
      })
    );

    // Handle messages
    ws.on('message', async (data: Buffer) => {
      try {
        // Try to parse as JSON (control messages)
        try {
          const message = JSON.parse(data.toString());
          await handleControlMessage(session, message);
        } catch {
          // Binary audio data
          await handleAudioChunk(session, data);
        }
      } catch (error) {
        logger.error('Error handling WebSocket message', {
          sessionId,
          error: error instanceof Error ? error.message : error,
        });

        ws.send(
          JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Failed to process message',
          })
        );
      }
    });

    // Handle close
    ws.on('close', () => {
      const duration = Date.now() - session.startTime;

      logger.info('WebSocket connection closed', {
        sessionId,
        duration: `${duration}ms`,
        chunksProcessed: session.chunkCount,
      });

      sessions.delete(sessionId);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket error', {
        sessionId,
        error: error.message,
      });
    });

    // Heartbeat
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      } else {
        clearInterval(heartbeat);
      }
    }, HEARTBEAT_INTERVAL);
  });
}

/**
 * Handle control messages (JSON)
 */
async function handleControlMessage(session: StreamingSession, message: any) {
  const { type, ...params } = message;

  switch (type) {
    case 'start':
      session.isActive = true;
      session.language = params.language || 'auto';
      session.audioChunks = [];
      session.chunkCount = 0;

      logger.info('Streaming started', {
        sessionId: session.id,
        language: session.language,
      });

      session.ws.send(
        JSON.stringify({
          type: 'started',
          sessionId: session.id,
          language: session.language,
        })
      );
      break;

    case 'stop':
      session.isActive = false;

      logger.info('Streaming stopped', {
        sessionId: session.id,
        chunksProcessed: session.chunkCount,
      });

      session.ws.send(
        JSON.stringify({
          type: 'stopped',
          sessionId: session.id,
          chunksProcessed: session.chunkCount,
        })
      );
      break;

    case 'config':
      if (params.language) {
        session.language = params.language;
      }

      session.ws.send(
        JSON.stringify({
          type: 'config-updated',
          language: session.language,
        })
      );
      break;

    case 'pong':
      // Heartbeat response
      break;

    default:
      session.ws.send(
        JSON.stringify({
          type: 'error',
          error: `Unknown message type: ${type}`,
        })
      );
  }
}

/**
 * Handle audio chunk (binary)
 */
async function handleAudioChunk(session: StreamingSession, audioData: Buffer) {
  if (!session.isActive) {
    return;
  }

  try {
    // Convert audio to Whisper format
    const processedAudio = await AudioProcessor.convertToWhisperFormat(audioData);

    session.chunkCount++;

    logger.debug('Processing audio chunk', {
      sessionId: session.id,
      chunkId: session.chunkCount,
      size: audioData.length,
    });

    // Transcribe chunk
    const result = await session.bridge.transcribeStreaming(processedAudio, {
      language: session.language,
    });

    // Send result
    const chunk: StreamingChunk = {
      chunkId: session.chunkCount,
      text: result.text,
      isFinal: result.isFinal,
      start: 0, // Would need to calculate based on cumulative time
      end: 0,
      confidence: result.confidence,
    };

    session.ws.send(
      JSON.stringify({
        type: 'transcription',
        chunk,
      })
    );

    logger.debug('Chunk transcribed', {
      sessionId: session.id,
      chunkId: session.chunkCount,
      text: result.text.substring(0, 50),
      isFinal: result.isFinal,
    });
  } catch (error) {
    logger.error('Failed to process audio chunk', {
      sessionId: session.id,
      chunkId: session.chunkCount,
      error: error instanceof Error ? error.message : error,
    });

    session.ws.send(
      JSON.stringify({
        type: 'error',
        chunkId: session.chunkCount,
        error: error instanceof Error ? error.message : 'Failed to process audio',
      })
    );
  }
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Get active session count
 */
export function getActiveSessionCount(): number {
  return sessions.size;
}
