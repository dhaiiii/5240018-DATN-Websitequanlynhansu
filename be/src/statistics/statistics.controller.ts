import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('statistics')
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) { }

    @UseGuards(JwtAuthGuard)
    @Get('summary')
    async getSummary(@CurrentUser() user: any) {
        return this.statisticsService.getSummary(user);
    }
}
