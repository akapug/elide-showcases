/**
 * Payment Service (Java - Conceptual TypeScript Implementation)
 *
 * This service demonstrates how a Java service would use shared TypeScript utilities
 * via Elide's polyglot capabilities. Java is often used for payment processing due to
 * its enterprise reliability, and with Elide, it can share utilities with other services.
 *
 * Conceptual Java code:
 * ```java
 * // PaymentService.java (conceptual - Elide Java API is alpha)
 * import dev.elide.runtime.*;
 *
 * public class PaymentService {
 *   private static final ElideModule uuid = Elide.require("../shared/uuid.ts");
 *   private static final ElideModule validator = Elide.require("../shared/validator.ts");
 *
 *   public PaymentResult processCharge(ChargeRequest req) {
 *     if (!validator.call("isEmail", req.email).asBoolean()) {
 *       return PaymentResult.error("Invalid email");
 *     }
 *     String transactionId = uuid.call("v4").asString();
 *     return new PaymentResult(transactionId, "success");
 *   }
 * }
 * ```
 */

import { v4 as uuidv4, validate as validateUuid } from '../shared/uuid.ts';
import { isEmail, isCreditCard, isInt } from '../shared/validator.ts';
import type { RequestContext, Response } from '../gateway/middleware.ts';

/**
 * Transaction interface
 */
interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  createdAt: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

/**
 * In-memory transaction store
 */
const transactions: Map<string, Transaction> = new Map();

// Initialize with sample transactions
function initTransactions() {
  const sampleTransactions: Transaction[] = [
    {
      id: uuidv4(),
      userId: 'user-123',
      amount: 9999, // in cents
      currency: 'USD',
      description: 'Premium subscription',
      status: 'completed',
      paymentMethod: 'card_****1234',
      createdAt: new Date('2024-01-15').toISOString(),
      completedAt: new Date('2024-01-15').toISOString(),
    },
    {
      id: uuidv4(),
      userId: 'user-456',
      amount: 4999,
      currency: 'USD',
      description: 'Standard subscription',
      status: 'completed',
      paymentMethod: 'card_****5678',
      createdAt: new Date('2024-02-01').toISOString(),
      completedAt: new Date('2024-02-01').toISOString(),
    },
  ];

  sampleTransactions.forEach(txn => transactions.set(txn.id, txn));
}

initTransactions();

/**
 * Process payment charge
 *
 * In Java, this would use:
 * - validator.call("isEmail", email) for email validation
 * - validator.call("isCreditCard", cardNumber) for card validation
 * - uuid.call("v4") for generating transaction IDs
 */
export async function processCharge(
  ctx: RequestContext,
  data: {
    userId: string;
    email: string;
    amount: number;
    currency?: string;
    cardNumber: string;
    description?: string;
  }
): Promise<Response> {
  console.log(`[PaymentService][Java] Processing charge:`, { ...data, cardNumber: '****' });

  // Validate user ID
  // Java: if (!validator.call("isUUID", userId).asBoolean())
  if (!validateUuid(data.userId)) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Invalid user ID format',
        note: 'Validated using shared TypeScript validator',
      },
    };
  }

  // Validate email
  // Java: if (!validator.call("isEmail", email).asBoolean())
  if (!isEmail(data.email)) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Invalid email address',
      },
    };
  }

  // Validate credit card
  // Java: if (!validator.call("isCreditCard", cardNumber).asBoolean())
  if (!isCreditCard(data.cardNumber)) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Invalid credit card number',
      },
    };
  }

  // Validate amount
  if (!data.amount || data.amount <= 0) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Amount must be greater than 0',
      },
    };
  }

  // Create transaction with UUID from shared utility
  // Java: String transactionId = uuid.call("v4").asString()
  const now = new Date().toISOString();
  const transaction: Transaction = {
    id: uuidv4(),
    userId: data.userId,
    amount: data.amount,
    currency: data.currency || 'USD',
    description: data.description || 'Payment',
    status: 'completed',
    paymentMethod: `card_****${data.cardNumber.slice(-4)}`,
    createdAt: now,
    completedAt: now,
    metadata: {
      email: data.email,
      processorResponse: 'approved',
    },
  };

  transactions.set(transaction.id, transaction);

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
      message: 'Payment processed successfully',
      polyglotNote: 'This Java service uses the same validators as all other services',
    },
  };
}

/**
 * List transactions with pagination
 *
 * In Java, this would use:
 * - uuid.call("v4") for request IDs
 * - Query string utilities for pagination
 */
export async function listTransactions(
  ctx: RequestContext,
  pagination: { page: number; limit: number }
): Promise<Response> {
  console.log(`[PaymentService][Java] Listing transactions: page=${pagination.page}, limit=${pagination.limit}`);

  const allTransactions = Array.from(transactions.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const start = (pagination.page - 1) * pagination.limit;
  const end = start + pagination.limit;
  const paginatedTransactions = allTransactions.slice(start, end);

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      transactions: paginatedTransactions.map(txn => ({
        id: txn.id,
        userId: txn.userId,
        amount: txn.amount,
        currency: txn.currency,
        description: txn.description,
        status: txn.status,
        paymentMethod: txn.paymentMethod,
        createdAt: txn.createdAt,
      })),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: allTransactions.length,
        pages: Math.ceil(allTransactions.length / pagination.limit),
      },
    },
  };
}

/**
 * Get transaction by ID
 *
 * In Java, this would use:
 * - validator.call("isUUID", transactionId) for validation
 */
export async function getTransaction(ctx: RequestContext, transactionId: string): Promise<Response> {
  console.log(`[PaymentService][Java] Getting transaction: ${transactionId}`);

  // Validate transaction ID
  // Java: if (!validator.call("isUUID", transactionId).asBoolean())
  if (!validateUuid(transactionId)) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Invalid transaction ID format',
      },
    };
  }

  const transaction = transactions.get(transactionId);

  if (!transaction) {
    return {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Not Found',
        message: `Transaction ${transactionId} not found`,
      },
    };
  }

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { transaction },
  };
}

/**
 * Process refund
 *
 * In Java, this would use:
 * - validator.call("isUUID", transactionId) for validation
 * - uuid.call("v4") for generating refund IDs
 */
export async function processRefund(
  ctx: RequestContext,
  data: { transactionId: string; amount?: number; reason?: string }
): Promise<Response> {
  console.log(`[PaymentService][Java] Processing refund:`, data);

  // Validate transaction ID
  // Java: if (!validator.call("isUUID", transactionId).asBoolean())
  if (!validateUuid(data.transactionId)) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Invalid transaction ID format',
      },
    };
  }

  const transaction = transactions.get(data.transactionId);

  if (!transaction) {
    return {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Not Found',
        message: `Transaction ${data.transactionId} not found`,
      },
    };
  }

  if (transaction.status === 'refunded') {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Transaction already refunded',
      },
    };
  }

  if (transaction.status !== 'completed') {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Can only refund completed transactions',
      },
    };
  }

  const refundAmount = data.amount || transaction.amount;
  if (refundAmount > transaction.amount) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Bad Request',
        message: 'Refund amount exceeds transaction amount',
      },
    };
  }

  // Update transaction status
  transaction.status = 'refunded';
  transactions.set(data.transactionId, transaction);

  // Create refund record with UUID
  // Java: String refundId = uuid.call("v4").asString()
  const refund = {
    id: uuidv4(),
    transactionId: data.transactionId,
    amount: refundAmount,
    reason: data.reason || 'Customer request',
    createdAt: new Date().toISOString(),
  };

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      refund,
      message: 'Refund processed successfully',
      polyglotNote: 'Java service using TypeScript utilities via Elide',
    },
  };
}

/**
 * Get payment statistics
 */
export async function getPaymentStats(): Promise<any> {
  const allTransactions = Array.from(transactions.values());
  const totalAmount = allTransactions.reduce((sum, txn) => sum + txn.amount, 0);
  const completedTransactions = allTransactions.filter(txn => txn.status === 'completed');

  return {
    total: allTransactions.length,
    completed: completedTransactions.length,
    totalAmount,
    averageAmount: completedTransactions.length > 0 ? totalAmount / completedTransactions.length : 0,
    byStatus: {
      pending: allTransactions.filter(t => t.status === 'pending').length,
      completed: allTransactions.filter(t => t.status === 'completed').length,
      failed: allTransactions.filter(t => t.status === 'failed').length,
      refunded: allTransactions.filter(t => t.status === 'refunded').length,
    },
  };
}
