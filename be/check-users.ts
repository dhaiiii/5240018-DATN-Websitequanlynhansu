import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { UsersService } from './src/users/users.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);
    const users = await usersService.findAll();
    console.log('USERS:', JSON.stringify(users.map(u => ({ email: u.email, first: u.first_name, last: u.last_name })), null, 2));
    await app.close();
}
bootstrap();
