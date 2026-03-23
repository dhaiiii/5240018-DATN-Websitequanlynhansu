import React from 'react';
import { Tabs, Card } from 'antd';
import { ScheduleOutlined, SettingOutlined } from '@ant-design/icons';
import WorkingHoursConfig from '@/components/settings/working-hours-config';

export default function SettingsPage() {
    const items = [
        {
            key: 'working-hours',
            label: (
                <span>
                    <ScheduleOutlined />
                    Cấu hình giờ làm
                </span>
            ),
            children: (
                <div className="pt-4">
                    <WorkingHoursConfig />
                </div>
            ),
        },
        {
            key: 'general',
            label: (
                <span>
                    <SettingOutlined />
                    Cài đặt chung
                </span>
            ),
            children: (
                <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    Các cài đặt hệ thống khác sẽ được cập nhật tại đây.
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 text-gray-900 dark:text-white">Cài đặt hệ thống</h1>
                <p className="text-gray-500">Quản lý các thông số vận hành của toàn bộ hệ thống</p>
            </div>

            <Card className="rounded-2xl shadow-sm border-gray-100 dark:bg-zinc-800 dark:border-zinc-700">
                <Tabs
                    defaultActiveKey="working-hours"
                    items={items}
                    className="custom-tabs"
                />
            </Card>
        </div>
    );
}
