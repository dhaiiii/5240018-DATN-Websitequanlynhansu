import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Notification])],
    providers: [NotificationsService],
    controllers: [NotificationsController],
    exports: [NotificationsService], // Export để các module khác (timekeeping, requests) dùng
})
export class NotificationsModule { }
