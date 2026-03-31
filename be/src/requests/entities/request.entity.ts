import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RequestType, RequestStatus } from '../enums/request-type.enum';
import { User } from '../../users/entities/user.entity';

@Entity('requests')
export class Request {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'email', referencedColumnName: 'email' })
    user: User;

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
