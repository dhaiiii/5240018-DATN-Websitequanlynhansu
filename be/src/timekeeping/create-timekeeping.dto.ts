import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateTimekeepingDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsOptional()
    @IsString()
    @Matches(/^([01]\d|2[0-3]):?([0-5]\d):?([0-5]\d)$/, { message: 'start_time must be in HH:mm:ss format' })
    start_time?: string;

    @IsOptional()
    @IsString()
    @Matches(/^([01]\d|2[0-3]):?([0-5]\d):?([0-5]\d)$/, { message: 'end_time must be in HH:mm:ss format' })
    end_time?: string;
}
