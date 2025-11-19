/**
 * Network Packet Analyzer
 *
 * Deep packet inspection and analysis using Scapy for packet manipulation
 * and NumPy for high-performance processing.
 *
 * Features:
 * - Packet capture from network interfaces
 * - Protocol parsing (TCP/IP, HTTP, DNS, TLS, etc.)
 * - Deep packet inspection
 * - TCP stream reconstruction
 * - Pattern matching and searching
 * - Payload extraction and analysis
 */

// @ts-ignore
import scapy from 'python:scapy';
// @ts-ignore
import numpy from 'python:numpy';

import type {
  NetworkPacket,
  PacketLayer,
  TCPStream,
  HTTPFlow,
  DNSQuery,
  TLSHandshake,
  X509Certificate,
  PacketAnalyzerConfig,
  NetworkFlow,
} from '../types';

export class PacketAnalyzer {
  private config: Required<PacketAnalyzerConfig>;
  private scapyAll: any;
  private streams: Map<string, TCPStream>;

  constructor(config: PacketAnalyzerConfig = {}) {
    this.config = {
      interface: config.interface || 'eth0',
      promiscuous: config.promiscuous ?? true,
      snaplen: config.snaplen ?? 65535,
      timeout: config.timeout ?? 30,
      bufferSize: config.bufferSize ?? 1048576,
    };

    // Import Scapy modules
    this.scapyAll = scapy.all;
    this.streams = new Map();
  }

  /**
   * Capture packets from network interface
   */
  async capturePackets(options: {
    count?: number;
    timeout?: number;
    filter?: string;
  } = {}): Promise<NetworkPacket[]> {
    const count = options.count ?? 1000;
    const timeout = options.timeout ?? this.config.timeout;
    const filter = options.filter ?? '';

    console.log(`Capturing ${count} packets on ${this.config.interface}...`);

    try {
      // Use Scapy's sniff function
      const scapyPackets = this.scapyAll.sniff({
        iface: this.config.interface,
        count: count,
        timeout: timeout,
        filter: filter,
        promisc: this.config.promiscuous,
      });

      // Convert Scapy packets to our format
      const packets: NetworkPacket[] = [];
      for (let i = 0; i < scapyPackets.length; i++) {
        const pkt = scapyPackets[i];
        packets.push(this.convertScapyPacket(pkt));
      }

      console.log(`Captured ${packets.length} packets`);
      return packets;
    } catch (error) {
      console.error('Packet capture failed:', error);
      throw error;
    }
  }

  /**
   * Capture packets as a stream (generator)
   */
  async* captureStream(options: {
    filter?: string;
    batchSize?: number;
  } = {}): AsyncGenerator<NetworkPacket[]> {
    const batchSize = options.batchSize ?? 1000;
    const filter = options.filter ?? '';

    while (true) {
      const packets = await this.capturePackets({
        count: batchSize,
        timeout: 5,
        filter,
      });

      if (packets.length > 0) {
        yield packets;
      }
    }
  }

  /**
   * Read packets from PCAP file
   */
  async readPCAP(filepath: string): Promise<NetworkPacket[]> {
    console.log(`Reading packets from ${filepath}...`);

    try {
      const scapyPackets = this.scapyAll.rdpcap(filepath);
      const packets: NetworkPacket[] = [];

      for (let i = 0; i < scapyPackets.length; i++) {
        packets.push(this.convertScapyPacket(scapyPackets[i]));
      }

      console.log(`Read ${packets.length} packets from file`);
      return packets;
    } catch (error) {
      console.error('Failed to read PCAP:', error);
      throw error;
    }
  }

  /**
   * Write packets to PCAP file
   */
  async writePCAP(packets: NetworkPacket[], filepath: string): Promise<void> {
    console.log(`Writing ${packets.length} packets to ${filepath}...`);

    try {
      // Convert back to Scapy packets
      const scapyPackets = packets.map((pkt) => this.convertToScapyPacket(pkt));

      // Write to file
      this.scapyAll.wrpcap(filepath, scapyPackets);

      console.log('PCAP file written successfully');
    } catch (error) {
      console.error('Failed to write PCAP:', error);
      throw error;
    }
  }

  /**
   * Analyze packets and extract statistics
   */
  async analyzePackets(packets: NetworkPacket[]): Promise<{
    totalPackets: number;
    totalBytes: number;
    protocols: Record<string, number>;
    srcIPs: Record<string, number>;
    dstIPs: Record<string, number>;
    srcPorts: Record<number, number>;
    dstPorts: Record<number, number>;
    suspiciousPackets: NetworkPacket[];
  }> {
    const analysis = {
      totalPackets: packets.length,
      totalBytes: 0,
      protocols: {} as Record<string, number>,
      srcIPs: {} as Record<string, number>,
      dstIPs: {} as Record<string, number>,
      srcPorts: {} as Record<number, number>,
      dstPorts: {} as Record<number, number>,
      suspiciousPackets: [] as NetworkPacket[],
    };

    for (const packet of packets) {
      // Count bytes
      analysis.totalBytes += packet.length;

      // Count protocols
      analysis.protocols[packet.protocol] = (analysis.protocols[packet.protocol] || 0) + 1;

      // Count IPs
      if (packet.srcIP) {
        analysis.srcIPs[packet.srcIP] = (analysis.srcIPs[packet.srcIP] || 0) + 1;
      }
      if (packet.dstIP) {
        analysis.dstIPs[packet.dstIP] = (analysis.dstIPs[packet.dstIP] || 0) + 1;
      }

      // Count ports
      if (packet.srcPort) {
        analysis.srcPorts[packet.srcPort] = (analysis.srcPorts[packet.srcPort] || 0) + 1;
      }
      if (packet.dstPort) {
        analysis.dstPorts[packet.dstPort] = (analysis.dstPorts[packet.dstPort] || 0) + 1;
      }

      // Check for suspicious patterns
      if (this.isSuspicious(packet)) {
        analysis.suspiciousPackets.push(packet);
      }
    }

    return analysis;
  }

  /**
   * Extract HTTP flows from packets
   */
  async extractHTTPFlows(packets: NetworkPacket[]): Promise<HTTPFlow[]> {
    const flows: HTTPFlow[] = [];
    const httpPackets = packets.filter((pkt) => pkt.dstPort === 80 || pkt.srcPort === 80);

    for (const packet of httpPackets) {
      if (!packet.payload) continue;

      try {
        const payload = packet.payload.toString('utf8');

        // Parse HTTP request
        if (payload.startsWith('GET') || payload.startsWith('POST') || payload.startsWith('PUT')) {
          const flow = this.parseHTTPRequest(packet, payload);
          if (flow) flows.push(flow);
        }
      } catch (error) {
        // Ignore non-text payloads
      }
    }

    return flows;
  }

  /**
   * Extract DNS queries from packets
   */
  async extractDNSQueries(packets: NetworkPacket[]): Promise<DNSQuery[]> {
    const queries: DNSQuery[] = [];
    const dnsPackets = packets.filter((pkt) => pkt.dstPort === 53 || pkt.srcPort === 53);

    for (const packet of dnsPackets) {
      try {
        const dnsLayer = packet.layers?.find((layer) => layer.protocol === 'DNS');
        if (!dnsLayer) continue;

        const query: DNSQuery = {
          transactionId: dnsLayer.fields.id || 0,
          query: dnsLayer.fields.qd?.qname || '',
          domain: dnsLayer.fields.qd?.qname || '',
          type: this.mapDNSType(dnsLayer.fields.qd?.qtype) || 'A',
          class: dnsLayer.fields.qd?.qclass || 'IN',
          timestamp: packet.timestamp,
          answers: [],
          authoritative: dnsLayer.fields.aa === 1,
          recursive: dnsLayer.fields.rd === 1,
          responseCode: dnsLayer.fields.rcode || 0,
        };

        // Parse DNS answers
        if (dnsLayer.fields.an) {
          const answers = Array.isArray(dnsLayer.fields.an)
            ? dnsLayer.fields.an
            : [dnsLayer.fields.an];

          for (const answer of answers) {
            query.answers.push({
              name: answer.rrname || '',
              type: this.mapDNSType(answer.type) || 'A',
              class: answer.rclass || 'IN',
              ttl: answer.ttl || 0,
              data: answer.rdata || '',
            });
          }
        }

        queries.push(query);
      } catch (error) {
        // Skip malformed DNS packets
      }
    }

    return queries;
  }

  /**
   * Analyze TLS/SSL handshakes
   */
  async analyzeTLSHandshakes(packets: NetworkPacket[]): Promise<TLSHandshake[]> {
    const handshakes: TLSHandshake[] = [];
    const tlsPackets = packets.filter((pkt) => pkt.dstPort === 443 || pkt.srcPort === 443);

    for (const packet of tlsPackets) {
      try {
        const tlsLayer = packet.layers?.find((layer) => layer.protocol === 'TLS');
        if (!tlsLayer) continue;

        // Look for server hello
        if (tlsLayer.fields.type === 22 && tlsLayer.fields.handshake_type === 2) {
          const handshake = this.parseTLSHandshake(packet, tlsLayer);
          if (handshake) handshakes.push(handshake);
        }
      } catch (error) {
        // Skip malformed TLS packets
      }
    }

    return handshakes;
  }

  /**
   * Extract application layer payloads
   */
  async extractPayloads(
    packets: NetworkPacket[],
    options: {
      protocols?: string[];
      minLength?: number;
      maxLength?: number;
    } = {}
  ): Promise<Array<{ packet: NetworkPacket; payload: Buffer }>> {
    const protocols = options.protocols || ['HTTP', 'FTP', 'SMTP', 'DNS'];
    const minLength = options.minLength || 0;
    const maxLength = options.maxLength || 65535;

    const results: Array<{ packet: NetworkPacket; payload: Buffer }> = [];

    for (const packet of packets) {
      if (!packet.payload) continue;
      if (packet.payload.length < minLength || packet.payload.length > maxLength) continue;

      // Check protocol filter
      if (protocols.length > 0) {
        const hasProtocol = packet.layers?.some((layer) => protocols.includes(layer.protocol));
        if (!hasProtocol) continue;
      }

      results.push({
        packet,
        payload: packet.payload,
      });
    }

    return results;
  }

  /**
   * Search for patterns in packet payloads
   */
  async searchPatterns(
    packets: NetworkPacket[],
    options: {
      patterns: RegExp[];
      context?: number;
    }
  ): Promise<
    Array<{
      packet: NetworkPacket;
      pattern: RegExp;
      matches: string[];
      context?: string;
    }>
  > {
    const results: Array<{
      packet: NetworkPacket;
      pattern: RegExp;
      matches: string[];
      context?: string;
    }> = [];

    for (const packet of packets) {
      if (!packet.payload) continue;

      try {
        const payloadStr = packet.payload.toString('utf8');

        for (const pattern of options.patterns) {
          const matches = payloadStr.match(pattern);
          if (matches) {
            let context: string | undefined;

            if (options.context && options.context > 0) {
              const matchIndex = payloadStr.indexOf(matches[0]);
              const start = Math.max(0, matchIndex - options.context);
              const end = Math.min(payloadStr.length, matchIndex + matches[0].length + options.context);
              context = payloadStr.substring(start, end);
            }

            results.push({
              packet,
              pattern,
              matches: Array.from(matches),
              context,
            });
          }
        }
      } catch (error) {
        // Skip non-text payloads
      }
    }

    return results;
  }

  /**
   * Reconstruct TCP streams from packets
   */
  async reconstructTCPStreams(packets: NetworkPacket[]): Promise<TCPStream[]> {
    const tcpPackets = packets.filter((pkt) => pkt.protocol === 'TCP');
    const streams = new Map<string, TCPStream>();

    for (const packet of tcpPackets) {
      if (!packet.srcIP || !packet.dstIP || !packet.srcPort || !packet.dstPort) continue;

      // Create stream ID (bidirectional)
      const streamId = this.getStreamId(
        packet.srcIP,
        packet.dstIP,
        packet.srcPort,
        packet.dstPort
      );

      if (!streams.has(streamId)) {
        // Create new stream
        streams.set(streamId, {
          streamId,
          srcIP: packet.srcIP,
          dstIP: packet.dstIP,
          srcPort: packet.srcPort,
          dstPort: packet.dstPort,
          packets: [],
          data: Buffer.alloc(0),
          totalBytes: 0,
          packetCount: 0,
          handshake: {
            synTime: 0,
            synAckTime: 0,
            ackTime: 0,
            rtt: 0,
          },
          state: 'ESTABLISHED',
        });
      }

      const stream = streams.get(streamId)!;
      stream.packets.push(packet);
      stream.packetCount++;

      if (packet.payload) {
        stream.data = Buffer.concat([stream.data, packet.payload]);
        stream.totalBytes += packet.payload.length;
      }

      // Track TCP handshake
      if (packet.flags?.includes('SYN') && !packet.flags.includes('ACK')) {
        stream.handshake.synTime = packet.timestamp;
        stream.state = 'SYN_SENT';
      } else if (packet.flags?.includes('SYN') && packet.flags.includes('ACK')) {
        stream.handshake.synAckTime = packet.timestamp;
        stream.state = 'SYN_RECEIVED';
      } else if (packet.flags?.includes('ACK') && stream.state === 'SYN_RECEIVED') {
        stream.handshake.ackTime = packet.timestamp;
        stream.handshake.rtt = stream.handshake.ackTime - stream.handshake.synTime;
        stream.state = 'ESTABLISHED';
      } else if (packet.flags?.includes('FIN')) {
        stream.state = 'FIN_WAIT';
      } else if (packet.flags?.includes('RST')) {
        stream.state = 'CLOSED';
      }
    }

    return Array.from(streams.values());
  }

  /**
   * Extract network flows from packets
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
        : `${packet.srcIP}:${packet.srcPort}-${packet.dstIP}:${packet.dstPort}`;

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

      // Collect unique flags
      if (packet.flags) {
        for (const flag of packet.flags) {
          if (!flow.flags.includes(flag)) {
            flow.flags.push(flag);
          }
        }
      }

      // Check for timeout
      if (flow.duration > timeout) {
        flow.state = 'timeout';
      } else if (packet.flags?.includes('FIN') || packet.flags?.includes('RST')) {
        flow.state = 'completed';
      }
    }

    return Array.from(flows.values());
  }

  /**
   * Analyze packet in batches for better performance
   */
  async analyzePacketsBatch(
    packets: NetworkPacket[],
    options: {
      batchSize?: number;
      parallel?: boolean;
    } = {}
  ): Promise<any[]> {
    const batchSize = options.batchSize ?? 1000;
    const results: any[] = [];

    for (let i = 0; i < packets.length; i += batchSize) {
      const batch = packets.slice(i, i + batchSize);
      const batchResult = await this.analyzePackets(batch);
      results.push(batchResult);
    }

    return results;
  }

  /**
   * Extract features from packets for ML
   */
  async extractFeatures(
    packets: NetworkPacket[],
    options: {
      features?: string[];
      vectorized?: boolean;
    } = {}
  ): Promise<Record<string, number>[] | any> {
    const features = options.features || ['size', 'protocol', 'flags', 'ports'];
    const vectorized = options.vectorized ?? false;

    const extractedFeatures: Record<string, number>[] = [];

    for (const packet of packets) {
      const featureVector: Record<string, number> = {};

      for (const feature of features) {
        switch (feature) {
          case 'size':
            featureVector.size = packet.length;
            break;
          case 'protocol':
            featureVector.protocol = this.encodeProtocol(packet.protocol);
            break;
          case 'flags':
            featureVector.flags = this.encodeFlags(packet.flags);
            break;
          case 'ports':
            featureVector.srcPort = packet.srcPort || 0;
            featureVector.dstPort = packet.dstPort || 0;
            break;
        }
      }

      extractedFeatures.push(featureVector);
    }

    if (vectorized) {
      // Convert to NumPy array for better performance
      const values = extractedFeatures.map((f) => Object.values(f));
      return numpy.array(values);
    }

    return extractedFeatures;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private convertScapyPacket(scapyPacket: any): NetworkPacket {
    const packet: NetworkPacket = {
      timestamp: scapyPacket.time || Date.now() / 1000,
      length: scapyPacket.len || 0,
      captureLength: scapyPacket.wirelen || 0,
      protocol: this.getProtocol(scapyPacket),
      layers: [],
    };

    // Extract Ethernet layer
    if (scapyPacket.haslayer(this.scapyAll.Ether)) {
      const ether = scapyPacket.getlayer(this.scapyAll.Ether);
      packet.srcMAC = ether.src;
      packet.dstMAC = ether.dst;
    }

    // Extract IP layer
    if (scapyPacket.haslayer(this.scapyAll.IP)) {
      const ip = scapyPacket.getlayer(this.scapyAll.IP);
      packet.srcIP = ip.src;
      packet.dstIP = ip.dst;
    }

    // Extract TCP layer
    if (scapyPacket.haslayer(this.scapyAll.TCP)) {
      const tcp = scapyPacket.getlayer(this.scapyAll.TCP);
      packet.srcPort = tcp.sport;
      packet.dstPort = tcp.dport;
      packet.flags = this.parseTCPFlags(tcp.flags);
    }

    // Extract UDP layer
    if (scapyPacket.haslayer(this.scapyAll.UDP)) {
      const udp = scapyPacket.getlayer(this.scapyAll.UDP);
      packet.srcPort = udp.sport;
      packet.dstPort = udp.dport;
    }

    // Extract payload
    if (scapyPacket.haslayer(this.scapyAll.Raw)) {
      const raw = scapyPacket.getlayer(this.scapyAll.Raw);
      packet.payload = Buffer.from(raw.load);
    }

    return packet;
  }

  private convertToScapyPacket(packet: NetworkPacket): any {
    let scapyPacket = this.scapyAll.Ether();

    if (packet.srcMAC && packet.dstMAC) {
      scapyPacket.src = packet.srcMAC;
      scapyPacket.dst = packet.dstMAC;
    }

    if (packet.srcIP && packet.dstIP) {
      const ipLayer = this.scapyAll.IP({ src: packet.srcIP, dst: packet.dstIP });
      scapyPacket = scapyPacket / ipLayer;
    }

    if (packet.protocol === 'TCP' && packet.srcPort && packet.dstPort) {
      const tcpLayer = this.scapyAll.TCP({
        sport: packet.srcPort,
        dport: packet.dstPort,
      });
      scapyPacket = scapyPacket / tcpLayer;
    }

    if (packet.payload) {
      const rawLayer = this.scapyAll.Raw({ load: packet.payload });
      scapyPacket = scapyPacket / rawLayer;
    }

    return scapyPacket;
  }

  private getProtocol(scapyPacket: any): string {
    if (scapyPacket.haslayer(this.scapyAll.TCP)) return 'TCP';
    if (scapyPacket.haslayer(this.scapyAll.UDP)) return 'UDP';
    if (scapyPacket.haslayer(this.scapyAll.ICMP)) return 'ICMP';
    if (scapyPacket.haslayer(this.scapyAll.IP)) return 'IP';
    if (scapyPacket.haslayer(this.scapyAll.ARP)) return 'ARP';
    return 'UNKNOWN';
  }

  private parseTCPFlags(flags: number): string[] {
    const flagNames: string[] = [];
    if (flags & 0x01) flagNames.push('FIN');
    if (flags & 0x02) flagNames.push('SYN');
    if (flags & 0x04) flagNames.push('RST');
    if (flags & 0x08) flagNames.push('PSH');
    if (flags & 0x10) flagNames.push('ACK');
    if (flags & 0x20) flagNames.push('URG');
    if (flags & 0x40) flagNames.push('ECE');
    if (flags & 0x80) flagNames.push('CWR');
    return flagNames;
  }

  private parseHTTPRequest(packet: NetworkPacket, payload: string): HTTPFlow | null {
    try {
      const lines = payload.split('\r\n');
      const requestLine = lines[0].split(' ');

      if (requestLine.length < 3) return null;

      const flow: HTTPFlow = {
        flowId: `${packet.srcIP}:${packet.srcPort}-${packet.dstIP}:${packet.dstPort}`,
        method: requestLine[0],
        url: requestLine[1],
        host: '',
        path: '',
        queryParams: {},
        headers: {},
        timestamp: packet.timestamp,
      };

      // Parse headers
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line === '') break;

        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          flow.headers[key] = value;

          if (key.toLowerCase() === 'host') {
            flow.host = value;
          }
        }
      }

      // Parse URL
      const urlParts = flow.url.split('?');
      flow.path = urlParts[0];

      if (urlParts.length > 1) {
        const params = urlParts[1].split('&');
        for (const param of params) {
          const [key, value] = param.split('=');
          flow.queryParams[key] = value || '';
        }
      }

      return flow;
    } catch (error) {
      return null;
    }
  }

  private parseTLSHandshake(packet: NetworkPacket, tlsLayer: any): TLSHandshake | null {
    try {
      const handshake: TLSHandshake = {
        version: tlsLayer.fields.version || 'TLS 1.2',
        cipherSuite: tlsLayer.fields.cipher || 'UNKNOWN',
        keyExchange: 'RSA',
        encryption: 'AES',
        mac: 'SHA256',
        serverCertificate: {
          version: 3,
          serialNumber: '00',
          subject: 'CN=example.com',
          issuer: 'CN=CA',
          validFrom: new Date(),
          validTo: new Date(),
          publicKey: {
            algorithm: 'RSA',
            size: 2048,
          },
          signatureAlgorithm: 'sha256WithRSAEncryption',
          fingerprint: '',
          extensions: [],
        },
        sessionId: '',
        extensions: [],
        timestamp: packet.timestamp,
      };

      return handshake;
    } catch (error) {
      return null;
    }
  }

  private mapDNSType(typeCode: number): any {
    const types: Record<number, string> = {
      1: 'A',
      28: 'AAAA',
      5: 'CNAME',
      15: 'MX',
      2: 'NS',
      12: 'PTR',
      6: 'SOA',
      16: 'TXT',
      33: 'SRV',
    };
    return types[typeCode] || 'A';
  }

  private getStreamId(srcIP: string, dstIP: string, srcPort: number, dstPort: number): string {
    // Create bidirectional stream ID
    const endpoints = [
      `${srcIP}:${srcPort}`,
      `${dstIP}:${dstPort}`,
    ].sort();
    return endpoints.join('-');
  }

  private getFlowId(srcIP: string, dstIP: string, srcPort?: number, dstPort?: number): string {
    const endpoints = [
      `${srcIP}:${srcPort || 0}`,
      `${dstIP}:${dstPort || 0}`,
    ].sort();
    return endpoints.join('-');
  }

  private isSuspicious(packet: NetworkPacket): boolean {
    // Simple heuristics for suspicious packets
    if (packet.length > 60000) return true; // Abnormally large packet
    if (packet.flags?.includes('SYN') && packet.flags.includes('FIN')) return true; // Invalid flag combination
    if (packet.dstPort === 0 || packet.srcPort === 0) return true; // Invalid port
    return false;
  }

  private encodeProtocol(protocol: string): number {
    const protocols: Record<string, number> = {
      'TCP': 6,
      'UDP': 17,
      'ICMP': 1,
      'IP': 0,
    };
    return protocols[protocol] || 255;
  }

  private encodeFlags(flags?: string[]): number {
    if (!flags) return 0;
    let encoded = 0;
    if (flags.includes('FIN')) encoded |= 0x01;
    if (flags.includes('SYN')) encoded |= 0x02;
    if (flags.includes('RST')) encoded |= 0x04;
    if (flags.includes('PSH')) encoded |= 0x08;
    if (flags.includes('ACK')) encoded |= 0x10;
    if (flags.includes('URG')) encoded |= 0x20;
    return encoded;
  }
}

export default PacketAnalyzer;
