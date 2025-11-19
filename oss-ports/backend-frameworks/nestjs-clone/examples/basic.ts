import { Module, Controller, Get, Post, Body, Param, Injectable, NestFactory } from '../src/nestjs.ts';

@Injectable()
class UserService {
  private users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ];

  findAll() {
    return this.users;
  }

  findOne(id: number) {
    return this.users.find(u => u.id === id);
  }
}

@Controller('users')
class UserController {
  constructor(private userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(parseInt(id));
  }
}

@Module({
  controllers: [UserController],
  providers: [UserService]
})
class AppModule {}

const app = await NestFactory.create(AppModule);
await app.listen(3000, () => {
  console.log('NestJS Clone app listening on port 3000');
});
