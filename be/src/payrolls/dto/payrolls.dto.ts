import { IsNumber, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AllowanceDto {
    @IsString()
    label: string;

    @IsNumber()
    amount: number;
}

export class CreateSalaryConfigDto {
    @IsNumber()
    user_id: number;

    @IsNumber()
    base_salary: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AllowanceDto)
    allowances?: AllowanceDto[];

    @IsOptional()
    @IsString()
    bank_account_number?: string;

    @IsOptional()
    @IsString()
    bank_name?: string;
}

export class UpdateSalaryConfigDto {
    @IsOptional()
    @IsNumber()
    base_salary?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AllowanceDto)
    allowances?: AllowanceDto[];

    @IsOptional()
    @IsString()
    bank_account_number?: string;

    @IsOptional()
    @IsString()
    bank_name?: string;
}

export class CreatePayrollDto {
    @IsNumber()
    user_id: number;

    @IsNumber()
    month: number;

    @IsNumber()
    year: number;

    @IsOptional()
    @IsNumber()
    standard_days?: number;

    @IsOptional()
    @IsNumber()
    ot_hours?: number;

    @IsOptional()
    @IsNumber()
    ot_pay?: number;

    @IsOptional()
    @IsNumber()
    total_deductions?: number;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    note?: string;
}
