import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';
import { Role } from './src/roles/entities/role.entity';

async function bootstrap() {
    try {
        const app = await NestFactory.createApplicationContext(AppModule);
        const dataSource = app.get(DataSource);
        const roles = await dataSource.getRepository(Role).find();
        console.log('--- START ROLES ---');
        console.log(JSON.stringify(roles, null, 2));
        console.log('--- END ROLES ---');
        await app.close();
    } catch (err) {
        console.error('ERROR:', err);
    }
}
bootstrap();
