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
}
