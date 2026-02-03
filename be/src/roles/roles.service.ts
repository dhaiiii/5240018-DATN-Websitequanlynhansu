import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
    constructor(
        @InjectRepository(Role)
        private readonly rolesRepository: Repository<Role>,
    ) { }

    async create(createRoleDto: CreateRoleDto): Promise<Role> {
        const role = this.rolesRepository.create(createRoleDto);
        return await this.rolesRepository.save(role);
    }

    async findAll(): Promise<any[]> {
        return await this.rolesRepository.createQueryBuilder('role')
            .loadRelationCountAndMap('role.employee_count', 'role.users', 'activeUser', (qb) => qb.andWhere('activeUser.is_active = :isActive', { isActive: true }))
            .getMany();
    }

    async findOne(id: number): Promise<any> {
        const role = await this.rolesRepository.createQueryBuilder('role')
            .leftJoinAndSelect('role.users', 'user', 'user.is_active = :isActive', { isActive: true })
            .where('role.id = :id', { id })
            .getOne();

        if (!role) {
            throw new NotFoundException(`Role with ID ${id} not found`);
        }

        return {
            ...role,
            employee_count: role.users?.length || 0
        };
    }

    async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
        const role = await this.findOne(id);
        Object.assign(role, updateRoleDto);
        return await this.rolesRepository.save(role);
    }

    async remove(id: number): Promise<void> {
        const role = await this.findOne(id);
        await this.rolesRepository.remove(role);
    }
}
