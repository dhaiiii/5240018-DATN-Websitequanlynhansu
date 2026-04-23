import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Room } from './room.entity';

@Entity('meetings')
export class Meeting {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'simple-json', nullable: true })
    organizer: { id: number; name: string; email: string }[];

    @Column()
    room_id: string;

    @ManyToOne(() => Room, room => room.meetings, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'room_id' })
    room: Room;

    @Column({ type: 'timestamp with time zone' })
    start_time: Date;

    @Column({ type: 'timestamp with time zone' })
    end_time: Date;

    @Column({ type: 'varchar', default: 'SCHEDULED' })
    status: string; // SCHEDULED | CANCELLED | COMPLETED

    @CreateDateColumn({ type: 'timestamp with time zone' })
    created_at: Date;
}
