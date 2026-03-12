import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateRoleDto {
    @IsNotEmpty()
    @IsString()
    role_name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    permission_level?: string;
}
