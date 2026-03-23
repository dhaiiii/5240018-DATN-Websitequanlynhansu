import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Timekeeping } from './timekeeping.entity';
import { CreateTimekeepingDto } from './create-timekeeping.dto';

@Injectable()
export class TimekeepingService {
    constructor(
        @InjectRepository(Timekeeping)
        private timekeepingRepository: Repository<Timekeeping>,
    ) { }

    async create(createTimekeepingDto: CreateTimekeepingDto) {
        if (!createTimekeepingDto.email) {
            return null; // Ignore invalid requests without an email
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find today's record for this email
        const existingRecord = await this.timekeepingRepository.findOne({
            where: {
                email: createTimekeepingDto.email,
                created_at: Between(today, tomorrow),
            },
        });

        if (existingRecord) {
            // Update existing record's end_time
            existingRecord.end_time = createTimekeepingDto.end_time || new Date().toLocaleTimeString('en-GB');
            return await this.timekeepingRepository.save(existingRecord);
        }

        // Create new record for today
        const timekeeping = this.timekeepingRepository.create({
            email: createTimekeepingDto.email,
            start_time: createTimekeepingDto.start_time || new Date().toLocaleTimeString('en-GB'),
            end_time: createTimekeepingDto.end_time || null,
        });

        return await this.timekeepingRepository.save(timekeeping);
    }

    async findAll(filters: { name?: string, date?: string, status?: string }) {
        const queryBuilder = this.timekeepingRepository.createQueryBuilder('timekeeping');

        if (filters.name) {
            queryBuilder.andWhere('timekeeping.email ILIKE :name', { name: `%${filters.name}%` });
        }

        if (filters.date) {
            queryBuilder.andWhere('CAST(timekeeping.created_at AS DATE) = :date', { date: filters.date });
        }

        if (filters.status) {
            if (filters.status === 'full') {
                queryBuilder.andWhere('timekeeping.end_time IS NOT NULL');
            } else if (filters.status === 'incomplete') {
                queryBuilder.andWhere('timekeeping.end_time IS NULL');
            }
        }

        queryBuilder.orderBy('timekeeping.created_at', 'DESC');

        const records = await queryBuilder.getMany();
        return records.filter(record => record.email && record.email.trim() !== '');
    }
}
