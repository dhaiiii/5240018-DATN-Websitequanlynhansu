import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('profile_histories')
export class ProfileHistory {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.histories, { onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => User, { nullable: true })
    admin: User;

    @Column()
    action: string;

    @Column({ type: 'jsonb', nullable: true })
    changes: any;

    @CreateDateColumn()
    created_at: Date;
}
