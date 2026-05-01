import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestType, RequestStatus } from './enums/request-type.enum';
import { User } from '../users/entities/user.entity';

@Injectable()
export class RequestsService {
    constructor(
        @InjectRepository(Request)
        private requestsRepository: Repository<Request>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async create(createRequestDto: CreateRequestDto) {
        const startDate = createRequestDto.start_date ? new Date(createRequestDto.start_date) : undefined;
        const endDate = createRequestDto.end_date ? new Date(createRequestDto.end_date) : undefined;

        if (startDate && endDate) {
            const overlappingRequests = await this.requestsRepository.createQueryBuilder('request')
                .where('request.email = :email', { email: createRequestDto.email })
                .andWhere('request.status IN (:...statuses)', { statuses: [RequestStatus.PENDING, RequestStatus.APPROVED] })
                .andWhere('request.start_date <= :endDate', { endDate })
                .andWhere('request.end_date >= :startDate', { startDate })
                .getMany();

            if (overlappingRequests.length > 0) {
                const newType = createRequestDto.type as RequestType;

                const isLeave = (type: RequestType) => [RequestType.PAID_LEAVE, RequestType.UNPAID_LEAVE, RequestType.LEAVE, RequestType.RESIGNATION].includes(type);
                const isTrip = (type: RequestType) => type === RequestType.BUSINESS_TRIP;
                const isOvertime = (type: RequestType) => type === RequestType.OVERTIME;

                for (const existing of overlappingRequests) {
                    const existingType = existing.type;

                    if (newType === RequestType.ATTENDANCE_ADJUSTMENT && existingType === RequestType.ATTENDANCE_ADJUSTMENT) {
                        throw new BadRequestException('Đã có đơn điều chỉnh chấm công trong thời gian này');
                    }

                    if (newType !== RequestType.ATTENDANCE_ADJUSTMENT && existingType !== RequestType.ATTENDANCE_ADJUSTMENT) {
                        if (isLeave(newType) && isLeave(existingType)) throw new BadRequestException('Không thể tạo nhiều đơn nghỉ phép trong cùng thời gian');
                        if ((isLeave(newType) && isTrip(existingType)) || (isTrip(newType) && isLeave(existingType))) throw new BadRequestException('Không thể vừa đi công tác vừa nghỉ phép trong cùng ngày');
                        if ((isLeave(newType) && isOvertime(existingType)) || (isOvertime(newType) && isLeave(existingType))) throw new BadRequestException('Không thể tăng ca trong ngày nghỉ phép');
                    }
                }
            }
        }

        const request = this.requestsRepository.create({
            ...createRequestDto,
            start_date: startDate,
            end_date: endDate,
        });
        return await this.requestsRepository.save(request);
    }

    async findAll(currentUser?: any) {
        if (currentUser && currentUser.permission_level === 'manager') {
            const managerUser = await this.userRepository.findOne({
                where: { id: currentUser.userId },
                relations: ['department'],
            });
            if (managerUser?.department?.id) {
                const deptUsers = await this.userRepository.find({
                    where: { department: { id: managerUser.department.id } }
                });
                const emails = deptUsers.map(u => u.email).filter(Boolean);
                if (emails.length > 0) {
                    return await this.requestsRepository.createQueryBuilder('request')
                        .where('request.email IN (:...emails)', { emails })
                        .orderBy('request.created_at', 'DESC')
                        .getMany();
                } else {
                    return await this.requestsRepository.find({ where: { email: currentUser.email }, order: { created_at: 'DESC' } });
                }
            }
            return await this.requestsRepository.find({ where: { email: currentUser.email }, order: { created_at: 'DESC' } });
        } else if (currentUser && currentUser.role !== 'admin' && currentUser.permission_level !== 'admin') {
            return await this.requestsRepository.find({ where: { email: currentUser.email }, order: { created_at: 'DESC' } });
        }

        return await this.requestsRepository.find({
            order: { created_at: 'DESC' },
        });
    }

    async findByEmail(email: string, currentUser?: any) {
        // If manager is trying to view a specific email, verify the person is in their department
        if (currentUser && currentUser.permission_level === 'manager') {
            const managerUser = await this.userRepository.findOne({ where: { id: currentUser.userId }, relations: ['department'] });
            const targetUser = await this.userRepository.findOne({ where: { email }, relations: ['department'] });
            if (!managerUser?.department?.id || !targetUser?.department?.id || managerUser.department.id !== targetUser.department.id) {
                if (email !== currentUser.email) {
                    throw new BadRequestException('Quản lý chỉ được xem đơn từ của nhân viên trong bộ phận');
                }
            }
        }
        return await this.requestsRepository.find({
            where: { email },
            order: { created_at: 'DESC' },
        });
    }

    async updateStatus(id: number, status: string, approverEmail: string, currentUser?: any) {
        if (currentUser && currentUser.permission_level === 'manager') {
            const request = await this.requestsRepository.findOne({ where: { id } });
            if (!request) throw new BadRequestException('Không tìm thấy yêu cầu');
            const managerUser = await this.userRepository.findOne({ where: { id: currentUser.userId }, relations: ['department'] });
            const targetUser = await this.userRepository.findOne({ where: { email: request.email }, relations: ['department'] });
            if (!managerUser?.department?.id || !targetUser?.department?.id || managerUser.department.id !== targetUser.department.id) {
                if (request.email !== currentUser.email) {
                    throw new BadRequestException('Quản lý chỉ được duyệt đơn từ của nhân viên trong bộ phận');
                }
            }
        }

        await this.requestsRepository.update(id, {
            status: status as any,
            processed_by: approverEmail
        });
        return await this.requestsRepository.findOne({ where: { id } });
    }

    async getDashboardStats(email?: string, currentUser?: any) {
        const whereClause: any = { status: 'PENDING' as any };
        if (email) {
            whereClause.email = email;
        }

        let emailsFilter: string[] | null = null;
        if (currentUser && currentUser.permission_level === 'manager' && !email) {
            const managerUser = await this.userRepository.findOne({
                where: { id: currentUser.userId },
                relations: ['department'],
            });
            if (managerUser?.department?.id) {
                const deptUsers = await this.userRepository.find({
                    where: { department: { id: managerUser.department.id } }
                });
                emailsFilter = deptUsers.map(u => u.email).filter(Boolean);
            } else {
                emailsFilter = [currentUser.email];
            }
        } else if (currentUser && currentUser.role !== 'admin' && currentUser.permission_level !== 'admin' && currentUser.permission_level !== 'manager' && !email) {
            emailsFilter = [currentUser.email];
        }

        const queryCount = this.requestsRepository.createQueryBuilder('request')
            .where('request.status = :status', { status: 'PENDING' });

        if (email) queryCount.andWhere('request.email = :email', { email });
        else if (emailsFilter !== null) {
            if (emailsFilter.length > 0) queryCount.andWhere('request.email IN (:...emails)', { emails: emailsFilter });
            else queryCount.andWhere('1=0');
        }

        const pendingCount = await queryCount.getCount();

        const query = this.requestsRepository.createQueryBuilder('request')
            .leftJoin('request.user', 'user')
            .select([
                'request.id AS request_id',
                'request.type AS request_type',
                'request.status AS request_status',
                'request.created_at AS request_created_at',
                'user.first_name AS user_first_name',
                'user.last_name AS user_last_name',
                'user.avatar AS user_avatar'
            ])
            .where('request.status = :status', { status: 'PENDING' })
            .orderBy('request.created_at', 'DESC')
            .limit(5);

        if (email) {
            query.andWhere('request.email = :email', { email });
        } else if (emailsFilter !== null) {
            if (emailsFilter.length > 0) query.andWhere('request.email IN (:...emails)', { emails: emailsFilter });
            else query.andWhere('1=0');
        }

        const recentActivities = await query.getRawMany();

        return {
            pendingCount,
            recentActivities: recentActivities.map(activity => ({
                id: activity.request_id,
                userName: `${activity.user_first_name} ${activity.user_last_name}`,
                type: activity.request_type,
                status: activity.request_status,
                time: activity.request_created_at,
                avatar: activity.user_avatar
            }))
        };
    }
}
