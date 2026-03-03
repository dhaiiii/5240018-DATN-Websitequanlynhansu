import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { RequestType, RequestStatus } from '../enums/request-type.enum';

@Entity('requests')
export class Request {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @Column({
        type: 'enum',
        enum: RequestType,
    })
    type: RequestType;

    @Column({ type: 'text', nullable: true })
    reason: string;

    @Column({
        type: 'enum',
        enum: RequestStatus,
        default: RequestStatus.PENDING,
    })
    status: RequestStatus;

    @Column({ type: 'timestamp', nullable: true })
    start_date: Date;

    @Column({ type: 'timestamp', nullable: true })
    end_date: Date;

    @Column({ nullable: true })
    processed_by: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
}
