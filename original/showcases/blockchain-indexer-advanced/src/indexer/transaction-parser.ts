import { ethers } from 'ethers';
import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';
import { retry, exponentialBackoff } from '../utils/retry';
import { Interface, AbiCoder, Fragment } from 'ethers';

interface ParsedTransaction {
  hash: string;
  blockNumber: number;
  blockHash: string;
  from: string;
  to: string | null;
  value: bigint;
  gasLimit: bigint;
  gasPrice: bigint | null;
  maxFeePerGas: bigint | null;
  maxPriorityFeePerGas: bigint | null;
  nonce: number;
  data: string;
  type: number;
  chainId: bigint | null;
  accessList?: any[];
  transactionIndex: number;
  signature: {
    v: number;
    r: string;
    s: string;
  };
  decoded?: DecodedInput;
  isContractCreation: boolean;
  isTokenTransfer: boolean;
  tokenTransfers?: TokenTransfer[];
}

interface DecodedInput {
  methodName: string;
  signature: string;
  params: Array<{
    name: string;
    type: string;
    value: any;
  }>;
}

interface TokenTransfer {
  type: 'ERC20' | 'ERC721' | 'ERC1155';
  token: string;
  from: string;
  to: string;
  value?: bigint;
  tokenId?: bigint;
  amount?: bigint;
}

interface MethodSignature {
  signature: string;
  name: string;
  inputs: Array<{
    name: string;
    type: string;
  }>;
}

export class TransactionParser {
  private provider: ethers.JsonRpcProvider;
  private pgPool: Pool;
  private methodSignatureCache: Map<string, MethodSignature>;
  private contractAbiCache: Map<string, Interface>;
  private knownMethodSignatures: Map<string, string>;

  // Common ERC20/721/1155 interfaces
  private erc20Interface: Interface;
  private erc721Interface: Interface;
  private erc1155Interface: Interface;

  constructor(provider: ethers.JsonRpcProvider, pgPool: Pool) {
    this.provider = provider;
    this.pgPool = pgPool;
    this.methodSignatureCache = new Map();
    this.contractAbiCache = new Map();
    this.knownMethodSignatures = new Map();

    this.initializeKnownSignatures();
    this.initializeTokenInterfaces();
  }

  private initializeKnownSignatures(): void {
    // Common method signatures
    const signatures = {
      '0xa9059cbb': 'transfer(address,uint256)',
      '0x23b872dd': 'transferFrom(address,address,uint256)',
      '0x095ea7b3': 'approve(address,uint256)',
      '0x70a08231': 'balanceOf(address)',
      '0x18160ddd': 'totalSupply()',
      '0xdd62ed3e': 'allowance(address,address)',
      '0x313ce567': 'decimals()',
      '0x06fdde03': 'name()',
      '0x95d89b41': 'symbol()',
      '0x40c10f19': 'mint(address,uint256)',
      '0x42966c68': 'burn(uint256)',
      '0x9dc29fac': 'burnFrom(address,uint256)',
      '0x42842e0e': 'safeTransferFrom(address,address,uint256)',
      '0xb88d4fde': 'safeTransferFrom(address,address,uint256,bytes)',
      '0x2eb2c2d6': 'safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)',
      '0xf242432a': 'safeTransferFrom(address,address,uint256,uint256,bytes)',
      '0xe985e9c5': 'isApprovedForAll(address,address)',
      '0xa22cb465': 'setApprovalForAll(address,bool)',
      '0x3ccfd60b': 'withdraw()',
      '0xd0e30db0': 'deposit()',
      '0x2e1a7d4d': 'withdraw(uint256)',
      '0xb6b55f25': 'deposit(uint256)',
      '0x38ed1739': 'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)',
      '0x7ff36ab5': 'swapExactETHForTokens(uint256,address[],address,uint256)',
      '0x18cbafe5': 'swapExactTokensForETH(uint256,uint256,address[],address,uint256)',
      '0xfb3bdb41': 'swapETHForExactTokens(uint256,address[],address,uint256)',
      '0x4a25d94a': 'swapTokensForExactETH(uint256,uint256,address[],address,uint256)',
      '0x8803dbee': 'swapTokensForExactTokens(uint256,uint256,address[],address,uint256)',
    };

    for (const [selector, signature] of Object.entries(signatures)) {
      this.knownMethodSignatures.set(selector, signature);
    }
  }

  private initializeTokenInterfaces(): void {
    // ERC20 interface
    this.erc20Interface = new Interface([
      'event Transfer(address indexed from, address indexed to, uint256 value)',
      'event Approval(address indexed owner, address indexed spender, uint256 value)',
      'function transfer(address to, uint256 value) returns (bool)',
      'function transferFrom(address from, address to, uint256 value) returns (bool)',
      'function approve(address spender, uint256 value) returns (bool)',
      'function balanceOf(address account) view returns (uint256)',
      'function totalSupply() view returns (uint256)',
      'function allowance(address owner, address spender) view returns (uint256)',
    ]);

    // ERC721 interface
    this.erc721Interface = new Interface([
      'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
      'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
      'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
      'function safeTransferFrom(address from, address to, uint256 tokenId)',
      'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)',
      'function transferFrom(address from, address to, uint256 tokenId)',
      'function approve(address to, uint256 tokenId)',
      'function setApprovalForAll(address operator, bool approved)',
    ]);

    // ERC1155 interface
    this.erc1155Interface = new Interface([
      'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
      'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
      'event ApprovalForAll(address indexed account, address indexed operator, bool approved)',
      'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
      'function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)',
      'function setApprovalForAll(address operator, bool approved)',
    ]);
  }

  async parseAndStore(
    client: PoolClient,
    block: ethers.Block,
    tx: ethers.TransactionResponse
  ): Promise<ParsedTransaction> {
    const parsed = await this.parseTransaction(block, tx);

    await this.storeTransaction(client, parsed);

    // Store additional metadata
    if (parsed.decoded) {
      await this.storeDecodedInput(client, parsed);
    }

    if (parsed.tokenTransfers && parsed.tokenTransfers.length > 0) {
      await this.storeTokenTransfers(client, parsed);
    }

    // Update address information
    await this.updateAddressStats(client, parsed);

    return parsed;
  }

  private async parseTransaction(
    block: ethers.Block,
    tx: ethers.TransactionResponse
  ): Promise<ParsedTransaction> {
    const isContractCreation = !tx.to;
    const isTokenTransfer = this.isTokenTransfer(tx.data);

    const parsed: ParsedTransaction = {
      hash: tx.hash,
      blockNumber: tx.blockNumber || block.number,
      blockHash: tx.blockHash || block.hash || '',
      from: tx.from,
      to: tx.to,
      value: tx.value,
      gasLimit: tx.gasLimit,
      gasPrice: tx.gasPrice,
      maxFeePerGas: tx.maxFeePerGas || null,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas || null,
      nonce: tx.nonce,
      data: tx.data,
      type: tx.type || 0,
      chainId: tx.chainId,
      accessList: (tx as any).accessList,
      transactionIndex: tx.index,
      signature: {
        v: tx.signature?.v || 0,
        r: tx.signature?.r || '0x',
        s: tx.signature?.s || '0x',
      },
      isContractCreation,
      isTokenTransfer,
    };

    // Decode input data if available
    if (tx.data && tx.data !== '0x' && tx.to) {
      try {
        parsed.decoded = await this.decodeInput(tx.to, tx.data);
      } catch (error) {
        logger.debug('Failed to decode input', { hash: tx.hash, error });
      }
    }

    // Extract token transfers
    if (isTokenTransfer) {
      try {
        parsed.tokenTransfers = await this.extractTokenTransfers(tx);
      } catch (error) {
        logger.debug('Failed to extract token transfers', { hash: tx.hash, error });
      }
    }

    return parsed;
  }

  private isTokenTransfer(data: string): boolean {
    if (!data || data.length < 10) return false;

    const selector = data.slice(0, 10).toLowerCase();

    // ERC20 transfer methods
    const erc20Selectors = [
      '0xa9059cbb', // transfer
      '0x23b872dd', // transferFrom
    ];

    // ERC721 transfer methods
    const erc721Selectors = [
      '0x42842e0e', // safeTransferFrom(address,address,uint256)
      '0xb88d4fde', // safeTransferFrom(address,address,uint256,bytes)
    ];

    // ERC1155 transfer methods
    const erc1155Selectors = [
      '0xf242432a', // safeTransferFrom
      '0x2eb2c2d6', // safeBatchTransferFrom
    ];

    return (
      erc20Selectors.includes(selector) ||
      erc721Selectors.includes(selector) ||
      erc1155Selectors.includes(selector)
    );
  }

  private async extractTokenTransfers(tx: ethers.TransactionResponse): Promise<TokenTransfer[]> {
    if (!tx.to || !tx.data) return [];

    const selector = tx.data.slice(0, 10).toLowerCase();
    const transfers: TokenTransfer[] = [];

    try {
      // Try ERC20
      if (['0xa9059cbb', '0x23b872dd'].includes(selector)) {
        const decoded = this.erc20Interface.parseTransaction({ data: tx.data });
        if (decoded) {
          transfers.push({
            type: 'ERC20',
            token: tx.to,
            from: selector === '0x23b872dd' ? decoded.args[0] : tx.from,
            to: selector === '0x23b872dd' ? decoded.args[1] : decoded.args[0],
            value: decoded.args[selector === '0x23b872dd' ? 2 : 1],
          });
        }
      }

      // Try ERC721
      if (['0x42842e0e', '0xb88d4fde', '0x23b872dd'].includes(selector)) {
        try {
          const decoded = this.erc721Interface.parseTransaction({ data: tx.data });
          if (decoded) {
            transfers.push({
              type: 'ERC721',
              token: tx.to,
              from: decoded.args[0],
              to: decoded.args[1],
              tokenId: decoded.args[2],
            });
          }
        } catch (e) {
          // Not ERC721
        }
      }

      // Try ERC1155
      if (['0xf242432a', '0x2eb2c2d6'].includes(selector)) {
        const decoded = this.erc1155Interface.parseTransaction({ data: tx.data });
        if (decoded) {
          if (selector === '0xf242432a') {
            // Single transfer
            transfers.push({
              type: 'ERC1155',
              token: tx.to,
              from: decoded.args[0],
              to: decoded.args[1],
              tokenId: decoded.args[2],
              amount: decoded.args[3],
            });
          } else {
            // Batch transfer
            const ids = decoded.args[2] as bigint[];
            const amounts = decoded.args[3] as bigint[];

            for (let i = 0; i < ids.length; i++) {
              transfers.push({
                type: 'ERC1155',
                token: tx.to,
                from: decoded.args[0],
                to: decoded.args[1],
                tokenId: ids[i],
                amount: amounts[i],
              });
            }
          }
        }
      }
    } catch (error) {
      logger.debug('Failed to extract token transfers', { hash: tx.hash, error });
    }

    return transfers;
  }

  private async decodeInput(contractAddress: string, data: string): Promise<DecodedInput | undefined> {
    if (!data || data === '0x' || data.length < 10) return undefined;

    const selector = data.slice(0, 10).toLowerCase();

    // Check cache first
    const cachedSignature = this.methodSignatureCache.get(selector);
    if (cachedSignature) {
      return this.decodeWithSignature(data, cachedSignature);
    }

    // Try known signatures
    const knownSignature = this.knownMethodSignatures.get(selector);
    if (knownSignature) {
      const signature = this.parseSignature(knownSignature);
      this.methodSignatureCache.set(selector, signature);
      return this.decodeWithSignature(data, signature);
    }

    // Try to fetch ABI from database
    try {
      const result = await this.pgPool.query(
        'SELECT abi FROM contract_abis WHERE address = $1',
        [contractAddress.toLowerCase()]
      );

      if (result.rows.length > 0) {
        const abi = result.rows[0].abi;
        const iface = new Interface(abi);
        this.contractAbiCache.set(contractAddress, iface);

        const decoded = iface.parseTransaction({ data });
        if (decoded) {
          return this.formatDecodedTransaction(decoded);
        }
      }
    } catch (error) {
      logger.debug('Failed to fetch ABI', { contractAddress, error });
    }

    // Try 4byte.directory API (in production, cache this)
    try {
      const signature = await this.fetch4ByteSignature(selector);
      if (signature) {
        this.methodSignatureCache.set(selector, signature);
        return this.decodeWithSignature(data, signature);
      }
    } catch (error) {
      logger.debug('Failed to fetch from 4byte.directory', { selector, error });
    }

    // Return basic info
    return {
      methodName: 'unknown',
      signature: selector,
      params: [],
    };
  }

  private parseSignature(signatureString: string): MethodSignature {
    const match = signatureString.match(/^(\w+)\((.*)\)$/);
    if (!match) {
      throw new Error(`Invalid signature: ${signatureString}`);
    }

    const [, name, paramsString] = match;
    const inputs = paramsString.split(',').filter(p => p).map((param, index) => {
      const type = param.trim();
      return {
        name: `param${index}`,
        type,
      };
    });

    return {
      signature: signatureString,
      name,
      inputs,
    };
  }

  private decodeWithSignature(data: string, signature: MethodSignature): DecodedInput {
    try {
      const iface = new Interface([`function ${signature.signature}`]);
      const decoded = iface.parseTransaction({ data });

      if (decoded) {
        return this.formatDecodedTransaction(decoded);
      }
    } catch (error) {
      logger.debug('Failed to decode with signature', { signature, error });
    }

    return {
      methodName: signature.name,
      signature: signature.signature,
      params: [],
    };
  }

  private formatDecodedTransaction(decoded: ethers.TransactionDescription): DecodedInput {
    const params = decoded.fragment.inputs.map((input, index) => ({
      name: input.name || `param${index}`,
      type: input.type,
      value: this.formatValue(decoded.args[index]),
    }));

    return {
      methodName: decoded.name,
      signature: decoded.signature,
      params,
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
        formatted[key] = this.formatValue(val);
      }
      return formatted;
    }

    return value;
  }

  private async fetch4ByteSignature(selector: string): Promise<MethodSignature | null> {
    // Note: In production, implement proper rate limiting and caching
    try {
      const response = await fetch(
        `https://www.4byte.directory/api/v1/signatures/?hex_signature=${selector}`
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return this.parseSignature(data.results[0].text_signature);
      }
    } catch (error) {
      logger.debug('4byte.directory fetch failed', { selector, error });
    }

    return null;
  }

  private async storeTransaction(client: PoolClient, parsed: ParsedTransaction): Promise<void> {
    await client.query(
      `INSERT INTO transactions (
        hash, block_number, block_hash, transaction_index,
        from_address, to_address, value, gas_limit, gas_price,
        max_fee_per_gas, max_priority_fee_per_gas, nonce, data,
        type, chain_id, v, r, s,
        is_contract_creation, is_token_transfer
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      ON CONFLICT (hash) DO UPDATE SET
        block_number = EXCLUDED.block_number,
        block_hash = EXCLUDED.block_hash,
        transaction_index = EXCLUDED.transaction_index`,
      [
        parsed.hash,
        parsed.blockNumber,
        parsed.blockHash,
        parsed.transactionIndex,
        parsed.from.toLowerCase(),
        parsed.to?.toLowerCase() || null,
        parsed.value.toString(),
        parsed.gasLimit.toString(),
        parsed.gasPrice?.toString() || null,
        parsed.maxFeePerGas?.toString() || null,
        parsed.maxPriorityFeePerGas?.toString() || null,
        parsed.nonce,
        parsed.data,
        parsed.type,
        parsed.chainId?.toString() || null,
        parsed.signature.v,
        parsed.signature.r,
        parsed.signature.s,
        parsed.isContractCreation,
        parsed.isTokenTransfer,
      ]
    );
  }

  private async storeDecodedInput(client: PoolClient, parsed: ParsedTransaction): Promise<void> {
    if (!parsed.decoded) return;

    await client.query(
      `INSERT INTO transaction_inputs (
        transaction_hash, method_name, method_signature, params
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (transaction_hash) DO UPDATE SET
        method_name = EXCLUDED.method_name,
        method_signature = EXCLUDED.method_signature,
        params = EXCLUDED.params`,
      [
        parsed.hash,
        parsed.decoded.methodName,
        parsed.decoded.signature,
        JSON.stringify(parsed.decoded.params),
      ]
    );
  }

  private async storeTokenTransfers(client: PoolClient, parsed: ParsedTransaction): Promise<void> {
    if (!parsed.tokenTransfers) return;

    for (const transfer of parsed.tokenTransfers) {
      await client.query(
        `INSERT INTO token_transfers (
          transaction_hash, block_number, token_address, token_type,
          from_address, to_address, value, token_id, amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          parsed.hash,
          parsed.blockNumber,
          transfer.token.toLowerCase(),
          transfer.type,
          transfer.from.toLowerCase(),
          transfer.to.toLowerCase(),
          transfer.value?.toString() || null,
          transfer.tokenId?.toString() || null,
          transfer.amount?.toString() || null,
        ]
      );
    }
  }

  private async updateAddressStats(client: PoolClient, parsed: ParsedTransaction): Promise<void> {
    // Update sender stats
    await client.query(
      `INSERT INTO addresses (address, first_seen, last_seen, transaction_count, total_sent)
       VALUES ($1, $2, $3, 1, $4)
       ON CONFLICT (address) DO UPDATE SET
         last_seen = EXCLUDED.last_seen,
         transaction_count = addresses.transaction_count + 1,
         total_sent = addresses.total_sent + EXCLUDED.total_sent`,
      [
        parsed.from.toLowerCase(),
        parsed.blockNumber,
        parsed.blockNumber,
        parsed.value.toString(),
      ]
    );

    // Update receiver stats
    if (parsed.to) {
      await client.query(
        `INSERT INTO addresses (address, first_seen, last_seen, transaction_count, total_received)
         VALUES ($1, $2, $3, 1, $4)
         ON CONFLICT (address) DO UPDATE SET
           last_seen = EXCLUDED.last_seen,
           transaction_count = addresses.transaction_count + 1,
           total_received = addresses.total_received + EXCLUDED.total_received`,
        [
          parsed.to.toLowerCase(),
          parsed.blockNumber,
          parsed.blockNumber,
          parsed.value.toString(),
        ]
      );
    }

    // If contract creation, mark address as contract
    if (parsed.isContractCreation) {
      const receipt = await retry(
        () => this.provider.getTransactionReceipt(parsed.hash),
        { retries: 3, backoff: exponentialBackoff }
      );

      if (receipt?.contractAddress) {
        await client.query(
          `UPDATE addresses SET is_contract = true WHERE address = $1`,
          [receipt.contractAddress.toLowerCase()]
        );
      }
    }
  }

  async getTransaction(hash: string): Promise<ParsedTransaction | null> {
    try {
      const result = await this.pgPool.query(
        `SELECT
          t.*,
          ti.method_name,
          ti.method_signature,
          ti.params
         FROM transactions t
         LEFT JOIN transaction_inputs ti ON t.hash = ti.transaction_hash
         WHERE t.hash = $1`,
        [hash.toLowerCase()]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return this.rowToTransaction(row);
    } catch (error) {
      logger.error('Failed to get transaction', { hash, error });
      return null;
    }
  }

  private rowToTransaction(row: any): ParsedTransaction {
    const parsed: ParsedTransaction = {
      hash: row.hash,
      blockNumber: row.block_number,
      blockHash: row.block_hash,
      from: row.from_address,
      to: row.to_address,
      value: BigInt(row.value),
      gasLimit: BigInt(row.gas_limit),
      gasPrice: row.gas_price ? BigInt(row.gas_price) : null,
      maxFeePerGas: row.max_fee_per_gas ? BigInt(row.max_fee_per_gas) : null,
      maxPriorityFeePerGas: row.max_priority_fee_per_gas ? BigInt(row.max_priority_fee_per_gas) : null,
      nonce: row.nonce,
      data: row.data,
      type: row.type,
      chainId: row.chain_id ? BigInt(row.chain_id) : null,
      transactionIndex: row.transaction_index,
      signature: {
        v: row.v,
        r: row.r,
        s: row.s,
      },
      isContractCreation: row.is_contract_creation,
      isTokenTransfer: row.is_token_transfer,
    };

    if (row.method_name) {
      parsed.decoded = {
        methodName: row.method_name,
        signature: row.method_signature,
        params: row.params,
      };
    }

    return parsed;
  }
}
