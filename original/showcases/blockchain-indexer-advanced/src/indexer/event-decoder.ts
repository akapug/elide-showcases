import { ethers, Interface, Log, LogDescription } from 'ethers';
import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';
import { retry, exponentialBackoff } from '../utils/retry';
import * as crypto from 'crypto';

interface DecodedEvent {
  address: string;
  blockNumber: number;
  blockHash: string;
  transactionHash: string;
  transactionIndex: number;
  logIndex: number;
  eventName: string;
  signature: string;
  args: Record<string, any>;
  raw: {
    topics: string[];
    data: string;
  };
  metadata?: EventMetadata;
}

interface EventMetadata {
  isTokenTransfer?: boolean;
  isNFTTransfer?: boolean;
  isDexSwap?: boolean;
  isLiquidityEvent?: boolean;
  contractType?: 'ERC20' | 'ERC721' | 'ERC1155' | 'DEX' | 'LENDING' | 'UNKNOWN';
}

interface EventSignature {
  signature: string;
  name: string;
  inputs: Array<{
    name: string;
    type: string;
    indexed: boolean;
  }>;
  hash: string;
}

interface ContractABI {
  address: string;
  abi: any[];
  interface: Interface;
  contractType?: string;
}

export class EventDecoder {
  private provider: ethers.JsonRpcProvider;
  private pgPool: Pool;
  private signatureCache: Map<string, EventSignature>;
  private abiCache: Map<string, ContractABI>;
  private interfaceCache: Map<string, Interface>;

  // Standard interfaces
  private erc20Interface: Interface;
  private erc721Interface: Interface;
  private erc1155Interface: Interface;
  private uniswapV2Interface: Interface;
  private uniswapV3Interface: Interface;
  private aaveInterface: Interface;
  private compoundInterface: Interface;

  // Event topic hashes
  private readonly TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
  private readonly APPROVAL_TOPIC = '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925';
  private readonly SWAP_TOPIC = '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822';
  private readonly SYNC_TOPIC = '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1';
  private readonly MINT_TOPIC = '0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f';
  private readonly BURN_TOPIC = '0xdccd412f0b1252819cb1fd330b93224ca42612892bb3f4f789976e6d81936496';

  constructor(provider: ethers.JsonRpcProvider, pgPool: Pool) {
    this.provider = provider;
    this.pgPool = pgPool;
    this.signatureCache = new Map();
    this.abiCache = new Map();
    this.interfaceCache = new Map();

    this.initializeStandardInterfaces();
    this.loadCommonSignatures();
  }

  private initializeStandardInterfaces(): void {
    // ERC20
    this.erc20Interface = new Interface([
      'event Transfer(address indexed from, address indexed to, uint256 value)',
      'event Approval(address indexed owner, address indexed spender, uint256 value)',
    ]);

    // ERC721
    this.erc721Interface = new Interface([
      'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
      'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
      'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
    ]);

    // ERC1155
    this.erc1155Interface = new Interface([
      'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
      'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
      'event ApprovalForAll(address indexed account, address indexed operator, bool approved)',
      'event URI(string value, uint256 indexed id)',
    ]);

    // Uniswap V2
    this.uniswapV2Interface = new Interface([
      'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)',
      'event Sync(uint112 reserve0, uint112 reserve1)',
      'event Mint(address indexed sender, uint amount0, uint amount1)',
      'event Burn(address indexed sender, uint amount0, uint amount1, address indexed to)',
    ]);

    // Uniswap V3
    this.uniswapV3Interface = new Interface([
      'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
      'event Mint(address sender, address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)',
      'event Burn(address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)',
    ]);

    // Aave
    this.aaveInterface = new Interface([
      'event Deposit(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint16 indexed referral)',
      'event Withdraw(address indexed reserve, address indexed user, address indexed to, uint256 amount)',
      'event Borrow(address indexed reserve, address user, address indexed onBehalfOf, uint256 amount, uint256 borrowRateMode, uint256 borrowRate, uint16 indexed referral)',
      'event Repay(address indexed reserve, address indexed user, address indexed repayer, uint256 amount)',
      'event LiquidationCall(address indexed collateralAsset, address indexed debtAsset, address indexed user, uint256 debtToCover, uint256 liquidatedCollateralAmount, address liquidator, bool receiveAToken)',
    ]);

    // Compound
    this.compoundInterface = new Interface([
      'event Mint(address minter, uint mintAmount, uint mintTokens)',
      'event Redeem(address redeemer, uint redeemAmount, uint redeemTokens)',
      'event Borrow(address borrower, uint borrowAmount, uint accountBorrows, uint totalBorrows)',
      'event RepayBorrow(address payer, address borrower, uint repayAmount, uint accountBorrows, uint totalBorrows)',
      'event LiquidateBorrow(address liquidator, address borrower, uint repayAmount, address cTokenCollateral, uint seizeTokens)',
    ]);
  }

  private loadCommonSignatures(): void {
    const signatures: Array<[string, string, Array<{ name: string; type: string; indexed: boolean }>]> = [
      [
        this.TRANSFER_TOPIC,
        'Transfer',
        [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'value', type: 'uint256', indexed: false },
        ],
      ],
      [
        this.APPROVAL_TOPIC,
        'Approval',
        [
          { name: 'owner', type: 'address', indexed: true },
          { name: 'spender', type: 'address', indexed: true },
          { name: 'value', type: 'uint256', indexed: false },
        ],
      ],
      [
        this.SWAP_TOPIC,
        'Swap',
        [
          { name: 'sender', type: 'address', indexed: true },
          { name: 'amount0In', type: 'uint256', indexed: false },
          { name: 'amount1In', type: 'uint256', indexed: false },
          { name: 'amount0Out', type: 'uint256', indexed: false },
          { name: 'amount1Out', type: 'uint256', indexed: false },
          { name: 'to', type: 'address', indexed: true },
        ],
      ],
    ];

    for (const [hash, name, inputs] of signatures) {
      const signature = this.buildEventSignature(name, inputs);
      this.signatureCache.set(hash, {
        signature,
        name,
        inputs,
        hash,
      });
    }
  }

  private buildEventSignature(name: string, inputs: Array<{ name: string; type: string; indexed: boolean }>): string {
    const types = inputs.map(input => input.type).join(',');
    return `${name}(${types})`;
  }

  async decodeLogs(logs: (Log | ethers.EventLog)[]): Promise<DecodedEvent[]> {
    const decodedEvents: DecodedEvent[] = [];

    for (const log of logs) {
      try {
        const decoded = await this.decodeLog(log);
        if (decoded) {
          decodedEvents.push(decoded);
        }
      } catch (error) {
        logger.debug('Failed to decode log', {
          address: log.address,
          topics: log.topics,
          error,
        });

        // Store undecoded event
        decodedEvents.push(this.createUndecodedEvent(log));
      }
    }

    return decodedEvents;
  }

  private async decodeLog(log: Log | ethers.EventLog): Promise<DecodedEvent | null> {
    const topic = log.topics[0];
    const address = log.address.toLowerCase();

    // Try contract-specific ABI first
    const contractAbi = await this.getContractABI(address);
    if (contractAbi) {
      try {
        const parsed = contractAbi.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });

        if (parsed) {
          return this.formatDecodedEvent(log, parsed, contractAbi.contractType);
        }
      } catch (error) {
        // Continue to standard interfaces
      }
    }

    // Try standard interfaces
    const standardInterfaces = [
      { interface: this.erc20Interface, type: 'ERC20' },
      { interface: this.erc721Interface, type: 'ERC721' },
      { interface: this.erc1155Interface, type: 'ERC1155' },
      { interface: this.uniswapV2Interface, type: 'DEX' },
      { interface: this.uniswapV3Interface, type: 'DEX' },
      { interface: this.aaveInterface, type: 'LENDING' },
      { interface: this.compoundInterface, type: 'LENDING' },
    ];

    for (const { interface: iface, type } of standardInterfaces) {
      try {
        const parsed = iface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });

        if (parsed) {
          return this.formatDecodedEvent(log, parsed, type);
        }
      } catch (error) {
        // Continue to next interface
      }
    }

    // Try signature lookup
    const signature = this.signatureCache.get(topic);
    if (signature) {
      return this.decodeWithSignature(log, signature);
    }

    // Try fetching signature from database
    const dbSignature = await this.fetchSignatureFromDB(topic);
    if (dbSignature) {
      this.signatureCache.set(topic, dbSignature);
      return this.decodeWithSignature(log, dbSignature);
    }

    // Try online signature database
    const onlineSignature = await this.fetchSignatureOnline(topic);
    if (onlineSignature) {
      this.signatureCache.set(topic, onlineSignature);
      await this.storeSignature(onlineSignature);
      return this.decodeWithSignature(log, onlineSignature);
    }

    return null;
  }

  private formatDecodedEvent(
    log: Log | ethers.EventLog,
    parsed: LogDescription,
    contractType?: string
  ): DecodedEvent {
    const args: Record<string, any> = {};

    parsed.fragment.inputs.forEach((input, index) => {
      args[input.name || `arg${index}`] = this.formatValue(parsed.args[index]);
    });

    const metadata = this.extractMetadata(parsed.name, args, contractType);

    return {
      address: log.address.toLowerCase(),
      blockNumber: log.blockNumber,
      blockHash: log.blockHash || '',
      transactionHash: log.transactionHash || '',
      transactionIndex: log.transactionIndex,
      logIndex: log.index,
      eventName: parsed.name,
      signature: parsed.signature,
      args,
      raw: {
        topics: log.topics as string[],
        data: log.data,
      },
      metadata,
    };
  }

  private extractMetadata(eventName: string, args: Record<string, any>, contractType?: string): EventMetadata {
    const metadata: EventMetadata = {
      contractType: (contractType as any) || 'UNKNOWN',
    };

    // Token transfer detection
    if (eventName === 'Transfer') {
      metadata.isTokenTransfer = true;

      // NFT transfer if tokenId exists or value is always 1
      if (args.tokenId !== undefined || args.value === '1') {
        metadata.isNFTTransfer = true;
      }
    }

    // DEX operations
    if (['Swap', 'Sync', 'Mint', 'Burn'].includes(eventName)) {
      metadata.isDexSwap = eventName === 'Swap';
      metadata.isLiquidityEvent = ['Mint', 'Burn', 'Sync'].includes(eventName);
    }

    return metadata;
  }

  private decodeWithSignature(log: Log | ethers.EventLog, signature: EventSignature): DecodedEvent {
    const args: Record<string, any> = {};

    try {
      // Create temporary interface for decoding
      const eventFragment = `event ${signature.signature}`;
      const tempInterface = new Interface([eventFragment]);

      const parsed = tempInterface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });

      if (parsed) {
        parsed.fragment.inputs.forEach((input, index) => {
          args[input.name || `arg${index}`] = this.formatValue(parsed.args[index]);
        });
      }
    } catch (error) {
      logger.debug('Failed to decode with signature', { signature, error });

      // Manual decoding fallback
      let topicIndex = 1;
      signature.inputs.forEach((input, index) => {
        if (input.indexed) {
          if (topicIndex < log.topics.length) {
            args[input.name] = log.topics[topicIndex];
            topicIndex++;
          }
        }
      });
    }

    return {
      address: log.address.toLowerCase(),
      blockNumber: log.blockNumber,
      blockHash: log.blockHash || '',
      transactionHash: log.transactionHash || '',
      transactionIndex: log.transactionIndex,
      logIndex: log.index,
      eventName: signature.name,
      signature: signature.signature,
      args,
      raw: {
        topics: log.topics as string[],
        data: log.data,
      },
    };
  }

  private createUndecodedEvent(log: Log | ethers.EventLog): DecodedEvent {
    return {
      address: log.address.toLowerCase(),
      blockNumber: log.blockNumber,
      blockHash: log.blockHash || '',
      transactionHash: log.transactionHash || '',
      transactionIndex: log.transactionIndex,
      logIndex: log.index,
      eventName: 'Unknown',
      signature: log.topics[0],
      args: {},
      raw: {
        topics: log.topics as string[],
        data: log.data,
      },
    };
  }

  private formatValue(value: any): any {
    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (Array.isArray(value)) {
      return value.map(v => this.formatValue(v));
    }

    if (typeof value === 'object' && value !== null) {
      const formatted: any = {};
      for (const [key, val] of Object.entries(value)) {
        if (!/^\d+$/.test(key)) {
          formatted[key] = this.formatValue(val);
        }
      }
      return formatted;
    }

    return value;
  }

  private async getContractABI(address: string): Promise<ContractABI | null> {
    // Check cache
    if (this.abiCache.has(address)) {
      return this.abiCache.get(address)!;
    }

    // Check database
    try {
      const result = await this.pgPool.query(
        'SELECT abi, contract_type FROM contract_abis WHERE address = $1',
        [address]
      );

      if (result.rows.length > 0) {
        const { abi, contract_type } = result.rows[0];
        const contractAbi: ContractABI = {
          address,
          abi,
          interface: new Interface(abi),
          contractType: contract_type,
        };

        this.abiCache.set(address, contractAbi);
        return contractAbi;
      }
    } catch (error) {
      logger.debug('Failed to fetch ABI from database', { address, error });
    }

    // Try fetching from Etherscan (in production, use API key and rate limiting)
    try {
      const abi = await this.fetchABIFromEtherscan(address);
      if (abi) {
        const contractAbi: ContractABI = {
          address,
          abi,
          interface: new Interface(abi),
        };

        this.abiCache.set(address, contractAbi);
        await this.storeABI(address, abi);
        return contractAbi;
      }
    } catch (error) {
      logger.debug('Failed to fetch ABI from Etherscan', { address, error });
    }

    return null;
  }

  private async fetchABIFromEtherscan(address: string): Promise<any[] | null> {
    const apiKey = process.env.ETHERSCAN_API_KEY;
    if (!apiKey) return null;

    try {
      const response = await fetch(
        `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${apiKey}`
      );

      const data = await response.json();
      if (data.status === '1' && data.result) {
        return JSON.parse(data.result);
      }
    } catch (error) {
      logger.debug('Etherscan API error', { address, error });
    }

    return null;
  }

  private async fetchSignatureFromDB(topicHash: string): Promise<EventSignature | null> {
    try {
      const result = await this.pgPool.query(
        'SELECT signature, name, inputs FROM event_signatures WHERE hash = $1',
        [topicHash]
      );

      if (result.rows.length > 0) {
        const { signature, name, inputs } = result.rows[0];
        return {
          signature,
          name,
          inputs: JSON.parse(inputs),
          hash: topicHash,
        };
      }
    } catch (error) {
      logger.debug('Failed to fetch signature from DB', { topicHash, error });
    }

    return null;
  }

  private async fetchSignatureOnline(topicHash: string): Promise<EventSignature | null> {
    // Try OpenChain signatures
    try {
      const response = await fetch(
        `https://api.openchain.xyz/signature-database/v1/lookup?filter=false&event=${topicHash}`
      );

      const data = await response.json();
      if (data.result?.event && data.result.event[topicHash]?.length > 0) {
        const signatureText = data.result.event[topicHash][0].name;
        return this.parseEventSignatureText(signatureText, topicHash);
      }
    } catch (error) {
      logger.debug('OpenChain lookup failed', { topicHash, error });
    }

    // Try 4byte.directory
    try {
      const response = await fetch(
        `https://www.4byte.directory/api/v1/event-signatures/?hex_signature=${topicHash}`
      );

      const data = await response.json();
      if (data.results?.length > 0) {
        return this.parseEventSignatureText(data.results[0].text_signature, topicHash);
      }
    } catch (error) {
      logger.debug('4byte.directory lookup failed', { topicHash, error });
    }

    return null;
  }

  private parseEventSignatureText(signatureText: string, hash: string): EventSignature {
    const match = signatureText.match(/^(\w+)\((.*)\)$/);
    if (!match) {
      throw new Error(`Invalid event signature: ${signatureText}`);
    }

    const [, name, paramsString] = match;
    const paramParts = paramsString.split(',').filter(p => p);

    const inputs = paramParts.map((param) => {
      const trimmed = param.trim();
      const indexed = trimmed.includes(' indexed ');
      const type = indexed
        ? trimmed.replace(' indexed', '').split(' ')[0]
        : trimmed.split(' ')[0];
      const paramName = trimmed.split(' ').pop() || 'arg';

      return {
        name: paramName,
        type,
        indexed,
      };
    });

    return {
      signature: signatureText,
      name,
      inputs,
      hash,
    };
  }

  private async storeABI(address: string, abi: any[]): Promise<void> {
    try {
      // Detect contract type from ABI
      const contractType = this.detectContractType(abi);

      await this.pgPool.query(
        `INSERT INTO contract_abis (address, abi, contract_type, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (address) DO UPDATE SET
           abi = EXCLUDED.abi,
           contract_type = EXCLUDED.contract_type`,
        [address, JSON.stringify(abi), contractType]
      );
    } catch (error) {
      logger.error('Failed to store ABI', { address, error });
    }
  }

  private detectContractType(abi: any[]): string {
    const functionNames = abi
      .filter(item => item.type === 'function')
      .map(item => item.name);

    const eventNames = abi
      .filter(item => item.type === 'event')
      .map(item => item.name);

    // ERC20
    if (
      functionNames.includes('transfer') &&
      functionNames.includes('balanceOf') &&
      eventNames.includes('Transfer')
    ) {
      return 'ERC20';
    }

    // ERC721
    if (
      functionNames.includes('ownerOf') &&
      functionNames.includes('safeTransferFrom') &&
      eventNames.includes('Transfer')
    ) {
      return 'ERC721';
    }

    // ERC1155
    if (
      eventNames.includes('TransferSingle') ||
      eventNames.includes('TransferBatch')
    ) {
      return 'ERC1155';
    }

    // Uniswap V2 Pair
    if (
      functionNames.includes('swap') &&
      eventNames.includes('Sync') &&
      eventNames.includes('Swap')
    ) {
      return 'UNISWAP_V2_PAIR';
    }

    // Uniswap V3 Pool
    if (
      functionNames.includes('flash') &&
      eventNames.includes('Swap') &&
      functionNames.includes('observe')
    ) {
      return 'UNISWAP_V3_POOL';
    }

    return 'UNKNOWN';
  }

  private async storeSignature(signature: EventSignature): Promise<void> {
    try {
      await this.pgPool.query(
        `INSERT INTO event_signatures (hash, signature, name, inputs)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (hash) DO NOTHING`,
        [
          signature.hash,
          signature.signature,
          signature.name,
          JSON.stringify(signature.inputs),
        ]
      );
    } catch (error) {
      logger.error('Failed to store signature', { signature, error });
    }
  }

  async getDecodedEvents(
    filter: {
      address?: string;
      eventName?: string;
      fromBlock?: number;
      toBlock?: number;
      limit?: number;
    }
  ): Promise<DecodedEvent[]> {
    let query = 'SELECT * FROM events WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filter.address) {
      query += ` AND address = $${paramCount++}`;
      params.push(filter.address.toLowerCase());
    }

    if (filter.eventName) {
      query += ` AND event_name = $${paramCount++}`;
      params.push(filter.eventName);
    }

    if (filter.fromBlock !== undefined) {
      query += ` AND block_number >= $${paramCount++}`;
      params.push(filter.fromBlock);
    }

    if (filter.toBlock !== undefined) {
      query += ` AND block_number <= $${paramCount++}`;
      params.push(filter.toBlock);
    }

    query += ' ORDER BY block_number DESC, log_index DESC';

    if (filter.limit) {
      query += ` LIMIT $${paramCount++}`;
      params.push(filter.limit);
    }

    const result = await this.pgPool.query(query, params);

    return result.rows.map(row => ({
      address: row.address,
      blockNumber: row.block_number,
      blockHash: row.block_hash,
      transactionHash: row.transaction_hash,
      transactionIndex: row.transaction_index,
      logIndex: row.log_index,
      eventName: row.event_name,
      signature: row.event_signature,
      args: row.args,
      raw: row.raw_log,
    }));
  }

  clearCache(): void {
    this.signatureCache.clear();
    this.abiCache.clear();
    this.interfaceCache.clear();
    logger.info('Event decoder cache cleared');
  }
}
