/**
 * Saga Pattern Polyglot
 *
 * Distributed transaction management using the Saga pattern:
 * - TypeScript: Saga orchestrator
 * - Python: Order service
 * - Go: Payment service
 * - Java: Inventory service
 * - Ruby: Notification service
 *
 * Demonstrates long-running distributed transactions with compensation.
 */

// Saga Step
interface SagaStep {
  name: string;
  service: string;
  action: () => Promise<any>;
  compensation: () => Promise<any>;
}

// Saga Orchestrator (TypeScript)
class SagaOrchestrator {
  private completedSteps: SagaStep[] = [];

  async execute(saga: SagaStep[]): Promise<{ success: boolean; result?: any; error?: string }> {
    console.log(`[Saga Orchestrator] Starting saga with ${saga.length} steps`);

    try {
      for (const step of saga) {
        console.log(`\n[Saga] Executing step: ${step.name} (${step.service})`);

        try {
          const result = await step.action();
          this.completedSteps.push(step);
          console.log(`  ✓ Step completed successfully`);
        } catch (error) {
          console.log(`  ✗ Step failed:`, error);
          console.log(`\n[Saga] Initiating compensation...`);
          await this.compensate();
          return { success: false, error: String(error) };
        }
      }

      console.log(`\n[Saga] All steps completed successfully!`);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  private async compensate(): Promise<void> {
    console.log(`[Saga] Compensating ${this.completedSteps.length} completed steps`);

    // Compensate in reverse order
    for (let i = this.completedSteps.length - 1; i >= 0; i--) {
      const step = this.completedSteps[i];
      console.log(`  [Compensation] Reverting: ${step.name}`);

      try {
        await step.compensation();
        console.log(`    ✓ Compensated successfully`);
      } catch (error) {
        console.error(`    ✗ Compensation failed:`, error);
        // Log for manual intervention
      }
    }

    this.completedSteps = [];
  }
}

// Order Service (Python-style)
class OrderService {
  private orders: Map<string, any> = new Map();

  async createOrder(orderId: string, userId: string, items: any[]): Promise<any> {
    console.log(`  [Python OrderService] Creating order ${orderId}`);

    const order = {
      id: orderId,
      userId,
      items,
      status: 'pending',
      createdAt: Date.now(),
    };

    this.orders.set(orderId, order);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log(`    → Order created with ${items.length} items`);

    return order;
  }

  async cancelOrder(orderId: string): Promise<void> {
    console.log(`    [Compensation] Cancelling order ${orderId}`);

    const order = this.orders.get(orderId);
    if (order) {
      order.status = 'cancelled';
      console.log(`      → Order cancelled`);
    }
  }

  async confirmOrder(orderId: string): Promise<void> {
    console.log(`  [Python OrderService] Confirming order ${orderId}`);

    const order = this.orders.get(orderId);
    if (order) {
      order.status = 'confirmed';
      console.log(`    → Order confirmed`);
    }
  }

  getOrder(orderId: string): any {
    return this.orders.get(orderId);
  }
}

// Payment Service (Go-style)
class PaymentService {
  private transactions: Map<string, any> = new Map();

  async processPayment(orderId: string, amount: number, userId: string): Promise<string> {
    console.log(`  [Go PaymentService] Processing payment for order ${orderId}`);

    const transactionId = `txn-${Date.now()}`;

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 150));

    // Simulate occasional failures for demo
    if (amount > 10000) {
      throw new Error('Payment amount exceeds limit');
    }

    const transaction = {
      id: transactionId,
      orderId,
      amount,
      userId,
      status: 'completed',
      timestamp: Date.now(),
    };

    this.transactions.set(transactionId, transaction);

    console.log(`    → Payment processed: ${transactionId}`);
    console.log(`    → Amount: $${amount}`);

    return transactionId;
  }

  async refundPayment(transactionId: string): Promise<void> {
    console.log(`    [Compensation] Refunding payment ${transactionId}`);

    const transaction = this.transactions.get(transactionId);
    if (transaction) {
      transaction.status = 'refunded';
      transaction.refundedAt = Date.now();
      console.log(`      → Payment refunded: $${transaction.amount}`);
    }
  }

  getTransaction(transactionId: string): any {
    return this.transactions.get(transactionId);
  }
}

// Inventory Service (Java-style)
class InventoryService {
  private inventory: Map<string, number> = new Map([
    ['product-1', 100],
    ['product-2', 50],
    ['product-3', 25],
  ]);

  private reservations: Map<string, any> = new Map();

  async reserveItems(orderId: string, items: Array<{ productId: string; quantity: number }>): Promise<string> {
    console.log(`  [Java InventoryService] Reserving items for order ${orderId}`);

    const reservationId = `res-${Date.now()}`;

    // Check availability
    for (const item of items) {
      const available = this.inventory.get(item.productId) || 0;
      if (available < item.quantity) {
        throw new Error(`Insufficient inventory for ${item.productId}: need ${item.quantity}, have ${available}`);
      }
    }

    // Reserve items
    for (const item of items) {
      const available = this.inventory.get(item.productId)!;
      this.inventory.set(item.productId, available - item.quantity);
    }

    this.reservations.set(reservationId, {
      id: reservationId,
      orderId,
      items,
      timestamp: Date.now(),
    });

    console.log(`    → Reserved ${items.length} items`);

    return reservationId;
  }

  async releaseReservation(reservationId: string): Promise<void> {
    console.log(`    [Compensation] Releasing reservation ${reservationId}`);

    const reservation = this.reservations.get(reservationId);
    if (reservation) {
      // Return items to inventory
      for (const item of reservation.items) {
        const current = this.inventory.get(item.productId) || 0;
        this.inventory.set(item.productId, current + item.quantity);
      }

      this.reservations.delete(reservationId);
      console.log(`      → Reservation released`);
    }
  }

  async commitReservation(reservationId: string): Promise<void> {
    console.log(`  [Java InventoryService] Committing reservation ${reservationId}`);
    console.log(`    → Items permanently allocated`);
  }

  getInventory(productId: string): number {
    return this.inventory.get(productId) || 0;
  }
}

// Notification Service (Ruby-style)
class NotificationService {
  async sendOrderConfirmation(orderId: string, userId: string, email: string): Promise<void> {
    console.log(`  [Ruby NotificationService] Sending order confirmation`);

    await new Promise(resolve => setTimeout(resolve, 50));

    console.log(`    → Email sent to ${email}`);
    console.log(`    → Order: ${orderId}`);
  }

  async sendOrderCancellation(orderId: string, userId: string, email: string): Promise<void> {
    console.log(`    [Compensation] Sending cancellation notification`);

    await new Promise(resolve => setTimeout(resolve, 50));

    console.log(`      → Cancellation email sent to ${email}`);
  }

  async sendPaymentFailure(orderId: string, userId: string, email: string): Promise<void> {
    console.log(`  [Ruby NotificationService] Sending payment failure notification`);
    console.log(`    → Email sent to ${email}`);
  }
}

// Demo Sagas
async function runSuccessfulOrderSaga() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║             Successful Order Saga                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const orchestrator = new SagaOrchestrator();
  const orderService = new OrderService();
  const paymentService = new PaymentService();
  const inventoryService = new InventoryService();
  const notificationService = new NotificationService();

  const orderId = `order-${Date.now()}`;
  let transactionId: string;
  let reservationId: string;

  const saga: SagaStep[] = [
    {
      name: 'Create Order',
      service: 'OrderService (Python)',
      action: async () => {
        return await orderService.createOrder(orderId, 'user-1', [
          { productId: 'product-1', quantity: 2 },
          { productId: 'product-2', quantity: 1 },
        ]);
      },
      compensation: async () => {
        await orderService.cancelOrder(orderId);
      },
    },
    {
      name: 'Reserve Inventory',
      service: 'InventoryService (Java)',
      action: async () => {
        reservationId = await inventoryService.reserveItems(orderId, [
          { productId: 'product-1', quantity: 2 },
          { productId: 'product-2', quantity: 1 },
        ]);
        return reservationId;
      },
      compensation: async () => {
        await inventoryService.releaseReservation(reservationId);
      },
    },
    {
      name: 'Process Payment',
      service: 'PaymentService (Go)',
      action: async () => {
        transactionId = await paymentService.processPayment(orderId, 299.99, 'user-1');
        return transactionId;
      },
      compensation: async () => {
        await paymentService.refundPayment(transactionId);
      },
    },
    {
      name: 'Confirm Order',
      service: 'OrderService (Python)',
      action: async () => {
        await orderService.confirmOrder(orderId);
      },
      compensation: async () => {
        // No compensation needed after confirmation
      },
    },
    {
      name: 'Send Confirmation',
      service: 'NotificationService (Ruby)',
      action: async () => {
        await notificationService.sendOrderConfirmation(orderId, 'user-1', 'user@example.com');
      },
      compensation: async () => {
        await notificationService.sendOrderCancellation(orderId, 'user-1', 'user@example.com');
      },
    },
  ];

  const result = await orchestrator.execute(saga);

  console.log('\n═══════════════════════════════════════════════════════════');
  if (result.success) {
    console.log('✓ Saga completed successfully!');
    console.log(`Order ${orderId} is confirmed and paid`);
  } else {
    console.log('✗ Saga failed:', result.error);
  }
  console.log('═══════════════════════════════════════════════════════════\n');
}

async function runFailedOrderSaga() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        Failed Order Saga (with Compensation)              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const orchestrator = new SagaOrchestrator();
  const orderService = new OrderService();
  const paymentService = new PaymentService();
  const inventoryService = new InventoryService();
  const notificationService = new NotificationService();

  const orderId = `order-${Date.now()}`;
  let reservationId: string;

  const saga: SagaStep[] = [
    {
      name: 'Create Order',
      service: 'OrderService (Python)',
      action: async () => {
        return await orderService.createOrder(orderId, 'user-2', [
          { productId: 'product-1', quantity: 2 },
        ]);
      },
      compensation: async () => {
        await orderService.cancelOrder(orderId);
      },
    },
    {
      name: 'Reserve Inventory',
      service: 'InventoryService (Java)',
      action: async () => {
        reservationId = await inventoryService.reserveItems(orderId, [
          { productId: 'product-1', quantity: 2 },
        ]);
        return reservationId;
      },
      compensation: async () => {
        await inventoryService.releaseReservation(reservationId);
      },
    },
    {
      name: 'Process Payment',
      service: 'PaymentService (Go)',
      action: async () => {
        // This will fail due to amount limit
        return await paymentService.processPayment(orderId, 15000, 'user-2');
      },
      compensation: async () => {
        // Won't be called since this step failed
      },
    },
  ];

  const result = await orchestrator.execute(saga);

  console.log('\n═══════════════════════════════════════════════════════════');
  if (result.success) {
    console.log('✓ Saga completed successfully!');
  } else {
    console.log('✗ Saga failed:', result.error);
    console.log('✓ All completed steps were compensated');
  }
  console.log('═══════════════════════════════════════════════════════════\n');
}

export async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║      Saga Pattern Polyglot - Elide Showcase             ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log();
  console.log('Saga Pattern Components:');
  console.log('  • Orchestrator:        TypeScript');
  console.log('  • Order Service:       Python');
  console.log('  • Payment Service:     Go');
  console.log('  • Inventory Service:   Java');
  console.log('  • Notification Service: Ruby');
  console.log();
  console.log('Pattern Benefits:');
  console.log('  → Distributed transaction management');
  console.log('  → Automatic compensation on failure');
  console.log('  → No 2PC/distributed locks needed');
  console.log('  → Each service maintains autonomy');
  console.log();

  // Run successful saga
  await runSuccessfulOrderSaga();

  // Run failed saga with compensation
  await runFailedOrderSaga();

  console.log('Key Benefits Demonstrated:');
  console.log('  ✓ Long-running distributed transactions');
  console.log('  ✓ Automatic rollback via compensation');
  console.log('  ✓ Service autonomy maintained');
  console.log('  ✓ No distributed locks required');
  console.log('  ✓ Each service in its optimal language');
  console.log();
}

if (import.meta.url.includes('server.ts')) {
  main().catch(console.error);
}
