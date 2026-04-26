import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notificationRepository: Repository<Notification>,
    ) { }

    /** Tạo một thông báo mới */
    async create(dto: CreateNotificationDto): Promise<Notification> {
        const notif = this.notificationRepository.create(dto);
        return this.notificationRepository.save(notif);
    }

    /** Lấy danh sách thông báo của một user (mới nhất trước) */
    async findAllForUser(email: string): Promise<Notification[]> {
        return this.notificationRepository.find({
            where: { recipient_email: email },
            order: { created_at: 'DESC' },
            take: 50,
        });
    }

    /** Đếm số thông báo chưa đọc */
    async countUnread(email: string): Promise<number> {
        return this.notificationRepository.count({
            where: { recipient_email: email, is_read: false },
        });
    }

    /** Đánh dấu một thông báo là đã đọc */
    async markRead(id: number): Promise<void> {
        await this.notificationRepository.update(id, { is_read: true });
    }

    /** Đánh dấu tất cả thông báo của user là đã đọc */
    async markAllRead(email: string): Promise<void> {
        await this.notificationRepository.update(
            { recipient_email: email, is_read: false },
            { is_read: true },
        );
    }

    /** Helper: tạo thông báo chấm công vào ca */
    async notifyCheckIn(email: string, checkInTime: string): Promise<void> {
        await this.create({
            recipient_email: email,
            type: NotificationType.TIMEKEEPING_IN,
            title: 'Chấm công vào ca thành công ✅',
            message: `Bạn đã vào ca lúc ${checkInTime}. Chúc bạn có một ngày làm việc hiệu quả! 💪`,
            metadata: { checkInTime },
        });
    }

    /** Helper: tạo thông báo chấm công tan ca */
    async notifyCheckOut(email: string, checkOutTime: string): Promise<void> {
        await this.create({
            recipient_email: email,
            type: NotificationType.TIMEKEEPING_OUT,
            title: 'Chấm công tan ca thành công ✅',
            message: `Bạn đã tan ca lúc ${checkOutTime}. Hẹn gặp lại bạn vào ngày mai! 👋`,
            metadata: { checkOutTime },
        });
    }

    /** Helper: tạo thông báo khi đơn từ được phê duyệt/từ chối */
    async notifyRequestStatus(email: string, status: 'APPROVED' | 'REJECTED', requestType: string): Promise<void> {
        const isApproved = status === 'APPROVED';
        await this.create({
            recipient_email: email,
            type: isApproved ? NotificationType.REQUEST_APPROVED : NotificationType.REQUEST_REJECTED,
            title: isApproved ? 'Đơn từ được phê duyệt ✅' : 'Đơn từ bị từ chối ❌',
            message: isApproved
                ? `Đơn "${requestType}" của bạn đã được phê duyệt.`
                : `Đơn "${requestType}" của bạn đã bị từ chối. Vui lòng liên hệ quản lý để biết thêm chi tiết.`,
            metadata: { requestType, status },
        });
    }

    /** Helper: tạo thông báo khi được tag vào lịch họp */
    async notifyMeetingInvite(email: string, meetingTitle: string, roomName: string, startTime: string): Promise<void> {
        await this.create({
            recipient_email: email,
            type: NotificationType.MEETING_INVITE,
            title: '📅 Lời mời tham gia cuộc họp mới',
            message: `Bạn vừa được thêm vào cuộc họp: "${meetingTitle}" tại ${roomName}. Bắt đầu lúc: ${startTime}.`,
            metadata: { meetingTitle, roomName, startTime },
        });
    }
}
