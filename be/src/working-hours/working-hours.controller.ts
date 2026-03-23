import { Controller, Get, Post, Body, Delete, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { WorkingHoursService } from './working-hours.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../auth/permission.decorator';
import { Permission } from '../auth/permission.enum';

@Controller('working-hours')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class WorkingHoursController {
    constructor(private readonly workingHoursService: WorkingHoursService) { }

    @Get()
    @RequirePermission(Permission.User)
    async findAll() {
        return await this.workingHoursService.findAll();
    }

    @Get('active')
    @RequirePermission(Permission.User)
    async getActive() {
        return await this.workingHoursService.getActiveAt();
    }

    @Post()
    @RequirePermission(Permission.Admin)
    async create(@Body() body: any) {
        return await this.workingHoursService.create(body);
    }

    @Delete(':id')
    @RequirePermission(Permission.Admin)
    async remove(@Param('id', ParseIntPipe) id: number) {
        return await this.workingHoursService.remove(id);
    }
}
