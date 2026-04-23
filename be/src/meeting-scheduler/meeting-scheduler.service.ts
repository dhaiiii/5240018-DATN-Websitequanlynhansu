import { Injectable, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Meeting } from './entities/meeting.entity';
import { Room } from './entities/room.entity';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MeetingSchedulerService implements OnModuleInit {
    constructor(
        private dataSource: DataSource,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async onModuleInit() {
        // Seed rooms nếu chưa tồn tại
        const roomRepo = this.dataSource.getRepository(Room);
        const count = await roomRepo.count();
        if (count === 0) {
            await roomRepo.save([
                { name: 'Phòng A', capacity: 10, location: 'Tầng 1' },
                { name: 'Phòng B', capacity: 20, location: 'Tầng 2' },
                { name: 'Phòng C', capacity: 8, location: 'Tầng 3' },
            ]);
        }
    }

    // ─── GET EMPLOYEES (for organizer select) ───────────────────────────────
    async getEmployees() {
        const users = await this.userRepository.find({
            where: { is_active: true },
            select: ['id', 'first_name', 'last_name', 'email'],
            order: { last_name: 'ASC', first_name: 'ASC' },
        });
        return users.map(u => ({
            id: u.id,
            name: `${u.last_name} ${u.first_name}`,
            email: u.email,
        }));
    }

    // ─── GET ALL ROOMS ────────────────────────────────────────────────────────
    async getAllRooms() {
        return await this.dataSource.getRepository(Room).find({
            where: { is_active: true },
            order: { name: 'ASC' },
        });
    }

    // ─── GET ALL MEETINGS ─────────────────────────────────────────────────────
    async getAllMeetings() {
        return await this.dataSource
            .getRepository(Meeting)
            .find({ relations: ['room'], order: { start_time: 'DESC' } });
    }

    // ─── GET MEETING BY ID ────────────────────────────────────────────────────
    async getMeetingById(id: string) {
        const meeting = await this.dataSource
            .getRepository(Meeting)
            .findOne({ where: { id }, relations: ['room'] });
        if (!meeting) throw new HttpException('Cuộc họp không tồn tại', HttpStatus.NOT_FOUND);
        return meeting;
    }

    // ─── BOOK MEETING (with transaction + conflict check) ─────────────────────
    async bookMeeting(dto: CreateMeetingDto) {
        const { room_id, start_time, end_time, title, description, organizer } = dto;
        const startTime = new Date(start_time);
        const endTime = new Date(end_time);

        // Validate thời gian
        if (startTime >= endTime) {
            throw new HttpException(
                'Thời gian kết thúc phải sau thời gian bắt đầu',
                HttpStatus.BAD_REQUEST,
            );
        }

        if (startTime < new Date()) {
            throw new HttpException(
                'Không thể đặt lịch trong quá khứ',
                HttpStatus.BAD_REQUEST,
            );
        }

        return await this.dataSource.transaction(async (manager: EntityManager) => {
            // 1. Lock row phòng để tránh race condition
            const room = await manager.findOne(Room, {
                where: { id: room_id, is_active: true },
                lock: { mode: 'pessimistic_write' },
            });

            if (!room) throw new HttpException('Phòng không tồn tại hoặc đã bị vô hiệu hoá', HttpStatus.NOT_FOUND);

            // 2. Kiểm tra xung đột thời gian
            // Logic: Hai khoảng thời gian [A,B] và [C,D] chồng chéo khi A < D và B > C
            const conflictMeeting = await manager
                .createQueryBuilder(Meeting, 'meeting')
                .where('meeting.room_id = :room_id', { room_id })
                .andWhere('meeting.status != :status', { status: 'CANCELLED' })
                .andWhere('meeting.start_time < :end_time', { end_time: endTime })
                .andWhere('meeting.end_time > :start_time', { start_time: startTime })
                .getOne();

            if (conflictMeeting) {
                // 3. Tìm phòng thay thế còn trống trong cùng khoảng thời gian
                const availableRooms = await this.findAlternativeRooms(manager, startTime, endTime, room_id);

                throw new HttpException(
                    {
                        message: `Phòng "${room.name}" đã được đặt từ ${conflictMeeting.start_time.toLocaleString('vi-VN')} đến ${conflictMeeting.end_time.toLocaleString('vi-VN')}.`,
                        conflict: true,
                        conflictWith: {
                            id: conflictMeeting.id,
                            title: conflictMeeting.title,
                            start_time: conflictMeeting.start_time,
                            end_time: conflictMeeting.end_time,
                        },
                        alternatives: availableRooms,
                    },
                    HttpStatus.CONFLICT,
                );
            }

            // 4. Tạo cuộc họp mới
            const newMeeting = manager.create(Meeting, {
                title,
                description,
                organizer,
                room_id,
                start_time: startTime,
                end_time: endTime,
                status: 'SCHEDULED',
            });
            const saved = await manager.save(newMeeting);

            // Trả về kèm thông tin phòng
            return await manager.findOne(Meeting, {
                where: { id: saved.id },
                relations: ['room'],
            });
        });
    }

    // ─── CANCEL MEETING ───────────────────────────────────────────────────────
    async cancelMeeting(id: string) {
        const meeting = await this.dataSource
            .getRepository(Meeting)
            .findOne({ where: { id } });

        if (!meeting) throw new HttpException('Cuộc họp không tồn tại', HttpStatus.NOT_FOUND);
        if (meeting.status === 'CANCELLED') {
            throw new HttpException('Cuộc họp đã bị huỷ trước đó', HttpStatus.BAD_REQUEST);
        }
        if (meeting.status === 'COMPLETED') {
            throw new HttpException('Không thể huỷ cuộc họp đã hoàn thành', HttpStatus.BAD_REQUEST);
        }

        meeting.status = 'CANCELLED';
        return await this.dataSource.getRepository(Meeting).save(meeting);
    }

    // ─── CHECK AVAILABLE ROOMS ────────────────────────────────────────────────
    async checkAvailableRooms(start_time: string, end_time: string) {
        const startTime = new Date(start_time);
        const endTime = new Date(end_time);

        const manager = this.dataSource.createEntityManager();
        return await this.findAlternativeRooms(manager, startTime, endTime, null);
    }

    // ─── PRIVATE: Find Alternative Rooms ─────────────────────────────────────
    private async findAlternativeRooms(
        manager: EntityManager,
        startTime: Date,
        endTime: Date,
        excludeRoomId: string | null,
    ) {
        const qb = manager
            .createQueryBuilder(Room, 'room')
            .where('room.is_active = true')
            .andWhere(qb => {
                // Lấy các room_id đang bị conflict trong khoảng thời gian này
                const subQuery = qb
                    .subQuery()
                    .select('meeting.room_id')
                    .from(Meeting, 'meeting')
                    .where('meeting.status != :status', { status: 'CANCELLED' })
                    .andWhere('meeting.start_time < :end_time', { end_time: endTime })
                    .andWhere('meeting.end_time > :start_time', { start_time: startTime })
                    .getQuery();
                return 'room.id NOT IN ' + subQuery;
            });

        // Loại trừ phòng đang xem xét (phòng bị conflict)
        if (excludeRoomId) {
            qb.andWhere('room.id != :excludeRoomId', { excludeRoomId });
        }

        return await qb.orderBy('room.name', 'ASC').getMany();
    }
}
