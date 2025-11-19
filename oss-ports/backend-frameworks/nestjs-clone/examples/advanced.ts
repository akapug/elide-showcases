/**
 * Advanced NestJS Clone Example
 *
 * Demonstrates Guards, Interceptors, Pipes, and advanced patterns
 */

import {
  Module,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Injectable,
  NestFactory,
  UseGuards,
  UseInterceptors,
  UsePipes,
  Guard,
  Interceptor,
  Pipe,
  ExecutionContext,
  CallHandler,
  ArgumentMetadata
} from '../src/nestjs.ts';

// ==================== GUARDS ====================

@Injectable()
class AuthGuard implements Guard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7);

    // Simple token validation
    if (token !== 'valid-token') {
      return false;
    }

    request.user = { id: 1, username: 'admin' };
    return true;
  }
}

@Injectable()
class RolesGuard implements Guard {
  constructor(private requiredRole: string) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    // Check user role
    return user.role === this.requiredRole || user.role === 'admin';
  }
}

// ==================== INTERCEPTORS ====================

@Injectable()
class LoggingInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();

    console.log(`[Request] ${request.method} ${request.url}`);

    const result = await next.handle();

    const duration = Date.now() - start;
    console.log(`[Response] ${request.method} ${request.url} - ${duration}ms`);

    return result;
  }
}

@Injectable()
class TransformInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const result = await next.handle();

    // Wrap result in standard format
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    };
  }
}

@Injectable()
class CacheInterceptor implements Interceptor {
  private cache = new Map<string, { value: any; expires: number }>();

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = `${request.method}:${request.url}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expires) {
      console.log(`[Cache] HIT for ${cacheKey}`);
      return cached.value;
    }

    // Execute handler
    const result = await next.handle();

    // Store in cache (5 second TTL)
    this.cache.set(cacheKey, {
      value: result,
      expires: Date.now() + 5000
    });

    console.log(`[Cache] MISS for ${cacheKey}`);
    return result;
  }
}

// ==================== PIPES ====================

@Injectable()
class ValidationPipe implements Pipe {
  transform(value: any, metadata: ArgumentMetadata): any {
    if (metadata.type === 'body') {
      // Validate body
      if (!value || typeof value !== 'object') {
        throw new Error('Invalid body format');
      }
    }

    return value;
  }
}

@Injectable()
class ParseIntPipe implements Pipe {
  transform(value: any, metadata: ArgumentMetadata): any {
    const val = parseInt(value, 10);

    if (isNaN(val)) {
      throw new Error(`Validation failed: "${value}" is not a valid integer`);
    }

    return val;
  }
}

@Injectable()
class TrimPipe implements Pipe {
  transform(value: any, metadata: ArgumentMetadata): any {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'object' && value !== null) {
      const trimmed: any = {};
      for (const [key, val] of Object.entries(value)) {
        trimmed[key] = typeof val === 'string' ? val.trim() : val;
      }
      return trimmed;
    }

    return value;
  }
}

// ==================== SERVICES ====================

@Injectable()
class UserService {
  private users = [
    { id: 1, username: 'alice', email: 'alice@example.com', role: 'admin' },
    { id: 2, username: 'bob', email: 'bob@example.com', role: 'user' },
    { id: 3, username: 'charlie', email: 'charlie@example.com', role: 'user' }
  ];

  findAll() {
    return this.users;
  }

  findOne(id: number) {
    return this.users.find(u => u.id === id);
  }

  create(userData: any) {
    const newUser = {
      id: this.users.length + 1,
      ...userData
    };
    this.users.push(newUser);
    return newUser;
  }

  update(id: number, userData: any) {
    const user = this.findOne(id);
    if (!user) return null;

    Object.assign(user, userData);
    return user;
  }

  delete(id: number) {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return false;

    this.users.splice(index, 1);
    return true;
  }
}

@Injectable()
class PostService {
  private posts = [
    { id: 1, userId: 1, title: 'First Post', content: 'Hello World' },
    { id: 2, userId: 2, title: 'Second Post', content: 'Another post' }
  ];

  findAll(userId?: number) {
    if (userId) {
      return this.posts.filter(p => p.userId === userId);
    }
    return this.posts;
  }

  findOne(id: number) {
    return this.posts.find(p => p.id === id);
  }

  create(postData: any) {
    const newPost = {
      id: this.posts.length + 1,
      ...postData
    };
    this.posts.push(newPost);
    return newPost;
  }
}

// ==================== CONTROLLERS ====================

@Controller('users')
@UseInterceptors(LoggingInterceptor)
class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @UseInterceptors(TransformInterceptor, CacheInterceptor)
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @UsePipes(ParseIntPipe)
  findOne(@Param('id') id: number) {
    const user = this.userService.findOne(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(ValidationPipe, TrimPipe)
  create(@Body() userData: any) {
    return this.userService.create(userData);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @UsePipes(ParseIntPipe, ValidationPipe)
  update(@Param('id') id: number, @Body() userData: any) {
    const user = this.userService.update(id, userData);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @UsePipes(ParseIntPipe)
  delete(@Param('id') id: number) {
    const deleted = this.userService.delete(id);
    if (!deleted) {
      throw new Error('User not found');
    }
    return { success: true, id };
  }
}

@Controller('posts')
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
class PostController {
  constructor(private postService: PostService) {}

  @Get()
  findAll(@Query('userId') userId?: string) {
    const userIdNum = userId ? parseInt(userId) : undefined;
    return this.postService.findAll(userIdNum);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  findOne(@Param('id') id: string) {
    const post = this.postService.findOne(parseInt(id));
    if (!post) {
      throw new Error('Post not found');
    }
    return post;
  }

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(ValidationPipe)
  create(@Body() postData: any) {
    return this.postService.create(postData);
  }
}

@Controller('admin')
@UseGuards(AuthGuard)
class AdminController {
  constructor(
    private userService: UserService,
    private postService: PostService
  ) {}

  @Get('stats')
  @UseInterceptors(TransformInterceptor)
  getStats() {
    return {
      users: this.userService.findAll().length,
      posts: this.postService.findAll().length,
      timestamp: new Date().toISOString()
    };
  }

  @Get('users')
  getAllUsers() {
    return this.userService.findAll();
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    const deleted = this.userService.delete(parseInt(id));
    if (!deleted) {
      throw new Error('User not found');
    }
    return { success: true, id: parseInt(id) };
  }
}

// ==================== MODULE ====================

@Module({
  controllers: [UserController, PostController, AdminController],
  providers: [
    UserService,
    PostService,
    AuthGuard,
    LoggingInterceptor,
    TransformInterceptor,
    CacheInterceptor,
    ValidationPipe,
    ParseIntPipe,
    TrimPipe
  ]
})
class AppModule {}

// ==================== BOOTSTRAP ====================

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  await app.listen(3200, () => {
    console.log('\n🚀 Advanced NestJS Clone app listening on port 3200\n');
    console.log('Features demonstrated:');
    console.log('  ✓ Guards (AuthGuard)');
    console.log('  ✓ Interceptors (Logging, Transform, Cache)');
    console.log('  ✓ Pipes (Validation, ParseInt, Trim)');
    console.log('  ✓ Dependency Injection');
    console.log('  ✓ Multiple controllers');
    console.log('\nEndpoints:');
    console.log('  GET    /api/v1/users - List users (cached)');
    console.log('  GET    /api/v1/users/:id - Get user');
    console.log('  POST   /api/v1/users - Create user (requires auth)');
    console.log('  PUT    /api/v1/users/:id - Update user (requires auth)');
    console.log('  DELETE /api/v1/users/:id - Delete user (requires auth)');
    console.log('  GET    /api/v1/posts - List posts');
    console.log('  GET    /api/v1/posts/:id - Get post (cached)');
    console.log('  POST   /api/v1/posts - Create post (requires auth)');
    console.log('  GET    /api/v1/admin/stats - Admin stats (requires auth)');
    console.log('\nAuthentication:');
    console.log('  Add header: Authorization: Bearer valid-token\n');
  });
}

bootstrap();
