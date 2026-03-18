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

    async findAll() {
        const records = await this.timekeepingRepository.find({
            order: { created_at: 'DESC' },
        });
        return records.filter(record => record.email && record.email.trim() !== '');
    }
}
