import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { WorkingHours } from '../working-hours/working-hours.entity';

@Entity('timekeeping')
export class Timekeeping {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: '' })
    email: string;

    @Column({ type: 'time', default: () => 'CURRENT_TIME' })
    start_time: string;

    @Column({ type: 'time', nullable: true })
    end_time: string | null;

    @ManyToOne(() => WorkingHours, { nullable: true })
    @JoinColumn({ name: 'working_hours_id' })
    workingHours: WorkingHours;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
}
