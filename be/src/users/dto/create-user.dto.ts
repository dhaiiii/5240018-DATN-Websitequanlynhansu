import { IsEmail, IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateUserDto {
    @IsString()
    @IsOptional()
    first_name?: string;

    @IsString()
    @IsOptional()
    last_name?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    password?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    avatar?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    gender?: 'Nam' | 'Nữ' | 'Khác';

    @IsOptional()
    birth_date?: any;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;

    @IsString()
    @IsOptional()
    role?: string;

    @IsNumber()
    @IsOptional()
    departmentId?: number;

    @IsNumber()
    @IsOptional()
    roleId?: number;
}
