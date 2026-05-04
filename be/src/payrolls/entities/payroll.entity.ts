import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('payrolls')
export class Payroll {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id' })
    user_id: number;

    @Column()
    month: number;

    @Column()
    year: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    base_salary: number;

    @Column({ default: 22 })
    standard_days: number;

    @Column({ type: 'float', default: 0 })
    actual_days: number;

    @Column({ type: 'float', default: 0 })
    ot_hours: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    ot_pay: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    total_allowances: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    total_deductions: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    net_salary: number;

    @Column({ type: 'enum', enum: ['PENDING', 'APPROVED', 'PAID'], default: 'PENDING' })
    status: string;

    @Column({ type: 'text', nullable: true })
    note: string;

    @CreateDateColumn()
    created_at: Date;
}
