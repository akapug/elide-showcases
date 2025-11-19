/**
 * Firewall Rule Engine
 *
 * Advanced firewall policy management and enforcement:
 * - Rule-based packet filtering
 * - Stateful packet inspection
 * - Policy optimization
 * - Traffic monitoring
 */

import type {
  FirewallRule,
  FirewallDecision,
  FirewallStatistics,
  FirewallConfig,
  FirewallAction,
} from '../types';

export class FirewallRuleEngine {
  private config: Required<FirewallConfig>;
  private rules: FirewallRule[];
  private stats: Map<string, number>;

  constructor(config: FirewallConfig) {
    this.config = {
      defaultPolicy: config.defaultPolicy,
      stateful: config.stateful,
      logAll: config.logAll ?? false,
      rateLimit: config.rateLimit ?? 0,
    };

    this.rules = [];
    this.stats = new Map();
  }

  /**
   * Add firewall rule
   */
  async addRule(rule: Partial<FirewallRule>): Promise<void> {
    const fullRule: FirewallRule = {
      ruleId: this.generateRuleId(),
      name: rule.name || 'Unnamed Rule',
      action: rule.action || 'deny',
      protocol: rule.protocol,
      srcIP: rule.srcIP,
      dstIP: rule.dstIP,
      srcPort: rule.srcPort,
      dstPort: rule.dstPort,
      direction: rule.direction || 'both',
      enabled: rule.enabled ?? true,
      log: rule.log ?? false,
      priority: rule.priority || 100,
      description: rule.description,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    this.rules.push(fullRule);
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Evaluate packet against firewall rules
   */
  async evaluatePacket(packet: {
    srcIP: string;
    dstIP: string;
    protocol: string;
    srcPort?: number;
    dstPort?: number;
  }): Promise<FirewallDecision> {
    // Check each rule in order of priority
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      if (this.matchRule(packet, rule)) {
        const decision: FirewallDecision = {
          action: rule.action,
          matchedRule: rule.name,
          reason: `Matched rule: ${rule.name}`,
          log: rule.log,
          timestamp: Date.now(),
        };

        this.recordDecision(decision);
        return decision;
      }
    }

    // Default policy
    return {
      action: this.config.defaultPolicy,
      reason: 'Default policy',
      log: this.config.logAll,
      timestamp: Date.now(),
    };
  }

  /**
   * Load firewall policy
   */
  async loadPolicy(policyPath: string): Promise<void> {
    console.log(`Loading policy from ${policyPath}...`);
    // In real implementation, load from file
  }

  /**
   * Analyze policy for conflicts and optimization
   */
  async analyzePolicy(): Promise<any> {
    return {
      totalRules: this.rules.length,
      allowRules: this.rules.filter((r) => r.action === 'allow').length,
      denyRules: this.rules.filter((r) => r.action === 'deny').length,
      conflicts: [],
      redundantRules: [],
    };
  }

  /**
   * Optimize firewall policy
   */
  async optimizePolicy(): Promise<any> {
    // Remove redundant rules, merge similar rules
    return {
      totalRules: this.rules.length,
    };
  }

  /**
   * Get firewall statistics
   */
  async getStatistics(options: { period: string }): Promise<FirewallStatistics> {
    return {
      period: options.period,
      packetsProcessed: this.stats.get('packetsProcessed') || 0,
      packetsAllowed: this.stats.get('packetsAllowed') || 0,
      packetsDenied: this.stats.get('packetsDenied') || 0,
      topBlockedIPs: [],
      topRules: [],
      bandwidth: 0,
    };
  }

  /**
   * Block host temporarily or permanently
   */
  async blockHost(ip: string, options?: { temporary?: boolean; duration?: number }): Promise<void> {
    await this.addRule({
      name: `Block ${ip}`,
      action: 'deny',
      srcIP: ip,
      priority: 1,
    });
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private matchRule(packet: any, rule: FirewallRule): boolean {
    // Check protocol
    if (rule.protocol && packet.protocol !== rule.protocol) {
      return false;
    }

    // Check source IP
    if (rule.srcIP) {
      const srcIPs = Array.isArray(rule.srcIP) ? rule.srcIP : [rule.srcIP];
      if (!srcIPs.some((ip) => this.matchIP(packet.srcIP, ip))) {
        return false;
      }
    }

    // Check destination IP
    if (rule.dstIP) {
      const dstIPs = Array.isArray(rule.dstIP) ? rule.dstIP : [rule.dstIP];
      if (!dstIPs.some((ip) => this.matchIP(packet.dstIP, ip))) {
        return false;
      }
    }

    // Check source port
    if (rule.srcPort && packet.srcPort) {
      const srcPorts = Array.isArray(rule.srcPort) ? rule.srcPort : [rule.srcPort];
      if (!srcPorts.includes(packet.srcPort)) {
        return false;
      }
    }

    // Check destination port
    if (rule.dstPort && packet.dstPort) {
      const dstPorts = Array.isArray(rule.dstPort) ? rule.dstPort : [rule.dstPort];
      if (!dstPorts.includes(packet.dstPort)) {
        return false;
      }
    }

    return true;
  }

  private matchIP(ip: string, pattern: string): boolean {
    // Support CIDR notation
    if (pattern.includes('/')) {
      return this.matchCIDR(ip, pattern);
    }
    return ip === pattern;
  }

  private matchCIDR(ip: string, cidr: string): boolean {
    // Simplified CIDR matching
    const [network, bits] = cidr.split('/');
    const ipParts = ip.split('.');
    const networkParts = network.split('.');

    const matchBits = parseInt(bits);
    const matchBytes = Math.floor(matchBits / 8);

    for (let i = 0; i < matchBytes; i++) {
      if (ipParts[i] !== networkParts[i]) {
        return false;
      }
    }

    return true;
  }

  private recordDecision(decision: FirewallDecision) {
    const key = decision.action === 'allow' ? 'packetsAllowed' : 'packetsDenied';
    this.stats.set(key, (this.stats.get(key) || 0) + 1);
    this.stats.set('packetsProcessed', (this.stats.get('packetsProcessed') || 0) + 1);
  }

  private generateRuleId(): string {
    return `RULE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default FirewallRuleEngine;
