/**
 * Smart City Platform - Comprehensive Demonstration
 *
 * End-to-end demonstration of all smart city systems working together.
 * TypeScript + Python polyglot showcase for urban infrastructure management.
 */

import type {
  CityConfig,
  TrafficNetwork,
  EnvironmentalNetwork,
  WasteManagementSystem,
  SmartLightingSystem,
  WaterManagementSystem,
  EmergencyResponseSystem,
  CitizenServicesSystem,
  District,
  GeoCoordinates
} from '../src/types.ts';

import { TrafficNetworkOptimizer } from '../src/traffic/traffic-optimizer.ts';
import { AirQualityMonitor } from '../src/environment/air-quality-monitor.ts';
import { WasteManagementOptimizer } from '../src/environment/waste-management.ts';
import { SmartLightingController } from '../src/utilities/smart-lighting.ts';
import { WaterManagementController } from '../src/utilities/water-management.ts';
import { EmergencyResponseCoordinator } from '../src/safety/emergency-response.ts';
import { CitizenServicesManager } from '../src/citizen/citizen-services.ts';
import { CityAnalyticsDashboard } from '../src/analytics/city-analytics.ts';

/**
 * Main demonstration runner
 */
async function main() {
  console.log('🏙️  Smart City Platform - Comprehensive Demo\n');
  console.log('═'.repeat(80));
  console.log('Elide TypeScript + Python Polyglot Showcase');
  console.log('═'.repeat(80));
  console.log('');

  // Step 1: Initialize City Configuration
  console.log('\n📍 Step 1: Initializing City Configuration...\n');
  const cityConfig = createCityConfiguration();
  console.log(`✓ City: ${cityConfig.cityName}`);
  console.log(`✓ Population: ${cityConfig.population.toLocaleString()}`);
  console.log(`✓ Area: ${cityConfig.area} km²`);
  console.log(`✓ Districts: ${cityConfig.districts.length}`);

  // Step 2: Initialize All City Systems
  console.log('\n🔧 Step 2: Initializing City Systems...\n');

  const trafficNetwork = createTrafficNetwork();
  const trafficOptimizer = new TrafficNetworkOptimizer(trafficNetwork);
  console.log(`✓ Traffic System: ${trafficNetwork.intersections.length} intersections, ${trafficNetwork.roads.length} roads`);

  const envNetwork = createEnvironmentalNetwork();
  const airQualityMonitor = new AirQualityMonitor(envNetwork);
  console.log(`✓ Environmental System: ${envNetwork.airQualitySensors.length} air quality sensors`);

  const wasteSystem = createWasteManagementSystem();
  const wasteManager = new WasteManagementOptimizer(wasteSystem);
  console.log(`✓ Waste Management: ${wasteSystem.bins.length} smart bins, ${wasteSystem.trucks.length} trucks`);

  const lightingSystem = createLightingSystem();
  const lightingController = new SmartLightingController(lightingSystem);
  console.log(`✓ Smart Lighting: ${lightingSystem.streetLights.length} lights in ${lightingSystem.zones.length} zones`);

  const waterSystem = createWaterManagementSystem();
  const waterManager = new WaterManagementController(waterSystem);
  console.log(`✓ Water Management: ${waterSystem.network.pipes.length} pipes, ${waterSystem.network.pumps.length} pumps`);

  const emergencySystem = createEmergencySystem();
  const emergencyCoordinator = new EmergencyResponseCoordinator(emergencySystem);
  console.log(`✓ Emergency Response: ${emergencySystem.responders.length} responders, ${emergencySystem.facilities.length} facilities`);

  const citizenSystem = createCitizenServicesSystem();
  const citizenServices = new CitizenServicesManager(citizenSystem);
  console.log(`✓ Citizen Services: ${citizenSystem.publicTransport.routes.length} transit routes, ${citizenSystem.parking.lots.length} parking lots`);

  // Step 3: Initialize Analytics Dashboard
  console.log('\n📊 Step 3: Initializing Analytics Dashboard...\n');
  const analytics = new CityAnalyticsDashboard(cityConfig);
  analytics.registerComponents({
    traffic: trafficOptimizer,
    airQuality: airQualityMonitor,
    waste: wasteManager,
    lighting: lightingController,
    water: waterManager,
    emergency: emergencyCoordinator,
    citizen: citizenServices
  });
  console.log('✓ Analytics dashboard registered with all systems');

  // Step 4: Traffic Optimization
  console.log('\n🚦 Step 4: Traffic Optimization Demo...\n');
  console.log('Running genetic algorithm optimization...');
  const trafficOptimization = await trafficOptimizer.optimizeWithGeneticAlgorithm(50, 30, 0.1);
  console.log(`✓ Optimization complete: ${trafficOptimization.signalAdjustments.length} signals optimized`);
  console.log(`  • Predicted improvement: ${trafficOptimization.predictedImprovement.toFixed(1)}%`);
  console.log(`  • Estimated delay reduction: ${trafficOptimization.estimatedDelay.toFixed(1)} seconds`);
  console.log(`  • Convergence time: ${trafficOptimization.convergence.convergenceTime.toFixed(0)}ms`);

  console.log('\nApplying optimization...');
  await trafficOptimizer.applyOptimization(trafficOptimization);
  console.log('✓ Traffic signals updated');

  console.log('\nDetecting traffic anomalies...');
  const trafficAnomalies = await trafficOptimizer.detectAnomalies();
  console.log(`✓ Detected ${trafficAnomalies.length} anomalies`);
  if (trafficAnomalies.length > 0) {
    console.log(`  • Top anomaly: ${trafficAnomalies[0].description}`);
  }

  // Step 5: Environmental Monitoring
  console.log('\n🌍 Step 5: Environmental Monitoring Demo...\n');
  console.log('Collecting air quality measurements...');
  const airQualityReadings = await airQualityMonitor.collectMeasurements();
  console.log(`✓ Collected readings from ${airQualityReadings.size} sensors`);

  console.log('\nPredicting air quality for next 24 hours...');
  const airQualityPredictions = await airQualityMonitor.predictAirQuality(24);
  console.log(`✓ Generated predictions for ${airQualityPredictions.size} sensors`);

  console.log('\nAnalyzing pollution sources...');
  const pollutionSources = await airQualityMonitor.analyzePollutionSources();
  console.log(`✓ Identified ${pollutionSources.length} pollution source clusters`);
  if (pollutionSources.length > 0) {
    console.log(`  • Primary source type: ${pollutionSources[0].sourceType}`);
  }

  const airQualityReport = airQualityMonitor.generateReport();
  console.log(`\n📋 Air Quality Summary:`);
  console.log(`  • Average AQI: ${airQualityReport.summary.averageAQI}`);
  console.log(`  • Compliance rate: ${airQualityReport.summary.complianceRate.toFixed(1)}%`);

  // Step 6: Waste Management
  console.log('\n♻️  Step 6: Waste Management Demo...\n');
  console.log('Monitoring smart bins...');
  const binStatuses = await wasteManager.monitorBins();
  console.log(`✓ Monitored ${binStatuses.size} bins`);

  console.log('\nPredicting bin fill times...');
  const fillPredictions = await wasteManager.predictFillTimes();
  console.log(`✓ Predicted fill times for ${fillPredictions.size} bins`);

  console.log('\nOptimizing collection routes...');
  const routes = await wasteManager.optimizeRoutes();
  console.log(`✓ Generated ${routes.length} optimized routes`);
  if (routes.length > 0) {
    console.log(`  • Route 1: ${routes[0].bins.length} bins, ${routes[0].distance.toFixed(1)} km`);
    console.log(`  • Estimated duration: ${routes[0].estimatedDuration} minutes`);
  }

  const wasteAnalysis = await wasteManager.analyzeWastePatterns();
  console.log(`\n📋 Waste Management Summary:`);
  console.log(`  • Total waste: ${wasteAnalysis.totalWaste.toFixed(0)} liters`);
  console.log(`  • Recycling rate: ${wasteAnalysis.recyclingRate.toFixed(1)}%`);
  console.log(`  • Hotspots detected: ${wasteAnalysis.hotspots.length}`);

  // Step 7: Smart Lighting
  console.log('\n💡 Step 7: Smart Lighting Demo...\n');
  console.log('Updating lighting based on conditions...');
  await lightingController.updateLighting();
  console.log(`✓ Updated ${lightingSystem.streetLights.length} lights`);

  console.log('\nPredicting maintenance needs...');
  const maintenancePredictions = await lightingController.predictMaintenance();
  console.log(`✓ Generated ${maintenancePredictions.length} maintenance predictions`);

  console.log('\nDetecting lighting faults...');
  const lightingFaults = await lightingController.detectFaults();
  console.log(`✓ Detected ${lightingFaults.length} faults`);

  const energySavings = lightingController.calculateEnergySavings();
  console.log(`\n📋 Lighting Summary:`);
  console.log(`  • Energy savings: ${energySavings.savingsPercentage.toFixed(1)}%`);
  console.log(`  • Cost savings: $${energySavings.costSavings.toFixed(2)}`);
  console.log(`  • Carbon reduction: ${energySavings.carbonReduction.toFixed(1)} kg CO2`);

  // Step 8: Water Management
  console.log('\n💧 Step 8: Water Management Demo...\n');
  console.log('Monitoring water quality...');
  const waterQualityReadings = await waterManager.monitorWaterQuality();
  console.log(`✓ Collected ${waterQualityReadings.size} water quality readings`);

  console.log('\nDetecting leaks...');
  const leaks = await waterManager.detectLeaks();
  console.log(`✓ Detected ${leaks.length} potential leaks`);

  console.log('\nOptimizing pump operations...');
  const pumpOptimizations = await waterManager.optimizePumpOperations();
  console.log(`✓ Generated ${pumpOptimizations.length} pump optimizations`);

  console.log('\nPredicting pipe failures...');
  const failurePredictions = await waterManager.predictPipeFailures();
  console.log(`✓ Identified ${failurePredictions.length} pipes at risk`);

  const waterReport = waterManager.generateReport();
  console.log(`\n📋 Water Management Summary:`);
  console.log(`  • Network pressure: ${waterReport.network.avgPressure.toFixed(1)} bar`);
  console.log(`  • Quality compliance: ${waterReport.waterQuality.complianceRate.toFixed(1)}%`);
  console.log(`  • Active leaks: ${waterReport.leaks.activeLeaks}`);

  // Step 9: Emergency Response
  console.log('\n🚨 Step 9: Emergency Response Demo...\n');
  console.log('Simulating emergency incidents...');

  // Fire emergency
  const fireEmergency = await emergencyCoordinator.reportEmergency(
    'fire',
    { latitude: cityConfig.coordinates.latitude + 0.01, longitude: cityConfig.coordinates.longitude + 0.01 },
    'Building fire reported, multiple floors involved'
  );
  console.log(`✓ Fire emergency dispatched: ${fireEmergency.emergencyId}`);
  console.log(`  • Severity: ${fireEmergency.severity}`);
  console.log(`  • Responders assigned: ${fireEmergency.assignedResponders.length}`);
  console.log(`  • Estimated response time: ${fireEmergency.estimatedResponseTime} minutes`);

  // Medical emergency
  const medicalEmergency = await emergencyCoordinator.reportEmergency(
    'medical',
    { latitude: cityConfig.coordinates.latitude - 0.01, longitude: cityConfig.coordinates.longitude - 0.01 },
    'Medical emergency - patient unconscious'
  );
  console.log(`✓ Medical emergency dispatched: ${medicalEmergency.emergencyId}`);

  console.log('\nPredicting emergency hotspots...');
  const hotspots = await emergencyCoordinator.predictHotspots();
  console.log(`✓ Identified ${hotspots.length} emergency hotspots`);

  const emergencyMetrics = emergencyCoordinator.calculatePerformanceMetrics();
  console.log(`\n📋 Emergency Response Summary:`);
  console.log(`  • Average response time: ${emergencyMetrics.avgResponseTime.toFixed(1)} minutes`);
  console.log(`  • Resolution rate: ${emergencyMetrics.resolutionRate.toFixed(1)}%`);
  console.log(`  • Active incidents: ${emergencyMetrics.activeIncidents}`);

  // Step 10: Citizen Services
  console.log('\n👥 Step 10: Citizen Services Demo...\n');
  console.log('Submitting service requests...');

  const request1 = await citizenServices.submitServiceRequest(
    'citizen-001',
    'infrastructure',
    'pothole',
    'Large pothole on Main Street causing traffic issues',
    { latitude: cityConfig.coordinates.latitude, longitude: cityConfig.coordinates.longitude },
    []
  );
  console.log(`✓ Service request submitted: ${request1.requestId}`);
  console.log(`  • Priority: ${request1.priority}`);
  console.log(`  • Assigned to: ${request1.assignedTo}`);

  console.log('\nSubmitting citizen feedback...');
  const feedback = await citizenServices.submitFeedback(
    'citizen-002',
    'transport',
    'The new bus schedule is much better, thank you!'
  );
  console.log(`✓ Feedback submitted: ${feedback.feedbackId}`);
  console.log(`  • Sentiment: ${feedback.sentiment}`);

  console.log('\nGetting transit information...');
  const transitInfo = await citizenServices.getTransitInfo();
  console.log(`✓ Retrieved info for ${transitInfo.routes.length} routes`);
  console.log(`  • System delay: ${transitInfo.avgSystemDelay.toFixed(1)} minutes`);

  console.log('\nFinding parking...');
  const parking = await citizenServices.findParking(cityConfig.coordinates, 2.0);
  console.log(`✓ Found ${parking.length} parking options`);

  const citizenReport = citizenServices.generateReport();
  console.log(`\n📋 Citizen Services Summary:`);
  console.log(`  • Service requests: ${citizenReport.serviceRequests.total}`);
  console.log(`  • Average satisfaction: ${citizenReport.serviceRequests.metrics.avgSatisfaction.toFixed(1)}/5`);

  // Step 11: City-Wide Analytics
  console.log('\n📊 Step 11: City-Wide Analytics Demo...\n');
  console.log('Collecting city analytics...');
  const cityAnalytics = await analytics.collectCityAnalytics();
  console.log('✓ Analytics collected from all systems');

  console.log('\nCalculating KPIs...');
  const kpis = analytics.calculateKPIs();
  console.log(`✓ Calculated ${kpis.size} KPIs`);

  console.log('\nGenerating predictive insights...');
  const insights = await analytics.generatePredictiveInsights();
  console.log(`✓ Generated ${insights.length} predictive insights`);

  console.log('\nDetecting system anomalies...');
  const systemAnomalies = await analytics.detectSystemAnomalies();
  console.log(`✓ Detected ${systemAnomalies.length} system-wide anomalies`);

  console.log('\nAnalyzing correlations...');
  const correlations = await analytics.analyzeCorrelations();
  console.log(`✓ Found ${correlations.length} significant correlations`);

  console.log('\nGenerating comprehensive report...');
  const comprehensiveReport = await analytics.generateComprehensiveReport();
  console.log('✓ Comprehensive report generated');
  console.log(`\n🏆 City Health Score: ${comprehensiveReport.healthScore}/100`);

  // Final Summary
  console.log('\n═'.repeat(80));
  console.log('📊 FINAL SUMMARY');
  console.log('═'.repeat(80));
  console.log('');
  console.log('City Performance Overview:');
  console.log(`  🚦 Traffic: ${cityAnalytics.traffic.totalVehicles} vehicles, ${cityAnalytics.traffic.averageSpeed.toFixed(1)} km/h avg`);
  console.log(`  🌍 Environment: AQI ${cityAnalytics.environment.averageAQI}, ${cityAnalytics.environment.recyclingRate.toFixed(1)}% recycling`);
  console.log(`  ⚡ Utilities: ${cityAnalytics.utilities.energyConsumption.toFixed(0)} kWh, ${cityAnalytics.utilities.streetLightEfficiency.toFixed(1)}% efficient`);
  console.log(`  🚨 Safety: ${cityAnalytics.safety.emergencyCount} incidents, ${cityAnalytics.safety.averageResponseTime.toFixed(1)} min response`);
  console.log(`  👥 Citizens: ${cityAnalytics.citizen.serviceRequests} requests, ${cityAnalytics.citizen.satisfactionScore.toFixed(1)}/5 satisfaction`);
  console.log('');
  console.log('Key Achievements:');
  console.log(`  ✓ ${trafficOptimization.signalAdjustments.length} traffic signals optimized`);
  console.log(`  ✓ ${airQualityReadings.size} air quality sensors monitored`);
  console.log(`  ✓ ${routes.length} waste collection routes optimized`);
  console.log(`  ✓ ${energySavings.savingsPercentage.toFixed(1)}% energy savings achieved`);
  console.log(`  ✓ ${leaks.length} water leaks detected`);
  console.log(`  ✓ ${emergencyMetrics.resolutionRate.toFixed(1)}% emergency resolution rate`);
  console.log(`  ✓ ${comprehensiveReport.healthScore}/100 overall city health score`);
  console.log('');

  if (comprehensiveReport.recommendations.length > 0) {
    console.log('Strategic Recommendations:');
    for (const rec of comprehensiveReport.recommendations) {
      console.log(`  • ${rec}`);
    }
    console.log('');
  }

  console.log('═'.repeat(80));
  console.log('✅ Smart City Platform Demo Complete!');
  console.log('═'.repeat(80));
  console.log('');
  console.log('This demonstration showcased Elide\'s TypeScript + Python polyglot capabilities');
  console.log('for building comprehensive smart city infrastructure management systems.');
  console.log('');
}

// ============================================================================
// Helper Functions - City Data Generation
// ============================================================================

function createCityConfiguration(): CityConfig {
  return {
    cityId: 'city-001',
    cityName: 'SmartVille',
    population: 500000,
    area: 250,
    timezone: 'UTC-5',
    coordinates: { latitude: 40.7128, longitude: -74.0060 },
    districts: [
      createDistrict('dist-001', 'Downtown', 'commercial', 50000),
      createDistrict('dist-002', 'North End', 'residential', 120000),
      createDistrict('dist-003', 'Industrial Park', 'industrial', 10000),
      createDistrict('dist-004', 'Suburbs', 'residential', 200000),
      createDistrict('dist-005', 'Tech Hub', 'mixed_use', 80000),
      createDistrict('dist-006', 'Old Town', 'recreational', 40000)
    ],
    metadata: {
      established: '1850',
      government: 'Mayor-Council',
      budget: '$2.5B'
    }
  };
}

function createDistrict(id: string, name: string, type: string, population: number): District {
  return {
    districtId: id,
    name,
    type: type as any,
    population,
    area: 40,
    boundaries: [],
    zoneClassification: 'urban_core' as any
  };
}

function createTrafficNetwork(): TrafficNetwork {
  const intersections = Array.from({ length: 50 }, (_, i) => ({
    intersectionId: `int-${i}`,
    location: { latitude: 40.7128 + (Math.random() - 0.5) * 0.1, longitude: -74.0060 + (Math.random() - 0.5) * 0.1 },
    type: 'signalized' as any,
    signals: [],
    sensors: [],
    capacity: 1000 + Math.random() * 500,
    currentFlow: 500 + Math.random() * 400,
    congestionLevel: 'moderate' as any,
    priority: 'medium' as any
  }));

  const roads = Array.from({ length: 100 }, (_, i) => ({
    segmentId: `road-${i}`,
    name: `Street ${i}`,
    type: 'arterial' as any,
    startPoint: intersections[i % 50].location,
    endPoint: intersections[(i + 1) % 50].location,
    length: 500 + Math.random() * 1000,
    lanes: 2 + Math.floor(Math.random() * 3),
    speedLimit: 50,
    capacity: 800,
    currentFlow: { volume: 400, speed: 45, density: 20, levelOfService: 'C' as any, timestamp: new Date() },
    condition: { surfaceQuality: 'good' as any, weather: {} as any, visibility: 1000, hazards: [], maintenanceNeeded: false }
  }));

  return {
    networkId: 'network-001',
    intersections,
    roads,
    zones: [],
    lastUpdated: new Date()
  };
}

function createEnvironmentalNetwork(): EnvironmentalNetwork {
  return {
    networkId: 'env-001',
    airQualitySensors: Array.from({ length: 30 }, (_, i) => ({
      sensorId: `aqs-${i}`,
      location: { latitude: 40.7128 + (Math.random() - 0.5) * 0.1, longitude: -74.0060 + (Math.random() - 0.5) * 0.1 },
      status: 'active' as any,
      measurements: {} as any,
      calibration: new Date(),
      manufacturer: 'SensorCorp',
      model: 'AQ-3000'
    })),
    noiseSensors: [],
    weatherStations: [],
    wasteManagement: {} as any
  };
}

function createWasteManagementSystem(): WasteManagementSystem {
  return {
    systemId: 'waste-001',
    bins: Array.from({ length: 200 }, (_, i) => ({
      binId: `bin-${i}`,
      location: { latitude: 40.7128 + (Math.random() - 0.5) * 0.1, longitude: -74.0060 + (Math.random() - 0.5) * 0.1 },
      type: ['general', 'recyclable', 'organic'][Math.floor(Math.random() * 3)] as any,
      capacity: 1000,
      fillLevel: Math.random() * 100,
      temperature: 20 + Math.random() * 10,
      lastCollection: new Date(Date.now() - Math.random() * 7 * 24 * 3600000),
      nextScheduled: new Date(Date.now() + 24 * 3600000),
      status: 'normal' as any,
      sensor: {} as any
    })),
    trucks: Array.from({ length: 10 }, (_, i) => ({
      truckId: `truck-${i}`,
      location: { latitude: 40.7128, longitude: -74.0060 },
      capacity: 10000,
      currentLoad: 0,
      status: 'idle' as any,
      route: '',
      driver: `Driver ${i + 1}`,
      fuelLevel: 80 + Math.random() * 20,
      lastMaintenance: new Date()
    })),
    facilities: [],
    routes: []
  };
}

function createLightingSystem(): SmartLightingSystem {
  return {
    systemId: 'lighting-001',
    streetLights: Array.from({ length: 500 }, (_, i) => ({
      lightId: `light-${i}`,
      location: { latitude: 40.7128 + (Math.random() - 0.5) * 0.1, longitude: -74.0060 + (Math.random() - 0.5) * 0.1 },
      type: 'led' as any,
      brightness: 0,
      status: 'off' as any,
      energyConsumption: 0,
      motionDetected: false,
      lastMaintenance: new Date(),
      lifespan: Math.random() * 50000
    })),
    zones: [],
    schedule: {} as any,
    energyUsage: {} as any
  };
}

function createWaterManagementSystem(): WaterManagementSystem {
  return {
    systemId: 'water-001',
    network: {
      networkId: 'net-001',
      pipes: Array.from({ length: 150 }, (_, i) => ({
        pipeId: `pipe-${i}`,
        startPoint: { latitude: 40.7128, longitude: -74.0060 },
        endPoint: { latitude: 40.7128 + 0.01, longitude: -74.0060 + 0.01 },
        diameter: 200 + Math.random() * 300,
        material: 'ductile_iron' as any,
        age: Math.floor(Math.random() * 50),
        condition: {
          status: 'good' as any,
          leakProbability: Math.random() * 0.3,
          corrosion: Math.random() * 50,
          lastInspection: new Date(),
          nextInspection: new Date(Date.now() + 180 * 24 * 3600000)
        },
        flowRate: 50 + Math.random() * 100,
        pressure: 3 + Math.random() * 2
      })),
      pumps: [],
      valves: [],
      totalLength: 500,
      pressure: 4
    },
    sensors: [],
    reservoirs: [],
    treatmentPlants: []
  };
}

function createEmergencySystem(): EmergencyResponseSystem {
  return {
    systemId: 'emergency-001',
    emergencies: [],
    responders: Array.from({ length: 100 }, (_, i) => ({
      responderId: `resp-${i}`,
      name: `Responder ${i + 1}`,
      type: ['firefighter', 'paramedic', 'police_officer'][Math.floor(Math.random() * 3)] as any,
      currentLocation: { latitude: 40.7128, longitude: -74.0060 },
      status: 'available' as any,
      skills: [],
      equipment: []
    })),
    facilities: [],
    dispatchCenter: {
      centerId: 'dispatch-001',
      location: { latitude: 40.7128, longitude: -74.0060 },
      operators: 10,
      activeIncidents: 0,
      averageResponseTime: 8,
      performance: {} as any
    }
  };
}

function createCitizenServicesSystem(): CitizenServicesSystem {
  return {
    systemId: 'citizen-001',
    serviceRequests: [],
    publicTransport: {
      systemId: 'transit-001',
      routes: Array.from({ length: 20 }, (_, i) => ({
        routeId: `route-${i}`,
        name: `Route ${i + 1}`,
        type: ['bus', 'tram', 'metro'][Math.floor(Math.random() * 3)] as any,
        stops: [],
        schedule: {} as any,
        frequency: 15,
        capacity: 100,
        currentLoad: 0
      })),
      vehicles: [],
      stops: [],
      realtime: true
    },
    parking: {
      systemId: 'parking-001',
      lots: Array.from({ length: 30 }, (_, i) => ({
        lotId: `lot-${i}`,
        name: `Lot ${i + 1}`,
        location: { latitude: 40.7128 + (Math.random() - 0.5) * 0.1, longitude: -74.0060 + (Math.random() - 0.5) * 0.1 },
        totalSpaces: 50 + Math.floor(Math.random() * 150),
        availableSpaces: Math.floor(Math.random() * 100),
        type: 'surface' as any,
        rates: [],
        evCharging: 5,
        accessibility: 3
      })),
      meters: [],
      regulations: []
    },
    feedback: []
  };
}

// Run the demo
main().catch(console.error);
