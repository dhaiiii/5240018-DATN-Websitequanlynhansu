import { Injectable } from '@nestjs/common';
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

  async create(createUserDto: CreateUserDto) {
    const { departmentId, roleId, ...userData } = createUserDto;

    // Hash password before saving
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    const user = this.usersRepository.create(userData);

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

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { departmentId, roleId, ...userData } = updateUserDto;
    const user = await this.findOne(id);

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

    Object.assign(user, userData);
    return this.usersRepository.save(user);
  }

  remove(id: number) {
    return this.usersRepository.delete(id);
  }
}
