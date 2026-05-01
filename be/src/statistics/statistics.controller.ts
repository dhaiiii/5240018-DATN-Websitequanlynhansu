import { Controller, Get, UseGuards, Res, Query, UnauthorizedException } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as XLSX from 'xlsx';

@Controller('statistics')
export class StatisticsController {
    constructor(
        private readonly statisticsService: StatisticsService,
        private readonly jwtService: JwtService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get('summary')
    async getSummary(@CurrentUser() user: any) {
        return this.statisticsService.getSummary(user);
    }

    @Get('export-excel')
    async exportExcel(@Query('token') token: string, @Res() res: any) {
        // Verify JWT token from query parameter
        if (!token) {
            throw new UnauthorizedException('Token is required');
        }

        let payload: any;
        try {
            payload = this.jwtService.verify(token, { secret: 'SECRET_KEY' });
        } catch (e) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        const user = {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
            permission_level: payload.permission_level,
        };

        const stats = await this.statisticsService.getSummary(user);
        const wb = XLSX.utils.book_new();

        // Sheet 1: Tổng quan
        const overviewData = [
            ['Chỉ số', 'Giá trị'],
            ['Tổng số nhân viên', stats.overview.total],
            ['Nhân viên đang làm', stats.overview.active],
            ['Nhân viên đã nghỉ', stats.overview.retired],
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
        ws1['!cols'] = [{ wch: 25 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws1, 'Tong quan');

        // Sheet 2: Phân bổ phòng ban
        const deptData = [
            ['Phòng ban', 'Số nhân viên'],
            ...stats.departmentDistribution.map((d: any) => [d.name, d.count]),
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(deptData);
        ws2['!cols'] = [{ wch: 30 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Theo phong ban');

        // Sheet 3: Chấm công hôm nay
        const attendanceData = [
            ['Trạng thái', 'Số lượng'],
            ['Đi làm', stats.attendanceToday.working],
            ['Nghỉ phép', stats.attendanceToday.leave],
            ['Vắng mặt', stats.attendanceToday.absent],
        ];
        const ws3 = XLSX.utils.aoa_to_sheet(attendanceData);
        ws3['!cols'] = [{ wch: 20 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws3, 'Cham cong hom nay');

        // Generate buffer
        const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

        const today = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
        const fileName = `ThongKe_NhanSu_${today}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        res.send(buf);
    }
}

