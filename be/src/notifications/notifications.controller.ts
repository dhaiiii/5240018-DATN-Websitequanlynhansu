import { Controller, Get, Patch, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    /** GET /notifications — Lấy tất cả thông báo của user hiện tại */
    @Get()
    findAll(@CurrentUser() user: any) {
        return this.notificationsService.findAllForUser(user.email);
    }

    /** GET /notifications/unread-count — Đếm số thông báo chưa đọc */
    @Get('unread-count')
    countUnread(@CurrentUser() user: any) {
        return this.notificationsService.countUnread(user.email).then(count => ({ count }));
    }

    /** PATCH /notifications/read-all — Đánh dấu tất cả là đã đọc */
    @Patch('read-all')
    markAllRead(@CurrentUser() user: any) {
        return this.notificationsService.markAllRead(user.email);
    }

    /** PATCH /notifications/:id/read — Đánh dấu một thông báo là đã đọc */
    @Patch(':id/read')
    markRead(@Param('id', ParseIntPipe) id: number) {
        return this.notificationsService.markRead(id);
    }
}
