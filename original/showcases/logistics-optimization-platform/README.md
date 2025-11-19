# Logistics Optimization Platform

> **Advanced logistics optimization and fleet management using TypeScript + Python interop**
>
> Demonstrates last-mile delivery optimization, dynamic routing, warehouse automation,
> and demand forecasting using OR-Tools, scikit-learn, and NetworkX.

## Overview

The Logistics Optimization Platform showcases Elide's powerful polyglot capabilities for
building sophisticated logistics and supply chain management systems. By seamlessly
integrating TypeScript's strong typing and modern JavaScript ecosystem with Python's
world-class optimization libraries (OR-Tools, NetworkX, scikit-learn), this platform
delivers production-grade solutions for:

- **Last-Mile Delivery Optimization** - Vehicle routing with time windows, capacity
  constraints, and multi-depot scenarios
- **Dynamic Routing** - Real-time route adjustments based on traffic, delays, and new orders
- **Fleet Management** - Vehicle assignment, maintenance scheduling, and utilization analytics
- **Warehouse Optimization** - Inventory placement, picking route optimization, and space utilization
- **Demand Forecasting** - ML-powered prediction of delivery volumes and resource needs
- **Real-Time Tracking** - GPS tracking, ETA prediction, and delivery status monitoring
- **Analytics & Insights** - Performance metrics, cost analysis, and operational intelligence

## Key Features

### 1. Advanced Route Optimization

The platform uses Google's OR-Tools to solve complex vehicle routing problems (VRP) with:

- **Time Windows**: Deliver packages within customer-specified time slots
- **Capacity Constraints**: Respect vehicle weight and volume limits
- **Multi-Depot**: Optimize routes across multiple distribution centers
- **Priority Handling**: Urgent deliveries and service level agreements
- **Driver Breaks**: Mandatory rest periods and shift constraints
- **Distance Matrices**: Real-world road network distances and travel times
- **Cost Minimization**: Fuel costs, overtime, and route efficiency

### 2. Dynamic Routing Engine

Real-time route optimization that adapts to changing conditions:

- **Traffic Integration**: Live traffic data for accurate ETA predictions
- **On-Demand Orders**: Insert new deliveries into existing routes
- **Delayed Deliveries**: Automatically reschedule and notify customers
- **Vehicle Breakdowns**: Reassign routes when vehicles are unavailable
- **Driver Availability**: Handle sick leave, shift changes, and breaks
- **Weather Conditions**: Adjust routes for storms, floods, or snow
- **Customer Changes**: Handle cancellations, address corrections, and time changes

### 3. Fleet Management

Comprehensive fleet operations management:

- **Vehicle Assignment**: Match vehicles to routes based on capacity, type, and location
- **Maintenance Scheduling**: Predictive maintenance based on mileage and usage
- **Utilization Analytics**: Track vehicle usage, idle time, and efficiency
- **Cost Tracking**: Fuel consumption, maintenance costs, and total cost of ownership
- **Driver Management**: Performance tracking, route history, and training needs
- **Compliance**: DOT hours of service, vehicle inspections, and safety records
- **Electric Vehicles**: Battery management, charging schedules, and range optimization

### 4. Warehouse Optimization

Intelligent warehouse operations:

- **Inventory Placement**: Optimal slotting based on pick frequency and item characteristics
- **Pick Path Optimization**: Minimize travel distance for order fulfillment
- **Space Utilization**: Maximize storage density while maintaining accessibility
- **Cross-Docking**: Direct transfer from inbound to outbound without storage
- **Wave Planning**: Batch orders for efficient picking operations
- **Labor Scheduling**: Match workforce to demand patterns
- **Multi-Zone Picking**: Optimize picker assignments across warehouse zones

### 5. Demand Forecasting

ML-powered demand prediction:

- **Time Series Analysis**: Historical patterns and seasonal trends
- **External Factors**: Weather, holidays, events, and promotions
- **Regional Patterns**: Demand variations across geographic areas
- **SKU-Level Forecasts**: Individual product demand predictions
- **Capacity Planning**: Resource requirements for peak periods
- **Confidence Intervals**: Uncertainty quantification for planning
- **Automated Retraining**: Models stay current with latest data

### 6. Real-Time Tracking

End-to-end shipment visibility:

- **GPS Tracking**: Real-time vehicle locations and route progress
- **ETA Prediction**: Machine learning models for accurate delivery times
- **Geofencing**: Automated alerts for arrivals, departures, and deviations
- **Proof of Delivery**: Photo capture, signatures, and delivery notes
- **Exception Handling**: Alerts for delays, failed deliveries, and issues
- **Customer Notifications**: SMS, email, and push notifications
- **Historical Playback**: Replay past deliveries for analysis

## Architecture

### Technology Stack

#### TypeScript Layer
- **Type-Safe APIs**: Strongly-typed interfaces for all logistics entities
- **Business Logic**: Order management, scheduling, and coordination
- **API Endpoints**: RESTful APIs for frontend and mobile apps
- **WebSocket Services**: Real-time updates and notifications
- **Data Validation**: Schema validation and constraint checking

#### Python Integration
- **OR-Tools**: Vehicle routing, bin packing, and constraint optimization
- **scikit-learn**: Demand forecasting, ETA prediction, and clustering
- **NetworkX**: Graph algorithms for route planning and network analysis
- **pandas**: Data manipulation and time series analysis
- **NumPy**: Numerical computations and matrix operations

#### Elide Bridge
- **Seamless Interop**: Direct Python function calls from TypeScript
- **Type Conversion**: Automatic conversion between JS and Python types
- **Error Handling**: Unified exception handling across languages
- **Performance**: Minimal overhead for cross-language calls
- **Debugging**: Stack traces across both languages

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Applications                    │
│          (Web Dashboard, Mobile Apps, Driver Apps)          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ REST API / WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   TypeScript API Layer                       │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐  │
│  │   Order    │  │   Fleet    │  │     Tracking        │  │
│  │   Manager  │  │   Manager  │  │     Service         │  │
│  └────────────┘  └────────────┘  └─────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Elide Bridge
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Python Optimization Layer                   │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐  │
│  │  OR-Tools  │  │  scikit-   │  │     NetworkX        │  │
│  │  Routing   │  │   learn    │  │     Graphs          │  │
│  │  Engine    │  │   Models   │  │     Analysis        │  │
│  └────────────┘  └────────────┘  └─────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Database    │
                    │  PostgreSQL   │
                    │   PostGIS     │
                    └───────────────┘
```

## Getting Started

### Installation

```bash
npm install
```

This will install all TypeScript dependencies and set up Python virtual environment
with required libraries.

### Configuration

Create a `.env` file:

```bash
# Database
DATABASE_URL=postgresql://localhost:5432/logistics
POSTGIS_ENABLED=true

# External APIs
GOOGLE_MAPS_API_KEY=your_api_key
TRAFFIC_API_KEY=your_traffic_api_key
WEATHER_API_KEY=your_weather_api_key

# Service Configuration
MAX_ROUTE_DURATION_HOURS=10
MAX_VEHICLE_CAPACITY_KG=1000
DEFAULT_DEPOT_LAT=37.7749
DEFAULT_DEPOT_LNG=-122.4194

# ML Models
MODEL_RETRAIN_INTERVAL_HOURS=24
ETA_MODEL_PATH=./models/eta_predictor.pkl
DEMAND_MODEL_PATH=./models/demand_forecast.pkl

# Optimization Settings
ROUTING_TIME_LIMIT_SECONDS=60
ROUTING_SOLUTION_STRATEGY=PATH_CHEAPEST_ARC
LOCAL_SEARCH_METAHEURISTIC=GUIDED_LOCAL_SEARCH
```

### Database Setup

```sql
-- Create PostGIS extension for geospatial data
CREATE EXTENSION postgis;

-- Vehicles table
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL,
    capacity_kg DECIMAL(10, 2) NOT NULL,
    capacity_m3 DECIMAL(10, 2) NOT NULL,
    fuel_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'available',
    current_location GEOGRAPHY(POINT, 4326),
    depot_id INTEGER REFERENCES depots(id),
    last_maintenance_date DATE,
    mileage_km DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Drivers table
CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    driver_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    license_number VARCHAR(50),
    license_expiry DATE,
    status VARCHAR(20) DEFAULT 'available',
    current_vehicle_id INTEGER REFERENCES vehicles(id),
    shift_start TIME,
    shift_end TIME,
    rating DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    delivery_address TEXT NOT NULL,
    delivery_location GEOGRAPHY(POINT, 4326) NOT NULL,
    delivery_time_start TIMESTAMP,
    delivery_time_end TIMESTAMP,
    priority INTEGER DEFAULT 5,
    weight_kg DECIMAL(10, 2),
    volume_m3 DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'pending',
    assigned_route_id INTEGER REFERENCES routes(id),
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Routes table
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    route_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_id INTEGER REFERENCES vehicles(id),
    driver_id INTEGER REFERENCES drivers(id),
    depot_id INTEGER REFERENCES depots(id),
    route_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'planned',
    planned_distance_km DECIMAL(10, 2),
    actual_distance_km DECIMAL(10, 2),
    planned_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    route_geometry GEOGRAPHY(LINESTRING, 4326),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Route stops table
CREATE TABLE route_stops (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES orders(id),
    stop_sequence INTEGER NOT NULL,
    stop_type VARCHAR(20) NOT NULL, -- 'pickup', 'delivery', 'depot'
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    planned_arrival_time TIMESTAMP,
    actual_arrival_time TIMESTAMP,
    planned_departure_time TIMESTAMP,
    actual_departure_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Depots/Warehouses table
CREATE TABLE depots (
    id SERIAL PRIMARY KEY,
    depot_name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    capacity_m3 DECIMAL(10, 2),
    operating_hours_start TIME,
    operating_hours_end TIME,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Inventory table
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    depot_id INTEGER REFERENCES depots(id),
    sku VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL,
    location_zone VARCHAR(20),
    location_aisle VARCHAR(20),
    location_shelf VARCHAR(20),
    pick_frequency INTEGER DEFAULT 0,
    weight_kg DECIMAL(10, 2),
    volume_m3 DECIMAL(10, 2),
    last_picked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tracking events table
CREATE TABLE tracking_events (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    event_type VARCHAR(50) NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    event_timestamp TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

-- Create spatial indexes
CREATE INDEX idx_vehicles_location ON vehicles USING GIST(current_location);
CREATE INDEX idx_orders_location ON orders USING GIST(delivery_location);
CREATE INDEX idx_routes_geometry ON routes USING GIST(route_geometry);
CREATE INDEX idx_depots_location ON depots USING GIST(location);
CREATE INDEX idx_tracking_events_location ON tracking_events USING GIST(location);

-- Create regular indexes
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_routes_date ON routes(route_date);
CREATE INDEX idx_routes_status ON routes(status);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_inventory_depot ON inventory(depot_id);
CREATE INDEX idx_tracking_events_timestamp ON tracking_events(event_timestamp);
```

## Usage Examples

### 1. Basic Route Optimization

```typescript
import { RouteOptimizer } from './src/routing/route-optimizer';
import { Order, Vehicle, Depot } from './src/types';

// Define depot
const depot: Depot = {
  id: 'depot-1',
  name: 'Main Distribution Center',
  location: { lat: 37.7749, lng: -122.4194 },
  operatingHours: { start: '06:00', end: '22:00' }
};

// Define vehicles
const vehicles: Vehicle[] = [
  {
    id: 'vehicle-1',
    type: 'van',
    capacityKg: 1000,
    capacityM3: 15,
    costPerKm: 0.50,
    costPerHour: 25,
    maxDurationHours: 10,
    depotId: 'depot-1'
  },
  {
    id: 'vehicle-2',
    type: 'truck',
    capacityKg: 2000,
    capacityM3: 30,
    costPerKm: 0.75,
    costPerHour: 35,
    maxDurationHours: 10,
    depotId: 'depot-1'
  }
];

// Define orders
const orders: Order[] = [
  {
    id: 'order-1',
    customerName: 'John Doe',
    location: { lat: 37.7849, lng: -122.4094 },
    timeWindow: {
      start: new Date('2024-01-15T09:00:00'),
      end: new Date('2024-01-15T12:00:00')
    },
    weightKg: 50,
    volumeM3: 2,
    serviceTimeMinutes: 10,
    priority: 1
  },
  {
    id: 'order-2',
    customerName: 'Jane Smith',
    location: { lat: 37.7649, lng: -122.4294 },
    timeWindow: {
      start: new Date('2024-01-15T10:00:00'),
      end: new Date('2024-01-15T14:00:00')
    },
    weightKg: 75,
    volumeM3: 3,
    serviceTimeMinutes: 15,
    priority: 2
  }
  // ... more orders
];

// Optimize routes
const optimizer = new RouteOptimizer();
const solution = await optimizer.optimizeRoutes({
  depot,
  vehicles,
  orders,
  optimizationGoal: 'minimize_cost',
  timeLimitSeconds: 60
});

console.log(`Total routes: ${solution.routes.length}`);
console.log(`Total cost: $${solution.totalCost.toFixed(2)}`);
console.log(`Total distance: ${solution.totalDistanceKm.toFixed(2)} km`);
console.log(`Unassigned orders: ${solution.unassignedOrders.length}`);

// Display each route
solution.routes.forEach((route, index) => {
  console.log(`\nRoute ${index + 1}:`);
  console.log(`  Vehicle: ${route.vehicleId}`);
  console.log(`  Stops: ${route.stops.length}`);
  console.log(`  Distance: ${route.distanceKm.toFixed(2)} km`);
  console.log(`  Duration: ${route.durationMinutes.toFixed(0)} minutes`);
  console.log(`  Load: ${route.totalWeightKg.toFixed(2)} kg`);

  route.stops.forEach((stop, stopIndex) => {
    console.log(`    ${stopIndex}. ${stop.orderId} - ${stop.arrivalTime}`);
  });
});
```

### 2. Dynamic Route Adjustment

```typescript
import { DynamicRouter } from './src/routing/dynamic-routing';

const dynamicRouter = new DynamicRouter();

// Start with existing route
const existingRoute = {
  id: 'route-1',
  vehicleId: 'vehicle-1',
  stops: [...],
  currentStopIndex: 2,
  currentLocation: { lat: 37.7749, lng: -122.4194 }
};

// New urgent order comes in
const urgentOrder: Order = {
  id: 'order-urgent',
  customerName: 'Emergency Delivery',
  location: { lat: 37.7849, lng: -122.4094 },
  timeWindow: {
    start: new Date(),
    end: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
  },
  weightKg: 25,
  volumeM3: 1,
  serviceTimeMinutes: 5,
  priority: 10 // Highest priority
};

// Insert into existing route
const updatedRoute = await dynamicRouter.insertOrder({
  route: existingRoute,
  order: urgentOrder,
  currentTrafficConditions: await getTrafficData()
});

if (updatedRoute.success) {
  console.log('Order successfully inserted at stop', updatedRoute.insertionIndex);
  console.log('Updated ETA:', updatedRoute.route.stops[updatedRoute.insertionIndex].arrivalTime);

  // Notify driver of route change
  await notifyDriver(updatedRoute.route.vehicleId, {
    type: 'route_updated',
    newStop: urgentOrder,
    updatedRoute: updatedRoute.route
  });
} else {
  console.log('Could not insert order:', updatedRoute.reason);
  // Assign to different vehicle or handle separately
}
```

### 3. Fleet Management

```typescript
import { FleetManager } from './src/fleet/fleet-manager';

const fleetManager = new FleetManager();

// Get available vehicles for a date
const availableVehicles = await fleetManager.getAvailableVehicles({
  date: new Date('2024-01-15'),
  depotId: 'depot-1',
  minCapacityKg: 500
});

console.log(`Available vehicles: ${availableVehicles.length}`);

// Schedule maintenance
const maintenanceSchedule = await fleetManager.scheduleMaintenanceOptimal({
  vehicles: await fleetManager.getAllVehicles(),
  horizon Days: 30,
  maintenanceCapacityPerDay: 5
});

console.log('Maintenance schedule:');
maintenanceSchedule.forEach(item => {
  console.log(`${item.vehicleId}: ${item.scheduledDate} - ${item.maintenanceType}`);
});

// Analyze fleet utilization
const utilization = await fleetManager.analyzeUtilization({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  groupBy: 'vehicle_type'
});

console.log('\nFleet utilization:');
utilization.forEach(stat => {
  console.log(`${stat.group}:`);
  console.log(`  Average utilization: ${(stat.avgUtilization * 100).toFixed(1)}%`);
  console.log(`  Total distance: ${stat.totalDistanceKm.toFixed(0)} km`);
  console.log(`  Total hours: ${stat.totalHours.toFixed(0)} hours`);
  console.log(`  Cost per km: $${stat.costPerKm.toFixed(2)}`);
});
```

### 4. Warehouse Optimization

```typescript
import { WarehouseOptimizer } from './src/warehouse/warehouse-optimizer';

const warehouseOptimizer = new WarehouseOptimizer();

// Optimize inventory placement
const placement = await warehouseOptimizer.optimizeInventoryPlacement({
  depotId: 'depot-1',
  items: await getInventoryItems(),
  pickFrequencyData: await getHistoricalPickData(),
  warehouseLayout: {
    zones: ['A', 'B', 'C'],
    aislesPerZone: 10,
    shelvesPerAisle: 20
  }
});

console.log('Inventory placement optimization:');
console.log(`Relocations needed: ${placement.relocations.length}`);
console.log(`Expected pick time reduction: ${placement.estimatedTimeReduction}%`);

placement.relocations.forEach(relocation => {
  console.log(`Move ${relocation.sku} from ${relocation.currentLocation} to ${relocation.newLocation}`);
});

// Optimize pick path for orders
const pickOrders = await getPendingOrders();
const pickPath = await warehouseOptimizer.optimizePickPath({
  depotId: 'depot-1',
  orders: pickOrders,
  startLocation: 'A-01-01',
  endLocation: 'PACKING-STATION-1'
});

console.log('\nOptimal pick path:');
console.log(`Total distance: ${pickPath.totalDistanceMeters.toFixed(0)} meters`);
console.log(`Estimated time: ${pickPath.estimatedTimeMinutes.toFixed(0)} minutes`);
console.log(`Items to pick: ${pickPath.items.length}`);

pickPath.path.forEach((location, index) => {
  console.log(`${index + 1}. ${location.zone}-${location.aisle}-${location.shelf} - ${location.items.join(', ')}`);
});
```

### 5. Demand Forecasting

```typescript
import { DemandPredictor } from './src/forecasting/demand-predictor';

const demandPredictor = new DemandPredictor();

// Train model on historical data
await demandPredictor.train({
  historicalData: await getHistoricalDeliveryData(),
  features: [
    'day_of_week',
    'month',
    'is_holiday',
    'weather_condition',
    'temperature',
    'region',
    'promotion_active'
  ],
  targetVariable: 'order_count',
  validationSplit: 0.2
});

// Forecast demand for next 30 days
const forecast = await demandPredictor.predict({
  startDate: new Date('2024-02-01'),
  days: 30,
  region: 'san-francisco',
  externalFactors: {
    holidays: ['2024-02-14'], // Valentine's Day
    events: ['super-bowl-2024'],
    weatherForecast: await getWeatherForecast()
  }
});

console.log('Demand forecast:');
forecast.forEach(day => {
  console.log(`${day.date}: ${day.predictedOrders.toFixed(0)} orders (±${day.confidenceInterval})`);
});

// Capacity planning
const capacityPlan = await demandPredictor.planCapacity({
  forecast,
  currentFleetSize: 20,
  targetServiceLevel: 0.95
});

console.log('\nCapacity recommendations:');
console.log(`Recommended fleet size: ${capacityPlan.recommendedVehicles}`);
console.log(`Additional drivers needed: ${capacityPlan.additionalDrivers}`);
console.log(`Peak day: ${capacityPlan.peakDay.date} (${capacityPlan.peakDay.orders} orders)`);
```

### 6. Real-Time Tracking

```typescript
import { ShipmentTracker } from './src/tracking/shipment-tracker';

const tracker = new ShipmentTracker();

// Track vehicle in real-time
tracker.startTracking({
  vehicleId: 'vehicle-1',
  routeId: 'route-1',
  updateIntervalSeconds: 30
});

// Listen for location updates
tracker.on('location_update', (event) => {
  console.log(`Vehicle ${event.vehicleId} at ${event.location.lat}, ${event.location.lng}`);
  console.log(`Speed: ${event.speed} km/h, Heading: ${event.heading}°`);

  // Update ETA for remaining stops
  const updatedETAs = await tracker.updateETAs({
    routeId: event.routeId,
    currentLocation: event.location,
    currentTime: event.timestamp,
    trafficConditions: await getTrafficData()
  });

  updatedETAs.forEach(eta => {
    console.log(`Stop ${eta.stopId}: ETA ${eta.estimatedArrivalTime} (${eta.confidenceLevel})`);
  });
});

// Geofence alerts
tracker.on('geofence_enter', async (event) => {
  console.log(`Vehicle ${event.vehicleId} arrived at stop ${event.stopId}`);

  // Mark stop as arrived
  await updateStopStatus(event.stopId, 'arrived');

  // Notify customer
  await sendCustomerNotification(event.stopId, {
    type: 'driver_arrived',
    eta: '2-5 minutes'
  });
});

tracker.on('geofence_exit', async (event) => {
  console.log(`Vehicle ${event.vehicleId} completed stop ${event.stopId}`);

  // Collect proof of delivery
  const pod = await getProofOfDelivery(event.stopId);

  await updateStopStatus(event.stopId, 'completed', {
    signature: pod.signature,
    photo: pod.photo,
    notes: pod.notes,
    timestamp: event.timestamp
  });
});

// Exception handling
tracker.on('route_deviation', async (event) => {
  console.warn(`Vehicle ${event.vehicleId} deviated from route`);
  console.warn(`Distance from route: ${event.deviationDistanceMeters} meters`);

  // Alert dispatcher
  await alertDispatcher({
    type: 'route_deviation',
    vehicleId: event.vehicleId,
    location: event.location,
    severity: event.deviationDistanceMeters > 1000 ? 'high' : 'medium'
  });
});

tracker.on('delay_detected', async (event) => {
  console.warn(`Route ${event.routeId} is delayed by ${event.delayMinutes} minutes`);

  // Notify affected customers
  const affectedStops = await getStopsAfterCurrent(event.routeId);

  for (const stop of affectedStops) {
    await sendCustomerNotification(stop.orderId, {
      type: 'delivery_delayed',
      newETA: stop.updatedETA,
      delayReason: event.reason
    });
  }
});
```

### 7. Analytics and Reporting

```typescript
import { LogisticsAnalytics } from './src/analytics/logistics-analytics';

const analytics = new LogisticsAnalytics();

// Performance metrics
const metrics = await analytics.calculateMetrics({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  groupBy: 'day'
});

console.log('Daily Performance Metrics:');
metrics.forEach(day => {
  console.log(`\n${day.date}:`);
  console.log(`  Orders delivered: ${day.ordersDelivered}`);
  console.log(`  On-time delivery rate: ${(day.onTimeRate * 100).toFixed(1)}%`);
  console.log(`  Average delivery time: ${day.avgDeliveryTime} minutes`);
  console.log(`  Miles driven: ${day.totalMiles.toFixed(0)}`);
  console.log(`  Cost per delivery: $${day.costPerDelivery.toFixed(2)}`);
  console.log(`  Vehicle utilization: ${(day.vehicleUtilization * 100).toFixed(1)}%`);
});

// Route efficiency analysis
const routeAnalysis = await analytics.analyzeRouteEfficiency({
  routes: await getCompletedRoutes(),
  compareToOptimal: true
});

console.log('\nRoute Efficiency Analysis:');
console.log(`Average route efficiency: ${(routeAnalysis.avgEfficiency * 100).toFixed(1)}%`);
console.log(`Potential savings: $${routeAnalysis.potentialSavings.toFixed(2)}/day`);
console.log(`Top issues:`);
routeAnalysis.issues.forEach(issue => {
  console.log(`  - ${issue.description} (Impact: $${issue.cost.toFixed(2)})`);
});

// Driver performance
const driverStats = await analytics.analyzeDriverPerformance({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31')
});

console.log('\nDriver Performance:');
driverStats.forEach(driver => {
  console.log(`\n${driver.driverName}:`);
  console.log(`  Deliveries completed: ${driver.deliveries}`);
  console.log(`  On-time rate: ${(driver.onTimeRate * 100).toFixed(1)}%`);
  console.log(`  Customer rating: ${driver.avgRating.toFixed(1)}/5.0`);
  console.log(`  Miles driven: ${driver.totalMiles.toFixed(0)}`);
  console.log(`  Incidents: ${driver.incidents}`);
});

// Cost analysis
const costAnalysis = await analytics.analyzeCosts({
  period: 'monthly',
  breakdownBy: ['fuel', 'maintenance', 'labor', 'overhead']
});

console.log('\nCost Breakdown:');
console.log(`Total monthly cost: $${costAnalysis.total.toFixed(2)}`);
costAnalysis.breakdown.forEach(category => {
  console.log(`  ${category.name}: $${category.amount.toFixed(2)} (${category.percentage.toFixed(1)}%)`);
});
```

## Advanced Features

### Multi-Depot Optimization

Handle complex logistics networks with multiple distribution centers:

```typescript
const multiDepotSolution = await optimizer.optimizeMultiDepot({
  depots: [
    { id: 'depot-sf', location: { lat: 37.7749, lng: -122.4194 } },
    { id: 'depot-oak', location: { lat: 37.8044, lng: -122.2712 } },
    { id: 'depot-sj', location: { lat: 37.3382, lng: -121.8863 } }
  ],
  vehicles: vehiclesByDepot,
  orders: allOrders,
  allowCrossDocking: true,
  optimizeDepotAssignment: true
});
```

### Electric Vehicle Integration

Optimize routes considering battery range and charging:

```typescript
const evRoutes = await optimizer.optimizeEVRoutes({
  vehicles: electricVehicles.map(v => ({
    ...v,
    batteryCapacityKWh: v.batteryCapacity,
    currentChargePercent: v.currentCharge,
    rangeKm: v.estimatedRange,
    chargingRate: v.fastChargeRate
  })),
  chargingStations: await getChargingStations(),
  orders: orders,
  allowMidRouteCharging: true,
  minBatteryReserve: 0.20 // 20% safety margin
});
```

### Weather Integration

Adjust routes based on weather conditions:

```typescript
const weatherAwareRoutes = await dynamicRouter.optimizeWithWeather({
  routes: plannedRoutes,
  weatherForecast: await getWeatherForecast(),
  roadConditions: await getRoadConditions(),
  adjustmentRules: {
    snow: { speedReduction: 0.3, avoidHighways: true },
    rain: { speedReduction: 0.15 },
    flood: { avoidAreas: ['low_elevation_zones'] }
  }
});
```

### Machine Learning ETA Prediction

Use historical data to improve ETA accuracy:

```typescript
// Train ETA model
await tracker.trainETAModel({
  historicalDeliveries: await getDeliveryHistory(),
  features: [
    'distance_km',
    'traffic_index',
    'time_of_day',
    'day_of_week',
    'weather_condition',
    'driver_experience',
    'vehicle_type',
    'num_stops_remaining'
  ]
});

// Predict ETA with confidence intervals
const eta = await tracker.predictETA({
  route: currentRoute,
  currentLocation: vehicleLocation,
  contextualFactors: {
    traffic: await getTrafficData(),
    weather: await getCurrentWeather(),
    driver: driverProfile
  }
});

console.log(`Estimated arrival: ${eta.predictedTime}`);
console.log(`Confidence: 90% chance between ${eta.lower90} and ${eta.upper90}`);
```

## Performance Optimization

### Caching Strategies

```typescript
// Cache distance matrices
const distanceCache = new DistanceMatrixCache({
  ttlMinutes: 60,
  maxEntries: 10000
});

optimizer.setDistanceMatrixProvider(async (locations) => {
  const cacheKey = hashLocations(locations);

  let matrix = await distanceCache.get(cacheKey);
  if (!matrix) {
    matrix = await calculateDistanceMatrix(locations);
    await distanceCache.set(cacheKey, matrix);
  }

  return matrix;
});
```

### Parallel Processing

```typescript
// Optimize multiple regions in parallel
const regionResults = await Promise.all(
  regions.map(region => optimizer.optimizeRoutes({
    depot: region.depot,
    vehicles: region.vehicles,
    orders: region.orders,
    timeLimitSeconds: 30
  }))
);
```

### Incremental Optimization

```typescript
// Start with fast solution, improve iteratively
const quickSolution = await optimizer.optimizeRoutes({
  ...params,
  timeLimitSeconds: 10,
  strategy: 'PATH_CHEAPEST_ARC'
});

// Improve solution with more time
const improvedSolution = await optimizer.improveExistingSolution({
  initialSolution: quickSolution,
  timeLimitSeconds: 60,
  metaheuristic: 'GUIDED_LOCAL_SEARCH'
});
```

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### Performance Benchmarks

```bash
npm run benchmark
```

Sample benchmark results:

```
Route Optimization Benchmarks
=============================
10 orders, 1 vehicle:     0.15s
50 orders, 5 vehicles:    1.2s
100 orders, 10 vehicles:  3.8s
500 orders, 20 vehicles:  18.5s
1000 orders, 50 vehicles: 45.2s

Dynamic Insertion Benchmarks
============================
Insert into 10-stop route:  0.05s
Insert into 50-stop route:  0.18s
Insert into 100-stop route: 0.32s

ETA Prediction Benchmarks
=========================
Single stop prediction:    0.02s
Route-wide predictions:    0.15s
Model training (1M samples): 45s
```

## Deployment

### Docker Deployment

```dockerfile
FROM node:20-alpine

# Install Python and dependencies
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY requirements.txt ./

# Install dependencies
RUN npm install
RUN pip3 install -r requirements.txt

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: logistics-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: logistics-platform
  template:
    metadata:
      labels:
        app: logistics-platform
    spec:
      containers:
      - name: logistics-api
        image: logistics-platform:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
```

## API Documentation

### REST API Endpoints

#### Routes

- `POST /api/routes/optimize` - Optimize delivery routes
- `GET /api/routes/:id` - Get route details
- `PUT /api/routes/:id/update` - Update route dynamically
- `POST /api/routes/:id/stops` - Add stop to route
- `DELETE /api/routes/:id/stops/:stopId` - Remove stop from route

#### Fleet

- `GET /api/fleet/vehicles` - List all vehicles
- `GET /api/fleet/vehicles/available` - Get available vehicles
- `POST /api/fleet/vehicles/:id/assign` - Assign vehicle to route
- `GET /api/fleet/utilization` - Fleet utilization metrics
- `POST /api/fleet/maintenance/schedule` - Schedule maintenance

#### Orders

- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order
- `GET /api/orders/:id/track` - Track order status
- `POST /api/orders/batch` - Create multiple orders

#### Tracking

- `GET /api/tracking/vehicles/:id/location` - Get vehicle location
- `GET /api/tracking/routes/:id/progress` - Get route progress
- `POST /api/tracking/events` - Log tracking event
- `GET /api/tracking/eta/:stopId` - Get ETA for stop

#### Analytics

- `GET /api/analytics/metrics` - Performance metrics
- `GET /api/analytics/routes/efficiency` - Route efficiency analysis
- `GET /api/analytics/drivers/performance` - Driver performance stats
- `GET /api/analytics/costs` - Cost analysis

### WebSocket Events

```typescript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3000/ws');

// Subscribe to vehicle updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'vehicle_locations',
  vehicleIds: ['vehicle-1', 'vehicle-2']
}));

// Receive location updates
ws.on('message', (data) => {
  const event = JSON.parse(data);

  switch (event.type) {
    case 'location_update':
      updateMapMarker(event.vehicleId, event.location);
      break;
    case 'eta_update':
      updateDeliveryETA(event.stopId, event.eta);
      break;
    case 'delivery_completed':
      markDeliveryComplete(event.orderId);
      break;
  }
});
```

## Best Practices

### 1. Route Planning

- Always optimize routes the night before to allow review and adjustment
- Include buffer time for unexpected delays (10-15% of route duration)
- Group deliveries by geographic clusters to minimize drive time
- Consider driver preferences and experience when assigning routes
- Balance route complexity across drivers for fair workload distribution

### 2. Capacity Management

- Monitor vehicle utilization and adjust fleet size seasonally
- Keep 10-20% spare capacity for unexpected demand spikes
- Cross-train drivers to handle different vehicle types
- Use demand forecasting to plan staffing weeks in advance
- Track "could not deliver" reasons to identify systemic issues

### 3. Customer Experience

- Provide accurate ETA windows (±30 minutes or less)
- Send proactive notifications for delays longer than 15 minutes
- Offer flexible delivery windows to improve first-attempt success
- Collect delivery preferences (gate codes, safe drop locations)
- Follow up on failed deliveries within 1 hour

### 4. Cost Optimization

- Minimize empty miles and backhaul opportunities
- Right-size vehicles for typical order profiles
- Optimize fuel efficiency through route planning and driver training
- Negotiate zone-based pricing with contractors
- Track cost per delivery by region and time period

### 5. Data Quality

- Validate delivery addresses before route optimization
- Maintain accurate geocoding for all locations
- Keep vehicle specifications and capacities up to date
- Regularly audit and clean historical tracking data
- Verify customer contact information to reduce delivery failures

## Contributing

We welcome contributions! Areas for enhancement:

1. **Additional Constraints**
   - Driver skill levels and customer preferences
   - Refrigerated/temperature-controlled vehicles
   - Hazardous materials handling
   - Multi-compartment vehicles

2. **Advanced Algorithms**
   - Reinforcement learning for dynamic routing
   - Genetic algorithms for long-term planning
   - Clustering algorithms for territory design
   - Graph neural networks for ETA prediction

3. **Integrations**
   - Additional mapping providers (HERE, Mapbox, OpenStreetMap)
   - Telematics systems (Geotab, Verizon Connect, Samsara)
   - WMS systems (Manhattan, SAP, Oracle)
   - TMS systems (BluJay, MercuryGate, project44)

4. **Features**
   - Mobile app for drivers
   - Customer portal for delivery tracking
   - Dispatch console UI
   - Automated reporting and alerting

## License

MIT License - see LICENSE file for details

## Support

- Documentation: https://docs.elide.dev/showcases/logistics
- Issues: https://github.com/elide-dev/elide-showcases/issues
- Discussions: https://github.com/elide-dev/elide-showcases/discussions
- Email: logistics@elide.dev

## Acknowledgments

Built with:
- **OR-Tools** - Google's optimization toolkit
- **scikit-learn** - Machine learning in Python
- **NetworkX** - Graph algorithms and analysis
- **pandas** - Data manipulation and analysis
- **Elide** - Polyglot runtime for seamless language interop

Special thanks to the logistics and supply chain community for best practices
and real-world insights that shaped this platform.

---

**Ready to optimize your logistics operations?** Start with the examples
directory and explore the powerful capabilities of polyglot programming
for supply chain management.
