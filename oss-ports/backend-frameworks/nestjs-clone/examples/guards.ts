/**
 * Guards Example for NestJS Clone
 *
 * Demonstrates authentication and authorization guards for route protection
 */

import {
  Controller,
  Get,
  Post,
  UseGuards,
  Injectable,
  createNestApplication
} from '../src/nestjs.ts';

// ==================== GUARDS ====================

@Injectable()
class AuthGuard {
  async canActivate(context: any): Promise<boolean> {
    const request = context.request;
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized: Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    // Simulate token validation
    if (token !== 'valid-token-123') {
      throw new Error('Unauthorized: Invalid token');
    }

    // Attach user to request
    request.user = {
      id: 1,
      email: 'user@example.com',
      username: 'testuser',
      roles: ['user']
    };

    return true;
  }
}

@Injectable()
class RolesGuard {
  constructor(private requiredRoles: string[]) {}

  async canActivate(context: any): Promise<boolean> {
    const request = context.request;

    if (!request.user) {
      throw new Error('Forbidden: User not authenticated');
    }

    const hasRole = this.requiredRoles.some(role =>
      request.user.roles.includes(role)
    );

    if (!hasRole) {
      throw new Error(`Forbidden: Requires one of: ${this.requiredRoles.join(', ')}`);
    }

    return true;
  }
}

@Injectable()
class RateLimitGuard {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private limit = 10;
  private windowMs = 60000; // 1 minute

  async canActivate(context: any): Promise<boolean> {
    const request = context.request;
    const ip = request.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();

    let record = this.requests.get(ip);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + this.windowMs };
      this.requests.set(ip, record);
    }

    record.count++;

    if (record.count > this.limit) {
      throw new Error('Too Many Requests: Rate limit exceeded');
    }

    return true;
  }
}

@Injectable()
class ThrottleGuard {
  private lastRequest = new Map<string, number>();
  private delayMs = 1000; // 1 second between requests

  async canActivate(context: any): Promise<boolean> {
    const request = context.request;
    const ip = request.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();

    const last = this.lastRequest.get(ip);

    if (last && now - last < this.delayMs) {
      const waitTime = this.delayMs - (now - last);
      throw new Error(`Too Fast: Please wait ${waitTime}ms before next request`);
    }

    this.lastRequest.set(ip, now);
    return true;
  }
}

@Injectable()
class ApiKeyGuard {
  private validKeys = new Set(['key-123', 'key-456', 'key-789']);

  async canActivate(context: any): Promise<boolean> {
    const request = context.request;
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new Error('Unauthorized: API key required');
    }

    if (!this.validKeys.has(apiKey)) {
      throw new Error('Unauthorized: Invalid API key');
    }

    request.apiKey = apiKey;
    return true;
  }
}

// ==================== SERVICES ====================

@Injectable()
class UserService {
  getProfile(userId: number) {
    return {
      id: userId,
      email: 'user@example.com',
      username: 'testuser',
      fullName: 'Test User',
      roles: ['user'],
      createdAt: '2024-01-01T00:00:00Z'
    };
  }

  getAdminDashboard() {
    return {
      stats: {
        totalUsers: 1250,
        activeUsers: 890,
        newUsersToday: 42
      },
      recentActivity: [
        { user: 'alice', action: 'login', timestamp: '2024-01-20T10:30:00Z' },
        { user: 'bob', action: 'update_profile', timestamp: '2024-01-20T10:25:00Z' }
      ]
    };
  }
}

@Injectable()
class AdminService {
  getAllUsers() {
    return {
      users: [
        { id: 1, username: 'alice', role: 'admin' },
        { id: 2, username: 'bob', role: 'user' },
        { id: 3, username: 'charlie', role: 'user' }
      ],
      total: 3
    };
  }

  deleteUser(userId: number) {
    return {
      success: true,
      message: `User ${userId} deleted successfully`
    };
  }
}

// ==================== CONTROLLERS ====================

@Controller('/api')
class ApiController {
  constructor(private userService: UserService) {}

  @Get('/public')
  getPublic() {
    return {
      message: 'This is a public endpoint - no authentication required',
      timestamp: new Date().toISOString()
    };
  }

  @Get('/protected')
  @UseGuards(AuthGuard)
  getProtected(context: any) {
    return {
      message: 'This is a protected endpoint',
      user: context.request.user,
      timestamp: new Date().toISOString()
    };
  }

  @Get('/profile')
  @UseGuards(AuthGuard)
  getProfile(context: any) {
    const userId = context.request.user.id;
    return this.userService.getProfile(userId);
  }

  @Post('/sensitive')
  @UseGuards(AuthGuard, RateLimitGuard)
  postSensitive(context: any) {
    return {
      message: 'Sensitive operation completed',
      user: context.request.user.username,
      timestamp: new Date().toISOString()
    };
  }

  @Get('/throttled')
  @UseGuards(ThrottleGuard)
  getThrottled() {
    return {
      message: 'This endpoint is throttled - max 1 request per second',
      timestamp: new Date().toISOString()
    };
  }

  @Get('/api-key-required')
  @UseGuards(ApiKeyGuard)
  getWithApiKey(context: any) {
    return {
      message: 'API key validated successfully',
      apiKey: context.request.apiKey,
      timestamp: new Date().toISOString()
    };
  }
}

@Controller('/admin')
class AdminController {
  constructor(
    private userService: UserService,
    private adminService: AdminService
  ) {}

  @Get('/dashboard')
  @UseGuards(AuthGuard, RolesGuard)
  getDashboard() {
    // RolesGuard would be initialized with ['admin'] role requirement
    return this.userService.getAdminDashboard();
  }

  @Get('/users')
  @UseGuards(AuthGuard, RolesGuard)
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Post('/users/:id/delete')
  @UseGuards(AuthGuard, RolesGuard, RateLimitGuard)
  deleteUser(context: any) {
    const userId = parseInt(context.request.params.id);
    return this.adminService.deleteUser(userId);
  }
}

// ==================== MODULE ====================

const app = createNestApplication({
  controllers: [ApiController, AdminController],
  providers: [
    UserService,
    AdminService,
    AuthGuard,
    RolesGuard,
    RateLimitGuard,
    ThrottleGuard,
    ApiKeyGuard
  ]
});

// ==================== START APPLICATION ====================

console.log('\n🛡️  NestJS Guards Demo\n');
console.log('Available Endpoints:\n');
console.log('Public:');
console.log('  GET  /api/public - No authentication required\n');
console.log('Protected (requires Bearer token):');
console.log('  GET  /api/protected - Basic auth guard');
console.log('  GET  /api/profile - User profile');
console.log('  POST /api/sensitive - Auth + rate limiting');
console.log('  GET  /api/throttled - Throttled (1 req/sec)');
console.log('  GET  /api/api-key-required - Requires X-API-Key header\n');
console.log('Admin (requires admin role):');
console.log('  GET  /admin/dashboard - Admin dashboard');
console.log('  GET  /admin/users - List all users');
console.log('  POST /admin/users/:id/delete - Delete user\n');
console.log('Guards:');
console.log('  ✓ AuthGuard - Validates Bearer token');
console.log('  ✓ RolesGuard - Checks user roles');
console.log('  ✓ RateLimitGuard - Limits requests per time window');
console.log('  ✓ ThrottleGuard - Enforces delay between requests');
console.log('  ✓ ApiKeyGuard - Validates API keys\n');
console.log('Usage:');
console.log('  curl http://localhost:3300/api/public');
console.log('  curl -H "Authorization: Bearer valid-token-123" http://localhost:3300/api/protected');
console.log('  curl -H "X-API-Key: key-123" http://localhost:3300/api/api-key-required\n');

app.listen(3300);
