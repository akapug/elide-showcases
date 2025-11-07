/**
 * Smart Contract Monitor
 *
 * A production-grade smart contract monitoring service with event listening,
 * state change tracking, alert system, audit logging, and anomaly detection.
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { EventEmitter } from 'events';

// ============================================================================
// Type Definitions
// ============================================================================

interface Contract {
  address: string;
  name: string;
  chain: string;
  abi: any[];
  deployedAt: number;
  owner: string;
  verified: boolean;
  monitored: boolean;
}

interface Event {
  id: string;
  contractAddress: string;
  eventName: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  args: Record<string, any>;
  timestamp: number;
  processed: boolean;
}

interface StateChange {
  id: string;
  contractAddress: string;
  variable: string;
  oldValue: any;
  newValue: any;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
  trigger?: string;
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  type: 'event' | 'state_change' | 'anomaly' | 'threshold' | 'security';
  contractAddress: string;
  title: string;
  description: string;
  data: any;
  timestamp: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
}

interface AuditLog {
  id: string;
  contractAddress: string;
  action: string;
  actor: string;
  transactionHash: string;
  blockNumber: number;
  data: any;
  gasUsed: bigint;
  timestamp: number;
}

interface MonitorRule {
  id: string;
  contractAddress: string;
  type: 'event' | 'state' | 'threshold' | 'pattern';
  condition: {
    eventName?: string;
    variable?: string;
    operator?: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
    threshold?: any;
    pattern?: string;
  };
  alert: {
    severity: 'info' | 'warning' | 'critical';
    title: string;
    notify: string[];
  };
  enabled: boolean;
}

interface Anomaly {
  id: string;
  contractAddress: string;
  type: 'unusual_gas' | 'high_frequency' | 'large_value' | 'new_pattern' | 'suspicious_caller';
  description: string;
  confidence: number; // 0-1
  severity: 'low' | 'medium' | 'high';
  data: any;
  timestamp: number;
}

interface MonitorStats {
  contractAddress?: string;
  totalEvents: number;
  totalStateChanges: number;
  totalAlerts: number;
  activeAlerts: number;
  totalAudits: number;
  totalAnomalies: number;
  uptime: number;
  lastBlock: number;
}

// ============================================================================
// Smart Contract Monitor
// ============================================================================

class SmartContractMonitor extends EventEmitter {
  private contracts: Map<string, Contract> = new Map();
  private events: Event[] = [];
  private stateChanges: StateChange[] = [];
  private alerts: Map<string, Alert> = new Map();
  private auditLogs: AuditLog[] = [];
  private rules: Map<string, MonitorRule> = new Map();
  private anomalies: Anomaly[] = [];
  private listeners: Map<string, NodeJS.Timeout> = new Map();
  private startTime: number = Date.now();
  private currentBlock: number = 18000000;

  constructor() {
    super();
    this.initializeAnomalyDetection();
  }

  // Contract Management
  addContract(contract: Contract): void {
    this.contracts.set(contract.address, contract);
    if (contract.monitored) {
      this.startMonitoring(contract.address);
    }
  }

  getContract(address: string): Contract | undefined {
    return this.contracts.get(address);
  }

  listContracts(): Contract[] {
    return Array.from(this.contracts.values());
  }

  // Event Listening
  startMonitoring(contractAddress: string): void {
    const contract = this.contracts.get(contractAddress);
    if (!contract) {
      throw new Error('Contract not found');
    }

    if (this.listeners.has(contractAddress)) {
      return; // Already monitoring
    }

    console.log(`Starting monitoring for ${contract.name} at ${contractAddress}`);

    // Simulate event listening (in production, connect to WebSocket or poll RPC)
    const interval = setInterval(() => {
      this.simulateEvents(contractAddress);
      this.simulateStateChanges(contractAddress);
      this.currentBlock++;
    }, 5000);

    this.listeners.set(contractAddress, interval);
    contract.monitored = true;
  }

  stopMonitoring(contractAddress: string): void {
    const interval = this.listeners.get(contractAddress);
    if (interval) {
      clearInterval(interval);
      this.listeners.delete(contractAddress);

      const contract = this.contracts.get(contractAddress);
      if (contract) {
        contract.monitored = false;
      }

      console.log(`Stopped monitoring ${contractAddress}`);
    }
  }

  private simulateEvents(contractAddress: string): void {
    // Simulate various contract events
    const eventTypes = ['Transfer', 'Approval', 'Swap', 'Mint', 'Burn', 'Deposit', 'Withdrawal'];
    const eventName = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    const event: Event = {
      id: this.generateId(),
      contractAddress,
      eventName,
      blockNumber: this.currentBlock,
      transactionHash: this.generateHash(),
      logIndex: Math.floor(Math.random() * 10),
      args: this.generateEventArgs(eventName),
      timestamp: Date.now(),
      processed: false
    };

    this.events.push(event);
    this.emit('event', event);

    // Process event against rules
    this.processEvent(event);

    // Audit log
    this.addAuditLog({
      contractAddress,
      action: eventName,
      actor: event.args.from || event.args.sender || this.generateAddress(),
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      data: event.args,
      gasUsed: BigInt(Math.floor(Math.random() * 100000) + 21000),
      timestamp: event.timestamp
    });
  }

  private simulateStateChanges(contractAddress: string): void {
    if (Math.random() < 0.3) { // 30% chance of state change
      const variables = ['totalSupply', 'balance', 'allowance', 'owner', 'paused', 'feeRate'];
      const variable = variables[Math.floor(Math.random() * variables.length)];

      const stateChange: StateChange = {
        id: this.generateId(),
        contractAddress,
        variable,
        oldValue: this.generateValue(variable),
        newValue: this.generateValue(variable),
        blockNumber: this.currentBlock,
        transactionHash: this.generateHash(),
        timestamp: Date.now()
      };

      this.stateChanges.push(stateChange);
      this.emit('stateChange', stateChange);

      // Check for anomalies
      this.detectAnomalies(stateChange);
    }
  }

  private generateEventArgs(eventName: string): Record<string, any> {
    const args: Record<string, any> = {};

    switch (eventName) {
      case 'Transfer':
        args.from = this.generateAddress();
        args.to = this.generateAddress();
        args.value = BigInt(Math.floor(Math.random() * 1000000000000000000));
        break;
      case 'Approval':
        args.owner = this.generateAddress();
        args.spender = this.generateAddress();
        args.value = BigInt(Math.floor(Math.random() * 1000000000000000000));
        break;
      case 'Swap':
        args.sender = this.generateAddress();
        args.amountIn = BigInt(Math.floor(Math.random() * 1000000000000000000));
        args.amountOut = BigInt(Math.floor(Math.random() * 1000000000000000000));
        args.tokenIn = this.generateAddress();
        args.tokenOut = this.generateAddress();
        break;
      case 'Mint':
      case 'Burn':
        args.account = this.generateAddress();
        args.amount = BigInt(Math.floor(Math.random() * 1000000000000000000));
        break;
      case 'Deposit':
      case 'Withdrawal':
        args.user = this.generateAddress();
        args.amount = BigInt(Math.floor(Math.random() * 1000000000000000000));
        break;
    }

    return args;
  }

  private generateValue(variable: string): any {
    switch (variable) {
      case 'totalSupply':
      case 'balance':
      case 'allowance':
        return BigInt(Math.floor(Math.random() * 1000000000000000000));
      case 'owner':
        return this.generateAddress();
      case 'paused':
        return Math.random() > 0.5;
      case 'feeRate':
        return Math.floor(Math.random() * 1000);
      default:
        return Math.random();
    }
  }

  // Rule Processing
  addRule(rule: MonitorRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  listRules(contractAddress?: string): MonitorRule[] {
    let rules = Array.from(this.rules.values());
    if (contractAddress) {
      rules = rules.filter(r => r.contractAddress === contractAddress);
    }
    return rules;
  }

  private processEvent(event: Event): void {
    const rules = this.listRules(event.contractAddress);

    rules.forEach(rule => {
      if (!rule.enabled || rule.type !== 'event') return;

      if (rule.condition.eventName === event.eventName) {
        this.createAlert({
          severity: rule.alert.severity,
          type: 'event',
          contractAddress: event.contractAddress,
          title: rule.alert.title,
          description: `Event ${event.eventName} triggered`,
          data: { event, rule },
          timestamp: Date.now(),
          acknowledged: false
        });
      }
    });

    event.processed = true;
  }

  // Alert Management
  private createAlert(alert: Omit<Alert, 'id'>): Alert {
    const fullAlert: Alert = {
      id: this.generateId(),
      ...alert
    };

    this.alerts.set(fullAlert.id, fullAlert);
    this.emit('alert', fullAlert);

    console.log(`[${fullAlert.severity.toUpperCase()}] ${fullAlert.title}`);

    return fullAlert;
  }

  getAlerts(filters?: {
    contractAddress?: string;
    severity?: string;
    acknowledged?: boolean;
  }): Alert[] {
    let alerts = Array.from(this.alerts.values());

    if (filters?.contractAddress) {
      alerts = alerts.filter(a => a.contractAddress === filters.contractAddress);
    }

    if (filters?.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }

    if (filters?.acknowledged !== undefined) {
      alerts = alerts.filter(a => a.acknowledged === filters.acknowledged);
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = Date.now();

    return true;
  }

  // Audit Logging
  private addAuditLog(log: Omit<AuditLog, 'id'>): void {
    const auditLog: AuditLog = {
      id: this.generateId(),
      ...log
    };

    this.auditLogs.push(auditLog);

    // Keep only last 10000 logs
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }
  }

  getAuditLogs(filters?: {
    contractAddress?: string;
    actor?: string;
    action?: string;
    fromBlock?: number;
    toBlock?: number;
  }): AuditLog[] {
    let logs = [...this.auditLogs];

    if (filters?.contractAddress) {
      logs = logs.filter(l => l.contractAddress === filters.contractAddress);
    }

    if (filters?.actor) {
      logs = logs.filter(l => l.actor.toLowerCase() === filters.actor!.toLowerCase());
    }

    if (filters?.action) {
      logs = logs.filter(l => l.action === filters.action);
    }

    if (filters?.fromBlock !== undefined) {
      logs = logs.filter(l => l.blockNumber >= filters.fromBlock!);
    }

    if (filters?.toBlock !== undefined) {
      logs = logs.filter(l => l.blockNumber <= filters.toBlock!);
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Anomaly Detection
  private initializeAnomalyDetection(): void {
    setInterval(() => {
      this.runAnomalyDetection();
    }, 30000); // Run every 30 seconds
  }

  private runAnomalyDetection(): void {
    // Analyze recent events for anomalies
    const recentEvents = this.events.filter(e => Date.now() - e.timestamp < 60000);

    // Check for high frequency
    const eventsByContract = new Map<string, number>();
    recentEvents.forEach(e => {
      eventsByContract.set(e.contractAddress, (eventsByContract.get(e.contractAddress) || 0) + 1);
    });

    eventsByContract.forEach((count, contractAddress) => {
      if (count > 20) { // More than 20 events per minute
        this.detectAnomaly({
          contractAddress,
          type: 'high_frequency',
          description: `Unusually high event frequency detected: ${count} events in the last minute`,
          confidence: 0.85,
          severity: 'medium',
          data: { eventCount: count, timeWindow: 60000 }
        });
      }
    });
  }

  private detectAnomalies(stateChange: StateChange): void {
    // Check for large value changes
    if (typeof stateChange.newValue === 'bigint' && typeof stateChange.oldValue === 'bigint') {
      const change = stateChange.newValue - stateChange.oldValue;
      const percentChange = Number(change * BigInt(100) / stateChange.oldValue);

      if (Math.abs(percentChange) > 50) {
        this.detectAnomaly({
          contractAddress: stateChange.contractAddress,
          type: 'large_value',
          description: `Large value change detected in ${stateChange.variable}: ${percentChange}%`,
          confidence: 0.9,
          severity: 'high',
          data: { stateChange, percentChange }
        });
      }
    }
  }

  private detectAnomaly(anomaly: Omit<Anomaly, 'id' | 'timestamp'>): void {
    const fullAnomaly: Anomaly = {
      id: this.generateId(),
      timestamp: Date.now(),
      ...anomaly
    };

    this.anomalies.push(fullAnomaly);
    this.emit('anomaly', fullAnomaly);

    // Create alert for high-severity anomalies
    if (fullAnomaly.severity === 'high') {
      this.createAlert({
        severity: 'critical',
        type: 'anomaly',
        contractAddress: fullAnomaly.contractAddress,
        title: 'Anomaly Detected',
        description: fullAnomaly.description,
        data: fullAnomaly,
        timestamp: Date.now(),
        acknowledged: false
      });
    }
  }

  getAnomalies(contractAddress?: string): Anomaly[] {
    let anomalies = [...this.anomalies];

    if (contractAddress) {
      anomalies = anomalies.filter(a => a.contractAddress === contractAddress);
    }

    return anomalies.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Statistics
  getStats(contractAddress?: string): MonitorStats {
    const filterByContract = <T extends { contractAddress: string }>(items: T[]): T[] =>
      contractAddress ? items.filter(item => item.contractAddress === contractAddress) : items;

    return {
      contractAddress,
      totalEvents: filterByContract(this.events).length,
      totalStateChanges: filterByContract(this.stateChanges).length,
      totalAlerts: filterByContract(Array.from(this.alerts.values())).length,
      activeAlerts: filterByContract(Array.from(this.alerts.values())).filter(a => !a.acknowledged).length,
      totalAudits: filterByContract(this.auditLogs).length,
      totalAnomalies: filterByContract(this.anomalies).length,
      uptime: Date.now() - this.startTime,
      lastBlock: this.currentBlock
    };
  }

  // Utility Methods
  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private generateHash(): string {
    return '0x' + Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private generateAddress(): string {
    return '0x' + Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}

// ============================================================================
// HTTP API Server
// ============================================================================

class MonitorAPI {
  private monitor: SmartContractMonitor;

  constructor(monitor: SmartContractMonitor) {
    this.monitor = monitor;
  }

  async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const path = url.pathname;
    const method = req.method || 'GET';

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      if (path === '/api/health') {
        this.sendJSON(res, { status: 'healthy', timestamp: Date.now() });
      } else if (path === '/api/contracts' && method === 'GET') {
        const contracts = this.monitor.listContracts();
        this.sendJSON(res, { count: contracts.length, contracts });
      } else if (path === '/api/contract/add' && method === 'POST') {
        const body = await this.parseBody(req);
        this.monitor.addContract(body);
        this.sendJSON(res, { success: true });
      } else if (path.startsWith('/api/contract/') && path.endsWith('/start') && method === 'POST') {
        const address = path.split('/')[3];
        this.monitor.startMonitoring(address);
        this.sendJSON(res, { success: true });
      } else if (path.startsWith('/api/contract/') && path.endsWith('/stop') && method === 'POST') {
        const address = path.split('/')[3];
        this.monitor.stopMonitoring(address);
        this.sendJSON(res, { success: true });
      } else if (path === '/api/events' && method === 'GET') {
        const contractAddress = url.searchParams.get('contract') || undefined;
        const events = this.monitor['events'].filter(e =>
          !contractAddress || e.contractAddress === contractAddress
        );
        this.sendJSON(res, {
          count: events.length,
          events: events.slice(-100).reverse()
        });
      } else if (path === '/api/state-changes' && method === 'GET') {
        const contractAddress = url.searchParams.get('contract') || undefined;
        const changes = this.monitor['stateChanges'].filter(s =>
          !contractAddress || s.contractAddress === contractAddress
        );
        this.sendJSON(res, {
          count: changes.length,
          stateChanges: changes.slice(-100).reverse()
        });
      } else if (path === '/api/alerts' && method === 'GET') {
        const filters = {
          contractAddress: url.searchParams.get('contract') || undefined,
          severity: url.searchParams.get('severity') || undefined,
          acknowledged: url.searchParams.get('acknowledged') === 'true' ? true :
                       url.searchParams.get('acknowledged') === 'false' ? false : undefined
        };
        const alerts = this.monitor.getAlerts(filters);
        this.sendJSON(res, { count: alerts.length, alerts });
      } else if (path.startsWith('/api/alert/') && path.endsWith('/acknowledge') && method === 'POST') {
        const alertId = path.split('/')[3];
        const body = await this.parseBody(req);
        const success = this.monitor.acknowledgeAlert(alertId, body.acknowledgedBy);
        this.sendJSON(res, { success });
      } else if (path === '/api/rules' && method === 'GET') {
        const contractAddress = url.searchParams.get('contract') || undefined;
        const rules = this.monitor.listRules(contractAddress);
        this.sendJSON(res, { count: rules.length, rules });
      } else if (path === '/api/rule/add' && method === 'POST') {
        const body = await this.parseBody(req);
        this.monitor.addRule(body);
        this.sendJSON(res, { success: true });
      } else if (path === '/api/audit-logs' && method === 'GET') {
        const filters = {
          contractAddress: url.searchParams.get('contract') || undefined,
          actor: url.searchParams.get('actor') || undefined,
          action: url.searchParams.get('action') || undefined,
          fromBlock: this.parseNumber(url.searchParams.get('fromBlock')),
          toBlock: this.parseNumber(url.searchParams.get('toBlock'))
        };
        const logs = this.monitor.getAuditLogs(filters);
        this.sendJSON(res, { count: logs.length, auditLogs: logs.slice(0, 100) });
      } else if (path === '/api/anomalies' && method === 'GET') {
        const contractAddress = url.searchParams.get('contract') || undefined;
        const anomalies = this.monitor.getAnomalies(contractAddress);
        this.sendJSON(res, { count: anomalies.length, anomalies });
      } else if (path === '/api/stats' && method === 'GET') {
        const contractAddress = url.searchParams.get('contract') || undefined;
        const stats = this.monitor.getStats(contractAddress);
        this.sendJSON(res, stats);
      } else {
        this.sendError(res, 404, 'Not Found');
      }
    } catch (error: any) {
      console.error('API error:', error);
      this.sendError(res, 500, error.message || 'Internal Server Error');
    }
  }

  private async parseBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error('Invalid JSON'));
        }
      });
    });
  }

  private parseNumber(value: string | null): number | undefined {
    if (!value) return undefined;
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
  }

  private sendJSON(res: ServerResponse, data: any): void {
    res.writeHead(200);
    res.end(JSON.stringify(data, null, 2));
  }

  private sendError(res: ServerResponse, code: number, message: string): void {
    res.writeHead(code);
    res.end(JSON.stringify({ error: message }));
  }
}

// ============================================================================
// Main Application
// ============================================================================

async function main() {
  const PORT = parseInt(process.env.PORT || '3000', 10);

  const monitor = new SmartContractMonitor();
  const api = new MonitorAPI(monitor);

  // Add sample contract
  monitor.addContract({
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    name: 'Uniswap Token',
    chain: 'ethereum',
    abi: [],
    deployedAt: Date.now() - 365 * 24 * 3600 * 1000,
    owner: '0x1a9C8182C09F50C8318d769245beA52c32BE35BC',
    verified: true,
    monitored: false
  });

  const server = createServer((req, res) => {
    api.handleRequest(req, res).catch(err => {
      console.error('Request error:', err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    });
  });

  server.listen(PORT, () => {
    console.log(`Smart Contract Monitor listening on port ${PORT}`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET  /api/contracts - List monitored contracts`);
    console.log(`  POST /api/contract/add - Add contract to monitor`);
    console.log(`  POST /api/contract/{address}/start - Start monitoring`);
    console.log(`  POST /api/contract/{address}/stop - Stop monitoring`);
    console.log(`  GET  /api/events?contract={addr} - Get contract events`);
    console.log(`  GET  /api/state-changes?contract={addr} - Get state changes`);
    console.log(`  GET  /api/alerts?contract={addr}&severity={sev}&acknowledged={bool} - Get alerts`);
    console.log(`  POST /api/alert/{id}/acknowledge - Acknowledge alert`);
    console.log(`  GET  /api/rules?contract={addr} - List monitoring rules`);
    console.log(`  POST /api/rule/add - Add monitoring rule`);
    console.log(`  GET  /api/audit-logs?contract={addr}&actor={addr}&action={name} - Get audit logs`);
    console.log(`  GET  /api/anomalies?contract={addr} - Get detected anomalies`);
    console.log(`  GET  /api/stats?contract={addr} - Get monitoring statistics`);
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
