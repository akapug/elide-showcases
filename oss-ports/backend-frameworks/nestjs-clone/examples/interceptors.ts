/**
 * Interceptors Example for NestJS Clone
 *
 * Demonstrates request/response transformation, logging, caching, and error handling
 */

import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  Injectable,
  createNestApplication
} from '../src/nestjs.ts';

// ==================== INTERCEPTORS ====================

@Injectable()
class LoggingInterceptor {
  async intercept(context: any, next: Function): Promise<any> {
    const request = context.request;
    const start = Date.now();

    console.log(`→ ${request.method} ${request.url}`);
    console.log(`  Headers:`, request.headers);
    console.log(`  Body:`, request.body);

    const result = await next();

    const duration = Date.now() - start;
    console.log(`← ${request.method} ${request.url} - ${duration}ms`);
    console.log(`  Response:`, result);

    return result;
  }
}

@Injectable()
class TransformInterceptor {
  async intercept(context: any, next: Function): Promise<any> {
    const result = await next();

    // Wrap response in standard format
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      path: context.request.url
    };
  }
}

@Injectable()
class CacheInterceptor {
  private cache = new Map<string, { data: any; expires: number }>();
  private ttl = 60000; // 60 seconds

  async intercept(context: any, next: Function): Promise<any> {
    const request = context.request;

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next();
    }

    const cacheKey = request.url;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() < cached.expires) {
      console.log(`Cache HIT: ${cacheKey}`);
      return {
        ...cached.data,
        _cached: true,
        _cacheAge: Math.floor((Date.now() - (cached.expires - this.ttl)) / 1000)
      };
    }

    console.log(`Cache MISS: ${cacheKey}`);
    const result = await next();

    this.cache.set(cacheKey, {
      data: result,
      expires: Date.now() + this.ttl
    });

    return {
      ...result,
      _cached: false
    };
  }
}

@Injectable()
class ErrorInterceptor {
  async intercept(context: any, next: Function): Promise<any> {
    try {
      return await next();
    } catch (error: any) {
      console.error('Error intercepted:', error);

      // Transform error into consistent format
      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || 'INTERNAL_ERROR',
          statusCode: error.statusCode || 500,
          timestamp: new Date().toISOString(),
          path: context.request.url
        }
      };
    }
  }
}

@Injectable()
class TimeoutInterceptor {
  private timeoutMs = 5000;

  async intercept(context: any, next: Function): Promise<any> {
    const timeout = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${this.timeoutMs}ms`));
      }, this.timeoutMs);
    });

    return Promise.race([next(), timeout]);
  }
}

@Injectable()
class HeaderInterceptor {
  async intercept(context: any, next: Function): Promise<any> {
    const result = await next();

    // Add custom headers to response
    context.response.setHeader('X-Powered-By', 'NestJS-Clone');
    context.response.setHeader('X-Request-ID', `req-${Date.now()}`);
    context.response.setHeader('X-Response-Time', `${Date.now()}ms`);

    return result;
  }
}

@Injectable()
class CompressionInterceptor {
  async intercept(context: any, next: Function): Promise<any> {
    const result = await next();

    // Simulate compression check
    const acceptEncoding = context.request.headers['accept-encoding'] || '';

    if (acceptEncoding.includes('gzip')) {
      console.log('Compressing response with gzip');
      context.response.setHeader('Content-Encoding', 'gzip');
    } else if (acceptEncoding.includes('deflate')) {
      console.log('Compressing response with deflate');
      context.response.setHeader('Content-Encoding', 'deflate');
    }

    return result;
  }
}

@Injectable()
class MetricsInterceptor {
  private metrics = {
    requests: 0,
    totalDuration: 0,
    errors: 0,
    endpoints: new Map<string, { count: number; totalDuration: number }>()
  };

  async intercept(context: any, next: Function): Promise<any> {
    const start = Date.now();
    const endpoint = `${context.request.method} ${context.request.url}`;

    this.metrics.requests++;

    try {
      const result = await next();
      const duration = Date.now() - start;

      this.metrics.totalDuration += duration;

      const endpointMetrics = this.metrics.endpoints.get(endpoint) || {
        count: 0,
        totalDuration: 0
      };

      endpointMetrics.count++;
      endpointMetrics.totalDuration += duration;

      this.metrics.endpoints.set(endpoint, endpointMetrics);

      return result;
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }

  getMetrics() {
    const endpoints: any[] = [];

    for (const [endpoint, data] of this.metrics.endpoints) {
      endpoints.push({
        endpoint,
        requests: data.count,
        avgDuration: Math.round(data.totalDuration / data.count)
      });
    }

    return {
      totalRequests: this.metrics.requests,
      totalErrors: this.metrics.errors,
      avgDuration: Math.round(this.metrics.totalDuration / this.metrics.requests),
      endpoints
    };
  }
}

// ==================== SERVICES ====================

@Injectable()
class DataService {
  getData() {
    return {
      items: [
        { id: 1, name: 'Item 1', value: 100 },
        { id: 2, name: 'Item 2', value: 200 },
        { id: 3, name: 'Item 3', value: 300 }
      ]
    };
  }

  getSlowData() {
    // Simulate slow operation
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          message: 'This took a while to fetch',
          data: { slow: true }
        });
      }, 2000);
    });
  }

  getErrorData() {
    throw new Error('Simulated error in data service');
  }
}

// ==================== CONTROLLERS ====================

const metricsInterceptor = new MetricsInterceptor();

@Controller('/api')
class ApiController {
  constructor(private dataService: DataService) {}

  @Get('/basic')
  @UseInterceptors(LoggingInterceptor)
  getBasic() {
    return {
      message: 'Basic endpoint with logging interceptor',
      timestamp: new Date().toISOString()
    };
  }

  @Get('/transformed')
  @UseInterceptors(TransformInterceptor)
  getTransformed() {
    return {
      message: 'This response will be transformed',
      value: 42
    };
  }

  @Get('/cached')
  @UseInterceptors(CacheInterceptor)
  getCached() {
    return {
      message: 'This response is cached for 60 seconds',
      timestamp: new Date().toISOString(),
      random: Math.random()
    };
  }

  @Get('/data')
  @UseInterceptors(LoggingInterceptor, TransformInterceptor)
  getData() {
    return this.dataService.getData();
  }

  @Get('/slow')
  @UseInterceptors(TimeoutInterceptor, LoggingInterceptor)
  async getSlowData() {
    return await this.dataService.getSlowData();
  }

  @Get('/error')
  @UseInterceptors(ErrorInterceptor)
  getError() {
    return this.dataService.getErrorData();
  }

  @Get('/with-headers')
  @UseInterceptors(HeaderInterceptor)
  getWithHeaders() {
    return {
      message: 'Check response headers',
      timestamp: new Date().toISOString()
    };
  }

  @Get('/compressed')
  @UseInterceptors(CompressionInterceptor)
  getCompressed() {
    return {
      message: 'This response will be compressed if client supports it',
      data: 'Large data payload here...'.repeat(100)
    };
  }

  @Get('/tracked')
  @UseInterceptors(metricsInterceptor)
  getTracked() {
    return {
      message: 'This request is tracked in metrics',
      timestamp: new Date().toISOString()
    };
  }

  @Post('/tracked')
  @UseInterceptors(metricsInterceptor)
  postTracked() {
    return {
      message: 'POST request tracked',
      timestamp: new Date().toISOString()
    };
  }

  @Get('/metrics')
  getMetrics() {
    return metricsInterceptor.getMetrics();
  }

  @Get('/all-interceptors')
  @UseInterceptors(
    LoggingInterceptor,
    MetricsInterceptor,
    HeaderInterceptor,
    TransformInterceptor,
    CacheInterceptor
  )
  getAllInterceptors() {
    return {
      message: 'Endpoint with multiple interceptors',
      features: ['logging', 'metrics', 'headers', 'transform', 'cache']
    };
  }
}

// ==================== MODULE ====================

const app = createNestApplication({
  controllers: [ApiController],
  providers: [
    DataService,
    LoggingInterceptor,
    TransformInterceptor,
    CacheInterceptor,
    ErrorInterceptor,
    TimeoutInterceptor,
    HeaderInterceptor,
    CompressionInterceptor,
    MetricsInterceptor
  ]
});

// ==================== START APPLICATION ====================

console.log('\n🎯 NestJS Interceptors Demo\n');
console.log('Interceptors Available:');
console.log('  • LoggingInterceptor - Logs requests and responses');
console.log('  • TransformInterceptor - Wraps responses in standard format');
console.log('  • CacheInterceptor - Caches GET requests for 60s');
console.log('  • ErrorInterceptor - Transforms errors into standard format');
console.log('  • TimeoutInterceptor - Enforces request timeout (5s)');
console.log('  • HeaderInterceptor - Adds custom response headers');
console.log('  • CompressionInterceptor - Compresses responses');
console.log('  • MetricsInterceptor - Tracks request metrics\n');
console.log('Endpoints:');
console.log('  GET  /api/basic - Logging interceptor');
console.log('  GET  /api/transformed - Transform interceptor');
console.log('  GET  /api/cached - Cache interceptor (60s TTL)');
console.log('  GET  /api/data - Multiple interceptors');
console.log('  GET  /api/slow - Timeout interceptor (2s delay)');
console.log('  GET  /api/error - Error interceptor');
console.log('  GET  /api/with-headers - Header interceptor');
console.log('  GET  /api/compressed - Compression interceptor');
console.log('  GET  /api/tracked - Metrics interceptor');
console.log('  POST /api/tracked - Metrics interceptor (POST)');
console.log('  GET  /api/metrics - View collected metrics');
console.log('  GET  /api/all-interceptors - All interceptors combined\n');
console.log('Usage:');
console.log('  curl http://localhost:3300/api/transformed');
console.log('  curl http://localhost:3300/api/cached  # Hit twice to see cache');
console.log('  curl http://localhost:3300/api/metrics # View metrics\n');

app.listen(3300);
