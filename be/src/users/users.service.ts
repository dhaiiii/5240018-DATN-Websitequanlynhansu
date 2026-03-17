import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Department } from '../departments/entities/department.entity';
import { Role } from '../roles/entities/role.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) { }

  async create(createUserDto: CreateUserDto, currentUser?: any) {
    const { email, departmentId, roleId, ...userData } = createUserDto;

    // Check if manager is trying to create an admin
    if (currentUser && currentUser.permission_level === 'manager') {
      if (userData.role === 'admin') {
        throw new ForbiddenException('Quản lý không được phép tạo tài khoản Quản trị viên');
      }
      if (roleId) {
        const role = await this.rolesRepository.findOneBy({ id: roleId });
        if (role && role.permission_level === 'admin') {
          throw new ForbiddenException('Quản lý không được phép tạo tài khoản có quyền Quản trị viên');
        }
      }
    }

    // Check if email already exists
    const existingUser = await this.usersRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('Đã tồn tại Email');
    }

    // Set default password if not provided
    if (!userData.password) {
      userData.password = '123456';
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);


    const user = this.usersRepository.create({
      ...userData,
      email
    });

    if (departmentId) {
      const department = await this.departmentRepository.findOneBy({ id: departmentId });
      if (department) {
        user.department = department;
      }
    }

    if (roleId) {
      const role = await this.rolesRepository.findOneBy({ id: roleId });
      if (role) {
        user.role_item = role;
      }
    }

    return this.usersRepository.save(user);
  }

  findAll() {
    return this.usersRepository.find({
      relations: ['department', 'role_item'],
    });
  }

  findOne(id: number) {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['department', 'role_item'],
    });
  }

  findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['department', 'role_item'],
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto, currentUser?: any) {
    const { departmentId, roleId, ...userData } = updateUserDto;
    const user = await this.findOne(id);

    if (!user) return null;

    // Check permissions for manager
    if (currentUser && currentUser.permission_level === 'manager') {
      // 1. Manager cannot modify an Admin user
      if (user.role === 'admin' || (user.role_item && user.role_item.permission_level === 'admin')) {
        throw new ForbiddenException('Quản lý không được phép sửa thông tin của Quản trị viên');
      }

      // 2. Manager cannot grant Admin role to anyone
      if (userData.role === 'admin') {
        throw new ForbiddenException('Quản lý không được phép cấp quyền Quản trị viên');
      }
      if (roleId) {
        const role = await this.rolesRepository.findOneBy({ id: roleId });
        if (role && role.permission_level === 'admin') {
          throw new ForbiddenException('Quản lý không được phép cấp quyền Quản trị viên');
        }
      }
    }

    if (!user) return null;

    if (departmentId !== undefined) {
      if (departmentId === null) {
        user.department = null;
      } else {
        const department = await this.departmentRepository.findOneBy({ id: departmentId });
        if (department) {
          user.department = department;
        }
      }
    }

    if (roleId !== undefined) {
      if (roleId === null) {
        user.role_item = null;
      } else {
        const role = await this.rolesRepository.findOneBy({ id: roleId });
        if (role) {
          user.role_item = role;
        }
      }
    }

    // Hash password if provided
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    console.log('UsersService.update - userData:', userData);
    Object.assign(user, userData);
    console.log('UsersService.update - user object before save:', user);
    return this.usersRepository.save(user);
  }

  async updateAvatar(id: number, avatarPath: string) {
    const user = await this.findOne(id);
    if (!user) return null;
    user.avatar = avatarPath;
    return this.usersRepository.save(user);
  }

  async remove(id: number, currentUser?: any) {
    const user = await this.findOne(id);
    if (!user) return null;

    if (currentUser && currentUser.permission_level === 'manager') {
      if (user.role === 'admin' || (user.role_item && user.role_item.permission_level === 'admin')) {
        throw new ForbiddenException('Quản lý không được phép xóa tài khoản Quản trị viên');
      }
    }

    return this.usersRepository.delete(id);
  }
}
