import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingSchedulerService } from './meeting-scheduler.service';
import { MeetingSchedulerController } from './meeting-scheduler.controller';
import { Room } from './entities/room.entity';
import { Meeting } from './entities/meeting.entity';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Room, Meeting, User])],
    controllers: [MeetingSchedulerController],
    providers: [MeetingSchedulerService],
})
export class MeetingSchedulerModule { }
