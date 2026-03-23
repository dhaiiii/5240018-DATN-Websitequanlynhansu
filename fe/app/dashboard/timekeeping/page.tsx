'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/api-client';
import { Input, Select, DatePicker, Button, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;

interface Timekeeping {
    id: number;
    email: string;
    start_time: string;
    end_time: string | null;
    created_at: string;
    workingHours?: {
        startTime: string;
        endTime: string;
    };
    attendanceStatus?: string;
}

export default function TimekeepingPage() {
    const [data, setData] = useState<Timekeeping[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        name: '',
        date: '',
        status: '',
    });
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.name) params.append('name', filters.name);
            if (filters.date) params.append('date', filters.date);
            if (filters.status) params.append('status', filters.status);

            const response = await apiClient.get(`/timekeeping?${params.toString()}`);
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch timekeeping data:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Search debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            setFilters(prev => ({ ...prev, name: searchTerm }));
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    const handleReset = () => {
        setSearchTerm('');
        setFilters({
            name: '',
            date: '',
            status: '',
        });
    };

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return '-';
        return timeStr.split('.')[0]; // Handle HH:mm:ss.SSS or HH:mm:ss
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chấm công</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700">
                    <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Hôm nay có mặt</h3>
                    <p className="text-3xl font-bold text-green-600">{data.length}</p>
                    <p className="text-gray-500 text-sm mt-2">Dữ liệu thực tế từ hệ thống</p>
                </div>
                {/* Keep other cards for visual structure, though they are static now */}
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700">
                    <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Vắng</h3>
                    <p className="text-3xl font-bold text-red-600">--</p>
                    <p className="text-gray-500 text-sm mt-2">Chưa tính toán vắng</p>
                </div>
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700">
                    <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Xin phép</h3>
                    <p className="text-3xl font-bold text-yellow-600">--</p>
                    <p className="text-gray-500 text-sm mt-2">Chưa tính toán xin phép</p>
                </div>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="w-[120px]">
                        <Input
                            placeholder="Email..."
                            prefix={<SearchOutlined className="text-gray-400" />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                            allowClear
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <DatePicker
                            placeholder="Chọn ngày"
                            onChange={(date) => setFilters(prev => ({ ...prev, date: date ? date.format('YYYY-MM-DD') : '' }))}
                            value={filters.date ? dayjs(filters.date) : null}
                            className="w-40 min-w-[150px]"
                        />
                        <Select
                            placeholder="Trạng thái"
                            value={filters.status || undefined}
                            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                            className="w-40 min-w-[150px]"
                            allowClear
                        >
                            <Option value="full">Đủ công</Option>
                            <Option value="incomplete">Thiếu công</Option>
                        </Select>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={handleReset}
                            className="hover:text-blue-500 whitespace-nowrap"
                        >
                            Làm mới
                        </Button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <span className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></span>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-zinc-700">
                                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                                    <th className="text-left py-3 px-4 font-semibold">Vào</th>
                                    <th className="text-left py-3 px-4 font-semibold">Ra</th>
                                    <th className="text-left py-3 px-4 font-semibold">Ngày</th>
                                    <th className="text-left py-3 px-4 font-semibold">Cấu hình</th> {/* New column header */}
                                    <th className="text-left py-3 px-4 font-semibold text-right">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length > 0 ? (
                                    data.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700/50">
                                            <td className="py-3 px-4 font-medium">{item.email}</td>
                                            <td className="py-3 px-4 text-green-600 font-medium">{formatTime(item.start_time)}</td>
                                            <td className="py-3 px-4 text-blue-600 font-medium">{formatTime(item.end_time)}</td>
                                            <td className="py-3 px-4 text-gray-500">
                                                {new Date(item.created_at).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="py-3 px-4">
                                                {item.workingHours ? (
                                                    <span className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded border border-gray-100 dark:bg-zinc-700 dark:text-zinc-300 dark:border-zinc-600">
                                                        {item.workingHours.startTime} - {item.workingHours.endTime}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                {(() => {
                                                    const status = item.attendanceStatus || 'Thiếu công';
                                                    let colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-200'; // Default

                                                    if (status === 'Đủ giờ công') colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
                                                    else if (status.includes('muộn') || status.includes('sớm')) colorClass = 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
                                                    else if (status === 'Đang làm việc') colorClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
                                                    else if (status === 'Muộn & Về sớm' || status === 'Thiếu công') colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';

                                                    return (
                                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${colorClass}`}>
                                                            {status}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-gray-500">
                                            Chưa có dữ liệu chấm công nào.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
