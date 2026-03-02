import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Timekeeping } from './timekeeping.entity';
import { CreateTimekeepingDto } from './create-timekeeping.dto';

@Injectable()
export class TimekeepingService {
    constructor(
        @InjectRepository(Timekeeping)
        private timekeepingRepository: Repository<Timekeeping>,
    ) { }

    async create(createTimekeepingDto: CreateTimekeepingDto) {
        const timekeeping = this.timekeepingRepository.create({
            email: createTimekeepingDto.email,
            start_time: createTimekeepingDto.start_time || new Date().toLocaleTimeString('en-GB'),
            end_time: createTimekeepingDto.end_time || null,
        });

        return await this.timekeepingRepository.save(timekeeping);
    }

    async findAll() {
        return await this.timekeepingRepository.find({
            order: { start_time: 'DESC' },
        });
    }
}
