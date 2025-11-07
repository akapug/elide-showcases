/**
 * Personal Finance Tracker - Main Entry Point
 *
 * Self-hosted budgeting and expense tracking application built with Elide.
 * Demonstrates polyglot capabilities with TypeScript, Python, and Ruby.
 */

import { createServer } from './backend/server';
import { initializeStorage } from './backend/storage/storage';
import { seedDatabase } from './backend/storage/seed';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

async function main() {
  console.log('🚀 Starting Personal Finance Tracker...');

  // Initialize storage
  console.log('📦 Initializing storage...');
  await initializeStorage();

  // Seed with sample data if needed
  if (process.env.SEED_DATA === 'true') {
    console.log('🌱 Seeding database with sample data...');
    await seedDatabase();
  }

  // Create and start server
  console.log('🌐 Starting API server...');
  const server = createServer();

  server.listen(PORT, () => {
    console.log(`✅ Finance Tracker running at http://${HOST}:${PORT}`);
    console.log('');
    console.log('📊 Features Available:');
    console.log('  - Account Management');
    console.log('  - Transaction Tracking');
    console.log('  - Budget Monitoring');
    console.log('  - Reports & Analytics');
    console.log('  - CSV Import/Export');
    console.log('  - Multi-Currency Support');
    console.log('');
    console.log('🔐 Privacy-first: All data stored locally');
    console.log('💯 Decimal precision: No rounding errors');
    console.log('');
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Finance Tracker...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down Finance Tracker...');
  process.exit(0);
});

// Run the application
main().catch((error) => {
  console.error('❌ Failed to start Finance Tracker:', error);
  process.exit(1);
});
