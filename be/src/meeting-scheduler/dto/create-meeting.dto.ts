import { IsNotEmpty, IsString, IsUUID, IsDateString, MinLength, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OrganizerDto {
    id: number;
    name: string;
    email: string;
}

export class CreateMeetingDto {
    @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
    @IsString()
    @MinLength(3, { message: 'Tiêu đề phải có ít nhất 3 ký tự' })
    title: string;

    @IsNotEmpty({ message: 'Vui lòng chọn phòng họp' })
    @IsUUID()
    room_id: string;

    @IsNotEmpty({ message: 'Vui lòng nhập thời gian bắt đầu' })
    @IsDateString()
    start_time: string;

    @IsNotEmpty({ message: 'Vui lòng nhập thời gian kết thúc' })
    @IsDateString()
    end_time: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    organizer?: OrganizerDto[];
}

