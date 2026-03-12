import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';

@Injectable()
export class RequestsService {
    constructor(
        @InjectRepository(Request)
        private requestsRepository: Repository<Request>,
    ) { }

    async create(createRequestDto: CreateRequestDto) {
        const request = this.requestsRepository.create({
            ...createRequestDto,
            start_date: createRequestDto.start_date ? new Date(createRequestDto.start_date) : undefined,
            end_date: createRequestDto.end_date ? new Date(createRequestDto.end_date) : undefined,
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
