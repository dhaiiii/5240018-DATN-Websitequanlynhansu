import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { WorkingHours } from './working-hours.entity';

@Injectable()
export class WorkingHoursService {
    constructor(
        @InjectRepository(WorkingHours)
        private workingHoursRepository: Repository<WorkingHours>,
    ) { }

    async create(data: Partial<WorkingHours>) {
        if (!data.startTime || !data.endTime || !data.effectiveDate) {
            throw new BadRequestException('Start time, end time, and effective date are required');
        }
        const workingHours = this.workingHoursRepository.create({
            ...data,
            effectiveDate: new Date(data.effectiveDate),
        });
        return await this.workingHoursRepository.save(workingHours);
    }

    async findAll() {
        return await this.workingHoursRepository.find({
            order: {
                effectiveDate: 'DESC',
                createdAt: 'DESC',
            },
        });
    }

    async getActiveAt(date: Date = new Date()) {
        const queryDate = new Date(date);
        queryDate.setHours(23, 59, 59, 999);

        const active = await this.workingHoursRepository.findOne({
            where: {
                effectiveDate: LessThanOrEqual(queryDate),
            },
            order: {
                effectiveDate: 'DESC',
                createdAt: 'DESC',
            },
        });

        if (!active) {
            // Return a default if no config exists in the DB
            return {
                id: 0, // Placeholder ID
                startTime: '08:00',
                endTime: '17:00',
                effectiveDate: new Date('2026-01-01'),
                createdAt: new Date(),
            } as WorkingHours;
        }

        return active;
    }

    async remove(id: number) {
        return await this.workingHoursRepository.delete(id);
    }
}
