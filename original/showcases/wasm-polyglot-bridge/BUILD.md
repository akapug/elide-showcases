# Build Instructions

## Prerequisites

- **Elide CLI** - Install from https://elide.dev
- **Rust** (for WASM compilation) - `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **wasm-bindgen** - `cargo install wasm-bindgen-cli`
- **Python 3.9+** with NumPy - Usually included with Elide

## Quick Start

```bash
# 1. Build the WASM module from Rust
npm run build:wasm

# 2. Start the server
npm start

# Or use Elide directly
elide run server.ts
```

## Running Examples

```bash
# Image processing pipeline
npm run example:image

# Data analysis pipeline
npm run example:data

# ML inference examples
npm run example:ml
```

## Running Benchmarks

```bash
npm run benchmark
```

This will run comprehensive performance benchmarks comparing:
- WASM vs JavaScript sorting
- WASM vs JavaScript statistics
- WASM vs JavaScript vector operations
- WASM vs JavaScript matrix operations
- WASM vs JavaScript image processing

Expected results: **20-25x speedup** with WASM!

## Testing

```bash
# Run Rust unit tests
cd rust-wasm
cargo test

# Run with coverage
cargo test --no-fail-fast
```

## Development

### Rust Development

Edit files in `rust-wasm/src/`:
- `lib.rs` - Core WASM bindings
- `sorting.rs` - Sorting algorithms
- `image.rs` - Image processing
- `math.rs` - Mathematical operations
- `json.rs` - JSON processing

After making changes:
```bash
npm run build:wasm
```

### Python Development

Edit files in `python/`:
- `ml_processor.py` - ML operations
- `data_analysis.py` - Statistical analysis

No build step needed - Elide handles Python integration.

### TypeScript Development

Edit `server.ts` or example files. No build step needed - Elide runs TypeScript directly.

## Architecture

```
┌─────────────────────────────────────────────┐
│           TypeScript Server                 │
│         (API & Orchestration)               │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌────────────────┐  │
│  │  Rust WASM   │      │  Python ML     │  │
│  │              │◄────►│                │  │
│  │ • Sorting    │      │ • NumPy        │  │
│  │ • Image      │      │ • ML models    │  │
│  │ • Math       │      │ • Statistics   │  │
│  │ • Vectors    │      │ • Analysis     │  │
│  └──────────────┘      └────────────────┘  │
│                                             │
│        Zero-Copy Memory Sharing             │
│          <1ms Cross-Language Calls          │
└─────────────────────────────────────────────┘
```

## Troubleshooting

### WASM build fails

Ensure you have:
1. Rust installed: `rustc --version`
2. wasm32 target: `rustup target add wasm32-unknown-unknown`
3. wasm-bindgen: `cargo install wasm-bindgen-cli`

### Python imports fail

Ensure NumPy is installed:
```bash
pip install numpy
```

Elide should automatically detect system Python.

### Server won't start

Check that port 8080 is available:
```bash
lsof -i :8080
```

Change port in `server.ts` if needed.

## Performance Tuning

### Rust Compilation

For maximum performance:
```bash
cd rust-wasm
RUSTFLAGS="-C target-cpu=native" cargo build --release --target wasm32-unknown-unknown
```

### Memory Settings

For large datasets, increase memory:
```bash
elide run --memory=4g server.ts
```

## Production Deployment

1. Build optimized WASM:
```bash
npm run build:wasm
```

2. Bundle with Elide:
```bash
elide build server.ts --output=dist/
```

3. Deploy the `dist/` directory to your server

## License

MIT
