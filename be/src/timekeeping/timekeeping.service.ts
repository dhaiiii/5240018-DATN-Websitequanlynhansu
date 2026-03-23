import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Timekeeping } from './timekeeping.entity';
import { CreateTimekeepingDto } from './create-timekeeping.dto';
import { WorkingHoursService } from '../working-hours/working-hours.service';

@Injectable()
export class TimekeepingService {
    constructor(
        @InjectRepository(Timekeeping)
        private timekeepingRepository: Repository<Timekeeping>,
        private workingHoursService: WorkingHoursService,
    ) { }

    async create(createTimekeepingDto: CreateTimekeepingDto) {
        if (!createTimekeepingDto.email) {
            return null; // Ignore invalid requests without an email
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find current active config
        const activeConfig = await this.workingHoursService.getActiveAt(new Date());

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
            workingHours: (activeConfig && activeConfig.id > 0) ? activeConfig : undefined,
        });

        return await this.timekeepingRepository.save(timekeeping);
    }

    async findAll(filters: { name?: string, date?: string, status?: string }) {
        const queryBuilder = this.timekeepingRepository.createQueryBuilder('timekeeping')
            .leftJoinAndSelect('timekeeping.workingHours', 'workingHours');

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

        // Filter and calculate status details
        const processedRecords = records
            .filter(record => record.email && record.email.trim() !== '')
            .map(record => {
                const config = record.workingHours || { startTime: '08:00', endTime: '17:00' };
                let attendanceStatus = 'Thiếu công';

                if (record.start_time && record.end_time) {
                    const isLate = record.start_time > config.startTime;
                    const isEarly = record.end_time < config.endTime;

                    if (isLate && isEarly) attendanceStatus = 'Muộn & Về sớm';
                    else if (isLate) attendanceStatus = 'Đi muộn';
                    else if (isEarly) attendanceStatus = 'Về sớm';
                    else attendanceStatus = 'Đủ giờ công';
                } else if (record.start_time) {
                    const isLate = record.start_time > config.startTime;
                    attendanceStatus = isLate ? 'Đi muộn (Chưa về)' : 'Đang làm việc';
                }

                return {
                    ...record,
                    attendanceStatus,
                };
            });

        return processedRecords;
    }
}
