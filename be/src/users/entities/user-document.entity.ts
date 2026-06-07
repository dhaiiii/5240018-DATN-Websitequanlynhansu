import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum DocumentType {
    CCCD = 'CCCD',
    HO_CHIEU = 'Hộ chiếu',
    BANG_CAP = 'Bằng cấp/Chứng chỉ',
    KHAC = 'Khác',
}

@Entity('user_documents')
export class UserDocument {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.documents, { onDelete: 'CASCADE' })
    user: User;

    @Column({ type: 'enum', enum: DocumentType, default: DocumentType.KHAC })
    type: DocumentType;

    @Column()
    filename: string;

    @Column()
    original_name: string;

    @CreateDateColumn()
    uploaded_at: Date;
}
