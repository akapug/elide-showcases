/**
 * Smart City Platform - Citizen Services System
 *
 * Citizen engagement, service requests, and public transit using TypeScript + Python.
 * Multi-channel communication, sentiment analysis, and service optimization.
 */

// @ts-ignore
import pandas from 'python:pandas';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import sklearn from 'python:sklearn';

import type {
  CitizenServicesSystem,
  ServiceRequest,
  PublicTransportSystem,
  ParkingSystem,
  CitizenFeedback,
  ServiceRequestType,
  RequestPriority,
  RequestStatus,
  TransitRoute,
  TransitVehicle,
  TransitStop,
  ParkingLot,
  FeedbackCategory,
  Sentiment,
  GeoCoordinates
} from '../types.ts';

/**
 * Citizen Services and Engagement Platform
 */
export class CitizenServicesManager {
  private system: CitizenServicesSystem;
  private requestHistory: ServiceRequest[] = [];
  private feedbackHistory: CitizenFeedback[] = [];
  private satisfactionScores: SatisfactionRecord[] = [];

  constructor(system: CitizenServicesSystem) {
    this.system = system;
  }

  /**
   * Submit new service request
   */
  async submitServiceRequest(
    citizenId: string,
    type: ServiceRequestType,
    category: string,
    description: string,
    location: GeoCoordinates,
    attachments: string[] = []
  ): Promise<ServiceRequest> {
    const request: ServiceRequest = {
      requestId: `req-${Date.now()}`,
      citizenId,
      type,
      category,
      description,
      location,
      attachments,
      priority: await this.assessPriority(type, description),
      status: 'submitted',
      submittedTime: new Date()
    };

    // Auto-assign based on type and location
    const assignment = await this.autoAssignRequest(request);
    if (assignment) {
      request.assignedTo = assignment.assignee;
      request.estimatedCompletion = assignment.estimatedCompletion;
      request.status = 'assigned';
    }

    this.system.serviceRequests.push(request);
    this.requestHistory.push(request);

    console.log(`Service request ${request.requestId} submitted and assigned to ${request.assignedTo}`);

    return request;
  }

  /**
   * Assess request priority using ML
   */
  private async assessPriority(type: ServiceRequestType, description: string): Promise<RequestPriority> {
    const urgentKeywords = ['emergency', 'urgent', 'dangerous', 'broken', 'leak', 'fire'];
    const highKeywords = ['safety', 'repair', 'damaged', 'problem'];

    const lowerDesc = description.toLowerCase();

    if (urgentKeywords.some(kw => lowerDesc.includes(kw))) {
      return 'urgent';
    }

    if (type === 'safety' || type === 'utilities') {
      return 'high';
    }

    if (highKeywords.some(kw => lowerDesc.includes(kw))) {
      return 'high';
    }

    if (type === 'infrastructure') {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Auto-assign request to appropriate department/personnel
   */
  private async autoAssignRequest(request: ServiceRequest): Promise<Assignment | null> {
    // Simplified assignment logic
    const departmentMap: Record<ServiceRequestType, string> = {
      'infrastructure': 'Public Works',
      'utilities': 'Utilities Department',
      'sanitation': 'Sanitation Department',
      'safety': 'Public Safety',
      'environment': 'Environmental Services',
      'transport': 'Transportation Department',
      'permits': 'Permits Office',
      'other': 'General Services'
    };

    const department = departmentMap[request.type];

    // Estimate completion time based on priority and type
    const completionHours =
      request.priority === 'urgent' ? 4 :
        request.priority === 'high' ? 24 :
          request.priority === 'medium' ? 72 :
            168; // 1 week

    return {
      assignee: department,
      estimatedCompletion: new Date(Date.now() + completionHours * 3600000)
    };
  }

  /**
   * Update service request status
   */
  async updateRequestStatus(
    requestId: string,
    status: RequestStatus,
    notes?: string
  ): Promise<void> {
    const request = this.system.serviceRequests.find(r => r.requestId === requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    request.status = status;

    if (status === 'completed') {
      request.actualCompletion = new Date();

      // Request satisfaction feedback
      await this.requestSatisfactionFeedback(request);
    }

    console.log(`Request ${requestId} status updated to ${status}`);
  }

  /**
   * Request satisfaction feedback
   */
  private async requestSatisfactionFeedback(request: ServiceRequest): Promise<void> {
    // In production, would send notification to citizen
    console.log(`Satisfaction survey sent for request ${request.requestId}`);
  }

  /**
   * Record satisfaction rating
   */
  async recordSatisfaction(requestId: string, rating: number, comments?: string): Promise<void> {
    const request = this.system.serviceRequests.find(r => r.requestId === requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    request.satisfaction = rating;

    this.satisfactionScores.push({
      requestId,
      type: request.type,
      rating,
      responseTime: request.actualCompletion ?
        (request.actualCompletion.getTime() - request.submittedTime.getTime()) / 3600000 : 0,
      timestamp: new Date()
    });

    console.log(`Satisfaction rating ${rating}/5 recorded for request ${requestId}`);
  }

  /**
   * Submit citizen feedback
   */
  async submitFeedback(
    citizenId: string,
    category: FeedbackCategory,
    content: string,
    location?: GeoCoordinates
  ): Promise<CitizenFeedback> {
    const feedback: CitizenFeedback = {
      feedbackId: `fb-${Date.now()}`,
      citizenId,
      category,
      sentiment: await this.analyzeSentiment(content),
      content,
      location,
      timestamp: new Date(),
      resolved: false
    };

    this.system.feedback.push(feedback);
    this.feedbackHistory.push(feedback);

    console.log(`Feedback ${feedback.feedbackId} submitted with ${feedback.sentiment} sentiment`);

    return feedback;
  }

  /**
   * Analyze sentiment using NLP
   */
  private async analyzeSentiment(text: string): Promise<Sentiment> {
    // Simplified sentiment analysis
    // In production, would use sklearn's sentiment classifier or transformer model

    const positiveWords = ['good', 'great', 'excellent', 'wonderful', 'happy', 'love', 'amazing'];
    const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'hate', 'worst', 'horrible'];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;

    if (positiveCount > negativeCount + 1) return 'very_positive';
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount + 1) return 'very_negative';
    if (negativeCount > positiveCount) return 'negative';

    return 'neutral';
  }

  /**
   * Analyze feedback trends
   */
  async analyzeFeedbackTrends(): Promise<FeedbackAnalysis> {
    if (this.feedbackHistory.length === 0) {
      return this.createEmptyFeedbackAnalysis();
    }

    const byCategory = new Map<FeedbackCategory, number>();
    const bySentiment = new Map<Sentiment, number>();

    for (const feedback of this.feedbackHistory) {
      byCategory.set(feedback.category, (byCategory.get(feedback.category) || 0) + 1);
      bySentiment.set(feedback.sentiment, (bySentiment.get(feedback.sentiment) || 0) + 1);
    }

    const total = this.feedbackHistory.length;
    const positive = (bySentiment.get('positive') || 0) + (bySentiment.get('very_positive') || 0);
    const negative = (bySentiment.get('negative') || 0) + (bySentiment.get('very_negative') || 0);

    const sentimentScore = ((positive - negative) / total) * 100;

    // Identify top issues
    const topIssues = await this.identifyTopIssues();

    return {
      totalFeedback: total,
      byCategory: Object.fromEntries(byCategory),
      bySentiment: Object.fromEntries(bySentiment),
      sentimentScore,
      topIssues,
      recommendations: this.generateFeedbackRecommendations(topIssues, sentimentScore)
    };
  }

  /**
   * Create empty feedback analysis
   */
  private createEmptyFeedbackAnalysis(): FeedbackAnalysis {
    return {
      totalFeedback: 0,
      byCategory: {},
      bySentiment: {},
      sentimentScore: 0,
      topIssues: [],
      recommendations: ['Insufficient feedback data']
    };
  }

  /**
   * Identify top issues from feedback
   */
  private async identifyTopIssues(): Promise<string[]> {
    // Use simple keyword extraction
    const keywords = new Map<string, number>();
    const commonWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but']);

    for (const feedback of this.feedbackHistory) {
      const words = feedback.content.toLowerCase().split(/\W+/);
      for (const word of words) {
        if (word.length > 4 && !commonWords.has(word)) {
          keywords.set(word, (keywords.get(word) || 0) + 1);
        }
      }
    }

    return Array.from(keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Generate feedback recommendations
   */
  private generateFeedbackRecommendations(topIssues: string[], sentimentScore: number): string[] {
    const recommendations: string[] = [];

    if (sentimentScore < -20) {
      recommendations.push('ALERT: Overall sentiment is very negative - immediate action required');
    } else if (sentimentScore < 0) {
      recommendations.push('Negative sentiment detected - review and address citizen concerns');
    } else if (sentimentScore > 50) {
      recommendations.push('Positive sentiment - maintain current service levels');
    }

    if (topIssues.length > 0) {
      recommendations.push(`Top concerns: ${topIssues.join(', ')}`);
    }

    return recommendations;
  }

  /**
   * Get real-time public transit information
   */
  async getTransitInfo(routeId?: string): Promise<TransitInfo> {
    const routes = routeId ?
      this.system.publicTransport.routes.filter(r => r.routeId === routeId) :
      this.system.publicTransport.routes;

    const routeInfo: RouteInfo[] = [];

    for (const route of routes) {
      const vehicles = this.system.publicTransport.vehicles.filter(v => v.routeId === route.routeId);
      const avgDelay = vehicles.length > 0 ?
        vehicles.reduce((sum, v) => sum + v.delay, 0) / vehicles.length : 0;

      const avgOccupancy = vehicles.length > 0 ?
        vehicles.reduce((sum, v) => sum + v.currentOccupancy / v.capacity, 0) / vehicles.length * 100 : 0;

      routeInfo.push({
        routeId: route.routeId,
        name: route.name,
        type: route.type,
        activeVehicles: vehicles.length,
        avgDelay,
        avgOccupancy,
        status: avgDelay > 10 ? 'delayed' : 'on_time'
      });
    }

    return {
      timestamp: new Date(),
      routes: routeInfo,
      totalVehicles: this.system.publicTransport.vehicles.length,
      avgSystemDelay: routeInfo.reduce((sum, r) => sum + r.avgDelay, 0) / routeInfo.length
    };
  }

  /**
   * Find nearest transit stops
   */
  async findNearestStops(location: GeoCoordinates, maxDistance: number = 0.5): Promise<NearbyStop[]> {
    const nearbyStops: NearbyStop[] = [];

    for (const stop of this.system.publicTransport.stops) {
      const distance = this.calculateDistance(location, stop.location);

      if (distance <= maxDistance) {
        // Get next arrivals
        const nextArrivals = await this.getNextArrivals(stop.stopId);

        nearbyStops.push({
          stop,
          distance,
          nextArrivals
        });
      }
    }

    return nearbyStops.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Calculate distance between points
   */
  private calculateDistance(p1: GeoCoordinates, p2: GeoCoordinates): number {
    const R = 6371;
    const dLat = (p2.latitude - p1.latitude) * Math.PI / 180;
    const dLon = (p2.longitude - p1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(p1.latitude * Math.PI / 180) * Math.cos(p2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Get next vehicle arrivals at stop
   */
  private async getNextArrivals(stopId: string): Promise<Arrival[]> {
    const arrivals: Arrival[] = [];
    const vehicles = this.system.publicTransport.vehicles.filter(v => v.nextStop === stopId);

    for (const vehicle of vehicles) {
      const route = this.system.publicTransport.routes.find(r => r.routeId === vehicle.routeId);
      if (!route) continue;

      // Estimate arrival time based on vehicle location and speed
      const estimatedMinutes = 5 + vehicle.delay; // Simplified

      arrivals.push({
        routeId: vehicle.routeId,
        routeName: route.name,
        vehicleId: vehicle.vehicleId,
        estimatedArrival: new Date(Date.now() + estimatedMinutes * 60000),
        delay: vehicle.delay,
        occupancy: (vehicle.currentOccupancy / vehicle.capacity) * 100
      });
    }

    return arrivals.sort((a, b) =>
      a.estimatedArrival.getTime() - b.estimatedArrival.getTime()
    );
  }

  /**
   * Find available parking
   */
  async findParking(location: GeoCoordinates, radius: number = 1.0): Promise<ParkingAvailability[]> {
    const availability: ParkingAvailability[] = [];

    for (const lot of this.system.parking.lots) {
      const distance = this.calculateDistance(location, lot.location);

      if (distance <= radius) {
        const occupancyRate = ((lot.totalSpaces - lot.availableSpaces) / lot.totalSpaces) * 100;

        availability.push({
          lot,
          distance,
          availableSpaces: lot.availableSpaces,
          occupancyRate,
          estimatedCost: this.estimateParkingCost(lot, 2) // 2-hour estimate
        });
      }
    }

    return availability.sort((a, b) => {
      // Sort by availability and distance
      if (a.availableSpaces === 0 && b.availableSpaces > 0) return 1;
      if (b.availableSpaces === 0 && a.availableSpaces > 0) return -1;
      return a.distance - b.distance;
    });
  }

  /**
   * Estimate parking cost
   */
  private estimateParkingCost(lot: ParkingLot, hours: number): number {
    if (lot.rates.length === 0) return 0;

    const rate = lot.rates[0];
    return rate.rate * hours;
  }

  /**
   * Calculate service request metrics
   */
  calculateServiceMetrics(): ServiceMetrics {
    if (this.requestHistory.length === 0) {
      return {
        totalRequests: 0,
        completedRequests: 0,
        avgResponseTime: 0,
        avgSatisfaction: 0,
        completionRate: 0
      };
    }

    const completed = this.requestHistory.filter(r => r.status === 'completed');
    const responseTimes = completed
      .filter(r => r.actualCompletion)
      .map(r => (r.actualCompletion!.getTime() - r.submittedTime.getTime()) / 3600000);

    const avgResponseTime = responseTimes.length > 0 ?
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

    const satisfactionRatings = this.satisfactionScores.map(s => s.rating);
    const avgSatisfaction = satisfactionRatings.length > 0 ?
      satisfactionRatings.reduce((a, b) => a + b, 0) / satisfactionRatings.length : 0;

    return {
      totalRequests: this.requestHistory.length,
      completedRequests: completed.length,
      avgResponseTime,
      avgSatisfaction,
      completionRate: (completed.length / this.requestHistory.length) * 100
    };
  }

  /**
   * Generate citizen services report
   */
  generateReport(): CitizenServicesReport {
    const serviceMetrics = this.calculateServiceMetrics();
    const feedbackAnalysis = this.analyzeFeedbackTrends();
    const transitInfo = this.getTransitInfo();

    const pendingRequests = this.system.serviceRequests.filter(r =>
      r.status !== 'completed' && r.status !== 'rejected' && r.status !== 'cancelled'
    );

    const byPriority = {
      urgent: pendingRequests.filter(r => r.priority === 'urgent').length,
      high: pendingRequests.filter(r => r.priority === 'high').length,
      medium: pendingRequests.filter(r => r.priority === 'medium').length,
      low: pendingRequests.filter(r => r.priority === 'low').length
    };

    return {
      timestamp: new Date(),
      serviceRequests: {
        total: this.system.serviceRequests.length,
        pending: pendingRequests.length,
        byPriority,
        metrics: serviceMetrics
      },
      feedback: feedbackAnalysis,
      publicTransport: {
        totalRoutes: this.system.publicTransport.routes.length,
        totalVehicles: this.system.publicTransport.vehicles.length,
        totalStops: this.system.publicTransport.stops.length
      },
      parking: {
        totalLots: this.system.parking.lots.length,
        totalSpaces: this.system.parking.lots.reduce((sum, l) => sum + l.totalSpaces, 0),
        availableSpaces: this.system.parking.lots.reduce((sum, l) => sum + l.availableSpaces, 0)
      },
      recommendations: this.generateSystemRecommendations(serviceMetrics, feedbackAnalysis)
    };
  }

  /**
   * Generate system recommendations
   */
  private generateSystemRecommendations(
    serviceMetrics: ServiceMetrics,
    feedbackAnalysis: FeedbackAnalysis | Promise<FeedbackAnalysis>
  ): string[] {
    const recommendations: string[] = [];

    if (serviceMetrics.avgResponseTime > 48) {
      recommendations.push('Average response time exceeds 48 hours - allocate more resources');
    }

    if (serviceMetrics.avgSatisfaction < 3.5) {
      recommendations.push('Satisfaction score below 3.5/5 - review service quality');
    }

    if (serviceMetrics.completionRate < 70) {
      recommendations.push('Completion rate below 70% - improve workflow efficiency');
    }

    return recommendations;
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface Assignment {
  assignee: string;
  estimatedCompletion: Date;
}

interface SatisfactionRecord {
  requestId: string;
  type: ServiceRequestType;
  rating: number;
  responseTime: number;
  timestamp: Date;
}

interface FeedbackAnalysis {
  totalFeedback: number;
  byCategory: Record<string, number>;
  bySentiment: Record<string, number>;
  sentimentScore: number;
  topIssues: string[];
  recommendations: string[];
}

interface RouteInfo {
  routeId: string;
  name: string;
  type: string;
  activeVehicles: number;
  avgDelay: number;
  avgOccupancy: number;
  status: 'on_time' | 'delayed' | 'disrupted';
}

interface TransitInfo {
  timestamp: Date;
  routes: RouteInfo[];
  totalVehicles: number;
  avgSystemDelay: number;
}

interface Arrival {
  routeId: string;
  routeName: string;
  vehicleId: string;
  estimatedArrival: Date;
  delay: number;
  occupancy: number;
}

interface NearbyStop {
  stop: TransitStop;
  distance: number;
  nextArrivals: Arrival[];
}

interface ParkingAvailability {
  lot: ParkingLot;
  distance: number;
  availableSpaces: number;
  occupancyRate: number;
  estimatedCost: number;
}

interface ServiceMetrics {
  totalRequests: number;
  completedRequests: number;
  avgResponseTime: number;
  avgSatisfaction: number;
  completionRate: number;
}

interface CitizenServicesReport {
  timestamp: Date;
  serviceRequests: {
    total: number;
    pending: number;
    byPriority: Record<string, number>;
    metrics: ServiceMetrics;
  };
  feedback: FeedbackAnalysis | Promise<FeedbackAnalysis>;
  publicTransport: {
    totalRoutes: number;
    totalVehicles: number;
    totalStops: number;
  };
  parking: {
    totalLots: number;
    totalSpaces: number;
    availableSpaces: number;
  };
  recommendations: string[];
}
