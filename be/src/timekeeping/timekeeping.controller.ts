import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { TimekeepingService } from './timekeeping.service';
import { CreateTimekeepingDto } from './create-timekeeping.dto';

@Controller('timekeeping')
export class TimekeepingController {
    constructor(private readonly timekeepingService: TimekeepingService) { }

    @Post()
    create(@Body() createTimekeepingDto: CreateTimekeepingDto) {
        return this.timekeepingService.create(createTimekeepingDto);
    }

    @Get()
    findAll(
        @Query('name') name?: string,
        @Query('date') date?: string,
        @Query('status') status?: string,
    ) {
        return this.timekeepingService.findAll({ name, date, status });
    }
}
