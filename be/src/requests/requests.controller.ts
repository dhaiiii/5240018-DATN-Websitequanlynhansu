import { Controller, Get, Post, Body, Query, Patch, Param } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';

@Controller('requests')
export class RequestsController {
    constructor(private readonly requestsService: RequestsService) { }

    @Post()
    create(@Body() createRequestDto: CreateRequestDto) {
        return this.requestsService.create(createRequestDto);
    }

    @Get()
    findAll(@Query('email') email?: string) {
        if (email) {
            return this.requestsService.findByEmail(email);
        }
        return this.requestsService.findAll();
    }

    @Get('stats')
    getDashboardStats(@Query('email') email?: string) {
        return this.requestsService.getDashboardStats(email);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() body: { status: string, approverEmail: string }) {
        return this.requestsService.updateStatus(+id, body.status, body.approverEmail);
    }
}
