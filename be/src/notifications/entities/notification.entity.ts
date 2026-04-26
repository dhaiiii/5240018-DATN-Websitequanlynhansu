import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum NotificationType {
    TIMEKEEPING_IN = 'TIMEKEEPING_IN',
    TIMEKEEPING_OUT = 'TIMEKEEPING_OUT',
    REQUEST_SUBMITTED = 'REQUEST_SUBMITTED',
    REQUEST_APPROVED = 'REQUEST_APPROVED',
    REQUEST_REJECTED = 'REQUEST_REJECTED',
    MEETING_INVITE = 'MEETING_INVITE',
}

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    // Người nhận thông báo
    @Column()
    recipient_email: string;

    @Column({ type: 'enum', enum: NotificationType })
    type: NotificationType;

    @Column()
    title: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ default: false })
    is_read: boolean;

    // Dữ liệu phụ (JSON), ví dụ: { checkIn: '08:01:00', requestId: 5 }
    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
}
