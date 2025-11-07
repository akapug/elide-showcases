/**
 * NFT Marketplace API
 *
 * A production-grade NFT marketplace backend with minting, listing management,
 * bidding system, metadata storage, and royalty calculations.
 */

import { URL } from 'url';
import * as crypto from 'crypto';

// Type definitions for HTTP handlers
interface IncomingMessage {
  url?: string;
  headers: { host?: string };
  method?: string;
  on(event: string, callback: (chunk: any) => void): void;
}

interface ServerResponse {
  setHeader(name: string, value: string): void;
  writeHead(statusCode: number, headers?: Record<string, string>): void;
  end(data?: string): void;
}

// ============================================================================
// Type Definitions
// ============================================================================

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  animation_url?: string;
  properties?: Record<string, any>;
}

interface NFT {
  tokenId: string;
  contractAddress: string;
  owner: string;
  creator: string;
  metadata: NFTMetadata;
  metadataUri: string;
  royaltyBps: number; // Basis points (e.g., 250 = 2.5%)
  mintedAt: number;
  chain: string;
}

interface Listing {
  id: string;
  tokenId: string;
  contractAddress: string;
  seller: string;
  price: bigint;
  currency: 'ETH' | 'USDC' | 'DAI';
  startTime: number;
  endTime?: number;
  status: 'active' | 'sold' | 'cancelled' | 'expired';
  createdAt: number;
  updatedAt: number;
}

interface Bid {
  id: string;
  listingId: string;
  bidder: string;
  amount: bigint;
  currency: 'ETH' | 'USDC' | 'DAI';
  expiresAt: number;
  status: 'active' | 'accepted' | 'rejected' | 'expired';
  createdAt: number;
}

interface Sale {
  id: string;
  listingId: string;
  tokenId: string;
  contractAddress: string;
  seller: string;
  buyer: string;
  price: bigint;
  currency: string;
  royaltyAmount: bigint;
  royaltyRecipient: string;
  platformFee: bigint;
  timestamp: number;
}

interface MintRequest {
  creator: string;
  contractAddress: string;
  metadata: NFTMetadata;
  royaltyBps: number;
  chain?: string;
}

interface ListingRequest {
  tokenId: string;
  contractAddress: string;
  seller: string;
  price: string;
  currency: 'ETH' | 'USDC' | 'DAI';
  duration?: number; // seconds
}

interface BidRequest {
  listingId: string;
  bidder: string;
  amount: string;
  currency: 'ETH' | 'USDC' | 'DAI';
  duration?: number; // seconds
}

interface MarketplaceStats {
  totalNFTs: number;
  totalListings: number;
  activeListings: number;
  totalSales: number;
  totalVolume: Record<string, string>;
  totalRoyalties: Record<string, string>;
  averagePrice: Record<string, string>;
}

// ============================================================================
// Storage Layer
// ============================================================================

class MarketplaceStore {
  private nfts: Map<string, NFT> = new Map();
  private listings: Map<string, Listing> = new Map();
  private bids: Map<string, Bid[]> = new Map();
  private sales: Map<string, Sale> = new Map();
  private platformFeeBps: number = 250; // 2.5%

  // NFT Management
  mintNFT(request: MintRequest): NFT {
    const tokenId = this.generateTokenId();
    const metadataUri = `ipfs://${this.generateIpfsHash()}`;

    const nft: NFT = {
      tokenId,
      contractAddress: request.contractAddress,
      owner: request.creator,
      creator: request.creator,
      metadata: request.metadata,
      metadataUri,
      royaltyBps: request.royaltyBps,
      mintedAt: Date.now(),
      chain: request.chain || 'ethereum'
    };

    const key = `${request.contractAddress}:${tokenId}`;
    this.nfts.set(key, nft);

    return nft;
  }

  getNFT(contractAddress: string, tokenId: string): NFT | undefined {
    return this.nfts.get(`${contractAddress}:${tokenId}`);
  }

  getNFTsByOwner(owner: string): NFT[] {
    return Array.from(this.nfts.values()).filter(nft =>
      nft.owner.toLowerCase() === owner.toLowerCase()
    );
  }

  transferNFT(contractAddress: string, tokenId: string, newOwner: string): boolean {
    const nft = this.getNFT(contractAddress, tokenId);
    if (!nft) return false;

    nft.owner = newOwner;
    return true;
  }

  // Listing Management
  createListing(request: ListingRequest): Listing {
    const listing: Listing = {
      id: this.generateId(),
      tokenId: request.tokenId,
      contractAddress: request.contractAddress,
      seller: request.seller,
      price: BigInt(request.price),
      currency: request.currency,
      startTime: Date.now(),
      endTime: request.duration ? Date.now() + request.duration * 1000 : undefined,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.listings.set(listing.id, listing);
    return listing;
  }

  getListing(id: string): Listing | undefined {
    return this.listings.get(id);
  }

  getActiveListings(filters?: {
    contractAddress?: string;
    minPrice?: bigint;
    maxPrice?: bigint;
    currency?: string;
  }): Listing[] {
    let listings = Array.from(this.listings.values()).filter(
      listing => listing.status === 'active'
    );

    // Check expiration
    const now = Date.now();
    listings = listings.filter(listing => {
      if (listing.endTime && listing.endTime < now) {
        listing.status = 'expired';
        listing.updatedAt = now;
        return false;
      }
      return true;
    });

    // Apply filters
    if (filters?.contractAddress) {
      listings = listings.filter(l =>
        l.contractAddress.toLowerCase() === filters.contractAddress!.toLowerCase()
      );
    }

    if (filters?.minPrice !== undefined) {
      listings = listings.filter(l => l.price >= filters.minPrice!);
    }

    if (filters?.maxPrice !== undefined) {
      listings = listings.filter(l => l.price <= filters.maxPrice!);
    }

    if (filters?.currency) {
      listings = listings.filter(l => l.currency === filters.currency);
    }

    return listings.sort((a, b) => b.createdAt - a.createdAt);
  }

  cancelListing(id: string, seller: string): boolean {
    const listing = this.listings.get(id);
    if (!listing || listing.seller !== seller || listing.status !== 'active') {
      return false;
    }

    listing.status = 'cancelled';
    listing.updatedAt = Date.now();
    return true;
  }

  // Bidding System
  placeBid(request: BidRequest): Bid {
    const bid: Bid = {
      id: this.generateId(),
      listingId: request.listingId,
      bidder: request.bidder,
      amount: BigInt(request.amount),
      currency: request.currency,
      expiresAt: Date.now() + (request.duration || 86400) * 1000, // Default 24h
      status: 'active',
      createdAt: Date.now()
    };

    if (!this.bids.has(request.listingId)) {
      this.bids.set(request.listingId, []);
    }
    this.bids.get(request.listingId)!.push(bid);

    return bid;
  }

  getBids(listingId: string): Bid[] {
    const bids = this.bids.get(listingId) || [];
    const now = Date.now();

    return bids
      .filter(bid => {
        if (bid.status === 'active' && bid.expiresAt < now) {
          bid.status = 'expired';
        }
        return bid;
      })
      .sort((a, b) => Number(b.amount - a.amount));
  }

  acceptBid(listingId: string, bidId: string): Sale | null {
    const listing = this.listings.get(listingId);
    const bids = this.bids.get(listingId) || [];
    const bid = bids.find(b => b.id === bidId);

    if (!listing || !bid || listing.status !== 'active' || bid.status !== 'active') {
      return null;
    }

    // Calculate royalties and fees
    const nft = this.getNFT(listing.contractAddress, listing.tokenId);
    if (!nft) return null;

    const salePrice = bid.amount;
    const royaltyAmount = (salePrice * BigInt(nft.royaltyBps)) / BigInt(10000);
    const platformFee = (salePrice * BigInt(this.platformFeeBps)) / BigInt(10000);

    // Create sale record
    const sale: Sale = {
      id: this.generateId(),
      listingId: listing.id,
      tokenId: listing.tokenId,
      contractAddress: listing.contractAddress,
      seller: listing.seller,
      buyer: bid.bidder,
      price: salePrice,
      currency: bid.currency,
      royaltyAmount,
      royaltyRecipient: nft.creator,
      platformFee,
      timestamp: Date.now()
    };

    // Update statuses
    listing.status = 'sold';
    listing.updatedAt = Date.now();
    bid.status = 'accepted';

    // Reject other bids
    bids.forEach(b => {
      if (b.id !== bidId && b.status === 'active') {
        b.status = 'rejected';
      }
    });

    // Transfer NFT ownership
    this.transferNFT(listing.contractAddress, listing.tokenId, bid.bidder);

    this.sales.set(sale.id, sale);
    return sale;
  }

  // Direct purchase (buy now)
  purchaseListing(listingId: string, buyer: string): Sale | null {
    const listing = this.listings.get(listingId);
    if (!listing || listing.status !== 'active') {
      return null;
    }

    const nft = this.getNFT(listing.contractAddress, listing.tokenId);
    if (!nft) return null;

    const salePrice = listing.price;
    const royaltyAmount = (salePrice * BigInt(nft.royaltyBps)) / BigInt(10000);
    const platformFee = (salePrice * BigInt(this.platformFeeBps)) / BigInt(10000);

    const sale: Sale = {
      id: this.generateId(),
      listingId: listing.id,
      tokenId: listing.tokenId,
      contractAddress: listing.contractAddress,
      seller: listing.seller,
      buyer,
      price: salePrice,
      currency: listing.currency,
      royaltyAmount,
      royaltyRecipient: nft.creator,
      platformFee,
      timestamp: Date.now()
    };

    listing.status = 'sold';
    listing.updatedAt = Date.now();

    this.transferNFT(listing.contractAddress, listing.tokenId, buyer);
    this.sales.set(sale.id, sale);

    return sale;
  }

  // Statistics
  getStats(): MarketplaceStats {
    const sales = Array.from(this.sales.values());
    const volumeByCurrency: Record<string, bigint> = {};
    const royaltiesByCurrency: Record<string, bigint> = {};

    sales.forEach(sale => {
      volumeByCurrency[sale.currency] = (volumeByCurrency[sale.currency] || BigInt(0)) + sale.price;
      royaltiesByCurrency[sale.currency] = (royaltiesByCurrency[sale.currency] || BigInt(0)) + sale.royaltyAmount;
    });

    return {
      totalNFTs: this.nfts.size,
      totalListings: this.listings.size,
      activeListings: Array.from(this.listings.values()).filter(l => l.status === 'active').length,
      totalSales: sales.length,
      totalVolume: Object.fromEntries(
        Object.entries(volumeByCurrency).map(([k, v]) => [k, v.toString()])
      ),
      totalRoyalties: Object.fromEntries(
        Object.entries(royaltiesByCurrency).map(([k, v]) => [k, v.toString()])
      ),
      averagePrice: Object.fromEntries(
        Object.entries(volumeByCurrency).map(([k, v]) => [
          k,
          sales.length > 0 ? (v / BigInt(sales.length)).toString() : '0'
        ])
      )
    };
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private generateTokenId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private generateIpfsHash(): string {
    // Simulate IPFS hash (Qm...)
    return 'Qm' + crypto.randomBytes(23).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
  }
}

// ============================================================================
// HTTP API Server
// ============================================================================

class MarketplaceAPI {
  private store: MarketplaceStore;

  constructor(store: MarketplaceStore) {
    this.store = store;
  }

  async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const path = url.pathname;
    const method = req.method || 'GET';

    // CORS headers
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
      // NFT endpoints
      if (path === '/api/nft/mint' && method === 'POST') {
        const body = await this.parseBody(req);
        const nft = this.store.mintNFT(body);
        this.sendJSON(res, nft);
      } else if (path.startsWith('/api/nft/') && method === 'GET') {
        const parts = path.split('/');
        const contractAddress = parts[3];
        const tokenId = parts[4];
        const nft = this.store.getNFT(contractAddress, tokenId);
        if (nft) {
          this.sendJSON(res, nft);
        } else {
          this.sendError(res, 404, 'NFT not found');
        }
      } else if (path === '/api/nft/owner' && method === 'GET') {
        const owner = url.searchParams.get('address');
        if (!owner) {
          this.sendError(res, 400, 'Owner address required');
          return;
        }
        const nfts = this.store.getNFTsByOwner(owner);
        this.sendJSON(res, { count: nfts.length, nfts });
      }
      // Listing endpoints
      else if (path === '/api/listing/create' && method === 'POST') {
        const body = await this.parseBody(req);
        const listing = this.store.createListing(body);
        this.sendJSON(res, this.serializeListing(listing));
      } else if (path === '/api/listings' && method === 'GET') {
        const filters = {
          contractAddress: url.searchParams.get('contract') || undefined,
          minPrice: this.parseBigInt(url.searchParams.get('minPrice')),
          maxPrice: this.parseBigInt(url.searchParams.get('maxPrice')),
          currency: url.searchParams.get('currency') || undefined
        };
        const listings = this.store.getActiveListings(filters);
        this.sendJSON(res, {
          count: listings.length,
          listings: listings.map(l => this.serializeListing(l))
        });
      } else if (path.startsWith('/api/listing/') && path.endsWith('/cancel') && method === 'POST') {
        const listingId = path.split('/')[3];
        const body = await this.parseBody(req);
        const success = this.store.cancelListing(listingId, body.seller);
        this.sendJSON(res, { success });
      } else if (path.startsWith('/api/listing/') && path.endsWith('/purchase') && method === 'POST') {
        const listingId = path.split('/')[3];
        const body = await this.parseBody(req);
        const sale = this.store.purchaseListing(listingId, body.buyer);
        if (sale) {
          this.sendJSON(res, this.serializeSale(sale));
        } else {
          this.sendError(res, 400, 'Purchase failed');
        }
      }
      // Bidding endpoints
      else if (path === '/api/bid/place' && method === 'POST') {
        const body = await this.parseBody(req);
        const bid = this.store.placeBid(body);
        this.sendJSON(res, this.serializeBid(bid));
      } else if (path.startsWith('/api/listing/') && path.endsWith('/bids') && method === 'GET') {
        const listingId = path.split('/')[3];
        const bids = this.store.getBids(listingId);
        this.sendJSON(res, {
          count: bids.length,
          bids: bids.map(b => this.serializeBid(b))
        });
      } else if (path.startsWith('/api/bid/') && path.endsWith('/accept') && method === 'POST') {
        const parts = path.split('/');
        const listingId = parts[3];
        const bidId = parts[4];
        const sale = this.store.acceptBid(listingId, bidId);
        if (sale) {
          this.sendJSON(res, this.serializeSale(sale));
        } else {
          this.sendError(res, 400, 'Accept bid failed');
        }
      }
      // Stats endpoint
      else if (path === '/api/stats' && method === 'GET') {
        const stats = this.store.getStats();
        this.sendJSON(res, stats);
      } else if (path === '/api/health' && method === 'GET') {
        this.sendJSON(res, { status: 'healthy', timestamp: Date.now() });
      } else {
        this.sendError(res, 404, 'Not Found');
      }
    } catch (error) {
      console.error('API error:', error);
      this.sendError(res, 500, 'Internal Server Error');
    }
  }

  private async parseBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error('Invalid JSON'));
        }
      });
    });
  }

  private parseBigInt(value: string | null): bigint | undefined {
    if (!value) return undefined;
    try {
      return BigInt(value);
    } catch {
      return undefined;
    }
  }

  private serializeListing(listing: Listing): any {
    return {
      ...listing,
      price: listing.price.toString()
    };
  }

  private serializeBid(bid: Bid): any {
    return {
      ...bid,
      amount: bid.amount.toString()
    };
  }

  private serializeSale(sale: Sale): any {
    return {
      ...sale,
      price: sale.price.toString(),
      royaltyAmount: sale.royaltyAmount.toString(),
      platformFee: sale.platformFee.toString()
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

  const store = new MarketplaceStore();
  const api = new MarketplaceAPI(store);

  console.log(`NFT Marketplace API running on http://localhost:${PORT}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  POST /api/nft/mint - Mint new NFT`);
  console.log(`  GET  /api/nft/{contract}/{tokenId} - Get NFT details`);
  console.log(`  GET  /api/nft/owner?address={addr} - Get NFTs by owner`);
  console.log(`  POST /api/listing/create - Create listing`);
  console.log(`  GET  /api/listings - Get active listings`);
  console.log(`  POST /api/listing/{id}/cancel - Cancel listing`);
  console.log(`  POST /api/listing/{id}/purchase - Purchase NFT`);
  console.log(`  POST /api/bid/place - Place bid`);
  console.log(`  GET  /api/listing/{id}/bids - Get listing bids`);
  console.log(`  POST /api/bid/{listingId}/{bidId}/accept - Accept bid`);
  console.log(`  GET  /api/stats - Marketplace statistics`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
