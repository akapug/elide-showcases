/**
 * @elide/helmet - Basic Usage Examples
 * Demonstrates various Helmet configurations
 */

import helmet, {
  contentSecurityPolicy,
  strictTransportSecurity,
  xFrameOptions,
  referrerPolicy,
  permissionsPolicy,
  strictHelmet,
  moderateHelmet
} from '@elide/helmet';

// Example 1: Default Helmet configuration
export function example1BasicHelmet(app: any) {
  console.log('=== Example 1: Basic Helmet ===');

  // Apply all default security headers
  app.use(helmet());

  app.get('/', (req: any, res: any) => {
    res.send('Protected with default Helmet security headers');
  });
}

// Example 2: Custom CSP configuration
export function example2CustomCSP(app: any) {
  console.log('=== Example 2: Custom CSP ===');

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", 'https://trusted.cdn.com', "'unsafe-inline'"],
        'style-src': ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'connect-src': ["'self'", 'https://api.example.com'],
        'frame-src': ["'none'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': true
      }
    }
  }));

  app.get('/', (req: any, res: any) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CSP Demo</title>
          <link href="https://fonts.googleapis.com/css2?family=Roboto" rel="stylesheet">
        </head>
        <body>
          <h1>Custom CSP Configuration</h1>
          <script src="https://trusted.cdn.com/script.js"></script>
        </body>
      </html>
    `);
  });
}

// Example 3: Strict security configuration
export function example3StrictSecurity(app: any) {
  console.log('=== Example 3: Strict Security ===');

  app.use(helmet(strictHelmet()));

  app.get('/', (req: any, res: any) => {
    res.send('Protected with strict security headers');
  });
}

// Example 4: Moderate security configuration
export function example4ModerateSecurity(app: any) {
  console.log('=== Example 4: Moderate Security ===');

  app.use(helmet(moderateHelmet()));

  app.get('/', (req: any, res: any) => {
    res.send('Protected with moderate security headers');
  });
}

// Example 5: API-specific configuration
export function example5APIConfiguration(app: any) {
  console.log('=== Example 5: API Configuration ===');

  app.use(helmet({
    contentSecurityPolicy: false, // Not needed for API
    xFrameOptions: { action: 'DENY' },
    strictTransportSecurity: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginResourcePolicy: { policy: 'same-origin' }
  }));

  app.get('/api/data', (req: any, res: any) => {
    res.json({ message: 'Secure API endpoint' });
  });
}

// Example 6: CSP with nonce for inline scripts
export function example6CSPWithNonce(app: any) {
  console.log('=== Example 6: CSP with Nonce ===');

  const crypto = require('crypto');

  app.use((req: any, res: any, next: any) => {
    // Generate nonce for this request
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    next();
  });

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          (req: any, res: any) => `'nonce-${res.locals.nonce}'`
        ],
        'style-src': ["'self'", "'unsafe-inline'"]
      }
    }
  }));

  app.get('/', (req: any, res: any) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CSP Nonce Demo</title>
        </head>
        <body>
          <h1>Inline Script with Nonce</h1>
          <script nonce="${res.locals.nonce}">
            console.log('This inline script is allowed via nonce');
          </script>
        </body>
      </html>
    `);
  });
}

// Example 7: Custom headers for specific routes
export function example7RouteSpecificSecurity(app: any) {
  console.log('=== Example 7: Route-Specific Security ===');

  // Global default headers
  app.use(helmet());

  // Additional strict headers for admin routes
  app.use('/admin', helmet(strictHelmet()));

  // Relaxed headers for public content
  app.use('/public', helmet({
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"]
      }
    }
  }));

  app.get('/', (req: any, res: any) => {
    res.send('Default security headers');
  });

  app.get('/admin', (req: any, res: any) => {
    res.send('Admin area with strict security');
  });

  app.get('/public', (req: any, res: any) => {
    res.send('Public area with relaxed security');
  });
}

// Example 8: Permissions Policy configuration
export function example8PermissionsPolicy(app: any) {
  console.log('=== Example 8: Permissions Policy ===');

  app.use(helmet({
    permissionsPolicy: {
      directives: {
        camera: [],                    // Block camera
        microphone: [],                // Block microphone
        geolocation: ['self'],         // Allow geolocation from same origin
        payment: ['self', 'https://payment.example.com'],
        accelerometer: [],
        gyroscope: [],
        magnetometer: [],
        usb: [],
        'picture-in-picture': ['self']
      }
    }
  }));

  app.get('/', (req: any, res: any) => {
    res.send('Permissions Policy configured');
  });
}

// Example 9: HSTS with preload
export function example9HSTSPreload(app: any) {
  console.log('=== Example 9: HSTS with Preload ===');

  app.use(helmet({
    strictTransportSecurity: {
      maxAge: 63072000, // 2 years
      includeSubDomains: true,
      preload: true
    }
  }));

  app.get('/', (req: any, res: any) => {
    res.send('HSTS configured with preload');
  });
}

// Example 10: Reporting endpoints
export function example10ReportingEndpoints(app: any) {
  console.log('=== Example 10: Security Reporting ===');

  // Endpoint to receive CSP violation reports
  app.post('/api/csp-report', (req: any, res: any) => {
    console.log('CSP Violation:', req.body);
    res.status(204).end();
  });

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'report-uri': ['/api/csp-report']
      },
      reportOnly: false // Set to true for testing
    }
  }));

  app.get('/', (req: any, res: any) => {
    res.send('CSP with reporting endpoint');
  });
}

// Example 11: Cross-Origin policies
export function example11CrossOriginPolicies(app: any) {
  console.log('=== Example 11: Cross-Origin Policies ===');

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'same-origin' },
    crossOriginEmbedderPolicy: { policy: 'require-corp' },
    crossOriginOpenerPolicy: { policy: 'same-origin' }
  }));

  app.get('/', (req: any, res: any) => {
    res.send('Cross-Origin policies configured');
  });
}

// Example 12: Disable specific headers
export function example12DisableHeaders(app: any) {
  console.log('=== Example 12: Selective Headers ===');

  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP
    xssFilter: false,             // Disable XSS filter
    strictTransportSecurity: {
      maxAge: 31536000,
      includeSubDomains: true
    },
    xFrameOptions: { action: 'SAMEORIGIN' }
  }));

  app.get('/', (req: any, res: any) => {
    res.send('Selective security headers');
  });
}

// Example 13: Development vs Production
export function example13EnvironmentSpecific(app: any) {
  console.log('=== Example 13: Environment-Specific ===');

  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    // Relaxed headers for development
    app.use(helmet({
      contentSecurityPolicy: false,
      strictTransportSecurity: false
    }));
  } else {
    // Strict headers for production
    app.use(helmet(strictHelmet()));
  }

  app.get('/', (req: any, res: any) => {
    res.send(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Example 14: SPA (Single Page Application) configuration
export function example14SPAConfiguration(app: any) {
  console.log('=== Example 14: SPA Configuration ===');

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'sha256-hash-of-inline-scripts'"],
        'style-src': ["'self'", "'unsafe-inline'"], // Often needed for CSS-in-JS
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': ["'self'", 'https://api.example.com', 'wss://websocket.example.com'],
        'font-src': ["'self'", 'data:'],
        'manifest-src': ["'self'"],
        'worker-src': ["'self'", 'blob:']
      }
    }
  }));

  app.get('/', (req: any, res: any) => {
    res.send('SPA with secure headers');
  });
}

// Example 15: Custom middleware order
export function example15MiddlewareOrder(app: any) {
  console.log('=== Example 15: Middleware Order ===');

  // Apply Helmet early in middleware chain
  app.use(helmet());

  // Other middleware
  app.use((req: any, res: any, next: any) => {
    console.log(`Request: ${req.method} ${req.path}`);
    next();
  });

  // Route handlers
  app.get('/', (req: any, res: any) => {
    res.send('Helmet applied early in middleware chain');
  });
}

// Run all examples
if (require.main === module) {
  const express = require('express');

  console.log('Helmet Examples\n');

  // Example 1
  const app1 = express();
  example1BasicHelmet(app1);
  app1.listen(3001, () => console.log('Example 1 on port 3001\n'));

  // Example 2
  const app2 = express();
  example2CustomCSP(app2);
  app2.listen(3002, () => console.log('Example 2 on port 3002\n'));

  // More examples can be started on different ports...
}
