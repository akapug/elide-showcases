/**
 * Network Traffic Analyzer
 *
 * Comprehensive network traffic analysis using Pandas and NumPy:
 * - Traffic statistics and metrics
 * - Flow analysis
 * - Bandwidth monitoring
 * - Protocol distribution
 * - Geolocation analysis
 * - Anomaly detection
 */

// @ts-ignore
import pandas from 'python:pandas';
// @ts-ignore
import numpy from 'python:numpy';

import type {
  NetworkPacket,
  NetworkFlow,
  TrafficStatistics,
  BandwidthStats,
  GeolocationAnalysis,
  TopTalker,
  PortStatistic,
} from '../types';

export class TrafficAnalyzer {
  private pandas: any;
  private numpy: any;

  constructor() {
    this.pandas = pandas;
    this.numpy = numpy;
  }

  /**
   * Analyze network traffic patterns
   */
  async analyzeTraffic(packets: NetworkPacket[]): Promise<TrafficStatistics> {
    if (packets.length === 0) {
      throw new Error('No packets to analyze');
    }

    const startTime = packets[0].timestamp;
    const endTime = packets[packets.length - 1].timestamp;
    const duration = endTime - startTime || 1;

    const stats: TrafficStatistics = {
      totalPackets: packets.length,
      totalBytes: 0,
      duration,
      averageRate: 0,
      peakRate: 0,
      protocols: {},
      topTalkers: [],
      topPorts: [],
      bandwidth: {
        current: 0,
        average: 0,
        peak: 0,
        timeline: [],
        topConsumers: [],
        applications: [],
      },
    };

    // Calculate total bytes
    for (const packet of packets) {
      stats.totalBytes += packet.length;

      // Count protocols
      stats.protocols[packet.protocol] = (stats.protocols[packet.protocol] || 0) + 1;
    }

    // Calculate rates
    stats.averageRate = stats.totalPackets / duration;
    stats.peakRate = await this.calculatePeakRate(packets);

    // Identify top talkers
    stats.topTalkers = await this.identifyTopTalkers(packets);

    // Identify top ports
    stats.topPorts = await this.identifyTopPorts(packets);

    // Calculate bandwidth metrics
    stats.bandwidth = await this.analyzeBandwidth(packets, { interval: 1, unit: 'mbps' });

    return stats;
  }

  /**
   * Extract network flows
   */
  async extractFlows(
    packets: NetworkPacket[],
    options: {
      timeout?: number;
      bidirectional?: boolean;
    } = {}
  ): Promise<NetworkFlow[]> {
    const timeout = options.timeout ?? 60;
    const bidirectional = options.bidirectional ?? true;
    const flows = new Map<string, NetworkFlow>();

    for (const packet of packets) {
      if (!packet.srcIP || !packet.dstIP) continue;

      const flowKey = bidirectional
        ? this.getFlowId(packet.srcIP, packet.dstIP, packet.srcPort, packet.dstPort)
        : `${packet.srcIP}:${packet.srcPort || 0}-${packet.dstIP}:${packet.dstPort || 0}`;

      if (!flows.has(flowKey)) {
        flows.set(flowKey, {
          flowId: flowKey,
          srcIP: packet.srcIP,
          dstIP: packet.dstIP,
          srcPort: packet.srcPort || 0,
          dstPort: packet.dstPort || 0,
          protocol: packet.protocol,
          startTime: packet.timestamp,
          endTime: packet.timestamp,
          duration: 0,
          packetCount: 0,
          byteCount: 0,
          forwardPackets: 0,
          backwardPackets: 0,
          forwardBytes: 0,
          backwardBytes: 0,
          flags: [],
          state: 'active',
        });
      }

      const flow = flows.get(flowKey)!;
      flow.endTime = packet.timestamp;
      flow.duration = flow.endTime - flow.startTime;
      flow.packetCount++;
      flow.byteCount += packet.length;

      // Determine direction
      if (packet.srcIP === flow.srcIP) {
        flow.forwardPackets++;
        flow.forwardBytes += packet.length;
      } else {
        flow.backwardPackets++;
        flow.backwardBytes += packet.length;
      }

      // Collect flags
      if (packet.flags) {
        for (const flag of packet.flags) {
          if (!flow.flags.includes(flag)) {
            flow.flags.push(flag);
          }
        }
      }

      // Update state
      if (flow.duration > timeout) {
        flow.state = 'timeout';
      } else if (packet.flags?.includes('FIN') || packet.flags?.includes('RST')) {
        flow.state = 'completed';
      }
    }

    return Array.from(flows.values());
  }

  /**
   * Analyze bandwidth usage
   */
  async analyzeBandwidth(
    packets: NetworkPacket[],
    options: {
      interval?: number;
      unit?: 'bps' | 'kbps' | 'mbps' | 'gbps';
    } = {}
  ): Promise<BandwidthStats> {
    const interval = options.interval ?? 1;
    const unit = options.unit ?? 'mbps';

    const timeline: any[] = [];
    const consumerMap = new Map<string, number>();
    const applicationMap = new Map<number, { name: string; bytes: number }>();

    // Group packets by time intervals
    const intervals = this.groupByTimeInterval(packets, interval);

    let totalBytes = 0;
    let peakRate = 0;

    for (const [time, intervalPackets] of intervals) {
      const bytes = intervalPackets.reduce((sum, p) => sum + p.length, 0);
      const rate = this.convertBandwidth(bytes / interval, unit);

      timeline.push({
        timestamp: time,
        rate,
        unit,
      });

      totalBytes += bytes;
      if (rate > peakRate) peakRate = rate;

      // Track per-IP bandwidth
      for (const packet of intervalPackets) {
        if (packet.srcIP) {
          consumerMap.set(packet.srcIP, (consumerMap.get(packet.srcIP) || 0) + packet.length);
        }

        // Track per-application bandwidth
        if (packet.dstPort) {
          const app = applicationMap.get(packet.dstPort) || {
            name: this.getServiceName(packet.dstPort),
            bytes: 0,
          };
          app.bytes += packet.length;
          applicationMap.set(packet.dstPort, app);
        }
      }
    }

    const duration = packets[packets.length - 1].timestamp - packets[0].timestamp || 1;
    const averageRate = this.convertBandwidth(totalBytes / duration, unit);

    // Get top consumers
    const topConsumers = Array.from(consumerMap.entries())
      .map(([ip, bytes]) => ({
        ip,
        bandwidth: this.convertBandwidth(bytes / duration, unit),
        percentage: (bytes / totalBytes) * 100,
      }))
      .sort((a, b) => b.bandwidth - a.bandwidth)
      .slice(0, 10);

    // Get top applications
    const applications = Array.from(applicationMap.values())
      .map((app) => ({
        name: app.name,
        port: 0,
        protocol: 'TCP',
        bandwidth: this.convertBandwidth(app.bytes / duration, unit),
      }))
      .sort((a, b) => b.bandwidth - a.bandwidth)
      .slice(0, 10);

    return {
      current: timeline[timeline.length - 1]?.rate || 0,
      average: averageRate,
      peak: peakRate,
      timeline,
      topConsumers,
      applications,
    };
  }

  /**
   * Analyze geographic distribution
   */
  async analyzeGeolocation(packets: NetworkPacket[]): Promise<GeolocationAnalysis> {
    const countryMap = new Map<string, number>();
    const cityMap = new Map<string, { country: string; count: number }>();
    const suspicious: any[] = [];

    for (const packet of packets) {
      if (!packet.dstIP) continue;

      // Simulated geolocation (in real implementation, use MaxMind GeoIP)
      const geo = await this.geolocateIP(packet.dstIP);

      if (geo) {
        countryMap.set(geo.country, (countryMap.get(geo.country) || 0) + 1);

        const cityKey = `${geo.city},${geo.country}`;
        cityMap.set(cityKey, {
          country: geo.country,
          count: (cityMap.get(cityKey)?.count || 0) + 1,
        });

        // Check for suspicious geolocations
        if (this.isSuspiciousLocation(geo)) {
          suspicious.push({
            ip: packet.dstIP,
            country: geo.country,
            city: geo.city,
            reason: 'High-risk country',
            riskScore: 0.8,
          });
        }
      }
    }

    const totalConnections = packets.length;

    const countries = Array.from(countryMap.entries())
      .map(([code, count]) => ({
        code,
        name: this.getCountryName(code),
        connections: count,
        percentage: (count / totalConnections) * 100,
      }))
      .sort((a, b) => b.connections - a.connections);

    const cities = Array.from(cityMap.entries())
      .map(([cityKey, data]) => ({
        city: cityKey.split(',')[0],
        country: data.country,
        connections: data.count,
        coordinates: [0, 0] as [number, number],
      }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 20);

    return {
      countries,
      cities,
      suspicious,
    };
  }

  /**
   * Calculate traffic entropy
   */
  async calculateEntropy(packets: NetworkPacket[]): Promise<number> {
    const portCounts = new Map<number, number>();
    let total = 0;

    for (const packet of packets) {
      if (packet.dstPort) {
        portCounts.set(packet.dstPort, (portCounts.get(packet.dstPort) || 0) + 1);
        total++;
      }
    }

    let entropy = 0;
    for (const count of portCounts.values()) {
      const probability = count / total;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  }

  /**
   * Detect traffic anomalies
   */
  async detectAnomalies(packets: NetworkPacket[]): Promise<any[]> {
    const anomalies: any[] = [];

    // Create time series data using Pandas
    const timestamps = packets.map((p) => p.timestamp);
    const sizes = packets.map((p) => p.length);

    // Convert to Pandas DataFrame
    const df = this.pandas.DataFrame({
      timestamp: timestamps,
      size: sizes,
    });

    // Calculate rolling statistics
    const rolling = df['size'].rolling(100);
    const mean = rolling.mean();
    const std = rolling.std();

    // Detect outliers (packets > 3 standard deviations from mean)
    for (let i = 0; i < packets.length; i++) {
      if (i < 100) continue; // Need enough data for rolling window

      const zscore = Math.abs((sizes[i] - mean.iloc[i]) / std.iloc[i]);
      if (zscore > 3) {
        anomalies.push({
          packet: packets[i],
          reason: 'Unusual packet size',
          zscore,
          timestamp: packets[i].timestamp,
        });
      }
    }

    return anomalies;
  }

  /**
   * Generate traffic report
   */
  async generateReport(packets: NetworkPacket[]): Promise<any> {
    const stats = await this.analyzeTraffic(packets);
    const flows = await this.extractFlows(packets);
    const geo = await this.analyzeGeolocation(packets);
    const entropy = await this.calculateEntropy(packets);

    return {
      summary: {
        totalPackets: stats.totalPackets,
        totalBytes: stats.totalBytes,
        duration: stats.duration,
        averageRate: stats.averageRate,
        peakRate: stats.peakRate,
      },
      protocols: stats.protocols,
      topTalkers: stats.topTalkers,
      topPorts: stats.topPorts,
      bandwidth: stats.bandwidth,
      flows: {
        total: flows.length,
        active: flows.filter((f) => f.state === 'active').length,
        completed: flows.filter((f) => f.state === 'completed').length,
        timedOut: flows.filter((f) => f.state === 'timeout').length,
      },
      geolocation: geo,
      entropy,
      generatedAt: new Date().toISOString(),
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async calculatePeakRate(packets: NetworkPacket[]): Promise<number> {
    const intervals = this.groupByTimeInterval(packets, 1);
    let peak = 0;

    for (const [, intervalPackets] of intervals) {
      const rate = intervalPackets.length;
      if (rate > peak) peak = rate;
    }

    return peak;
  }

  private async identifyTopTalkers(packets: NetworkPacket[]): Promise<TopTalker[]> {
    const talkers = new Map<string, { packets: number; bytes: number }>();

    for (const packet of packets) {
      if (!packet.srcIP) continue;

      const talker = talkers.get(packet.srcIP) || { packets: 0, bytes: 0 };
      talker.packets++;
      talker.bytes += packet.length;
      talkers.set(packet.srcIP, talker);
    }

    const totalPackets = packets.length;

    return Array.from(talkers.entries())
      .map(([ip, stats]) => ({
        ip,
        packets: stats.packets,
        bytes: stats.bytes,
        percentage: (stats.packets / totalPackets) * 100,
      }))
      .sort((a, b) => b.packets - a.packets)
      .slice(0, 10);
  }

  private async identifyTopPorts(packets: NetworkPacket[]): Promise<PortStatistic[]> {
    const ports = new Map<number, number>();

    for (const packet of packets) {
      if (packet.dstPort) {
        ports.set(packet.dstPort, (ports.get(packet.dstPort) || 0) + 1);
      }
    }

    return Array.from(ports.entries())
      .map(([port, count]) => ({
        port,
        protocol: 'TCP',
        packets: count,
        service: this.getServiceName(port),
      }))
      .sort((a, b) => b.packets - a.packets)
      .slice(0, 10);
  }

  private groupByTimeInterval(
    packets: NetworkPacket[],
    intervalSeconds: number
  ): Map<number, NetworkPacket[]> {
    const intervals = new Map<number, NetworkPacket[]>();

    for (const packet of packets) {
      const intervalKey = Math.floor(packet.timestamp / intervalSeconds) * intervalSeconds;
      const intervalPackets = intervals.get(intervalKey) || [];
      intervalPackets.push(packet);
      intervals.set(intervalKey, intervalPackets);
    }

    return intervals;
  }

  private getFlowId(srcIP: string, dstIP: string, srcPort?: number, dstPort?: number): string {
    const endpoints = [
      `${srcIP}:${srcPort || 0}`,
      `${dstIP}:${dstPort || 0}`,
    ].sort();
    return endpoints.join('-');
  }

  private convertBandwidth(bytesPerSecond: number, unit: string): number {
    const bitsPerSecond = bytesPerSecond * 8;

    switch (unit) {
      case 'bps':
        return bitsPerSecond;
      case 'kbps':
        return bitsPerSecond / 1024;
      case 'mbps':
        return bitsPerSecond / (1024 * 1024);
      case 'gbps':
        return bitsPerSecond / (1024 * 1024 * 1024);
      default:
        return bitsPerSecond;
    }
  }

  private getServiceName(port: number): string {
    const services: Record<number, string> = {
      20: 'FTP-DATA',
      21: 'FTP',
      22: 'SSH',
      23: 'Telnet',
      25: 'SMTP',
      53: 'DNS',
      80: 'HTTP',
      110: 'POP3',
      143: 'IMAP',
      443: 'HTTPS',
      445: 'SMB',
      3306: 'MySQL',
      3389: 'RDP',
      5432: 'PostgreSQL',
      6379: 'Redis',
      8080: 'HTTP-Proxy',
      27017: 'MongoDB',
    };

    return services[port] || `Port ${port}`;
  }

  private async geolocateIP(ip: string): Promise<any> {
    // Simulated geolocation
    // In real implementation, use MaxMind GeoIP2 or similar
    const hash = ip.split('.').reduce((acc, octet) => acc + parseInt(octet), 0);

    const countries = ['US', 'GB', 'DE', 'FR', 'JP', 'CN', 'RU', 'BR'];
    const cities = ['New York', 'London', 'Berlin', 'Paris', 'Tokyo', 'Beijing', 'Moscow', 'São Paulo'];

    return {
      country: countries[hash % countries.length],
      city: cities[hash % cities.length],
      coordinates: [40 + (hash % 50), -70 + (hash % 100)],
    };
  }

  private isSuspiciousLocation(geo: any): boolean {
    const highRiskCountries = ['CN', 'RU', 'KP', 'IR'];
    return highRiskCountries.includes(geo.country);
  }

  private getCountryName(code: string): string {
    const names: Record<string, string> = {
      'US': 'United States',
      'GB': 'United Kingdom',
      'DE': 'Germany',
      'FR': 'France',
      'JP': 'Japan',
      'CN': 'China',
      'RU': 'Russia',
      'BR': 'Brazil',
    };
    return names[code] || code;
  }
}

export default TrafficAnalyzer;
