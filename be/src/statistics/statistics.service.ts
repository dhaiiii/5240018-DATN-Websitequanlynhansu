import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Department } from '../departments/entities/department.entity';
import { Timekeeping } from '../timekeeping/timekeeping.entity';
import { Request } from '../requests/entities/request.entity';
import { RequestType, RequestStatus } from '../requests/enums/request-type.enum';

@Injectable()
export class StatisticsService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Department)
        private departmentRepository: Repository<Department>,
        @InjectRepository(Timekeeping)
        private timekeepingRepository: Repository<Timekeeping>,
        @InjectRepository(Request)
        private requestRepository: Repository<Request>,
    ) { }

    async getSummary() {
        const totalUsers = await this.userRepository.count();
        const activeUsers = await this.userRepository.count({ where: { is_active: true } });
        const retiredUsers = await this.userRepository.count({ where: { is_active: false } });

        const departmentStats = await this.userRepository
            .createQueryBuilder('user')
            .leftJoin('user.department', 'department')
            .select('department.name', 'name')
            .addSelect('COUNT(user.id)', 'count')
            .groupBy('department.id')
            .addGroupBy('department.name')
            .getRawMany();

        // Attendance stats for TODAY
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const workingToday = await this.timekeepingRepository.count({
            where: {
                created_at: Between(today, tomorrow),
            },
        });

        const leaveToday = await this.requestRepository.count({
            where: [
                {
                    type: RequestType.PAID_LEAVE,
                    status: RequestStatus.APPROVED,
                    start_date: LessThanOrEqual(tomorrow),
                    end_date: MoreThanOrEqual(today),
                },
                {
                    type: RequestType.UNPAID_LEAVE,
                    status: RequestStatus.APPROVED,
                    start_date: LessThanOrEqual(tomorrow),
                    end_date: MoreThanOrEqual(today),
                }
            ],
        });

        // Simple absent calculation: Active employees - those who are working or on leave
        const absentToday = Math.max(0, activeUsers - workingToday - leaveToday);

        return {
            overview: {
                total: totalUsers,
                active: activeUsers,
                retired: retiredUsers,
            },
            departmentDistribution: departmentStats.map(d => ({
                name: d.name || 'Chưa xếp phòng',
                count: parseInt(d.count),
            })),
            attendanceToday: {
                working: workingToday,
                leave: leaveToday,
                absent: absentToday,
            },
        };
    }
}
