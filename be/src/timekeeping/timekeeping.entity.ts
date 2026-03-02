import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';

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

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
}
