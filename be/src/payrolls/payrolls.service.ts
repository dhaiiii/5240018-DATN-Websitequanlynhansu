import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Payroll } from './entities/payroll.entity';
import { SalaryConfig } from './entities/salary-config.entity';
import { CreatePayrollDto, CreateSalaryConfigDto, UpdateSalaryConfigDto } from './dto/payrolls.dto';
import { Timekeeping } from '../timekeeping/timekeeping.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PayrollsService {
    constructor(
        @InjectRepository(Payroll)
        private payrollRepository: Repository<Payroll>,
        @InjectRepository(SalaryConfig)
        private salaryConfigRepository: Repository<SalaryConfig>,
        @InjectRepository(Timekeeping)
        private timekeepingRepository: Repository<Timekeeping>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async getSalaryConfig(userId: number) {
        return this.salaryConfigRepository.findOne({ where: { user_id: userId } });
    }

    async createOrUpdateSalaryConfig(dto: CreateSalaryConfigDto) {
        let config = await this.salaryConfigRepository.findOne({ where: { user_id: dto.user_id } });
        if (config) {
            Object.assign(config, dto);
        } else {
            config = this.salaryConfigRepository.create(dto);
        }
        return this.salaryConfigRepository.save(config);
    }

    async calculatePayroll(dto: CreatePayrollDto) {
        const { user_id, month, year, standard_days = 22, ot_hours = 0, ot_pay = 0, total_deductions = 0 } = dto;

        // 1. Get user and salary config
        const user = await this.userRepository.findOne({ where: { id: user_id } });
        if (!user) throw new NotFoundException('User not found');

        const salaryConfig = await this.salaryConfigRepository.findOne({ where: { user_id } });
        const base_salary = salaryConfig ? Number(salaryConfig.base_salary) : 0;

        // 2. Calculate allowances
        const total_allowances = salaryConfig?.allowances?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

        // 3. Get actual working days from timekeeping
        // Count unique days for this user in this month/year
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const timekeepingRecords = await this.timekeepingRepository.find({
            where: {
                email: user.email,
                created_at: Between(startDate, endDate)
            }
        });

        // Unique days count
        const uniqueDays = new Set(timekeepingRecords.map(r => r.created_at.toISOString().split('T')[0])).size;
        const actual_days = uniqueDays;

        // 4. Final calculation
        // net = (base / standard * actual) + ot_pay + allowances - deductions
        const dailyRate = standard_days > 0 ? base_salary / standard_days : 0;
        const earnedSalary = dailyRate * actual_days;
        const net_salary = earnedSalary + Number(ot_pay) + total_allowances - Number(total_deductions);

        // 5. Save or update payroll record
        let payroll = await this.payrollRepository.findOne({
            where: { user_id, month, year }
        });

        if (payroll) {
            if (payroll.status === 'PAID') {
                throw new Error('Cannot update a payroll that has already been paid');
            }
            Object.assign(payroll, {
                base_salary,
                standard_days,
                actual_days,
                ot_hours,
                ot_pay,
                total_allowances,
                total_deductions,
                net_salary,
                status: dto.status || payroll.status,
                note: dto.note || payroll.note
            });
        } else {
            payroll = this.payrollRepository.create({
                user_id,
                month,
                year,
                base_salary,
                standard_days,
                actual_days,
                ot_hours,
                ot_pay,
                total_allowances,
                total_deductions,
                net_salary,
                status: dto.status || 'PENDING',
                note: dto.note
            });
        }

        return this.payrollRepository.save(payroll);
    }

    async findAll(month?: number, year?: number) {
        const where: any = {};
        if (month) where.month = month;
        if (year) where.year = year;

        return this.payrollRepository.find({
            where,
            relations: ['user'],
            order: { created_at: 'DESC' }
        });
    }

    async findOne(id: number) {
        return this.payrollRepository.findOne({
            where: { id },
            relations: ['user']
        });
    }

    async updateStatus(id: number, status: string) {
        const payroll = await this.payrollRepository.findOne({ where: { id } });
        if (!payroll) throw new NotFoundException('Payroll not found');

        if (payroll.status === 'PAID') {
            throw new Error('Cannot change status of a payroll that has already been paid');
        }

        payroll.status = status;
        return this.payrollRepository.save(payroll);
    }
}
