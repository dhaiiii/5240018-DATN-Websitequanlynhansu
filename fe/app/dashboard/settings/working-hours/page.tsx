'use client';

import React from 'react';
import WorkingHoursConfig from '@/components/settings/working-hours-config';
import { Card } from 'antd';

export default function WorkingHoursPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Cấu hình giờ làm việc</h1>
                <p className="text-gray-500">Quản lý thời gian bắt đầu và kết thúc làm việc của công ty</p>
            </div>

            <Card className="rounded-2xl shadow-sm border-gray-100">
                <WorkingHoursConfig />
            </Card>
        </div>
    );
}
