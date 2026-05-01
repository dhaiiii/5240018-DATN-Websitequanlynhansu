import { Controller, Get, Post, Body, Query, Patch, Param } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';

import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@UseGuards(JwtAuthGuard)
@Controller('requests')
export class RequestsController {
    constructor(private readonly requestsService: RequestsService) { }

    @Post()
    create(@Body() createRequestDto: CreateRequestDto) {
        return this.requestsService.create(createRequestDto);
    }

    @Get()
    findAll(@CurrentUser() user: any, @Query('email') email?: string) {
        if (email && user.role !== 'admin' && user.permission_level !== 'admin' && user.permission_level !== 'manager') {
            // Normal user can only see their own
            return this.requestsService.findByEmail(user.email);
        } else if (email) {
            return this.requestsService.findByEmail(email, user);
        }
        return this.requestsService.findAll(user);
    }

    @Get('stats')
    getDashboardStats(@CurrentUser() user: any, @Query('email') email?: string) {
        return this.requestsService.getDashboardStats(email, user);
    }

    @Patch(':id/status')
    updateStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() body: { status: string, approverEmail: string }) {
        return this.requestsService.updateStatus(+id, body.status, body.approverEmail, user);
    }
}
