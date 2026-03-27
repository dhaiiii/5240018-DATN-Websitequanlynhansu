import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestType, RequestStatus } from './enums/request-type.enum';

@Injectable()
export class RequestsService {
    constructor(
        @InjectRepository(Request)
        private requestsRepository: Repository<Request>,
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

    async findAll() {
        return await this.requestsRepository.find({
            order: { created_at: 'DESC' },
        });
    }

    async findByEmail(email: string) {
        return await this.requestsRepository.find({
            where: { email },
            order: { created_at: 'DESC' },
        });
    }

    async updateStatus(id: number, status: string, approverEmail: string) {
        await this.requestsRepository.update(id, {
            status: status as any,
            processed_by: approverEmail
        });
        return await this.requestsRepository.findOne({ where: { id } });
    }

    async getDashboardStats(email?: string) {
        const whereClause: any = { status: 'PENDING' as any };
        if (email) {
            whereClause.email = email;
        }

        const pendingCount = await this.requestsRepository.count({
            where: whereClause
        });

        const query = this.requestsRepository.createQueryBuilder('request')
            .leftJoin('users', 'user', 'user.email = request.email')
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
