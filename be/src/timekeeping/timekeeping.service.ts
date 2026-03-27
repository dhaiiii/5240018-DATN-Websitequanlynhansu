import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Timekeeping } from './timekeeping.entity';
import { CreateTimekeepingDto } from './create-timekeeping.dto';
import { WorkingHoursService } from '../working-hours/working-hours.service';
import { Request } from '../requests/entities/request.entity';
import { RequestType, RequestStatus } from '../requests/enums/request-type.enum';

@Injectable()
export class TimekeepingService {
    constructor(
        @InjectRepository(Timekeeping)
        private timekeepingRepository: Repository<Timekeeping>,
        @InjectRepository(Request)
        private requestRepository: Repository<Request>,
        private workingHoursService: WorkingHoursService,
    ) { }

    async create(createTimekeepingDto: CreateTimekeepingDto) {
        if (!createTimekeepingDto.email) {
            return null; // Ignore invalid requests without an email
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find current active config
        const activeConfig = await this.workingHoursService.getActiveAt(new Date());

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
            expected_start_time: activeConfig?.startTime || '08:00',
            expected_end_time: activeConfig?.endTime || '17:00',
            workingHours: (activeConfig && activeConfig.id > 0) ? activeConfig : undefined,
        });

        return await this.timekeepingRepository.save(timekeeping);
    }

    async findAll(filters: { name?: string, date?: string, status?: string }, user?: any) {
        const queryBuilder = this.timekeepingRepository.createQueryBuilder('timekeeping')
            .leftJoinAndSelect('timekeeping.workingHours', 'workingHours');

        // Filter by user email if not admin or manager
        if (user && user.role !== 'admin' && user.role !== 'manager' && user.permission_level !== 'admin' && user.permission_level !== 'manager') {
            queryBuilder.andWhere('timekeeping.email = :email', { email: user.email });
        }

        if (filters.name) {
            queryBuilder.andWhere('timekeeping.email ILIKE :name', { name: `%${filters.name}%` });
        }

        let queryStartD: Date | undefined;
        let queryEndD: Date | undefined;

        if (filters.date) {
            queryBuilder.andWhere('CAST(timekeeping.created_at AS DATE) = :date', { date: filters.date });
            queryStartD = new Date(filters.date);
            queryStartD.setHours(0, 0, 0, 0);
            queryEndD = new Date(filters.date);
            queryEndD.setHours(23, 59, 59, 999);
        }

        queryBuilder.orderBy('timekeeping.created_at', 'DESC');
        const records = await queryBuilder.getMany();

        // 2. Fetch approved requests
        const reqQueryBuilder = this.requestRepository.createQueryBuilder('request')
            .where('request.status = :status', { status: RequestStatus.APPROVED });

        if (user && user.role !== 'admin' && user.role !== 'manager' && user.permission_level !== 'admin' && user.permission_level !== 'manager') {
            reqQueryBuilder.andWhere('request.email = :email', { email: user.email });
        } else if (filters.name) {
            reqQueryBuilder.andWhere('request.email ILIKE :name', { name: `%${filters.name}%` });
        }

        if (queryStartD && queryEndD) {
            reqQueryBuilder.andWhere('request.start_date <= :queryEndD', { queryEndD })
                .andWhere('request.end_date >= :queryStartD', { queryStartD });
        }

        const approvedRequests = await reqQueryBuilder.getMany();

        // Keep track of which (email + dateStr) has a timekeeping record
        const recordMap = new Set<string>();

        let processedRecords = records
            .filter(record => record.email && record.email.trim() !== '')
            .map(record => {
                const expectedStart = record.expected_start_time || '08:00';
                const expectedEnd = record.expected_end_time || '17:00';
                let attendanceStatus = 'Thiếu công';

                if (record.start_time && record.end_time) {
                    const isLate = record.start_time > expectedStart;
                    const isEarly = record.end_time < expectedEnd;

                    if (isLate && isEarly) attendanceStatus = 'Muộn & Về sớm';
                    else if (isLate) attendanceStatus = 'Đi muộn';
                    else if (isEarly) attendanceStatus = 'Về sớm';
                    else attendanceStatus = 'Đủ giờ công';
                } else if (record.start_time) {
                    const isLate = record.start_time > expectedStart;
                    attendanceStatus = isLate ? 'Đi muộn (Chưa về)' : 'Đang làm việc';
                }

                return {
                    ...record,
                    attendanceStatus,
                };
            });

        // Combine requests and timekeeping
        processedRecords = processedRecords.map(record => {
            const dateStr = new Date(record.created_at).toISOString().split('T')[0];
            recordMap.add(`${record.email}_${dateStr}`);

            // Find overlapping requests for this specific day
            const rStart = new Date(dateStr);
            rStart.setHours(0, 0, 0, 0);
            const rEnd = new Date(dateStr);
            rEnd.setHours(23, 59, 59, 999);

            const dayReqs = approvedRequests.filter(req =>
                req.email === record.email && req.start_date <= rEnd && req.end_date >= rStart
            );

            if (dayReqs.length > 0) {
                const hasAdjustment = dayReqs.find(r => r.type === RequestType.ATTENDANCE_ADJUSTMENT);
                const isTrip = dayReqs.find(r => r.type === RequestType.BUSINESS_TRIP);
                const isPaidLeave = dayReqs.find(r => r.type === RequestType.PAID_LEAVE || r.type === RequestType.LEAVE);
                const isUnpaidLeave = dayReqs.find(r => r.type === RequestType.UNPAID_LEAVE);
                const isOvertime = dayReqs.find(r => r.type === RequestType.OVERTIME);

                if (hasAdjustment) {
                    record.attendanceStatus = 'Đã cập nhật công';
                } else if (isTrip) {
                    record.attendanceStatus = 'Công tác';
                } else if (isPaidLeave) {
                    record.attendanceStatus = 'Nghỉ phép (có lương)';
                } else if (isUnpaidLeave) {
                    record.attendanceStatus = 'Nghỉ không lương';
                }

                if (isOvertime) {
                    record.attendanceStatus += ' (+ Tăng ca)';
                }
            }

            return record;
        });

        // Augment missing records for requests if filters.date is specified
        if (filters.date) {
            for (const req of approvedRequests) {
                const hrDate = new Date(filters.date);
                hrDate.setHours(12, 0, 0, 0); // generic mid-day representation

                const dateKey = `${req.email}_${filters.date}`;
                if (!recordMap.has(dateKey)) {
                    // Create virtual record
                    let status = 'Nghỉ phép';
                    if (req.type === RequestType.ATTENDANCE_ADJUSTMENT) status = 'Đã cập nhật công';
                    else if (req.type === RequestType.BUSINESS_TRIP) status = 'Công tác';
                    else if (req.type === RequestType.PAID_LEAVE || req.type === RequestType.LEAVE) status = 'Nghỉ phép (có lương)';
                    else if (req.type === RequestType.UNPAID_LEAVE) status = 'Nghỉ không lương';

                    if (req.type === RequestType.OVERTIME) status = 'Tăng ca';

                    processedRecords.push({
                        id: `virtual_${req.id}` as any,
                        email: req.email,
                        start_time: '',
                        end_time: '',
                        expected_start_time: '08:00',
                        expected_end_time: '17:00',
                        created_at: hrDate,
                        workingHours: undefined as any,
                        attendanceStatus: status
                    });
                    recordMap.add(dateKey); // Prevent duplicate virtual records if multiple requests overlap
                }
            }
        }

        // Apply status filter after calculation
        if (filters.status) {
            if (filters.status === 'full') {
                processedRecords = processedRecords.filter(r =>
                    r.attendanceStatus.includes('Đủ giờ công') ||
                    r.attendanceStatus.includes('Đã cập nhật công') ||
                    r.attendanceStatus.includes('Công tác') ||
                    r.attendanceStatus.includes('có lương')
                );
            } else if (filters.status === 'incomplete') {
                processedRecords = processedRecords.filter(r =>
                    !r.attendanceStatus.includes('Đủ giờ công') &&
                    !r.attendanceStatus.includes('Đã cập nhật công') &&
                    !r.attendanceStatus.includes('Công tác') &&
                    !r.attendanceStatus.includes('có lương')
                );
            }
        }

        return processedRecords;
    }
}
