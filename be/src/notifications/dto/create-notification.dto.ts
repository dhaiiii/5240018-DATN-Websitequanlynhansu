import { IsEnum, IsString, IsEmail, IsOptional, IsObject } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
    @IsEmail()
    recipient_email: string;

    @IsEnum(NotificationType)
    type: NotificationType;

    @IsString()
    title: string;

    @IsString()
    message: string;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
