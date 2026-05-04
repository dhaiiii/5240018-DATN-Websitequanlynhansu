import { Controller, Get, Post, Body, Param, Put, Query, UseGuards } from '@nestjs/common';
import { PayrollsService } from './payrolls.service';
import { CreatePayrollDto, CreateSalaryConfigDto } from './dto/payrolls.dto';
// Import your AuthGuard here if applicable

@Controller('payrolls')
export class PayrollsController {
    constructor(private readonly payrollsService: PayrollsService) { }

    @Get('config/:userId')
    async getConfig(@Param('userId') userId: string) {
        return this.payrollsService.getSalaryConfig(+userId);
    }

    @Post('config')
    async createConfig(@Body() dto: CreateSalaryConfigDto) {
        return this.payrollsService.createOrUpdateSalaryConfig(dto);
    }

    @Get()
    async findAll(
        @Query('month') month?: string,
        @Query('year') year?: string,
    ) {
        return this.payrollsService.findAll(month ? +month : undefined, year ? +year : undefined);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.payrollsService.findOne(+id);
    }

    @Post('calculate')
    async calculate(@Body() dto: CreatePayrollDto) {
        return this.payrollsService.calculatePayroll(dto);
    }

    @Put(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body('status') status: string,
    ) {
        return this.payrollsService.updateStatus(+id, status);
    }
}
