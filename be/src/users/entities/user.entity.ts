import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Department } from '../../departments/entities/department.entity';
import { Role as RoleEntity } from '../../roles/entities/role.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    first_name: string;

    @Column()
    last_name: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    avatar: string;

    @Column({ type: 'enum', enum: ['Nam', 'Nữ', 'Khác'], default: 'Nam' })
    gender: string;

    @Column({ default: 'user' })
    role: string;

    @Column({ default: true })
    is_active: boolean;

    @ManyToOne(() => Department, (department) => department.users, { nullable: true })
    department: Department | null;

    @ManyToOne(() => RoleEntity, (role) => role.users, { nullable: true })
    role_item: RoleEntity | null;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}
