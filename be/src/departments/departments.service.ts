import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
    constructor(
        @InjectRepository(Department)
        private departmentRepository: Repository<Department>,
    ) { }

    async create(createDepartmentDto: CreateDepartmentDto) {
        const department = this.departmentRepository.create(createDepartmentDto);
        return await this.departmentRepository.save(department);
    }

    async findAll() {
        return this.departmentRepository.createQueryBuilder('department')
            .loadRelationCountAndMap('department.employee_count', 'department.users')
            .getMany();
    }

    async findOne(id: number) {
        const department = await this.departmentRepository.createQueryBuilder('department')
            .where('department.id = :id', { id })
            .loadRelationCountAndMap('department.employee_count', 'department.users')
            .getOne();

        if (!department) {
            throw new NotFoundException(`Department with ID ${id} not found`);
        }
        return department;
    }

    async update(id: number, updateDepartmentDto: UpdateDepartmentDto) {
        const department = await this.findOne(id);
        Object.assign(department, updateDepartmentDto);
        return await this.departmentRepository.save(department);
    }

    async remove(id: number) {
        const department = await this.findOne(id);
        return await this.departmentRepository.remove(department);
    }
}
