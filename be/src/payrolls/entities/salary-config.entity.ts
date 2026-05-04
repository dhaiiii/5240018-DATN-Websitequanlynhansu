import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('salary_configs')
export class SalaryConfig {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id' })
    user_id: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    base_salary: number;

    @Column({ type: 'jsonb', nullable: true })
    allowances: { label: string, amount: number }[];

    @Column({ nullable: true })
    bank_account_number: string;

    @Column({ nullable: true })
    bank_name: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
