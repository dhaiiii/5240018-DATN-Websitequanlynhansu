import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { TimekeepingService } from './timekeeping.service';
import { CreateTimekeepingDto } from './create-timekeeping.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('timekeeping')
export class TimekeepingController {
    constructor(private readonly timekeepingService: TimekeepingService) { }

    @Post()
    create(@Body() createTimekeepingDto: CreateTimekeepingDto) {
        return this.timekeepingService.create(createTimekeepingDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(
        @CurrentUser() user: any,
        @Query('name') name?: string,
        @Query('date') date?: string,
        @Query('status') status?: string,
    ) {
        return this.timekeepingService.findAll({ name, date, status }, user);
    }
}
