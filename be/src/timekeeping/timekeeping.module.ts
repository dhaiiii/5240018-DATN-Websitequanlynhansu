import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimekeepingService } from './timekeeping.service';
import { TimekeepingController } from './timekeeping.controller';
import { Timekeeping } from './timekeeping.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Timekeeping]),
    ],
    controllers: [TimekeepingController],
    providers: [TimekeepingService],
})
export class TimekeepingModule { }
