export class CreateUserDto {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
    avatar?: string;
    address?: string;
    gender?: 'Nam' | 'Nữ' | 'Khác';
    birth_date?: any;
    is_active?: boolean;
    role?: string;
    departmentId?: number;
    roleId?: number;
}
