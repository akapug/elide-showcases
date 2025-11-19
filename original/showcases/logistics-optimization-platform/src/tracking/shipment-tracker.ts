/**
 * Shipment Tracker
 *
 * Real-time shipment tracking and monitoring system.
 * Handles GPS tracking, ETA predictions, geofencing,
 * and delivery notifications.
 */

// @ts-ignore - Elide Python interop
import sklearn from 'python:sklearn';
// @ts-ignore
import numpy from 'python:numpy';

import {
  Route,
  RouteStop,
  GeoLocation,
  TrackingEvent,
  TrackingEventType,
  VehicleTelemetry,
  ETAPrediction,
  TrafficData,
} from '../types';

/**
 * Event emitter for tracking events
 */
class EventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit(event: string, data: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((cb) => cb(data));
  }
}

/**
 * Geofence definition
 */
interface Geofence {
  id: string;
  location: GeoLocation;
  radiusMeters: number;
  type: 'stop' | 'depot' | 'zone';
}

/**
 * Shipment Tracker class
 */
export class ShipmentTracker extends EventEmitter {
  private activeTracking: Map<string, NodeJS.Timer> = new Map();
  private vehicleLocations: Map<string, GeoLocation> = new Map();
  private geofences: Map<string, Geofence> = new Map();
  private etaModel: any = null;
  private readonly EARTH_RADIUS_KM = 6371;

  /**
   * Start tracking a vehicle
   */
  startTracking(params: {
    vehicleId: string;
    routeId: string;
    updateIntervalSeconds?: number;
  }): void {
    const { vehicleId, routeId, updateIntervalSeconds = 30 } = params;

    console.log(`Starting tracking for vehicle ${vehicleId} on route ${routeId}`);

    // Stop existing tracking if any
    this.stopTracking(vehicleId);

    // Set up tracking interval
    const interval = setInterval(() => {
      this.trackVehicle(vehicleId, routeId);
    }, updateIntervalSeconds * 1000);

    this.activeTracking.set(vehicleId, interval);
  }

  /**
   * Stop tracking a vehicle
   */
  stopTracking(vehicleId: string): void {
    const interval = this.activeTracking.get(vehicleId);
    if (interval) {
      clearInterval(interval);
      this.activeTracking.delete(vehicleId);
      console.log(`Stopped tracking vehicle ${vehicleId}`);
    }
  }

  /**
   * Track vehicle location (simulated GPS update)
   */
  private async trackVehicle(vehicleId: string, routeId: string): Promise<void> {
    // Would fetch actual GPS data from vehicle
    // Simulated here
    const location = await this.getVehicleGPSLocation(vehicleId);

    this.vehicleLocations.set(vehicleId, location);

    // Emit location update event
    this.emit('location_update', {
      vehicleId,
      routeId,
      location,
      speed: 45 + Math.random() * 20, // km/h
      heading: Math.random() * 360,
      timestamp: new Date(),
    });

    // Check geofences
    await this.checkGeofences(vehicleId, routeId, location);

    // Check for delays
    await this.checkForDelays(vehicleId, routeId);
  }

  /**
   * Update ETAs for all remaining stops
   */
  async updateETAs(params: {
    routeId: string;
    currentLocation: GeoLocation;
    currentTime: Date;
    trafficConditions?: TrafficData;
  }): Promise<ETAPrediction[]> {
    console.log(`Updating ETAs for route ${params.routeId}`);

    const { routeId, currentLocation, currentTime, trafficConditions } = params;

    // Get route details
    const route = await this.getRouteById(routeId);
    if (!route) return [];

    // Get remaining stops
    const remainingStops = route.stops.filter(
      (stop) => stop.status === 'pending' || stop.status === 'approaching'
    );

    const predictions: ETAPrediction[] = [];
    let cumulativeTime = 0;

    for (const stop of remainingStops) {
      // Calculate distance and base time
      const distance = this.haversineDistance(currentLocation, stop.location);
      const baseTime = (distance / 40) * 60; // 40 km/h base speed

      // Apply traffic factor
      const trafficDelay = trafficConditions ? baseTime * 0.2 : 0;

      // Apply weather factor
      const weatherDelay = 0;

      // Driver experience adjustment
      const driverAdjustment = -baseTime * 0.05; // 5% faster for experienced

      // Historical accuracy
      const historicalAccuracy = 0.92;

      cumulativeTime += baseTime + trafficDelay + weatherDelay + driverAdjustment + stop.serviceTimeMinutes;

      const predictedTime = new Date(currentTime.getTime() + cumulativeTime * 60000);

      // Calculate confidence interval
      const variance = cumulativeTime * 0.15; // 15% variance
      const lower = new Date(predictedTime.getTime() - variance * 60000);
      const upper = new Date(predictedTime.getTime() + variance * 60000);

      predictions.push({
        stopId: stop.id,
        orderId: stop.orderId,
        predictedArrivalTime: predictedTime,
        confidenceInterval: {
          lower,
          upper,
          confidenceLevel: 0.9,
        },
        factors: {
          baselineMinutes: baseTime,
          trafficDelayMinutes: trafficDelay,
          weatherDelayMinutes: weatherDelay,
          driverExperienceAdjustment: driverAdjustment,
          historicalAccuracy,
        },
      });
    }

    return predictions;
  }

  /**
   * Train ETA prediction model
   */
  async trainETAModel(params: {
    historicalDeliveries: any[];
    features: string[];
  }): Promise<{
    accuracy: number;
    rmse: number;
  }> {
    console.log('Training ETA prediction model...');

    const { historicalDeliveries, features } = params;

    // Would use sklearn to train actual model
    // Simulated here
    this.etaModel = {
      trained: true,
      features,
      accuracy: 0.88,
      rmse: 12.5, // minutes
    };

    console.log(`ETA model trained: ${this.etaModel.accuracy * 100}% accuracy`);

    return {
      accuracy: this.etaModel.accuracy,
      rmse: this.etaModel.rmse,
    };
  }

  /**
   * Predict ETA using ML model
   */
  async predictETA(params: {
    route: Route;
    currentLocation: GeoLocation;
    contextualFactors: {
      traffic?: TrafficData;
      weather?: any;
      driver?: any;
    };
  }): Promise<ETAPrediction> {
    const { route, currentLocation, contextualFactors } = params;

    // Use model to predict if trained
    if (this.etaModel) {
      // Would use actual model prediction
      // Simulated here
    }

    // Fallback to rule-based prediction
    const nextStop = route.stops.find((s) => s.status === 'pending');

    if (!nextStop) {
      throw new Error('No pending stops in route');
    }

    const distance = this.haversineDistance(currentLocation, nextStop.location);
    const baseTime = (distance / 40) * 60; // minutes

    const predictedTime = new Date(Date.now() + baseTime * 60000);
    const variance = baseTime * 0.2;

    return {
      stopId: nextStop.id,
      orderId: nextStop.orderId,
      predictedArrivalTime: predictedTime,
      confidenceInterval: {
        lower: new Date(predictedTime.getTime() - variance * 60000),
        upper: new Date(predictedTime.getTime() + variance * 60000),
        confidenceLevel: 0.8,
      },
      factors: {
        baselineMinutes: baseTime,
        trafficDelayMinutes: 0,
        weatherDelayMinutes: 0,
        driverExperienceAdjustment: 0,
        historicalAccuracy: 0.85,
      },
    };
  }

  /**
   * Log tracking event
   */
  async logEvent(event: Omit<TrackingEvent, 'id'>): Promise<TrackingEvent> {
    const fullEvent: TrackingEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...event,
    };

    // Would persist to database
    console.log(`Event logged: ${fullEvent.eventType} for vehicle ${fullEvent.vehicleId}`);

    return fullEvent;
  }

  /**
   * Get vehicle location history
   */
  async getLocationHistory(params: {
    vehicleId: string;
    startTime: Date;
    endTime: Date;
  }): Promise<GeoLocation[]> {
    // Would fetch from database
    return [];
  }

  /**
   * Set up geofence for a stop
   */
  setupGeofence(params: {
    stopId: string;
    location: GeoLocation;
    radiusMeters?: number;
  }): void {
    const { stopId, location, radiusMeters = 100 } = params;

    this.geofences.set(stopId, {
      id: stopId,
      location,
      radiusMeters,
      type: 'stop',
    });

    console.log(`Geofence set up for stop ${stopId}`);
  }

  /**
   * Check if vehicle is in any geofences
   */
  private async checkGeofences(
    vehicleId: string,
    routeId: string,
    location: GeoLocation
  ): Promise<void> {
    for (const [stopId, geofence] of this.geofences.entries()) {
      const distance = this.haversineDistance(location, geofence.location) * 1000; // convert to meters

      if (distance <= geofence.radiusMeters) {
        // Inside geofence - emit enter event
        this.emit('geofence_enter', {
          vehicleId,
          routeId,
          stopId,
          location,
          timestamp: new Date(),
        });
      } else if (distance <= geofence.radiusMeters * 2) {
        // Approaching geofence
        this.emit('geofence_approaching', {
          vehicleId,
          routeId,
          stopId,
          location,
          distanceMeters: distance,
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * Check for route delays
   */
  private async checkForDelays(vehicleId: string, routeId: string): Promise<void> {
    const route = await this.getRouteById(routeId);
    if (!route) return;

    const currentTime = new Date();
    const currentStop = route.stops[route.currentStopIndex || 0];

    if (currentStop && currentStop.plannedArrivalTime) {
      const delayMinutes =
        (currentTime.getTime() - currentStop.plannedArrivalTime.getTime()) / 60000;

      if (delayMinutes > 15) {
        // Significant delay detected
        this.emit('delay_detected', {
          vehicleId,
          routeId,
          delayMinutes: Math.round(delayMinutes),
          reason: 'Traffic or other delays',
          timestamp: currentTime,
        });
      }
    }
  }

  /**
   * Calculate haversine distance
   */
  private haversineDistance(loc1: GeoLocation, loc2: GeoLocation): number {
    const lat1 = (loc1.lat * Math.PI) / 180;
    const lat2 = (loc2.lat * Math.PI) / 180;
    const deltaLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const deltaLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return this.EARTH_RADIUS_KM * c;
  }

  /**
   * Get vehicle GPS location (simulated)
   */
  private async getVehicleGPSLocation(vehicleId: string): Promise<GeoLocation> {
    // Would fetch actual GPS data
    // Simulated random movement
    const lastLocation = this.vehicleLocations.get(vehicleId) || {
      lat: 37.7749,
      lng: -122.4194,
    };

    return {
      lat: lastLocation.lat + (Math.random() - 0.5) * 0.01,
      lng: lastLocation.lng + (Math.random() - 0.5) * 0.01,
    };
  }

  /**
   * Get route by ID (would fetch from database)
   */
  private async getRouteById(routeId: string): Promise<Route | null> {
    // Would fetch from database
    return null;
  }

  /**
   * Get active tracking count
   */
  getActiveTrackingCount(): number {
    return this.activeTracking.size;
  }

  /**
   * Stop all tracking
   */
  stopAllTracking(): void {
    this.activeTracking.forEach((_, vehicleId) => {
      this.stopTracking(vehicleId);
    });
  }
}

export default ShipmentTracker;
