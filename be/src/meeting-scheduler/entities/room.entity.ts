import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Meeting } from './meeting.entity';

@Entity('rooms')
export class Room {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'int', default: 10 })
    capacity: number;

    @Column({ type: 'varchar', length: 100, nullable: true })
    location: string;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @OneToMany(() => Meeting, meeting => meeting.room)
    meetings: Meeting[];
}
