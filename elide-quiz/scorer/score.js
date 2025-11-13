#!/usr/bin/env node
/**
 * Elide Quiz Scorer - CLI version
 * 
 * Usage: node score.js <answers-file>
 * 
 * Answer format (one per line):
 * 1. B
 * 2. A,C,D
 * 3. export default async function fetch(req: Request): Promise<Response>
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Answer key (first 260 answers - extend as needed)
const ANSWER_KEY = {
  // Runtime & Core (100)
  1: { answer: 'A,B,C,D', points: 1, topic: 'Runtime' },
  2: { answer: 'B', points: 1, topic: 'Runtime' },
  3: { answer: 'B', points: 1, topic: 'Runtime' },
  4: { answer: 'B', points: 1, topic: 'Runtime' },
  5: { answer: 'C', points: 1, topic: 'Runtime' },
  6: { answer: 'B', points: 1, topic: 'Runtime' },
  7: { answer: 'A', points: 1, topic: 'Runtime' },
  8: { answer: 'D', points: 1, topic: 'Runtime' },
  9: { answer: 'B', points: 1, topic: 'Runtime' },
  10: { answer: 'A', points: 1, topic: 'Runtime' },
  11: { answer: 'C', points: 1, topic: 'Runtime' },
  12: { answer: 'B', points: 1, topic: 'Runtime' },
  13: { answer: 'A', points: 1, topic: 'Runtime' },
  14: { answer: 'A', points: 1, topic: 'Runtime' },
  15: { answer: 'D', points: 1, topic: 'Runtime' },
  16: { answer: 'A', points: 1, topic: 'Runtime' },
  17: { answer: 'C', points: 1, topic: 'Runtime' },
  18: { answer: 'B', points: 1, topic: 'Runtime' },
  19: { answer: 'B', points: 1, topic: 'Runtime' },
  20: { answer: 'B', points: 1, topic: 'Runtime' },
  21: { answer: 'D', points: 1, topic: 'Runtime' },
  22: { answer: 'A', points: 1, topic: 'Runtime' },
  23: { answer: 'B', points: 1, topic: 'Runtime' },
  24: { answer: 'B', points: 1, topic: 'Runtime' },
  25: { answer: 'A', points: 1, topic: 'Runtime' },
  26: { answer: 'C', points: 1, topic: 'Runtime' },
  27: { answer: 'B', points: 1, topic: 'Runtime' },
  28: { answer: 'A', points: 1, topic: 'Runtime' },
  29: { answer: 'C', points: 1, topic: 'Runtime' },
  30: { answer: 'A,B,C', points: 1, topic: 'Runtime' },
  31: { answer: 'A', points: 1, topic: 'Runtime' },
  32: { answer: 'B', points: 1, topic: 'Runtime' },
  33: { answer: 'B', points: 1, topic: 'Runtime' },
  34: { answer: 'A', points: 1, topic: 'Runtime' },
  35: { answer: 'B', points: 1, topic: 'Runtime' },
  36: { answer: 'A,B,C,D', points: 1, topic: 'Runtime' },
  37: { answer: 'A', points: 1, topic: 'Runtime' },
  38: { answer: 'B', points: 1, topic: 'Runtime' },
  39: { answer: 'B', points: 1, topic: 'Runtime' },
  40: { answer: 'A', points: 1, topic: 'Runtime' },
  
  // Medium questions (2 points each)
  41: { answer: 'B', points: 2, topic: 'Runtime' },
  42: { answer: 'B', points: 2, topic: 'Runtime' },
  43: { answer: 'A,B,C,D', points: 2, topic: 'Runtime' },
  44: { answer: 'B', points: 2, topic: 'Runtime' },
  45: { answer: 'B', points: 2, topic: 'Runtime' },
  46: { answer: 'B', points: 2, topic: 'Runtime' },
  47: { answer: 'D', points: 2, topic: 'Runtime' },
  48: { answer: 'A,C', points: 2, topic: 'Runtime' },
  49: { answer: 'B', points: 2, topic: 'Runtime' },
  50: { answer: 'A', points: 2, topic: 'Runtime' },
  
  // CLI Commands (80)
  101: { answer: 'B', points: 1, topic: 'CLI' },
  102: { answer: 'B', points: 1, topic: 'CLI' },
  103: { answer: 'B', points: 1, topic: 'CLI' },
  104: { answer: 'C', points: 1, topic: 'CLI' },
  105: { answer: 'B', points: 1, topic: 'CLI' },
  106: { answer: 'B', points: 1, topic: 'CLI' },
  107: { answer: 'C', points: 1, topic: 'CLI' },
  108: { answer: 'B', points: 1, topic: 'CLI' },
  109: { answer: 'D', points: 1, topic: 'CLI' },
  110: { answer: 'D', points: 1, topic: 'CLI' },
  
  // HTTP & Servers (80)
  181: { answer: 'B', points: 1, topic: 'HTTP' },
  182: { answer: 'B', points: 1, topic: 'HTTP' },
  183: { answer: 'A', points: 1, topic: 'HTTP' },
  184: { answer: 'A', points: 1, topic: 'HTTP' },
  185: { answer: 'A', points: 1, topic: 'HTTP' },
  186: { answer: 'A', points: 1, topic: 'HTTP' },
  187: { answer: 'A,B', points: 1, topic: 'HTTP' },
  188: { answer: 'A', points: 1, topic: 'HTTP' },
  189: { answer: 'C', points: 1, topic: 'HTTP' },
  190: { answer: 'A', points: 1, topic: 'HTTP' },
  191: { answer: 'C', points: 1, topic: 'HTTP' },
  192: { answer: 'A', points: 1, topic: 'HTTP' },
  193: { answer: 'A', points: 1, topic: 'HTTP' },
  194: { answer: 'A,B,C', points: 1, topic: 'HTTP' },
  195: { answer: 'B', points: 1, topic: 'HTTP' },
  196: { answer: 'B', points: 1, topic: 'HTTP' },
  197: { answer: 'A', points: 1, topic: 'HTTP' },
  198: { answer: 'A', points: 1, topic: 'HTTP' },
  199: { answer: 'A', points: 1, topic: 'HTTP' },
  200: { answer: 'A,B', points: 1, topic: 'HTTP' },
  
  // Short answer questions (fuzzy matching)
  211: {
    answer: 'export default async function fetch',
    points: 2,
    topic: 'HTTP',
    fuzzy: true,
    keywords: ['export', 'default', 'async', 'function', 'fetch', 'Request', 'Response']
  },
  212: {
    answer: 'import { createServer } from "http"',
    points: 2,
    topic: 'HTTP',
    fuzzy: true,
    keywords: ['import', 'createServer', 'http', 'listen']
  },
  213: { answer: 'Response.json', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['Response', 'json'] },
  214: { answer: 'await req.json()', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['await', 'req', 'json'] },
  215: { answer: 'new URL(req.url)', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['URL', 'req', 'url'] },
  216: { answer: 'headers: { "X-Custom": "value" }', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['headers'] },
  217: { answer: 'status: 404', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['status', '404'] },
  218: { answer: 'req.method === "POST"', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['method', 'POST'] },
  219: { answer: 'ReadableStream', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['ReadableStream', 'controller'] },
  220: { answer: 'elide run --wsgi app.py', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['elide', 'wsgi'] },

  // Continue with remaining Runtime Medium/Hard (51-100)
  51: { answer: 'C', points: 2, topic: 'Runtime' },
  52: { answer: 'B', points: 2, topic: 'Runtime' },
  53: { answer: 'C', points: 2, topic: 'Runtime' },
  54: { answer: 'B', points: 2, topic: 'Runtime' },
  55: { answer: 'B', points: 2, topic: 'Runtime' },
  56: { answer: 'B', points: 2, topic: 'Runtime' },
  57: { answer: 'B', points: 2, topic: 'Runtime' },
  58: { answer: 'A,B,C,D', points: 2, topic: 'Runtime' },
  59: { answer: 'B', points: 2, topic: 'Runtime' },
  60: { answer: 'C', points: 2, topic: 'Runtime' },
  61: { answer: 'B', points: 2, topic: 'Runtime' },
  62: { answer: 'B', points: 2, topic: 'Runtime' },
  63: { answer: 'B', points: 2, topic: 'Runtime' },
  64: { answer: 'B', points: 2, topic: 'Runtime' },
  65: { answer: 'A,B,C,D', points: 2, topic: 'Runtime' },
  66: { answer: 'B', points: 2, topic: 'Runtime' },
  67: { answer: 'B', points: 2, topic: 'Runtime' },
  68: { answer: 'B', points: 2, topic: 'Runtime' },
  69: { answer: 'B', points: 2, topic: 'Runtime' },
  70: { answer: 'B', points: 2, topic: 'Runtime' },
  71: { answer: 'B', points: 2, topic: 'Runtime' },
  72: { answer: 'B', points: 2, topic: 'Runtime' },
  73: { answer: 'B', points: 2, topic: 'Runtime' },
  74: { answer: 'B', points: 2, topic: 'Runtime' },
  75: { answer: 'B', points: 2, topic: 'Runtime' },
  76: { answer: 'B', points: 2, topic: 'Runtime' },
  77: { answer: 'B', points: 2, topic: 'Runtime' },
  78: { answer: 'C', points: 2, topic: 'Runtime' },
  79: { answer: 'B', points: 2, topic: 'Runtime' },
  80: { answer: 'B', points: 2, topic: 'Runtime' },

  // Runtime Hard (81-100)
  81: { answer: 'B', points: 3, topic: 'Runtime' },
  82: { answer: 'B', points: 3, topic: 'Runtime' },
  83: { answer: 'B', points: 3, topic: 'Runtime' },
  84: { answer: 'B', points: 3, topic: 'Runtime' },
  85: { answer: 'B', points: 3, topic: 'Runtime' },
  86: { answer: 'B', points: 3, topic: 'Runtime' },
  87: { answer: 'B', points: 3, topic: 'Runtime' },
  88: { answer: 'B', points: 3, topic: 'Runtime' },
  89: { answer: 'B', points: 3, topic: 'Runtime' },
  90: { answer: 'B', points: 3, topic: 'Runtime' },
  91: { answer: 'B', points: 3, topic: 'Runtime' },
  92: { answer: 'B', points: 3, topic: 'Runtime' },
  93: { answer: 'B', points: 3, topic: 'Runtime' },
  94: { answer: 'B', points: 3, topic: 'Runtime' },
  95: { answer: 'B', points: 3, topic: 'Runtime' },
  96: { answer: 'B', points: 3, topic: 'Runtime' },
  97: { answer: 'B', points: 3, topic: 'Runtime' },
  98: { answer: 'B', points: 3, topic: 'Runtime' },
  99: { answer: 'B', points: 3, topic: 'Runtime' },
  100: { answer: 'B', points: 3, topic: 'Runtime' },

  // CLI Easy (111-130 continued)
  111: { answer: 'A', points: 1, topic: 'CLI' },
  112: { answer: 'B', points: 1, topic: 'CLI' },
  113: { answer: 'B', points: 1, topic: 'CLI' },
  114: { answer: 'B', points: 1, topic: 'CLI' },
  115: { answer: 'B', points: 1, topic: 'CLI' },
  116: { answer: 'B', points: 1, topic: 'CLI' },
  117: { answer: 'C', points: 1, topic: 'CLI' },
  118: { answer: 'B', points: 1, topic: 'CLI' },
  119: { answer: 'B', points: 1, topic: 'CLI' },
  120: { answer: 'B', points: 1, topic: 'CLI' },
  121: { answer: 'B', points: 1, topic: 'CLI' },
  122: { answer: 'A', points: 1, topic: 'CLI' },
  123: { answer: 'B', points: 1, topic: 'CLI' },
  124: { answer: 'A', points: 1, topic: 'CLI' },
  125: { answer: 'B', points: 1, topic: 'CLI' },
  126: { answer: 'B', points: 1, topic: 'CLI' },
  127: { answer: 'A', points: 1, topic: 'CLI' },
  128: { answer: 'B', points: 1, topic: 'CLI' },
  129: { answer: 'A', points: 1, topic: 'CLI' },
  130: { answer: 'A', points: 1, topic: 'CLI' },

  // CLI Medium (131-160)
  131: { answer: 'C', points: 2, topic: 'CLI' },
  132: { answer: 'B', points: 2, topic: 'CLI' },
  133: { answer: 'B', points: 2, topic: 'CLI' },
  134: { answer: 'A', points: 2, topic: 'CLI' },
  135: { answer: 'D', points: 2, topic: 'CLI' },
  136: { answer: 'C', points: 2, topic: 'CLI' },
  137: { answer: 'C', points: 2, topic: 'CLI' },
  138: { answer: 'A', points: 2, topic: 'CLI' },
  139: { answer: 'B', points: 2, topic: 'CLI' },
  140: { answer: 'B', points: 2, topic: 'CLI' },
  141: { answer: 'B', points: 2, topic: 'CLI' },
  142: { answer: 'B', points: 2, topic: 'CLI' },
  143: { answer: 'A', points: 2, topic: 'CLI' },
  144: { answer: 'B', points: 2, topic: 'CLI' },
  145: { answer: 'B', points: 2, topic: 'CLI' },
  146: { answer: 'B', points: 2, topic: 'CLI' },
  147: { answer: 'B', points: 2, topic: 'CLI' },
  148: { answer: 'B', points: 2, topic: 'CLI' },
  149: { answer: 'B', points: 2, topic: 'CLI' },
  150: { answer: 'B', points: 2, topic: 'CLI' },
  151: { answer: 'B', points: 2, topic: 'CLI' },
  152: { answer: 'B', points: 2, topic: 'CLI' },
  153: { answer: 'A', points: 2, topic: 'CLI' },
  154: { answer: 'A', points: 2, topic: 'CLI' },
  155: { answer: 'A', points: 2, topic: 'CLI' },
  156: { answer: 'A', points: 2, topic: 'CLI' },
  157: { answer: 'A', points: 2, topic: 'CLI' },
  158: { answer: 'A', points: 2, topic: 'CLI' },
  159: { answer: 'A', points: 2, topic: 'CLI' },
  160: { answer: 'B', points: 2, topic: 'CLI' },

  // CLI Hard (161-180)
  161: { answer: 'B', points: 3, topic: 'CLI' },
  162: { answer: 'B', points: 3, topic: 'CLI' },
  163: { answer: 'B', points: 3, topic: 'CLI' },
  164: { answer: 'D', points: 3, topic: 'CLI' },
  165: { answer: 'B', points: 3, topic: 'CLI' },
  166: { answer: 'B', points: 3, topic: 'CLI' },
  167: { answer: 'B', points: 3, topic: 'CLI' },
  168: { answer: 'A', points: 3, topic: 'CLI' },
  169: { answer: 'D', points: 3, topic: 'CLI' },
  170: { answer: 'D', points: 3, topic: 'CLI' },
  171: { answer: 'A', points: 3, topic: 'CLI' },
  172: { answer: 'A', points: 3, topic: 'CLI' },
  173: { answer: 'B', points: 3, topic: 'CLI' },
  174: { answer: 'D', points: 3, topic: 'CLI' },
  175: { answer: 'A', points: 3, topic: 'CLI' },
  176: { answer: 'D', points: 3, topic: 'CLI' },
  177: { answer: 'A', points: 3, topic: 'CLI' },
  178: { answer: 'A', points: 3, topic: 'CLI' },
  179: { answer: 'A', points: 3, topic: 'CLI' },
  180: { answer: 'A', points: 3, topic: 'CLI' },

  // HTTP Easy (197-210 continued)
  197: { answer: 'A', points: 1, topic: 'HTTP' },
  198: { answer: 'A', points: 1, topic: 'HTTP' },
  199: { answer: 'A', points: 1, topic: 'HTTP' },
  200: { answer: 'A,B', points: 1, topic: 'HTTP' },
  201: { answer: 'A', points: 1, topic: 'HTTP' },
  202: { answer: 'B', points: 1, topic: 'HTTP' },
  203: { answer: 'A', points: 1, topic: 'HTTP' },
  204: { answer: 'C', points: 1, topic: 'HTTP' },
  205: { answer: 'A', points: 1, topic: 'HTTP' },
  206: { answer: 'A', points: 1, topic: 'HTTP' },
  207: { answer: 'A', points: 1, topic: 'HTTP' },
  208: { answer: 'A', points: 1, topic: 'HTTP' },
  209: { answer: 'A', points: 1, topic: 'HTTP' },
  210: { answer: 'A', points: 1, topic: 'HTTP' },

  // HTTP Medium (221-240 continued)
  221: { answer: '8080', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['8080'] },
  222: { answer: 'curl http://localhost:8080', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['curl', 'localhost'] },
  223: { answer: 'import Python Flask, call from TypeScript', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['import', 'Flask', 'TypeScript'] },
  224: { answer: 'import { serve } from "elide/http/server"', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['import', 'serve', 'elide'] },
  225: { answer: 'import { serve } from "elide/http/server"', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['import', 'serve'] },
  226: { answer: 'wrap in function', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['function', 'wrap'] },
  227: { answer: '50% faster cold start', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['faster', 'cold'] },
  228: { answer: '22', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['22'] },
  229: { answer: 'flask-typescript-polyglot', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['flask', 'typescript', 'polyglot'] },
  230: { answer: 'WSGI support', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['WSGI'] },
  231: { answer: 'req.on("data")', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['req', 'on', 'data'] },
  232: { answer: 'res.writeHead(404)', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['writeHead', '404'] },
  233: { answer: 'server.listen(5000)', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['listen', '5000'] },
  234: { answer: 'Fetch is declarative, http is imperative', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['declarative', 'imperative'] },
  235: { answer: 'Node.js http', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['http', 'imperative'] },
  236: { answer: 'Fetch Handler', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['Fetch', 'declarative'] },
  237: { answer: 'Configure TLS in elide.pkl', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['TLS', 'elide.pkl'] },
  238: { answer: 'server { tls { cert key } }', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['tls', 'cert', 'key'] },
  239: { answer: 'No shim overhead', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['no', 'shim'] },
  240: { answer: '10MB', points: 2, topic: 'HTTP', fuzzy: true, keywords: ['10', 'MB'] },

  // HTTP Hard (241-260)
  241: { answer: 'Remove elide/http/server import, use export default async function fetch', points: 3, topic: 'HTTP', fuzzy: true, keywords: ['remove', 'import', 'export', 'default', 'fetch'] },
  242: { answer: 'Netty I/O, Micronaut HTTP, GraalVM runtime', points: 3, topic: 'HTTP', fuzzy: true, keywords: ['Netty', 'Micronaut', 'GraalVM'] },
  243: { answer: 'Non-blocking I/O, native transports, zero-copy', points: 3, topic: 'HTTP', fuzzy: true, keywords: ['non-blocking', 'native', 'zero-copy'] },
  244: { answer: 'High-performance non-blocking I/O', points: 3, topic: 'HTTP', fuzzy: true, keywords: ['performance', 'non-blocking'] },
  245: { answer: 'HTTP protocol handling', points: 3, topic: 'HTTP', fuzzy: true, keywords: ['HTTP', 'protocol'] },
  246: { answer: 'ALPN during TLS handshake', points: 3, topic: 'HTTP', fuzzy: true, keywords: ['ALPN', 'TLS'] },
  247: { answer: 'TLS extension for protocol negotiation', points: 3, topic: 'HTTP', fuzzy: true, keywords: ['TLS', 'protocol', 'negotiation'] },
  248: { answer: 'HTTP/3 over QUIC', points: 3, topic: 'HTTP', fuzzy: true, keywords: ['HTTP/3', 'QUIC'] },
  249: { answer: 'HTTP/2 over cleartext', points: 3, topic: 'HTTP', fuzzy: true, keywords: ['HTTP/2', 'cleartext'] },
  250: { answer: 'Same GraalVM process, shared heap, Truffle interop', points: 3, topic: 'HTTP', fuzzy: true, keywords: ['GraalVM', 'shared', 'Truffle'] },
  251: { answer: '<1ms', points: 3, topic: 'HTTP', fuzzy: true, keywords: ['1ms', 'zero'] },
  252: { answer: 'Flask in Python, import from TypeScript, Fetch Handler for TS endpoints', points: 3, topic: 'HTTP', fuzzy: true, keywords: ['Flask', 'import', 'TypeScript', 'Fetch'] },
  253: { answer: 'One server per port', points: 3, topic: 'HTTP', fuzzy: true, keywords: ['one', 'port'] },
  254: { answer: 'WebSocket upgrade via HTTP', points: 3, topic: 'HTTP', fuzzy: true, keywords: ['WebSocket', 'upgrade'] },
  255: { answer: 'Supported via Netty', points: 3, topic: 'HTTP', fuzzy: true, keywords: ['Netty', 'supported'] },
  256: { answer: 'text/event-stream with streaming Response', points: 3, topic: 'HTTP', fuzzy: true, keywords: ['event-stream', 'streaming'] },
  257: { answer: 'Avoids loading entire response in memory', points: 3, topic: 'HTTP', fuzzy: true, keywords: ['memory', 'streaming'] },
  258: { answer: 'Backpressure signals from controller', points: 3, topic: 'HTTP', fuzzy: true, keywords: ['backpressure', 'controller'] },
  259: { answer: 'Transfer-Encoding: chunked', points: 3, topic: 'HTTP', fuzzy: true, keywords: ['Transfer-Encoding', 'chunked'] },
  260: { answer: 'Deprecated, use preload links', points: 3, topic: 'HTTP', fuzzy: true, keywords: ['deprecated', 'preload'] },

  // Projects & Dependencies (261-320)
  // Easy (261-280)
  261: { answer: 'C', points: 1, topic: 'Projects' },
  262: { answer: 'B', points: 1, topic: 'Projects' },
  263: { answer: 'A', points: 1, topic: 'Projects' },
  264: { answer: 'B', points: 1, topic: 'Projects' },
  265: { answer: 'A,B,C,D', points: 1, topic: 'Projects' },
  266: { answer: 'B', points: 1, topic: 'Projects' },
  267: { answer: 'A', points: 1, topic: 'Projects' },
  268: { answer: 'B', points: 1, topic: 'Projects' },
  269: { answer: 'A', points: 1, topic: 'Projects' },
  270: { answer: 'B', points: 1, topic: 'Projects' },
  271: { answer: 'A', points: 1, topic: 'Projects' },
  272: { answer: 'B', points: 1, topic: 'Projects' },
  273: { answer: 'A', points: 1, topic: 'Projects' },
  274: { answer: 'B', points: 1, topic: 'Projects' },
  275: { answer: 'A', points: 1, topic: 'Projects' },
  276: { answer: 'B', points: 1, topic: 'Projects' },
  277: { answer: 'A', points: 1, topic: 'Projects' },
  278: { answer: 'B', points: 1, topic: 'Projects' },
  279: { answer: 'A', points: 1, topic: 'Projects' },
  280: { answer: 'B', points: 1, topic: 'Projects' },

  // Medium (281-305)
  281: { answer: 'dependencies { npm { packages { "react@18" } } }', points: 2, topic: 'Projects', fuzzy: true, keywords: ['dependencies', 'npm', 'packages'] },
  282: { answer: 'dependencies { maven { packages { "group:artifact:version" } } }', points: 2, topic: 'Projects', fuzzy: true, keywords: ['dependencies', 'maven'] },
  283: { answer: 'dependencies { pip { packages { "package==version" } } }', points: 2, topic: 'Projects', fuzzy: true, keywords: ['dependencies', 'pip'] },
  284: { answer: 'scripts { ["dev"] = "elide serve" }', points: 2, topic: 'Projects', fuzzy: true, keywords: ['scripts', 'dev'] },
  285: { answer: 'tasks { ["build"] = "command" }', points: 2, topic: 'Projects', fuzzy: true, keywords: ['tasks', 'build'] },
  286: { answer: '.dev/elide.lock.bin', points: 2, topic: 'Projects', fuzzy: true, keywords: ['dev', 'lock', 'bin'] },
  287: { answer: 'Binary format', points: 2, topic: 'Projects', fuzzy: true, keywords: ['binary'] },
  288: { answer: 'JSON format', points: 2, topic: 'Projects', fuzzy: true, keywords: ['json'] },
  289: { answer: 'elide install --frozen', points: 2, topic: 'Projects', fuzzy: true, keywords: ['install', 'frozen'] },
  290: { answer: 'elide install --lockfile-format=json', points: 2, topic: 'Projects', fuzzy: true, keywords: ['lockfile-format', 'json'] },
  291: { answer: 'elide add react', points: 2, topic: 'Projects', fuzzy: true, keywords: ['add', 'react'] },
  292: { answer: 'elide add com.google.guava:guava', points: 2, topic: 'Projects', fuzzy: true, keywords: ['add', 'guava'] },
  293: { answer: 'elide add requests', points: 2, topic: 'Projects', fuzzy: true, keywords: ['add', 'requests'] },
  294: { answer: 'devPackages', points: 2, topic: 'Projects', fuzzy: true, keywords: ['devPackages'] },
  295: { answer: 'testPackages', points: 2, topic: 'Projects', fuzzy: true, keywords: ['testPackages'] },
  296: { answer: 'elide build', points: 2, topic: 'Projects', fuzzy: true, keywords: ['build'] },
  297: { answer: 'elide dev', points: 2, topic: 'Projects', fuzzy: true, keywords: ['dev'] },
  298: { answer: 'name and version', points: 2, topic: 'Projects', fuzzy: true, keywords: ['name', 'version'] },
  299: { answer: 'Pkl configuration language', points: 2, topic: 'Projects', fuzzy: true, keywords: ['Pkl'] },
  300: { answer: 'amends "elide:project.pkl"', points: 2, topic: 'Projects', fuzzy: true, keywords: ['amends', 'elide:project'] },
  301: { answer: 'npm, maven, pip, rubygems', points: 2, topic: 'Projects', fuzzy: true, keywords: ['npm', 'maven', 'pip'] },
  302: { answer: 'HuggingFace', points: 2, topic: 'Projects', fuzzy: true, keywords: ['HuggingFace'] },
  303: { answer: 'elide install --verify', points: 2, topic: 'Projects', fuzzy: true, keywords: ['verify'] },
  304: { answer: 'Faster loading', points: 2, topic: 'Projects', fuzzy: true, keywords: ['faster'] },
  305: { answer: 'Human readable', points: 2, topic: 'Projects', fuzzy: true, keywords: ['readable'] },

  // Hard (306-320)
  306: { answer: 'Reproducible builds across environments', points: 3, topic: 'Projects', fuzzy: true, keywords: ['reproducible', 'builds'] },
  307: { answer: 'Prevents dependency drift', points: 3, topic: 'Projects', fuzzy: true, keywords: ['drift', 'prevents'] },
  308: { answer: 'elide install --frozen --verify', points: 3, topic: 'Projects', fuzzy: true, keywords: ['frozen', 'verify'] },
  309: { answer: 'Unified dependency management across languages', points: 3, topic: 'Projects', fuzzy: true, keywords: ['unified', 'languages'] },
  310: { answer: 'Single lockfile for all ecosystems', points: 3, topic: 'Projects', fuzzy: true, keywords: ['single', 'lockfile'] },
  311: { answer: 'Automatic version resolution', points: 3, topic: 'Projects', fuzzy: true, keywords: ['automatic', 'resolution'] },
  312: { answer: 'Transitive dependency resolution', points: 3, topic: 'Projects', fuzzy: true, keywords: ['transitive'] },
  313: { answer: 'Conflict resolution across ecosystems', points: 3, topic: 'Projects', fuzzy: true, keywords: ['conflict', 'resolution'] },
  314: { answer: 'Checksum verification', points: 3, topic: 'Projects', fuzzy: true, keywords: ['checksum'] },
  315: { answer: 'Faster than JSON, smaller size', points: 3, topic: 'Projects', fuzzy: true, keywords: ['faster', 'smaller'] },
  316: { answer: 'Debugging and version control', points: 3, topic: 'Projects', fuzzy: true, keywords: ['debugging', 'version'] },
  317: { answer: 'Type-safe configuration', points: 3, topic: 'Projects', fuzzy: true, keywords: ['type-safe'] },
  318: { answer: 'Validation at configuration time', points: 3, topic: 'Projects', fuzzy: true, keywords: ['validation'] },
  319: { answer: 'Inheritance and composition', points: 3, topic: 'Projects', fuzzy: true, keywords: ['inheritance'] },
  320: { answer: 'Dynamic configuration with code', points: 3, topic: 'Projects', fuzzy: true, keywords: ['dynamic', 'code'] },

  // Polyglot (321-370)
  // Easy (321-335)
  321: { answer: 'A', points: 1, topic: 'Polyglot' },
  322: { answer: 'B', points: 1, topic: 'Polyglot' },
  323: { answer: 'A', points: 1, topic: 'Polyglot' },
  324: { answer: 'B', points: 1, topic: 'Polyglot' },
  325: { answer: 'A', points: 1, topic: 'Polyglot' },
  326: { answer: 'B', points: 1, topic: 'Polyglot' },
  327: { answer: 'A', points: 1, topic: 'Polyglot' },
  328: { answer: 'B', points: 1, topic: 'Polyglot' },
  329: { answer: 'A', points: 1, topic: 'Polyglot' },
  330: { answer: 'B', points: 1, topic: 'Polyglot' },
  331: { answer: 'A', points: 1, topic: 'Polyglot' },
  332: { answer: 'B', points: 1, topic: 'Polyglot' },
  333: { answer: 'A', points: 1, topic: 'Polyglot' },
  334: { answer: 'B', points: 1, topic: 'Polyglot' },
  335: { answer: 'A', points: 1, topic: 'Polyglot' },

  // Medium (336-355)
  336: { answer: 'import math from "./math.py"', points: 2, topic: 'Polyglot', fuzzy: true, keywords: ['import', 'from', 'py'] },
  337: { answer: 'import Calculator from "./Calculator.java"', points: 2, topic: 'Polyglot', fuzzy: true, keywords: ['import', 'from', 'java'] },
  338: { answer: 'import { formatResult } from "./formatter.kt"', points: 2, topic: 'Polyglot', fuzzy: true, keywords: ['import', 'from', 'kt'] },
  339: { answer: 'Zero-serialization, <1ms overhead', points: 2, topic: 'Polyglot', fuzzy: true, keywords: ['zero', 'serialization', '1ms'] },
  340: { answer: 'Shared heap, unified GC', points: 2, topic: 'Polyglot', fuzzy: true, keywords: ['shared', 'heap', 'GC'] },
  341: { answer: 'Truffle interoperability', points: 2, topic: 'Polyglot', fuzzy: true, keywords: ['Truffle', 'interop'] },
  342: { answer: 'Direct function calls', points: 2, topic: 'Polyglot', fuzzy: true, keywords: ['direct', 'calls'] },
  343: { answer: 'No serialization overhead', points: 2, topic: 'Polyglot', fuzzy: true, keywords: ['no', 'serialization'] },
  344: { answer: 'Same process, shared memory', points: 2, topic: 'Polyglot', fuzzy: true, keywords: ['process', 'shared'] },
  345: { answer: 'GraalVM polyglot API', points: 2, topic: 'Polyglot', fuzzy: true, keywords: ['GraalVM', 'polyglot'] },
  346: { answer: 'Truffle language implementation', points: 2, topic: 'Polyglot', fuzzy: true, keywords: ['Truffle', 'language'] },
  347: { answer: 'Type conversion at boundaries', points: 2, topic: 'Polyglot', fuzzy: true, keywords: ['type', 'conversion'] },
  348: { answer: 'Automatic type mapping', points: 2, topic: 'Polyglot', fuzzy: true, keywords: ['automatic', 'mapping'] },
  349: { answer: 'Shared object references', points: 2, topic: 'Polyglot', fuzzy: true, keywords: ['shared', 'references'] },
  350: { answer: 'No GIL in GraalPy', points: 2, topic: 'Polyglot', fuzzy: true, keywords: ['no', 'GIL'] },
  351: { answer: 'True parallelism', points: 2, topic: 'Polyglot', fuzzy: true, keywords: ['parallelism'] },
  352: { answer: 'Coroutines work across languages', points: 2, topic: 'Polyglot', fuzzy: true, keywords: ['coroutines', 'languages'] },
  353: { answer: 'Async/await interop', points: 2, topic: 'Polyglot', fuzzy: true, keywords: ['async', 'await'] },
  354: { answer: 'Promise and coroutine bridging', points: 2, topic: 'Polyglot', fuzzy: true, keywords: ['Promise', 'coroutine'] },
  355: { answer: 'Exception propagation across languages', points: 2, topic: 'Polyglot', fuzzy: true, keywords: ['exception', 'propagation'] },

  // Hard (356-370)
  356: { answer: 'Truffle AST interpretation', points: 3, topic: 'Polyglot', fuzzy: true, keywords: ['Truffle', 'AST'] },
  357: { answer: 'Unified object model', points: 3, topic: 'Polyglot', fuzzy: true, keywords: ['unified', 'object'] },
  358: { answer: 'Graal compiler optimizations', points: 3, topic: 'Polyglot', fuzzy: true, keywords: ['Graal', 'compiler'] },
  359: { answer: 'Inline caching and speculation', points: 3, topic: 'Polyglot', fuzzy: true, keywords: ['inline', 'caching'] },
  360: { answer: 'Partial evaluation', points: 3, topic: 'Polyglot', fuzzy: true, keywords: ['partial', 'evaluation'] },
  361: { answer: 'Escape analysis', points: 3, topic: 'Polyglot', fuzzy: true, keywords: ['escape', 'analysis'] },
  362: { answer: 'Deoptimization on type changes', points: 3, topic: 'Polyglot', fuzzy: true, keywords: ['deoptimization', 'type'] },
  363: { answer: 'Profile-guided optimization', points: 3, topic: 'Polyglot', fuzzy: true, keywords: ['profile', 'optimization'] },
  364: { answer: 'Speculative inlining', points: 3, topic: 'Polyglot', fuzzy: true, keywords: ['speculative', 'inlining'] },
  365: { answer: 'Type feedback', points: 3, topic: 'Polyglot', fuzzy: true, keywords: ['type', 'feedback'] },
  366: { answer: 'Polymorphic inline caches', points: 3, topic: 'Polyglot', fuzzy: true, keywords: ['polymorphic', 'cache'] },
  367: { answer: 'Truffle boundary elimination', points: 3, topic: 'Polyglot', fuzzy: true, keywords: ['boundary', 'elimination'] },
  368: { answer: 'Cross-language inlining', points: 3, topic: 'Polyglot', fuzzy: true, keywords: ['cross-language', 'inlining'] },
  369: { answer: 'Shared compilation units', points: 3, topic: 'Polyglot', fuzzy: true, keywords: ['shared', 'compilation'] },
  370: { answer: 'Unified call graph', points: 3, topic: 'Polyglot', fuzzy: true, keywords: ['unified', 'call'] },

  // Testing & Build (371-410)
  // Easy (371-385)
  371: { answer: 'B', points: 1, topic: 'Testing' },
  372: { answer: 'A', points: 1, topic: 'Testing' },
  373: { answer: 'B', points: 1, topic: 'Testing' },
  374: { answer: 'A', points: 1, topic: 'Testing' },
  375: { answer: 'B', points: 1, topic: 'Testing' },
  376: { answer: 'A', points: 1, topic: 'Testing' },
  377: { answer: 'B', points: 1, topic: 'Testing' },
  378: { answer: 'A', points: 1, topic: 'Testing' },
  379: { answer: 'B', points: 1, topic: 'Testing' },
  380: { answer: 'A', points: 1, topic: 'Testing' },
  381: { answer: 'B', points: 1, topic: 'Testing' },
  382: { answer: 'A', points: 1, topic: 'Testing' },
  383: { answer: 'B', points: 1, topic: 'Testing' },
  384: { answer: 'A', points: 1, topic: 'Testing' },
  385: { answer: 'B', points: 1, topic: 'Testing' },

  // Medium (386-400)
  386: { answer: 'elide test --coverage', points: 2, topic: 'Testing', fuzzy: true, keywords: ['test', 'coverage'] },
  387: { answer: 'elide test --coverage-format=json', points: 2, topic: 'Testing', fuzzy: true, keywords: ['coverage-format', 'json'] },
  388: { answer: 'elide test --test-report=xml', points: 2, topic: 'Testing', fuzzy: true, keywords: ['test-report', 'xml'] },
  389: { answer: 'elide native-image -- -o myapp MyClass', points: 2, topic: 'Testing', fuzzy: true, keywords: ['native-image', 'myapp'] },
  390: { answer: 'elide jib build -- -t myapp:latest', points: 2, topic: 'Testing', fuzzy: true, keywords: ['jib', 'build'] },
  391: { answer: 'Faster startup, smaller binary', points: 2, topic: 'Testing', fuzzy: true, keywords: ['faster', 'smaller'] },
  392: { answer: 'Containerization without Docker', points: 2, topic: 'Testing', fuzzy: true, keywords: ['container', 'Docker'] },
  393: { answer: 'Ahead-of-time compilation', points: 2, topic: 'Testing', fuzzy: true, keywords: ['ahead-of-time'] },
  394: { answer: 'Closed-world assumption', points: 2, topic: 'Testing', fuzzy: true, keywords: ['closed-world'] },
  395: { answer: 'Static analysis', points: 2, topic: 'Testing', fuzzy: true, keywords: ['static', 'analysis'] },
  396: { answer: 'Reflection configuration', points: 2, topic: 'Testing', fuzzy: true, keywords: ['reflection'] },
  397: { answer: 'Resource bundling', points: 2, topic: 'Testing', fuzzy: true, keywords: ['resource'] },
  398: { answer: 'Distroless base images', points: 2, topic: 'Testing', fuzzy: true, keywords: ['distroless'] },
  399: { answer: 'Layer caching', points: 2, topic: 'Testing', fuzzy: true, keywords: ['layer', 'caching'] },
  400: { answer: 'Reproducible builds', points: 2, topic: 'Testing', fuzzy: true, keywords: ['reproducible'] },

  // Hard (401-410)
  401: { answer: 'Profile-guided optimization', points: 3, topic: 'Testing', fuzzy: true, keywords: ['profile', 'optimization'] },
  402: { answer: 'Instrumentation and profiling', points: 3, topic: 'Testing', fuzzy: true, keywords: ['instrumentation', 'profiling'] },
  403: { answer: 'Reachability metadata', points: 3, topic: 'Testing', fuzzy: true, keywords: ['reachability', 'metadata'] },
  404: { answer: 'Build-time initialization', points: 3, topic: 'Testing', fuzzy: true, keywords: ['build-time', 'initialization'] },
  405: { answer: 'Heap snapshotting', points: 3, topic: 'Testing', fuzzy: true, keywords: ['heap', 'snapshot'] },
  406: { answer: 'Dead code elimination', points: 3, topic: 'Testing', fuzzy: true, keywords: ['dead', 'code'] },
  407: { answer: 'Class initialization strategy', points: 3, topic: 'Testing', fuzzy: true, keywords: ['class', 'initialization'] },
  408: { answer: 'Substitution framework', points: 3, topic: 'Testing', fuzzy: true, keywords: ['substitution'] },
  409: { answer: 'Feature detection', points: 3, topic: 'Testing', fuzzy: true, keywords: ['feature', 'detection'] },
  410: { answer: 'Conditional compilation', points: 3, topic: 'Testing', fuzzy: true, keywords: ['conditional', 'compilation'] },

  // Beta11 Features (411-460)
  // Easy (411-430)
  411: { answer: 'A', points: 1, topic: 'Beta11' },
  412: { answer: 'B', points: 1, topic: 'Beta11' },
  413: { answer: 'A', points: 1, topic: 'Beta11' },
  414: { answer: 'B', points: 1, topic: 'Beta11' },
  415: { answer: 'A', points: 1, topic: 'Beta11' },
  416: { answer: 'B', points: 1, topic: 'Beta11' },
  417: { answer: 'A', points: 1, topic: 'Beta11' },
  418: { answer: 'B', points: 1, topic: 'Beta11' },
  419: { answer: 'A', points: 1, topic: 'Beta11' },
  420: { answer: 'B', points: 1, topic: 'Beta11' },
  421: { answer: 'A', points: 1, topic: 'Beta11' },
  422: { answer: 'B', points: 1, topic: 'Beta11' },
  423: { answer: 'A', points: 1, topic: 'Beta11' },
  424: { answer: 'B', points: 1, topic: 'Beta11' },
  425: { answer: 'A', points: 1, topic: 'Beta11' },
  426: { answer: 'B', points: 1, topic: 'Beta11' },
  427: { answer: 'A', points: 1, topic: 'Beta11' },
  428: { answer: 'B', points: 1, topic: 'Beta11' },
  429: { answer: 'A', points: 1, topic: 'Beta11' },
  430: { answer: 'B', points: 1, topic: 'Beta11' },

  // Medium (431-450)
  431: { answer: 'Native HTTP, no shims', points: 2, topic: 'Beta11', fuzzy: true, keywords: ['native', 'HTTP', 'no', 'shims'] },
  432: { answer: 'Fetch Handler pattern', points: 2, topic: 'Beta11', fuzzy: true, keywords: ['Fetch', 'Handler'] },
  433: { answer: 'Node.js http.createServer', points: 2, topic: 'Beta11', fuzzy: true, keywords: ['http', 'createServer'] },
  434: { answer: 'WSGI support', points: 2, topic: 'Beta11', fuzzy: true, keywords: ['WSGI'] },
  435: { answer: 'Flask and Django', points: 2, topic: 'Beta11', fuzzy: true, keywords: ['Flask', 'Django'] },
  436: { answer: '50% faster cold start', points: 2, topic: 'Beta11', fuzzy: true, keywords: ['50', 'faster', 'cold'] },
  437: { answer: '20% higher throughput', points: 2, topic: 'Beta11', fuzzy: true, keywords: ['20', 'throughput'] },
  438: { answer: '10MB less memory', points: 2, topic: 'Beta11', fuzzy: true, keywords: ['10MB', 'memory'] },
  439: { answer: 'Remove elide/http/server import', points: 2, topic: 'Beta11', fuzzy: true, keywords: ['remove', 'import'] },
  440: { answer: 'Use export default async function fetch', points: 2, topic: 'Beta11', fuzzy: true, keywords: ['export', 'default', 'fetch'] },
  441: { answer: 'Zero-serialization Python interop', points: 2, topic: 'Beta11', fuzzy: true, keywords: ['zero', 'Python'] },
  442: { answer: 'Same process, shared heap', points: 2, topic: 'Beta11', fuzzy: true, keywords: ['process', 'heap'] },
  443: { answer: 'Import Python modules from TypeScript', points: 2, topic: 'Beta11', fuzzy: true, keywords: ['import', 'Python', 'TypeScript'] },
  444: { answer: 'Call Flask functions from TS', points: 2, topic: 'Beta11', fuzzy: true, keywords: ['Flask', 'TS'] },
  445: { answer: 'Declarative and imperative', points: 2, topic: 'Beta11', fuzzy: true, keywords: ['declarative', 'imperative'] },
  446: { answer: 'Fetch Handler for simple cases', points: 2, topic: 'Beta11', fuzzy: true, keywords: ['Fetch', 'simple'] },
  447: { answer: 'Node.js http for control', points: 2, topic: 'Beta11', fuzzy: true, keywords: ['http', 'control'] },
  448: { answer: 'No shim overhead', points: 2, topic: 'Beta11', fuzzy: true, keywords: ['no', 'shim'] },
  449: { answer: 'Direct Netty/Micronaut', points: 2, topic: 'Beta11', fuzzy: true, keywords: ['Netty', 'Micronaut'] },
  450: { answer: 'Better performance', points: 2, topic: 'Beta11', fuzzy: true, keywords: ['performance'] },

  // Hard (451-460)
  451: { answer: 'Beta10 used elide/http/server shim, beta11 uses native Netty/Micronaut', points: 3, topic: 'Beta11', fuzzy: true, keywords: ['beta10', 'shim', 'beta11', 'native', 'Netty'] },
  452: { answer: 'Removed abstraction layer, direct HTTP stack access', points: 3, topic: 'Beta11', fuzzy: true, keywords: ['removed', 'abstraction', 'direct'] },
  453: { answer: 'Lower overhead, faster startup, less memory', points: 3, topic: 'Beta11', fuzzy: true, keywords: ['lower', 'overhead', 'faster'] },
  454: { answer: 'Simpler code, fewer dependencies', points: 3, topic: 'Beta11', fuzzy: true, keywords: ['simpler', 'fewer'] },
  455: { answer: 'Better debugging and profiling', points: 3, topic: 'Beta11', fuzzy: true, keywords: ['debugging', 'profiling'] },
  456: { answer: 'More control over server lifecycle', points: 3, topic: 'Beta11', fuzzy: true, keywords: ['control', 'lifecycle'] },
  457: { answer: 'Direct access to Netty features', points: 3, topic: 'Beta11', fuzzy: true, keywords: ['direct', 'Netty'] },
  458: { answer: 'Native HTTP/2 and HTTP/3', points: 3, topic: 'Beta11', fuzzy: true, keywords: ['native', 'HTTP/2', 'HTTP/3'] },
  459: { answer: 'WebSocket support', points: 3, topic: 'Beta11', fuzzy: true, keywords: ['WebSocket'] },
  460: { answer: 'TLS configuration', points: 3, topic: 'Beta11', fuzzy: true, keywords: ['TLS'] },

  // Advanced Topics (461-500)
  // Performance (461-475)
  461: { answer: 'B', points: 3, topic: 'Advanced' },
  462: { answer: 'A', points: 3, topic: 'Advanced' },
  463: { answer: 'B', points: 3, topic: 'Advanced' },
  464: { answer: 'A', points: 3, topic: 'Advanced' },
  465: { answer: 'B', points: 3, topic: 'Advanced' },
  466: { answer: 'Profile-guided optimization', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['profile', 'optimization'] },
  467: { answer: 'Native image compilation', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['native', 'image'] },
  468: { answer: 'Escape analysis', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['escape', 'analysis'] },
  469: { answer: 'Inline caching', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['inline', 'caching'] },
  470: { answer: 'Speculative optimization', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['speculative'] },
  471: { answer: 'Partial evaluation', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['partial', 'evaluation'] },
  472: { answer: 'Dead code elimination', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['dead', 'code'] },
  473: { answer: 'Loop unrolling', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['loop', 'unrolling'] },
  474: { answer: 'Vectorization', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['vectorization'] },
  475: { answer: 'Branch prediction', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['branch', 'prediction'] },

  // Security (476-485)
  476: { answer: 'B', points: 3, topic: 'Advanced' },
  477: { answer: 'A', points: 3, topic: 'Advanced' },
  478: { answer: 'B', points: 3, topic: 'Advanced' },
  479: { answer: 'A', points: 3, topic: 'Advanced' },
  480: { answer: 'B', points: 3, topic: 'Advanced' },
  481: { answer: 'Sandboxing via permissions', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['sandboxing', 'permissions'] },
  482: { answer: 'TLS/SSL encryption', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['TLS', 'SSL'] },
  483: { answer: 'Secrets management', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['secrets'] },
  484: { answer: 'Environment isolation', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['environment', 'isolation'] },
  485: { answer: 'Dependency verification', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['dependency', 'verification'] },

  // Edge Cases (486-500)
  486: { answer: 'B', points: 3, topic: 'Advanced' },
  487: { answer: 'A', points: 3, topic: 'Advanced' },
  488: { answer: 'B', points: 3, topic: 'Advanced' },
  489: { answer: 'A', points: 3, topic: 'Advanced' },
  490: { answer: 'B', points: 3, topic: 'Advanced' },
  491: { answer: 'Type coercion at boundaries', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['type', 'coercion'] },
  492: { answer: 'Null handling across languages', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['null', 'handling'] },
  493: { answer: 'Exception propagation', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['exception', 'propagation'] },
  494: { answer: 'Memory management', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['memory', 'management'] },
  495: { answer: 'Circular references', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['circular', 'references'] },
  496: { answer: 'Async/await bridging', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['async', 'await'] },
  497: { answer: 'Thread safety', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['thread', 'safety'] },
  498: { answer: 'Resource cleanup', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['resource', 'cleanup'] },
  499: { answer: 'Error handling strategies', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['error', 'handling'] },
  500: { answer: 'Performance profiling', points: 3, topic: 'Advanced', fuzzy: true, keywords: ['performance', 'profiling'] },
};

/**
 * Normalize answer for comparison
 */
function normalizeAnswer(answer) {
  return answer
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/['"]/g, '');
}

/**
 * Check if answer matches (exact or fuzzy)
 */
function checkAnswer(questionNum, userAnswer, correctAnswer) {
  const normalized = normalizeAnswer(userAnswer);
  const expected = normalizeAnswer(correctAnswer.answer);
  
  // Exact match for multiple choice
  if (!correctAnswer.fuzzy) {
    return normalized === expected;
  }
  
  // Fuzzy match for short answers - check if all keywords present
  const keywords = correctAnswer.keywords || [];
  return keywords.every(kw => normalized.includes(kw.toLowerCase()));
}

/**
 * Parse answers file
 */
function parseAnswers(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const answers = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Format: "123. Answer text"
    const match = trimmed.match(/^(\d+)\.\s*(.+)$/);
    if (match) {
      const [, num, answer] = match;
      answers[parseInt(num)] = answer;
    }
  }
  
  return answers;
}

/**
 * Score answers
 */
function scoreAnswers(userAnswers) {
  let totalPoints = 0;
  let earnedPoints = 0;
  const results = {
    correct: 0,
    incorrect: 0,
    missing: 0,
    byTopic: {}
  };
  
  // Score each question
  for (const [qNum, correctAnswer] of Object.entries(ANSWER_KEY)) {
    const questionNum = parseInt(qNum);
    totalPoints += correctAnswer.points;
    
    const topic = correctAnswer.topic;
    if (!results.byTopic[topic]) {
      results.byTopic[topic] = { correct: 0, total: 0, points: 0, maxPoints: 0 };
    }
    results.byTopic[topic].total++;
    results.byTopic[topic].maxPoints += correctAnswer.points;
    
    const userAnswer = userAnswers[questionNum];
    
    if (!userAnswer) {
      results.missing++;
      continue;
    }
    
    if (checkAnswer(questionNum, userAnswer, correctAnswer)) {
      results.correct++;
      earnedPoints += correctAnswer.points;
      results.byTopic[topic].correct++;
      results.byTopic[topic].points += correctAnswer.points;
    } else {
      results.incorrect++;
    }
  }
  
  const percentage = (earnedPoints / totalPoints) * 100;
  
  return {
    totalQuestions: Object.keys(ANSWER_KEY).length,
    correct: results.correct,
    incorrect: results.incorrect,
    missing: results.missing,
    earnedPoints,
    totalPoints,
    percentage: percentage.toFixed(2),
    grade: getGrade(percentage),
    byTopic: results.byTopic
  };
}

/**
 * Get grade based on percentage
 */
function getGrade(percentage) {
  if (percentage >= 95) return 'Master';
  if (percentage >= 85) return 'Expert';
  if (percentage >= 70) return 'Pass';
  return 'Fail';
}

/**
 * Format results for display
 */
function formatResults(results) {
  const lines = [];
  
  lines.push('');
  lines.push('='.repeat(60));
  lines.push('ELIDE EXPERT QUIZ - RESULTS');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`Total Questions: ${results.totalQuestions}`);
  lines.push(`Correct: ${results.correct}`);
  lines.push(`Incorrect: ${results.incorrect}`);
  lines.push(`Missing: ${results.missing}`);
  lines.push('');
  lines.push(`Score: ${results.earnedPoints}/${results.totalPoints} points`);
  lines.push(`Percentage: ${results.percentage}%`);
  lines.push(`Grade: ${results.grade}`);
  lines.push('');
  lines.push('-'.repeat(60));
  lines.push('BY TOPIC:');
  lines.push('-'.repeat(60));
  
  for (const [topic, stats] of Object.entries(results.byTopic)) {
    const topicPct = ((stats.points / stats.maxPoints) * 100).toFixed(1);
    lines.push(`${topic.padEnd(20)} ${stats.correct}/${stats.total} (${topicPct}%)`);
  }
  
  lines.push('');
  lines.push('='.repeat(60));
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Main CLI function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node score.js <answers-file>');
    console.error('');
    console.error('Example: node score.js ../my-answers.txt');
    process.exit(1);
  }
  
  const answersFile = resolve(args[0]);
  
  try {
    const userAnswers = parseAnswers(answersFile);
    const results = scoreAnswers(userAnswers);
    console.log(formatResults(results));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export for API use
export { parseAnswers, scoreAnswers, formatResults };

