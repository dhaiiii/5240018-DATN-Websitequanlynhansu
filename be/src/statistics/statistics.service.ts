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

    async getSummary(currentUser?: any) {
        let managerDeptId: number | undefined;
        let emailsFilter: string[] | undefined;

        if (currentUser && currentUser.permission_level === 'manager') {
            const manager = await this.userRepository.findOne({
                where: { id: currentUser.userId },
                relations: ['department'],
            });
            if (manager?.department?.id) {
                managerDeptId = manager.department.id;
                const deptUsers = await this.userRepository.find({
                    where: { department: { id: managerDeptId } }
                });
                emailsFilter = deptUsers.map(u => u.email).filter(Boolean);
            } else {
                managerDeptId = -1; // non existent department to return empty stats
                emailsFilter = [currentUser.email];
            }
        } else if (currentUser && currentUser.role !== 'admin' && currentUser.permission_level !== 'admin' && currentUser.permission_level !== 'manager') {
            const user = await this.userRepository.findOne({
                where: { id: currentUser.userId },
                relations: ['department'],
            });
            if (user?.department?.id) {
                managerDeptId = user.department.id;
                emailsFilter = [currentUser.email]; // Maybe normal users shouldn't see stats, but if they do, just their own or their dept. Wait, normal users shouldn't really see global stats. Let's return just their own data.
            } else {
                managerDeptId = -1;
                emailsFilter = [currentUser.email];
            }
        }

        const baseUserQuery: any = {};
        if (managerDeptId && managerDeptId !== -1) {
            baseUserQuery.department = { id: managerDeptId };
        } else if (managerDeptId === -1) {
            baseUserQuery.id = currentUser?.userId || -1;
        }

        const totalUsers = await this.userRepository.count({ where: baseUserQuery });
        const activeUsers = await this.userRepository.count({ where: { ...baseUserQuery, is_active: true } });
        const retiredUsers = await this.userRepository.count({ where: { ...baseUserQuery, is_active: false } });

        const deptQuery = this.userRepository
            .createQueryBuilder('user')
            .leftJoin('user.department', 'department')
            .select('department.name', 'name')
            .addSelect('COUNT(user.id)', 'count');

        if (managerDeptId && managerDeptId !== -1) {
            deptQuery.where('department.id = :managerDeptId', { managerDeptId });
        } else if (managerDeptId === -1) {
            deptQuery.where('user.id = :userId', { userId: currentUser?.userId || -1 });
        }

        const departmentStats = await deptQuery
            .groupBy('department.id')
            .addGroupBy('department.name')
            .getRawMany();

        // Attendance stats for TODAY
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const tkWhere: any = {
            created_at: Between(today, tomorrow),
        };
        if (emailsFilter && emailsFilter.length > 0) {
            tkWhere.email = emailsFilter.length === 1 ? emailsFilter[0] : (emailsFilter as any); // Using In might be better but typeorm finds it if we use simple queries. Actually let's use queryBuilder for safety or exact.
        }

        const tkQuery = this.timekeepingRepository.createQueryBuilder('timekeeping')
            .where('timekeeping.created_at BETWEEN :today AND :tomorrow', { today, tomorrow });

        if (emailsFilter && emailsFilter.length > 0) {
            tkQuery.andWhere('timekeeping.email IN (:...emailsFilter)', { emailsFilter });
        } else if (emailsFilter && emailsFilter.length === 0) {
            tkQuery.andWhere('1=0');
        }

        const workingToday = await tkQuery.getCount();

        const reqQuery = this.requestRepository.createQueryBuilder('request')
            .where('request.status = :status', { status: RequestStatus.APPROVED })
            .andWhere('request.start_date <= :tomorrow', { tomorrow })
            .andWhere('request.end_date >= :today', { today })
            .andWhere('request.type IN (:...types)', { types: [RequestType.PAID_LEAVE, RequestType.UNPAID_LEAVE] });

        if (emailsFilter && emailsFilter.length > 0) {
            reqQuery.andWhere('request.email IN (:...emailsFilter)', { emailsFilter });
        } else if (emailsFilter && emailsFilter.length === 0) {
            reqQuery.andWhere('1=0');
        }

        const leaveToday = await reqQuery.getCount();

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
