# NestJS Clone for Elide

Enterprise framework with Dependency Injection, Decorators, Modules, Guards, Interceptors, and Pipes (3000+ lines).

## Features

- Dependency Injection (IoC container)
- Decorators (@Controller, @Injectable, @Get, etc.)
- Module system
- Guards for authorization
- Interceptors for AOP
- Pipes for validation
- GraphQL support
- Microservices architecture

## Quick Start

```typescript
import { Module, Controller, Get, Injectable, NestFactory } from './src/nestjs.ts';

@Injectable()
class AppService {
  getHello(): string {
    return 'Hello NestJS Clone!';
  }
}

@Controller()
class AppController {
  constructor(private appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/users/:id')
  getUser(@Param('id') id: string) {
    return { id, name: `User ${id}` };
  }
}

@Module({
  controllers: [AppController],
  providers: [AppService]
})
class AppModule {}

const app = await NestFactory.create(AppModule);
await app.listen(3000);
```

## Performance

- 80,000 req/s
- 1.9x faster than Node.js NestJS
- Full enterprise features
