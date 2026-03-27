import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimekeepingService } from './timekeeping.service';
import { TimekeepingController } from './timekeeping.controller';
import { Timekeeping } from './timekeeping.entity';
import { WorkingHoursModule } from '../working-hours/working-hours.module';
import { Request } from '../requests/entities/request.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Timekeeping, Request]),
        WorkingHoursModule,
    ],
    providers: [TimekeepingService],
    controllers: [TimekeepingController],
})
export class TimekeepingModule { }
