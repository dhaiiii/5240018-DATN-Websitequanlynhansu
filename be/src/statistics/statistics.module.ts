import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { User } from '../users/entities/user.entity';
import { Department } from '../departments/entities/department.entity';
import { Timekeeping } from '../timekeeping/timekeeping.entity';
import { Request } from '../requests/entities/request.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Department, Timekeeping, Request]),
    ],
    controllers: [StatisticsController],
    providers: [StatisticsService],
})
export class StatisticsModule { }
