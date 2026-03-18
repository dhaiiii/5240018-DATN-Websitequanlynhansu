import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateSettingDto {
    @IsString()
    @IsNotEmpty()
    key: string;

    @IsString()
    @IsNotEmpty()
    value: string;
}
