import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    role_name: string;

    @Column({ nullable: true })
    description: string;

    @OneToMany(() => User, (user) => user.role_item)
    users: User[];
}
