import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Timekeeping } from '../timekeeping/timekeeping.entity';

@Entity('working_hours')
export class WorkingHours {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    startTime: string; // e.g., "08:00"

    @Column()
    endTime: string; // e.g., "17:00"

    @Column({ type: 'date' })
    effectiveDate: Date;

    @CreateDateColumn()
    createdAt: Date;

    @OneToMany(() => Timekeeping, timekeeping => timekeeping.workingHours)
    timekeepings: Timekeeping[];
}
