import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../auth/permission.decorator';
import { Permission } from '../auth/permission.enum';

@Controller('departments')
@UseGuards(PermissionGuard)
export class DepartmentsController {
    constructor(private readonly departmentsService: DepartmentsService) { }

    @Post()
    @RequirePermission(Permission.Admin)
    create(@Body() createDepartmentDto: CreateDepartmentDto) {
        return this.departmentsService.create(createDepartmentDto);
    }

    @Get()
    @RequirePermission(Permission.User) // All authenticated users can view
    findAll() {
        return this.departmentsService.findAll();
    }

    @Get(':id')
    @RequirePermission(Permission.User) // All authenticated users can view
    findOne(@Param('id') id: string) {
        return this.departmentsService.findOne(+id);
    }

    @Patch(':id')
    @RequirePermission(Permission.Admin)
    update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
        return this.departmentsService.update(+id, updateDepartmentDto);
    }

    @Delete(':id')
    @RequirePermission(Permission.Admin)
    remove(@Param('id') id: string) {
        return this.departmentsService.remove(+id);
    }
}
