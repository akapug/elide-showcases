# CORS - Cross-Origin Resource Sharing

Enable CORS with various options - converted for Elide.

## Overview

CORS is a Node.js package for providing Express/Connect middleware to enable CORS with various options. Essential for modern web applications that separate frontend and backend.

**Based on**: [cors](https://www.npmjs.com/package/cors) (~40M downloads/week on npm)

## Features

- ✅ **Origin control** - Whitelist specific origins
- ✅ **Credentials** - Support for cookies and auth
- ✅ **Custom headers** - Configure allowed headers
- ✅ **Preflight** - Handle OPTIONS requests
- ✅ **Methods** - Control allowed HTTP methods
- ✅ **Zero dependencies** - Pure TypeScript

## Usage

```typescript
import cors from "./elide-cors.ts";

// Allow all origins
const middleware1 = cors();

// Specific origin
const middleware2 = cors({
  origin: "https://example.com"
});

// Multiple origins
const middleware3 = cors({
  origin: ["https://app1.com", "https://app2.com"]
});

// With credentials
const middleware4 = cors({
  origin: "https://app.com",
  credentials: true
});

// Dynamic origin check
const middleware5 = cors({
  origin: (origin) => origin.endsWith(".myapp.com")
});
```

## Options

```typescript
interface CorsOptions {
  origin?: string | string[] | boolean | ((origin: string) => boolean);
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}
```

## Examples

### REST API

```typescript
const api = cors({
  origin: ["https://app.example.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
});
```

### Microservices

```typescript
const internal = cors({
  origin: true, // Allow all for internal services
  credentials: false
});
```

## Use Cases

- REST API security
- Frontend-backend separation
- Microservices communication
- Third-party API integration

## Running the Demo

```bash
elide run elide-cors.ts
```
