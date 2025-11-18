import { z } from 'zod';

export const TransactionSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  cardNumber: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  merchantId: z.string(),
  merchantCategory: z.string(),
  location: z.object({
    lat: z.number(),
    lon: z.number(),
    country: z.string(),
    city: z.string().optional(),
  }).optional(),
  deviceFingerprint: z.string().optional(),
  ipAddress: z.string().optional(),
  timestamp: z.number(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

export interface FraudCheckResult {
  transactionId: string;
  fraudScore: number; // 0-100
  decision: 'APPROVE' | 'DECLINE' | 'REVIEW';
  signals: FraudSignal[];
  latencyMs: number;
  timestamp: number;
  requiresReview: boolean;
}

export interface FraudSignal {
  type: SignalType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
  message: string;
}

export type SignalType =
  | 'BLOCKLIST'
  | 'AMOUNT_ANOMALY'
  | 'HIGH_AMOUNT'
  | 'HIGH_VELOCITY'
  | 'IMPOSSIBLE_TRAVEL'
  | 'UNUSUAL_TIME'
  | 'NEW_DEVICE'
  | 'ML_PREDICTION';

export interface VelocityProfile {
  accountId: string;
  recentTransactions: Array<{ amount: number; timestamp: number }>;
  lastLocation: { lat: number; lon: number } | null;
  lastLocationTime: number;
}
