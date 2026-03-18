import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(Setting)
        private settingsRepository: Repository<Setting>,
    ) { }

    async getSetting(key: string): Promise<string | null> {
        const setting = await this.settingsRepository.findOne({ where: { key } });
        return setting ? setting.value : null;
    }

    async setSetting(key: string, value: string): Promise<Setting> {
        if (!key || !value) {
            throw new BadRequestException('Key and Value are required');
        }
        let setting = await this.settingsRepository.findOne({ where: { key } });
        if (setting) {
            setting.value = value;
        } else {
            setting = this.settingsRepository.create({ key, value });
        }
        return await this.settingsRepository.save(setting);
    }
}
