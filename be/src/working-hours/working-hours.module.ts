import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkingHoursService } from './working-hours.service';
import { WorkingHoursController } from './working-hours.controller';
import { WorkingHours } from './working-hours.entity';

@Module({
    imports: [TypeOrmModule.forFeature([WorkingHours])],
    providers: [WorkingHoursService],
    controllers: [WorkingHoursController],
    exports: [WorkingHoursService],
})
export class WorkingHoursModule { }
