import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';
import { RequestType } from '../enums/request-type.enum';

export class CreateRequestDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsEnum(RequestType)
    @IsNotEmpty()
    type: RequestType;

    @IsString()
    @IsOptional()
    reason?: string;

    @IsDateString()
    @IsOptional()
    start_date?: string;

    @IsDateString()
    @IsOptional()
    end_date?: string;
}
