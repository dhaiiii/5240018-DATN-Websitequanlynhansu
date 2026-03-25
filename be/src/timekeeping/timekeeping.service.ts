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
            expected_start_time: activeConfig?.startTime || '08:00',
            expected_end_time: activeConfig?.endTime || '17:00',
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

        queryBuilder.orderBy('timekeeping.created_at', 'DESC');

        const records = await queryBuilder.getMany();

        // Filter and calculate status details
        let processedRecords = records
            .filter(record => record.email && record.email.trim() !== '')
            .map(record => {
                const expectedStart = record.expected_start_time || '08:00';
                const expectedEnd = record.expected_end_time || '17:00';
                let attendanceStatus = 'Thiếu công';

                if (record.start_time && record.end_time) {
                    const isLate = record.start_time > expectedStart;
                    const isEarly = record.end_time < expectedEnd;

                    if (isLate && isEarly) attendanceStatus = 'Muộn & Về sớm';
                    else if (isLate) attendanceStatus = 'Đi muộn';
                    else if (isEarly) attendanceStatus = 'Về sớm';
                    else attendanceStatus = 'Đủ giờ công';
                } else if (record.start_time) {
                    const isLate = record.start_time > expectedStart;
                    attendanceStatus = isLate ? 'Đi muộn (Chưa về)' : 'Đang làm việc';
                }

                return {
                    ...record,
                    attendanceStatus,
                };
            });

        // Apply status filter after calculation
        if (filters.status) {
            if (filters.status === 'full') {
                processedRecords = processedRecords.filter(r => r.attendanceStatus === 'Đủ giờ công');
            } else if (filters.status === 'incomplete') {
                processedRecords = processedRecords.filter(r => r.attendanceStatus !== 'Đủ giờ công');
            }
        }

        return processedRecords;
    }
}
