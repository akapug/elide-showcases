# Web3 Wallet Service

A production-grade Web3 wallet service with secure key management, transaction signing, multi-signature support, balance tracking, and intelligent gas optimization.

## Features

- **Key Management**: Secure encryption and storage of private keys
- **Transaction Signing**: EIP-1559 and legacy transaction support
- **Multi-Sig Support**: Multi-signature wallet creation and transaction management
- **Balance Tracking**: Real-time balance tracking across multiple tokens
- **Gas Optimization**: Smart gas estimation with configurable strategies
- **Message Signing**: Sign and verify arbitrary messages
- **HD Wallet Support**: Hierarchical deterministic wallet generation (ready for implementation)

## Architecture

### Components

1. **KeyManager**: Cryptographic operations
   - AES-256-GCM encryption
   - PBKDF2 key derivation
   - ECDSA signing and verification
   - Key generation

2. **WalletManager**: Core wallet operations
   - Wallet creation and import
   - Multi-sig wallet management
   - Transaction management
   - Balance tracking
   - Gas estimation

3. **WalletAPI**: HTTP REST interface
   - Wallet endpoints
   - Transaction endpoints
   - Multi-sig endpoints
   - Gas estimation

## API Endpoints

### Wallet Management

#### Create Wallet
```
POST /api/wallet/create
```
Body:
```json
{
  "password": "secure_password_here",
  "label": "My Main Wallet"
}
```

Response:
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "label": "My Main Wallet"
}
```

#### Import Wallet
```
POST /api/wallet/import
```
Body:
```json
{
  "privateKey": "0x1234567890abcdef...",
  "password": "secure_password_here",
  "label": "Imported Wallet"
}
```

#### List Wallets
```
GET /api/wallets
```

Response:
```json
{
  "count": 3,
  "wallets": [
    {
      "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
      "label": "My Main Wallet",
      "createdAt": 1699200000000,
      "lastUsed": 1699206000000
    }
  ]
}
```

#### Get Balances
```
GET /api/wallet/{address}/balances?chain=ethereum
```

Response:
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "chain": "ethereum",
  "count": 2,
  "balances": [
    {
      "token": "ETH",
      "amount": "5230000000000000000",
      "decimals": 18,
      "symbol": "ETH",
      "valueUSD": 9675.50,
      "lastUpdate": 1699200000000
    },
    {
      "token": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "amount": "1000000000",
      "decimals": 6,
      "symbol": "USDC",
      "valueUSD": 1000.00,
      "lastUpdate": 1699200000000
    }
  ]
}
```

### Transaction Management

#### Send Transaction
```
POST /api/transaction/send
```
Body:
```json
{
  "from": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "to": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  "amount": "1000000000000000000",
  "gasStrategy": "medium",
  "password": "secure_password_here"
}
```

Response:
```json
{
  "hash": "0xabc123...",
  "from": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "to": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  "value": "1000000000000000000",
  "gasLimit": "21000",
  "maxFeePerGas": "33000000000",
  "maxPriorityFeePerGas": "3000000000",
  "status": "pending",
  "createdAt": 1699200000000
}
```

#### Get Transaction
```
GET /api/transaction/{hash}
```

#### List Transactions
```
GET /api/transactions?address={address}
```

### Multi-Signature Wallets

#### Create Multi-Sig Wallet
```
POST /api/multisig/create
```
Body:
```json
{
  "owners": [
    "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    "0xBuyerAddress123..."
  ],
  "threshold": 2
}
```

Response:
```json
{
  "address": "0xMultiSigAddress...",
  "owners": [...],
  "threshold": 2,
  "nonce": 0,
  "createdAt": 1699200000000
}
```

#### Propose Multi-Sig Transaction
```
POST /api/multisig/propose
```
Body:
```json
{
  "wallet": "0xMultiSigAddress...",
  "to": "0xRecipient...",
  "value": "1000000000000000000",
  "data": "0x",
  "proposer": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "signature": "0xsignature..."
}
```

#### Sign Multi-Sig Transaction
```
POST /api/multisig/{txId}/sign
```
Body:
```json
{
  "signer": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  "signature": "0xsignature..."
}
```

### Gas Optimization

#### Estimate Gas
```
POST /api/gas/estimate
```
Body:
```json
{
  "from": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "to": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  "amount": "1000000000000000000",
  "strategy": "medium"
}
```

Response:
```json
{
  "gasLimit": "21000",
  "baseFee": "30000000000",
  "maxFeePerGas": "33000000000",
  "maxPriorityFeePerGas": "3000000000",
  "estimatedCost": "693000000000000",
  "estimatedTime": 30,
  "confidence": "medium"
}
```

Gas strategies:
- **slow**: Lower cost, 60s confirmation time, low confidence
- **medium**: Balanced cost/speed, 30s confirmation time
- **fast**: Higher cost, 15s confirmation time, high confidence

### Message Signing

#### Sign Message
```
POST /api/message/sign
```
Body:
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "message": "I agree to the terms",
  "password": "secure_password_here"
}
```

Response:
```json
{
  "signature": "0xabcdef1234567890..."
}
```

## Security Features

### Encryption
- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Salt**: Random 16-byte salt per encrypted key
- **IV**: Random 12-byte initialization vector
- **Auth Tag**: AEAD authentication

### Key Storage
- Private keys are NEVER stored in plain text
- All keys encrypted with user-provided password
- Password never leaves the client
- Encryption happens before storage

### Best Practices
1. Use strong passwords (minimum 12 characters)
2. Enable 2FA for additional security
3. Regularly backup encrypted key material
4. Use hardware security modules (HSM) in production
5. Implement rate limiting on API endpoints
6. Use HTTPS for all communications
7. Implement IP whitelisting for sensitive operations

## Usage Examples

### Creating and Using a Wallet
```bash
# Create wallet
curl -X POST http://localhost:3000/api/wallet/create \
  -H "Content-Type: application/json" \
  -d '{
    "password": "MySecurePassword123!",
    "label": "Main Wallet"
  }'

# Check balances
curl http://localhost:3000/api/wallet/0x742d35Cc6634C0532925a3b844Bc454e4438f44e/balances?chain=ethereum

# Send transaction
curl -X POST http://localhost:3000/api/transaction/send \
  -H "Content-Type: application/json" \
  -d '{
    "from": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "to": "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    "amount": "1000000000000000000",
    "gasStrategy": "fast",
    "password": "MySecurePassword123!"
  }'
```

### Multi-Sig Workflow
```bash
# Create multi-sig wallet (2-of-3)
curl -X POST http://localhost:3000/api/multisig/create \
  -H "Content-Type: application/json" \
  -d '{
    "owners": ["0xOwner1...", "0xOwner2...", "0xOwner3..."],
    "threshold": 2
  }'

# Propose transaction
curl -X POST http://localhost:3000/api/multisig/propose \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0xMultiSig...",
    "to": "0xRecipient...",
    "value": "5000000000000000000",
    "proposer": "0xOwner1...",
    "signature": "0xsig1..."
  }'

# Second owner signs (transaction executes automatically when threshold reached)
curl -X POST http://localhost:3000/api/multisig/550e8400-e29b-41d4-a716-446655440000/sign \
  -H "Content-Type: application/json" \
  -d '{
    "signer": "0xOwner2...",
    "signature": "0xsig2..."
  }'
```

## Configuration

Environment variables:
- `PORT`: Server port (default: 3000)

## Production Considerations

1. **Key Storage**: Use hardware security modules (HSM) or cloud KMS
2. **Database**: Persist wallet data to PostgreSQL with encryption at rest
3. **Authentication**: Add JWT-based authentication
4. **Rate Limiting**: Protect endpoints from brute force attacks
5. **Audit Logging**: Log all wallet operations for compliance
6. **Backup**: Implement automated encrypted backups
7. **Monitoring**: Track failed authentication attempts
8. **Network**: Use dedicated RPC nodes for reliability
9. **Testing**: Extensive testing on testnets before mainnet
10. **Compliance**: Implement KYC/AML as required by jurisdiction

## Use Cases

- Custodial wallet services
- DApp backend integration
- Treasury management
- Multi-signature escrow
- Payment processing
- DAO operations
- Corporate crypto management

## License

MIT
