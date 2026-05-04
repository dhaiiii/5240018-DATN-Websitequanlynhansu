import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollsService } from './payrolls.service';
import { PayrollsController } from './payrolls.controller';
import { Payroll } from './entities/payroll.entity';
import { SalaryConfig } from './entities/salary-config.entity';
import { Timekeeping } from '../timekeeping/timekeeping.entity';
import { User } from '../users/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Payroll, SalaryConfig, Timekeeping, User]),
    ],
    controllers: [PayrollsController],
    providers: [PayrollsService],
    exports: [PayrollsService],
})
export class PayrollsModule { }
