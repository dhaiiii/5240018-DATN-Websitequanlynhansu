import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../auth/permission.decorator';
import { Permission } from '../auth/permission.enum';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get(':key')
    @RequirePermission(Permission.User)
    async getSetting(@Param('key') key: string) {
        const value = await this.settingsService.getSetting(key);
        return { key, value };
    }

    @Post()
    @RequirePermission(Permission.Admin)
    async setSetting(@Body() body: UpdateSettingDto) {
        return await this.settingsService.setSetting(body.key, body.value);
    }
}
