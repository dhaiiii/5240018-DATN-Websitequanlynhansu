export class CreateUserDto {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
    avatar?: string;
    address?: string;
    gender?: 'Nam' | 'Nữ' | 'Khác';
    is_active?: boolean;
    role?: string;
    departmentId?: number;
    roleId?: number;
}
