# NFT Marketplace API

A production-grade NFT marketplace backend with comprehensive features for minting, listing management, bidding, metadata storage, and automatic royalty calculations.

## Features

- **Minting API**: Create and mint NFTs with metadata and royalty settings
- **Listing Management**: Create, update, and cancel NFT listings
- **Bidding System**: Place and accept bids with expiration times
- **Direct Purchase**: Buy now functionality for fixed-price listings
- **Metadata Storage**: Full ERC-721/ERC-1155 metadata support
- **Royalty Calculations**: Automatic creator royalties on secondary sales
- **Multi-Currency**: Support for ETH, USDC, and DAI
- **Platform Fees**: Configurable marketplace fees
- **Statistics**: Real-time marketplace metrics

## Architecture

### Components

1. **MarketplaceStore**: Core data management
   - NFT minting and ownership tracking
   - Listing lifecycle management
   - Bid handling and acceptance
   - Sale execution with royalty distribution
   - Statistics aggregation

2. **MarketplaceAPI**: RESTful HTTP interface
   - NFT endpoints
   - Listing endpoints
   - Bidding endpoints
   - Statistics endpoints

## API Endpoints

### NFT Management

#### Mint NFT
```
POST /api/nft/mint
```
Body:
```json
{
  "creator": "0x...",
  "contractAddress": "0x...",
  "royaltyBps": 250,
  "metadata": {
    "name": "Cool NFT #1",
    "description": "An awesome NFT",
    "image": "ipfs://...",
    "attributes": [
      { "trait_type": "Background", "value": "Blue" },
      { "trait_type": "Rarity", "value": "Rare" }
    ]
  }
}
```

#### Get NFT Details
```
GET /api/nft/{contractAddress}/{tokenId}
```

#### Get NFTs by Owner
```
GET /api/nft/owner?address={ownerAddress}
```

### Listing Management

#### Create Listing
```
POST /api/listing/create
```
Body:
```json
{
  "tokenId": "0x...",
  "contractAddress": "0x...",
  "seller": "0x...",
  "price": "1000000000000000000",
  "currency": "ETH",
  "duration": 604800
}
```

#### Get Active Listings
```
GET /api/listings?contract={addr}&minPrice={n}&maxPrice={n}&currency={curr}
```

#### Cancel Listing
```
POST /api/listing/{id}/cancel
```
Body:
```json
{
  "seller": "0x..."
}
```

#### Purchase NFT
```
POST /api/listing/{id}/purchase
```
Body:
```json
{
  "buyer": "0x..."
}
```

### Bidding System

#### Place Bid
```
POST /api/bid/place
```
Body:
```json
{
  "listingId": "uuid",
  "bidder": "0x...",
  "amount": "900000000000000000",
  "currency": "ETH",
  "duration": 86400
}
```

#### Get Listing Bids
```
GET /api/listing/{id}/bids
```

#### Accept Bid
```
POST /api/bid/{listingId}/{bidId}/accept
```

### Statistics

#### Get Marketplace Stats
```
GET /api/stats
```

Response:
```json
{
  "totalNFTs": 1250,
  "totalListings": 450,
  "activeListings": 125,
  "totalSales": 325,
  "totalVolume": {
    "ETH": "450000000000000000000",
    "USDC": "125000000000"
  },
  "totalRoyalties": {
    "ETH": "11250000000000000000",
    "USDC": "3125000000"
  },
  "averagePrice": {
    "ETH": "1384615384615384615",
    "USDC": "384615384"
  }
}
```

## Usage Examples

### Minting an NFT
```bash
curl -X POST http://localhost:3000/api/nft/mint \
  -H "Content-Type: application/json" \
  -d '{
    "creator": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "contractAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    "royaltyBps": 250,
    "metadata": {
      "name": "Digital Art #1",
      "description": "Beautiful digital artwork",
      "image": "ipfs://QmExample123",
      "attributes": [
        {"trait_type": "Color", "value": "Blue"},
        {"trait_type": "Rarity", "value": "Legendary"}
      ]
    }
  }'
```

### Creating a Listing
```bash
curl -X POST http://localhost:3000/api/listing/create \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": "0x123...",
    "contractAddress": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    "seller": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "price": "1000000000000000000",
    "currency": "ETH",
    "duration": 604800
  }'
```

### Placing a Bid
```bash
curl -X POST http://localhost:3000/api/bid/place \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "550e8400-e29b-41d4-a716-446655440000",
    "bidder": "0xBuyerAddress123...",
    "amount": "900000000000000000",
    "currency": "ETH",
    "duration": 86400
  }'
```

## Data Models

### NFT
- Token ID and contract address
- Owner and creator addresses
- Metadata (name, description, image, attributes)
- Metadata URI (IPFS)
- Royalty percentage (basis points)
- Mint timestamp
- Chain identifier

### Listing
- Unique listing ID
- Token reference
- Seller address
- Price and currency
- Start/end times
- Status (active, sold, cancelled, expired)

### Bid
- Unique bid ID
- Listing reference
- Bidder address
- Bid amount and currency
- Expiration time
- Status (active, accepted, rejected, expired)

### Sale
- Sale ID
- Token and listing references
- Seller and buyer addresses
- Sale price
- Royalty amount and recipient
- Platform fee
- Timestamp

## Royalty System

Royalties are automatically calculated and tracked on every sale:

```
Sale Price: 1 ETH
Creator Royalty (2.5%): 0.025 ETH → Creator
Platform Fee (2.5%): 0.025 ETH → Platform
Seller Receives: 0.95 ETH
```

Basis points (BPS) system:
- 100 BPS = 1%
- 250 BPS = 2.5%
- 1000 BPS = 10%

## Configuration

Environment variables:
- `PORT`: Server port (default: 3000)

Platform fee is configured in `MarketplaceStore` (default: 250 BPS / 2.5%)

## Production Considerations

1. **Blockchain Integration**: Integrate with actual smart contracts (ERC-721/ERC-1155)
2. **Database**: Use PostgreSQL for persistent storage
3. **Authentication**: Add wallet signature verification
4. **IPFS**: Implement real IPFS pinning for metadata
5. **Payment Processing**: Integrate with payment gateways for fiat
6. **Escrow**: Implement escrow system for secure transactions
7. **Events**: Add WebSocket support for real-time updates
8. **Search**: Add Elasticsearch for advanced NFT search
9. **Caching**: Use Redis for frequently accessed data
10. **Rate Limiting**: Protect endpoints from abuse

## Use Cases

- NFT marketplaces
- Digital art platforms
- Gaming item marketplaces
- Collectibles trading
- Domain name marketplaces
- Music and media NFTs
- Metaverse asset trading

## License

MIT
