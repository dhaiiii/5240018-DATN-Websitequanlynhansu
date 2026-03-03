import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const queryRunner = dataSource.createQueryRunner();
    const table = await queryRunner.getTable('users');
    console.log('COLUMNS:', table?.columns.map(c => c.name));
    await queryRunner.release();
    await app.close();
}
bootstrap();
