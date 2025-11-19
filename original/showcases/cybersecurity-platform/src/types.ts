/**
 * Cybersecurity Platform - Type Definitions
 *
 * Comprehensive type system for security operations including:
 * - Network packets and protocols
 * - Threats and vulnerabilities
 * - Detection and analysis results
 * - Incident response and orchestration
 */

// ============================================================================
// Network Types
// ============================================================================

export interface NetworkPacket {
  timestamp: number;
  length: number;
  captureLength: number;
  protocol: string;
  srcMAC?: string;
  dstMAC?: string;
  srcIP?: string;
  dstIP?: string;
  srcPort?: number;
  dstPort?: number;
  flags?: string[];
  payload?: Buffer;
  layers?: PacketLayer[];
}

export interface PacketLayer {
  name: string;
  protocol: string;
  fields: Record<string, any>;
  payload?: Buffer;
}

export interface NetworkFlow {
  flowId: string;
  srcIP: string;
  dstIP: string;
  srcPort: number;
  dstPort: number;
  protocol: string;
  startTime: number;
  endTime: number;
  duration: number;
  packetCount: number;
  byteCount: number;
  forwardPackets: number;
  backwardPackets: number;
  forwardBytes: number;
  backwardBytes: number;
  flags: string[];
  state: FlowState;
}

export type FlowState = 'active' | 'completed' | 'timeout' | 'reset' | 'error';

export interface TCPStream {
  streamId: string;
  srcIP: string;
  dstIP: string;
  srcPort: number;
  dstPort: number;
  packets: NetworkPacket[];
  data: Buffer;
  totalBytes: number;
  packetCount: number;
  handshake: TCPHandshake;
  state: TCPState;
}

export interface TCPHandshake {
  synTime: number;
  synAckTime: number;
  ackTime: number;
  rtt: number;
}

export type TCPState = 'SYN_SENT' | 'SYN_RECEIVED' | 'ESTABLISHED' | 'FIN_WAIT' | 'CLOSE_WAIT' | 'CLOSED';

export interface HTTPFlow {
  flowId: string;
  method: string;
  url: string;
  host: string;
  path: string;
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  requestBody?: string;
  statusCode?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  timestamp: number;
  duration?: number;
}

export interface DNSQuery {
  transactionId: number;
  query: string;
  domain: string;
  type: DNSRecordType;
  class: string;
  timestamp: number;
  answers: DNSAnswer[];
  authoritative: boolean;
  recursive: boolean;
  responseCode: number;
}

export type DNSRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS' | 'PTR' | 'SOA' | 'TXT' | 'SRV';

export interface DNSAnswer {
  name: string;
  type: DNSRecordType;
  class: string;
  ttl: number;
  data: string;
}

export interface TLSHandshake {
  version: string;
  cipherSuite: string;
  keyExchange: string;
  encryption: string;
  mac: string;
  serverCertificate: X509Certificate;
  clientCertificate?: X509Certificate;
  sessionId: string;
  extensions: TLSExtension[];
  timestamp: number;
}

export interface TLSExtension {
  type: string;
  data: Buffer;
}

export interface X509Certificate {
  version: number;
  serialNumber: string;
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  publicKey: PublicKeyInfo;
  signatureAlgorithm: string;
  fingerprint: string;
  extensions: CertificateExtension[];
}

export interface PublicKeyInfo {
  algorithm: string;
  size: number;
  exponent?: number;
  modulus?: string;
  curve?: string;
}

export interface CertificateExtension {
  oid: string;
  critical: boolean;
  value: any;
}

// ============================================================================
// Detection Types
// ============================================================================

export interface IntrusionAlert {
  alertId: string;
  timestamp: number;
  severity: SeverityLevel;
  signature: string;
  category: AlertCategory;
  description: string;
  srcIP: string;
  dstIP: string;
  srcPort?: number;
  dstPort?: number;
  protocol: string;
  packet: NetworkPacket;
  rule: DetectionRule;
  confidence: number;
  falsePositiveProbability: number;
}

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type AlertCategory =
  | 'exploit'
  | 'malware'
  | 'trojan'
  | 'shellcode'
  | 'scan'
  | 'dos'
  | 'ddos'
  | 'policy-violation'
  | 'suspicious'
  | 'anomaly';

export interface DetectionRule {
  ruleId: string;
  name: string;
  description: string;
  severity: SeverityLevel;
  category: AlertCategory;
  pattern?: string;
  signature?: string;
  conditions: RuleCondition[];
  action: RuleAction;
  enabled: boolean;
  lastModified: Date;
}

export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
  caseSensitive?: boolean;
}

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'matches'
  | 'greater_than'
  | 'less_than'
  | 'in'
  | 'not_in';

export type RuleAction = 'alert' | 'drop' | 'reject' | 'pass' | 'log';

export interface AnomalyDetection {
  anomalyId: string;
  timestamp: number;
  score: number;
  threshold: number;
  type: AnomalyType;
  description: string;
  features: Record<string, number>;
  packet?: NetworkPacket;
  flow?: NetworkFlow;
  baseline: AnomalyBaseline;
  recommendation: string;
}

export type AnomalyType =
  | 'statistical'
  | 'behavioral'
  | 'protocol'
  | 'volumetric'
  | 'temporal'
  | 'sequential';

export interface AnomalyBaseline {
  mean: Record<string, number>;
  stddev: Record<string, number>;
  min: Record<string, number>;
  max: Record<string, number>;
  percentiles: Record<string, Record<number, number>>;
}

export interface BehaviorAnalysis {
  analysisId: string;
  timeWindow: number;
  startTime: number;
  endTime: number;
  portScans: PortScan[];
  ddosAttacks: DDoSAttack[];
  bruteForceAttempts: BruteForceAttempt[];
  dataExfiltration: DataExfiltration[];
  lateralMovement: LateralMovement[];
}

export interface PortScan {
  scanId: string;
  srcIP: string;
  targetIP: string;
  ports: number[];
  scanType: PortScanType;
  startTime: number;
  endTime: number;
  packetsPerSecond: number;
  confidence: number;
}

export type PortScanType = 'syn' | 'connect' | 'udp' | 'fin' | 'xmas' | 'null' | 'ack';

export interface DDoSAttack {
  attackId: string;
  targetIP: string;
  attackType: DDoSType;
  sourceIPs: string[];
  requestRate: number;
  bandwidth: number;
  startTime: number;
  endTime?: number;
  amplitude: number;
}

export type DDoSType = 'syn-flood' | 'udp-flood' | 'http-flood' | 'dns-amplification' | 'ntp-amplification';

export interface BruteForceAttempt {
  attemptId: string;
  srcIP: string;
  targetIP: string;
  service: string;
  port: number;
  attempts: number;
  uniquePasswords: number;
  startTime: number;
  endTime: number;
  successful: boolean;
}

export interface DataExfiltration {
  exfiltrationId: string;
  srcIP: string;
  dstIP: string;
  protocol: string;
  bytesTransferred: number;
  duration: number;
  suspicionScore: number;
  indicators: string[];
}

export interface LateralMovement {
  movementId: string;
  srcIP: string;
  targetIPs: string[];
  protocol: string;
  technique: string;
  startTime: number;
  endTime: number;
  hops: number;
}

// ============================================================================
// Malware Types
// ============================================================================

export interface MalwareAnalysis {
  analysisId: string;
  filename: string;
  filepath: string;
  size: number;
  fileType: string;
  md5: string;
  sha1: string;
  sha256: string;
  isMalware: boolean;
  confidence: number;
  malwareFamily?: string;
  malwareType?: MalwareType;
  signatures: string[];
  static: StaticAnalysis;
  dynamic?: DynamicAnalysis;
  ml?: MLClassification;
  timestamp: number;
}

export type MalwareType =
  | 'virus'
  | 'worm'
  | 'trojan'
  | 'ransomware'
  | 'spyware'
  | 'adware'
  | 'rootkit'
  | 'backdoor'
  | 'dropper'
  | 'loader';

export interface StaticAnalysis {
  peHeader?: PEHeader;
  sections: PESection[];
  imports: ImportFunction[];
  exports: ExportFunction[];
  strings: StringAnalysis;
  entropy: number;
  packers: string[];
  antiVM: boolean;
  antiDebug: boolean;
  suspicious: SuspiciousIndicator[];
}

export interface PEHeader {
  machine: string;
  numberOfSections: number;
  timeDateStamp: number;
  characteristics: string[];
  subsystem: string;
  entryPoint: number;
  imageBase: number;
}

export interface PESection {
  name: string;
  virtualAddress: number;
  virtualSize: number;
  rawSize: number;
  entropy: number;
  characteristics: string[];
  suspicious: boolean;
}

export interface ImportFunction {
  dll: string;
  function: string;
  suspicious: boolean;
  category?: string;
}

export interface ExportFunction {
  name: string;
  ordinal: number;
  address: number;
}

export interface StringAnalysis {
  total: number;
  suspicious: SuspiciousString[];
  urls: string[];
  ips: string[];
  emails: string[];
  registry: string[];
  files: string[];
}

export interface SuspiciousString {
  value: string;
  category: string;
  offset: number;
  context?: string;
}

export interface SuspiciousIndicator {
  type: string;
  description: string;
  severity: SeverityLevel;
  confidence: number;
}

export interface DynamicAnalysis {
  executionTime: number;
  exitCode: number;
  crashed: boolean;
  filesystem: FileSystemActivity[];
  network: NetworkActivity[];
  registry: RegistryActivity[];
  processes: ProcessActivity[];
  memory: MemoryActivity[];
  apiCalls: APICall[];
}

export interface FileSystemActivity {
  operation: FileOperation;
  path: string;
  timestamp: number;
  success: boolean;
  details?: any;
}

export type FileOperation = 'create' | 'read' | 'write' | 'delete' | 'rename' | 'copy';

export interface NetworkActivity {
  protocol: string;
  destination: string;
  port: number;
  bytes: number;
  timestamp: number;
  data?: Buffer;
}

export interface RegistryActivity {
  operation: RegistryOperation;
  key: string;
  value?: string;
  data?: any;
  timestamp: number;
}

export type RegistryOperation = 'create' | 'read' | 'write' | 'delete';

export interface ProcessActivity {
  pid: number;
  name: string;
  commandLine: string;
  parentPid: number;
  startTime: number;
  endTime?: number;
  exitCode?: number;
}

export interface MemoryActivity {
  operation: MemoryOperation;
  address: number;
  size: number;
  protection: string;
  timestamp: number;
}

export type MemoryOperation = 'allocate' | 'free' | 'protect' | 'write' | 'read';

export interface APICall {
  name: string;
  module: string;
  arguments: any[];
  returnValue: any;
  timestamp: number;
  thread: number;
}

export interface MLClassification {
  model: string;
  classification: 'malicious' | 'benign' | 'suspicious';
  confidence: number;
  features: Record<string, number>;
  probabilities: Record<string, number>;
}

// ============================================================================
// Threat Intelligence Types
// ============================================================================

export interface IOC {
  type: IOCType;
  value: string;
  threat?: ThreatInfo;
  confidence: number;
  source: string;
  firstSeen: Date;
  lastSeen: Date;
  tags: string[];
}

export type IOCType = 'ip' | 'domain' | 'url' | 'hash' | 'email' | 'file' | 'registry' | 'mutex';

export interface ThreatInfo {
  name: string;
  family?: string;
  category: string;
  severity: SeverityLevel;
  description: string;
  references: string[];
  tactics: string[];
  techniques: string[];
}

export interface ThreatCorrelation {
  correlationId: string;
  attackChain: string;
  confidence: number;
  events: SecurityEvent[];
  indicators: string[];
  timeline: TimelineEvent[];
  mitreTactics: string[];
  mitreTechniques: string[];
}

export interface SecurityEvent {
  eventId: string;
  timestamp: number;
  type: string;
  severity: SeverityLevel;
  source: string;
  data: Record<string, any>;
}

export interface TimelineEvent {
  timestamp: number;
  event: string;
  description: string;
  entities: string[];
}

export interface RiskScore {
  entity: string;
  entityType: string;
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  recommendations: string[];
  timestamp: number;
}

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'minimal';

export interface RiskFactor {
  name: string;
  weight: number;
  value: number;
  description: string;
}

// ============================================================================
// Analysis Types
// ============================================================================

export interface TrafficStatistics {
  totalPackets: number;
  totalBytes: number;
  duration: number;
  averageRate: number;
  peakRate: number;
  protocols: Record<string, number>;
  topTalkers: TopTalker[];
  topPorts: PortStatistic[];
  bandwidth: BandwidthStats;
}

export interface TopTalker {
  ip: string;
  packets: number;
  bytes: number;
  percentage: number;
}

export interface PortStatistic {
  port: number;
  protocol: string;
  packets: number;
  service?: string;
}

export interface BandwidthStats {
  current: number;
  average: number;
  peak: number;
  timeline: BandwidthSample[];
  topConsumers: BandwidthConsumer[];
  applications: ApplicationBandwidth[];
}

export interface BandwidthSample {
  timestamp: number;
  rate: number;
  unit: 'bps' | 'kbps' | 'mbps' | 'gbps';
}

export interface BandwidthConsumer {
  ip: string;
  bandwidth: number;
  percentage: number;
}

export interface ApplicationBandwidth {
  name: string;
  port: number;
  protocol: string;
  bandwidth: number;
}

export interface GeolocationAnalysis {
  countries: CountryStatistic[];
  cities: CityStatistic[];
  suspicious: SuspiciousGeolocation[];
}

export interface CountryStatistic {
  code: string;
  name: string;
  connections: number;
  percentage: number;
}

export interface CityStatistic {
  city: string;
  country: string;
  connections: number;
  coordinates: [number, number];
}

export interface SuspiciousGeolocation {
  ip: string;
  country: string;
  city: string;
  reason: string;
  riskScore: number;
}

// ============================================================================
// Vulnerability Types
// ============================================================================

export interface Vulnerability {
  vulnerabilityId: string;
  cve?: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  cvss: number;
  host: string;
  port?: number;
  service?: string;
  version?: string;
  solution: string;
  references: string[];
  exploitAvailable: boolean;
  patchAvailable: boolean;
  discoveryDate: Date;
}

export interface ScanResult {
  scanId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  hostsScanned: number;
  vulnerabilities: Vulnerability[];
  hosts: HostScanResult[];
  summary: ScanSummary;
}

export interface HostScanResult {
  host: string;
  hostname?: string;
  os?: string;
  status: 'up' | 'down' | 'filtered';
  openPorts: PortScanResult[];
  vulnerabilities: Vulnerability[];
  riskScore: number;
}

export interface PortScanResult {
  port: number;
  protocol: string;
  state: 'open' | 'closed' | 'filtered';
  service?: string;
  version?: string;
  banner?: string;
}

export interface ScanSummary {
  totalVulnerabilities: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  mediumVulnerabilities: number;
  lowVulnerabilities: number;
  hostsWithVulnerabilities: number;
}

// ============================================================================
// Firewall Types
// ============================================================================

export interface FirewallRule {
  ruleId: string;
  name: string;
  action: FirewallAction;
  protocol?: string;
  srcIP?: string | string[];
  dstIP?: string | string[];
  srcPort?: number | number[];
  dstPort?: number | number[];
  direction: Direction;
  enabled: boolean;
  log: boolean;
  priority: number;
  description?: string;
  createdAt: Date;
  modifiedAt: Date;
}

export type FirewallAction = 'allow' | 'deny' | 'reject' | 'drop';

export type Direction = 'inbound' | 'outbound' | 'both';

export interface FirewallDecision {
  action: FirewallAction;
  matchedRule?: string;
  reason: string;
  log: boolean;
  timestamp: number;
}

export interface FirewallStatistics {
  period: string;
  packetsProcessed: number;
  packetsAllowed: number;
  packetsDenied: number;
  topBlockedIPs: string[];
  topRules: string[];
  bandwidth: number;
}

// ============================================================================
// Incident Response Types
// ============================================================================

export interface Incident {
  incidentId: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  status: IncidentStatus;
  category: IncidentCategory;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  indicators: IOC[];
  events: SecurityEvent[];
  evidence: Evidence[];
  timeline: TimelineEvent[];
  playbook?: string;
  notes: IncidentNote[];
}

export type IncidentStatus = 'new' | 'investigating' | 'contained' | 'eradicated' | 'recovered' | 'closed';

export type IncidentCategory =
  | 'malware'
  | 'phishing'
  | 'data-breach'
  | 'dos'
  | 'unauthorized-access'
  | 'policy-violation'
  | 'other';

export interface Evidence {
  evidenceId: string;
  type: EvidenceType;
  description: string;
  data: any;
  collectedAt: Date;
  hash: string;
  chainOfCustody: ChainOfCustodyEntry[];
}

export type EvidenceType = 'pcap' | 'logs' | 'memory-dump' | 'disk-image' | 'file' | 'screenshot';

export interface ChainOfCustodyEntry {
  timestamp: Date;
  actor: string;
  action: string;
  notes?: string;
}

export interface IncidentNote {
  noteId: string;
  author: string;
  content: string;
  timestamp: Date;
}

export interface Playbook {
  playbookId: string;
  name: string;
  description: string;
  category: string;
  steps: PlaybookStep[];
  automated: boolean;
}

export interface PlaybookStep {
  stepId: string;
  name: string;
  description: string;
  action: string;
  parameters?: Record<string, any>;
  automated: boolean;
  timeout?: number;
  onSuccess?: string;
  onFailure?: string;
}

export interface PlaybookExecution {
  executionId: string;
  playbookId: string;
  incidentId: string;
  startTime: Date;
  endTime?: Date;
  status: ExecutionStatus;
  steps: StepExecution[];
}

export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export interface StepExecution {
  stepId: string;
  name: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: string;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface PacketAnalyzerConfig {
  interface?: string;
  promiscuous?: boolean;
  snaplen?: number;
  timeout?: number;
  bufferSize?: number;
}

export interface IntrusionDetectorConfig {
  mode: 'signature' | 'anomaly' | 'hybrid';
  sensitivity: 'low' | 'medium' | 'high' | 'paranoid';
  rulesets?: string[];
  updateInterval?: number;
}

export interface MalwareDetectorConfig {
  engines: ('static' | 'dynamic' | 'ml')[];
  timeout?: number;
  sandbox?: boolean;
  yara?: boolean;
}

export interface ThreatIntelligenceConfig {
  sources: string[];
  updateInterval?: number;
  cacheSize?: number;
  apiKeys?: Record<string, string>;
}

export interface VulnerabilityScannerConfig {
  databases: string[];
  updateInterval?: number;
  timeout?: number;
  maxConcurrent?: number;
}

export interface FirewallConfig {
  defaultPolicy: 'allow' | 'deny';
  stateful: boolean;
  logAll?: boolean;
  rateLimit?: number;
}

export interface SOARConfig {
  playbooks: string;
  integrations: string[];
  automate?: boolean;
  notifications?: NotificationConfig;
}

export interface NotificationConfig {
  email?: EmailConfig;
  slack?: SlackConfig;
  webhook?: WebhookConfig;
}

export interface EmailConfig {
  smtp: string;
  from: string;
  to: string[];
}

export interface SlackConfig {
  webhookUrl: string;
  channel: string;
}

export interface WebhookConfig {
  url: string;
  headers?: Record<string, string>;
}

// ============================================================================
// Performance Types
// ============================================================================

export interface BenchmarkResult {
  name: string;
  description: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  throughput: number;
  memoryUsage: number;
}

export interface PerformanceMetrics {
  cpu: number;
  memory: number;
  diskIO: number;
  networkIO: number;
  packetRate: number;
  detectionRate: number;
  latency: number;
}
