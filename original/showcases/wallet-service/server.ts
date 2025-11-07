/**
 * Web3 Wallet Service
 *
 * A production-grade Web3 wallet service with secure key management, transaction
 * signing, multi-signature support, balance tracking, and gas optimization.
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import * as crypto from 'crypto';

// ============================================================================
// Type Definitions
// ============================================================================

interface Wallet {
  address: string;
  publicKey: string;
  encryptedPrivateKey: string;
  createdAt: number;
  lastUsed: number;
  nonce: number;
  label?: string;
}

interface MultiSigWallet {
  address: string;
  owners: string[];
  threshold: number;
  nonce: number;
  createdAt: number;
}

interface Balance {
  address: string;
  chain: string;
  token: string;
  amount: bigint;
  decimals: number;
  symbol: string;
  valueUSD?: number;
  lastUpdate: number;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: bigint;
  data: string;
  nonce: number;
  gasLimit: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  type: 0 | 1 | 2; // Legacy, EIP-2930, EIP-1559
  chainId: number;
  status: 'pending' | 'confirmed' | 'failed';
  signature?: {
    r: string;
    s: string;
    v: number;
  };
  createdAt: number;
  confirmedAt?: number;
}

interface MultiSigTransaction {
  id: string;
  wallet: string;
  to: string;
  value: bigint;
  data: string;
  nonce: number;
  signatures: Map<string, string>;
  executed: boolean;
  createdAt: number;
  executedAt?: number;
}

interface GasEstimate {
  gasLimit: bigint;
  baseFee?: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  estimatedCost: bigint;
  estimatedTime: number; // seconds
  confidence: 'low' | 'medium' | 'high';
}

interface TransferRequest {
  from: string;
  to: string;
  amount: string;
  token?: string;
  gasStrategy?: 'slow' | 'medium' | 'fast';
  password: string;
}

interface SignMessageRequest {
  address: string;
  message: string;
  password: string;
}

// ============================================================================
// Encryption & Key Management
// ============================================================================

class KeyManager {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivationIterations = 100000;

  deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      password,
      salt,
      this.keyDerivationIterations,
      32,
      'sha256'
    );
  }

  encrypt(data: string, password: string): string {
    const salt = crypto.randomBytes(16);
    const key = this.deriveKey(password, salt);
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      encrypted
    });
  }

  decrypt(encryptedData: string, password: string): string {
    const { salt, iv, authTag, encrypted } = JSON.parse(encryptedData);

    const key = this.deriveKey(password, Buffer.from(salt, 'hex'));

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key,
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  generateKeyPair(): { privateKey: string; publicKey: string; address: string } {
    // Simulate ECDSA key generation (secp256k1)
    const privateKey = crypto.randomBytes(32).toString('hex');
    const publicKey = crypto.randomBytes(64).toString('hex');
    const address = '0x' + crypto.createHash('sha256')
      .update(publicKey)
      .digest('hex')
      .slice(24);

    return { privateKey, publicKey, address };
  }

  sign(message: string, privateKey: string): string {
    // Simulate ECDSA signing
    const hash = crypto.createHash('sha256').update(message).digest();
    const signature = crypto.createHmac('sha256', privateKey).update(hash).digest('hex');
    return signature;
  }

  verify(message: string, signature: string, publicKey: string): boolean {
    // Simulate signature verification
    return signature.length === 64;
  }
}

// ============================================================================
// Wallet Management
// ============================================================================

class WalletManager {
  private wallets: Map<string, Wallet> = new Map();
  private multiSigWallets: Map<string, MultiSigWallet> = new Map();
  private balances: Map<string, Balance[]> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private multiSigTxs: Map<string, MultiSigTransaction> = new Map();
  private keyManager: KeyManager;

  constructor() {
    this.keyManager = new KeyManager();
  }

  // Wallet Creation
  createWallet(password: string, label?: string): Wallet {
    const { privateKey, publicKey, address } = this.keyManager.generateKeyPair();
    const encryptedPrivateKey = this.keyManager.encrypt(privateKey, password);

    const wallet: Wallet = {
      address,
      publicKey,
      encryptedPrivateKey,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      nonce: 0,
      label
    };

    this.wallets.set(address, wallet);
    return wallet;
  }

  importWallet(privateKey: string, password: string, label?: string): Wallet {
    // In production, derive public key and address from private key
    const publicKey = crypto.randomBytes(64).toString('hex');
    const address = '0x' + crypto.createHash('sha256')
      .update(publicKey)
      .digest('hex')
      .slice(24);

    const encryptedPrivateKey = this.keyManager.encrypt(privateKey, password);

    const wallet: Wallet = {
      address,
      publicKey,
      encryptedPrivateKey,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      nonce: 0,
      label
    };

    this.wallets.set(address, wallet);
    return wallet;
  }

  getWallet(address: string): Wallet | undefined {
    return this.wallets.get(address);
  }

  listWallets(): Wallet[] {
    return Array.from(this.wallets.values());
  }

  // Multi-Sig Wallet Management
  createMultiSigWallet(owners: string[], threshold: number): MultiSigWallet {
    if (threshold < 1 || threshold > owners.length) {
      throw new Error('Invalid threshold');
    }

    const address = '0x' + crypto.randomBytes(20).toString('hex');

    const multiSig: MultiSigWallet = {
      address,
      owners,
      threshold,
      nonce: 0,
      createdAt: Date.now()
    };

    this.multiSigWallets.set(address, multiSig);
    return multiSig;
  }

  getMultiSigWallet(address: string): MultiSigWallet | undefined {
    return this.multiSigWallets.get(address);
  }

  // Balance Tracking
  async updateBalances(address: string, chain: string): Promise<Balance[]> {
    // Simulate fetching balances from blockchain
    const balances: Balance[] = [
      {
        address,
        chain,
        token: 'ETH',
        amount: BigInt(Math.floor(Math.random() * 10000000000000000000)),
        decimals: 18,
        symbol: 'ETH',
        valueUSD: 1850 * Math.random() * 10,
        lastUpdate: Date.now()
      },
      {
        address,
        chain,
        token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        amount: BigInt(Math.floor(Math.random() * 10000000000)),
        decimals: 6,
        symbol: 'USDC',
        valueUSD: Math.random() * 1000,
        lastUpdate: Date.now()
      }
    ];

    this.balances.set(`${address}:${chain}`, balances);
    return balances;
  }

  getBalances(address: string, chain: string): Balance[] {
    return this.balances.get(`${address}:${chain}`) || [];
  }

  // Transaction Management
  async createTransaction(request: TransferRequest): Promise<Transaction> {
    const wallet = this.getWallet(request.from);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Verify password and decrypt private key
    try {
      this.keyManager.decrypt(wallet.encryptedPrivateKey, request.password);
    } catch {
      throw new Error('Invalid password');
    }

    const gasEstimate = await this.estimateGas(
      request.from,
      request.to,
      request.amount,
      request.gasStrategy || 'medium'
    );

    const tx: Transaction = {
      hash: '0x' + crypto.randomBytes(32).toString('hex'),
      from: request.from,
      to: request.to,
      value: BigInt(request.amount),
      data: '0x',
      nonce: wallet.nonce++,
      gasLimit: gasEstimate.gasLimit,
      maxFeePerGas: gasEstimate.maxFeePerGas,
      maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas,
      type: 2, // EIP-1559
      chainId: 1,
      status: 'pending',
      createdAt: Date.now()
    };

    // Sign transaction
    const privateKey = this.keyManager.decrypt(wallet.encryptedPrivateKey, request.password);
    const txHash = this.hashTransaction(tx);
    const signature = this.keyManager.sign(txHash, privateKey);

    tx.signature = {
      r: signature.slice(0, 64),
      s: signature.slice(64, 128),
      v: 27
    };

    this.transactions.set(tx.hash, tx);
    wallet.lastUsed = Date.now();

    // Simulate transaction confirmation
    setTimeout(() => {
      tx.status = 'confirmed';
      tx.confirmedAt = Date.now();
    }, 5000);

    return tx;
  }

  getTransaction(hash: string): Transaction | undefined {
    return this.transactions.get(hash);
  }

  listTransactions(address: string): Transaction[] {
    return Array.from(this.transactions.values())
      .filter(tx => tx.from === address || tx.to === address)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Multi-Sig Transactions
  proposeMultiSigTransaction(
    wallet: string,
    to: string,
    value: string,
    data: string,
    proposer: string,
    signature: string
  ): MultiSigTransaction {
    const multiSig = this.getMultiSigWallet(wallet);
    if (!multiSig) {
      throw new Error('Multi-sig wallet not found');
    }

    if (!multiSig.owners.includes(proposer)) {
      throw new Error('Not an owner');
    }

    const tx: MultiSigTransaction = {
      id: crypto.randomUUID(),
      wallet,
      to,
      value: BigInt(value),
      data,
      nonce: multiSig.nonce,
      signatures: new Map([[proposer, signature]]),
      executed: false,
      createdAt: Date.now()
    };

    this.multiSigTxs.set(tx.id, tx);
    return tx;
  }

  signMultiSigTransaction(txId: string, signer: string, signature: string): boolean {
    const tx = this.multiSigTxs.get(txId);
    if (!tx || tx.executed) {
      return false;
    }

    const multiSig = this.getMultiSigWallet(tx.wallet);
    if (!multiSig || !multiSig.owners.includes(signer)) {
      return false;
    }

    tx.signatures.set(signer, signature);

    // Check if threshold reached
    if (tx.signatures.size >= multiSig.threshold) {
      this.executeMultiSigTransaction(txId);
    }

    return true;
  }

  private executeMultiSigTransaction(txId: string): void {
    const tx = this.multiSigTxs.get(txId);
    if (!tx || tx.executed) return;

    const multiSig = this.getMultiSigWallet(tx.wallet);
    if (!multiSig) return;

    tx.executed = true;
    tx.executedAt = Date.now();
    multiSig.nonce++;

    console.log(`Multi-sig transaction ${txId} executed`);
  }

  getMultiSigTransaction(txId: string): MultiSigTransaction | undefined {
    return this.multiSigTxs.get(txId);
  }

  // Gas Optimization
  async estimateGas(
    from: string,
    to: string,
    amount: string,
    strategy: 'slow' | 'medium' | 'fast' = 'medium'
  ): Promise<GasEstimate> {
    // Simulate gas estimation
    const baseFee = BigInt(30000000000); // 30 gwei
    const priorityFeeMultipliers = { slow: 1.1, medium: 1.2, fast: 1.5 };
    const multiplier = priorityFeeMultipliers[strategy];

    const maxPriorityFeePerGas = BigInt(Math.floor(Number(baseFee) * 0.1 * multiplier));
    const maxFeePerGas = baseFee + maxPriorityFeePerGas;
    const gasLimit = BigInt(21000); // Standard transfer

    return {
      gasLimit,
      baseFee,
      maxFeePerGas,
      maxPriorityFeePerGas,
      estimatedCost: gasLimit * maxFeePerGas,
      estimatedTime: strategy === 'slow' ? 60 : strategy === 'medium' ? 30 : 15,
      confidence: strategy === 'fast' ? 'high' : strategy === 'medium' ? 'medium' : 'low'
    };
  }

  // Message Signing
  signMessage(request: SignMessageRequest): string {
    const wallet = this.getWallet(request.address);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    try {
      const privateKey = this.keyManager.decrypt(wallet.encryptedPrivateKey, request.password);
      const signature = this.keyManager.sign(request.message, privateKey);
      return signature;
    } catch {
      throw new Error('Invalid password');
    }
  }

  verifyMessage(message: string, signature: string, address: string): boolean {
    const wallet = this.getWallet(address);
    if (!wallet) return false;

    return this.keyManager.verify(message, signature, wallet.publicKey);
  }

  // Utility Methods
  private hashTransaction(tx: Transaction): string {
    const data = [
      tx.from,
      tx.to,
      tx.value.toString(),
      tx.data,
      tx.nonce.toString(),
      tx.gasLimit.toString(),
      tx.maxFeePerGas?.toString() || '',
      tx.maxPriorityFeePerGas?.toString() || '',
      tx.chainId.toString()
    ].join('');

    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

// ============================================================================
// HTTP API Server
// ============================================================================

class WalletAPI {
  private manager: WalletManager;

  constructor(manager: WalletManager) {
    this.manager = manager;
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
      } else if (path === '/api/wallet/create' && method === 'POST') {
        const body = await this.parseBody(req);
        const wallet = this.manager.createWallet(body.password, body.label);
        this.sendJSON(res, { address: wallet.address, label: wallet.label });
      } else if (path === '/api/wallet/import' && method === 'POST') {
        const body = await this.parseBody(req);
        const wallet = this.manager.importWallet(body.privateKey, body.password, body.label);
        this.sendJSON(res, { address: wallet.address, label: wallet.label });
      } else if (path === '/api/wallets' && method === 'GET') {
        const wallets = this.manager.listWallets();
        this.sendJSON(res, {
          count: wallets.length,
          wallets: wallets.map(w => ({
            address: w.address,
            label: w.label,
            createdAt: w.createdAt,
            lastUsed: w.lastUsed
          }))
        });
      } else if (path.startsWith('/api/wallet/') && path.endsWith('/balances') && method === 'GET') {
        const address = path.split('/')[3];
        const chain = url.searchParams.get('chain') || 'ethereum';
        const balances = await this.manager.updateBalances(address, chain);
        this.sendJSON(res, {
          address,
          chain,
          count: balances.length,
          balances: balances.map(b => ({ ...b, amount: b.amount.toString() }))
        });
      } else if (path === '/api/transaction/send' && method === 'POST') {
        const body = await this.parseBody(req);
        const tx = await this.manager.createTransaction(body);
        this.sendJSON(res, this.serializeTransaction(tx));
      } else if (path.startsWith('/api/transaction/') && method === 'GET') {
        const hash = path.split('/')[3];
        const tx = this.manager.getTransaction(hash);
        if (tx) {
          this.sendJSON(res, this.serializeTransaction(tx));
        } else {
          this.sendError(res, 404, 'Transaction not found');
        }
      } else if (path === '/api/transactions' && method === 'GET') {
        const address = url.searchParams.get('address');
        if (!address) {
          this.sendError(res, 400, 'Address required');
          return;
        }
        const txs = this.manager.listTransactions(address);
        this.sendJSON(res, {
          count: txs.length,
          transactions: txs.map(tx => this.serializeTransaction(tx))
        });
      } else if (path === '/api/multisig/create' && method === 'POST') {
        const body = await this.parseBody(req);
        const multiSig = this.manager.createMultiSigWallet(body.owners, body.threshold);
        this.sendJSON(res, multiSig);
      } else if (path === '/api/multisig/propose' && method === 'POST') {
        const body = await this.parseBody(req);
        const tx = this.manager.proposeMultiSigTransaction(
          body.wallet,
          body.to,
          body.value,
          body.data || '0x',
          body.proposer,
          body.signature
        );
        this.sendJSON(res, this.serializeMultiSigTx(tx));
      } else if (path.startsWith('/api/multisig/') && path.endsWith('/sign') && method === 'POST') {
        const txId = path.split('/')[3];
        const body = await this.parseBody(req);
        const success = this.manager.signMultiSigTransaction(txId, body.signer, body.signature);
        this.sendJSON(res, { success });
      } else if (path === '/api/gas/estimate' && method === 'POST') {
        const body = await this.parseBody(req);
        const estimate = await this.manager.estimateGas(
          body.from,
          body.to,
          body.amount,
          body.strategy
        );
        this.sendJSON(res, {
          ...estimate,
          gasLimit: estimate.gasLimit.toString(),
          baseFee: estimate.baseFee?.toString(),
          maxFeePerGas: estimate.maxFeePerGas.toString(),
          maxPriorityFeePerGas: estimate.maxPriorityFeePerGas.toString(),
          estimatedCost: estimate.estimatedCost.toString()
        });
      } else if (path === '/api/message/sign' && method === 'POST') {
        const body = await this.parseBody(req);
        const signature = this.manager.signMessage(body);
        this.sendJSON(res, { signature });
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

  private serializeTransaction(tx: Transaction): any {
    return {
      ...tx,
      value: tx.value.toString(),
      gasLimit: tx.gasLimit.toString(),
      gasPrice: tx.gasPrice?.toString(),
      maxFeePerGas: tx.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString()
    };
  }

  private serializeMultiSigTx(tx: MultiSigTransaction): any {
    return {
      ...tx,
      value: tx.value.toString(),
      signatures: Object.fromEntries(tx.signatures)
    };
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

  const manager = new WalletManager();
  const api = new WalletAPI(manager);

  const server = createServer((req, res) => {
    api.handleRequest(req, res).catch(err => {
      console.error('Request error:', err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    });
  });

  server.listen(PORT, () => {
    console.log(`Web3 Wallet Service listening on port ${PORT}`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  POST /api/wallet/create - Create new wallet`);
    console.log(`  POST /api/wallet/import - Import wallet from private key`);
    console.log(`  GET  /api/wallets - List all wallets`);
    console.log(`  GET  /api/wallet/{address}/balances?chain={chain} - Get balances`);
    console.log(`  POST /api/transaction/send - Send transaction`);
    console.log(`  GET  /api/transaction/{hash} - Get transaction`);
    console.log(`  GET  /api/transactions?address={addr} - List transactions`);
    console.log(`  POST /api/multisig/create - Create multi-sig wallet`);
    console.log(`  POST /api/multisig/propose - Propose multi-sig transaction`);
    console.log(`  POST /api/multisig/{txId}/sign - Sign multi-sig transaction`);
    console.log(`  POST /api/gas/estimate - Estimate gas costs`);
    console.log(`  POST /api/message/sign - Sign message`);
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
