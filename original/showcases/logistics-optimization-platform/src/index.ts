/**
 * Logistics Optimization Platform
 *
 * Main entry point for the logistics optimization platform.
 * Exports all modules for easy importing.
 */

// Types
export * from './types';

// Routing
export { RouteOptimizer, optimizeDeliveryRoutes } from './routing/route-optimizer';
export { DynamicRouter } from './routing/dynamic-routing';

// Fleet Management
export { FleetManager } from './fleet/fleet-manager';

// Warehouse Operations
export { WarehouseOptimizer } from './warehouse/warehouse-optimizer';

// Forecasting
export { DemandPredictor } from './forecasting/demand-predictor';

// Tracking
export { ShipmentTracker } from './tracking/shipment-tracker';

// Analytics
export { LogisticsAnalytics } from './analytics/logistics-analytics';

/**
 * Quick start: Optimize delivery routes
 */
export { optimizeDeliveryRoutes as quickOptimize } from './routing/route-optimizer';
