import { Controller, Get, Post, Patch, Body, Param, Query, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { MeetingSchedulerService } from './meeting-scheduler.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('meeting-scheduler')
export class MeetingSchedulerController {
    constructor(private readonly meetingSchedulerService: MeetingSchedulerService) { }

    // GET /meeting-scheduler/employees
    @UseGuards(JwtAuthGuard)
    @Get('employees')
    getEmployees(@CurrentUser() user: any) {
        return this.meetingSchedulerService.getEmployees(user);
    }

    // GET /meeting-scheduler/rooms
    @Get('rooms')
    getAllRooms() {
        return this.meetingSchedulerService.getAllRooms();
    }

    // GET /meeting-scheduler/rooms/check?start_time=...&end_time=...
    @Get('rooms/check')
    checkAvailableRooms(
        @Query('start_time') start_time: string,
        @Query('end_time') end_time: string,
    ) {
        return this.meetingSchedulerService.checkAvailableRooms(start_time, end_time);
    }

    // GET /meeting-scheduler/meetings
    @UseGuards(JwtAuthGuard)
    @Get('meetings')
    getAllMeetings(@CurrentUser() user: any) {
        return this.meetingSchedulerService.getAllMeetings(user);
    }

    // GET /meeting-scheduler/meetings/:id
    @Get('meetings/:id')
    getMeetingById(@Param('id') id: string) {
        return this.meetingSchedulerService.getMeetingById(id);
    }

    // POST /meeting-scheduler/meetings
    @Post('meetings')
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    bookMeeting(@Body() createMeetingDto: CreateMeetingDto) {
        return this.meetingSchedulerService.bookMeeting(createMeetingDto);
    }

    // PATCH /meeting-scheduler/meetings/:id/cancel
    @Patch('meetings/:id/cancel')
    cancelMeeting(@Param('id') id: string) {
        return this.meetingSchedulerService.cancelMeeting(id);
    }
}
