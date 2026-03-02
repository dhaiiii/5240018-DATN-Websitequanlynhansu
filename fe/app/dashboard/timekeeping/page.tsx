'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/api-client';

interface Timekeeping {
    id: number;
    email: string;
    start_time: string;
    end_time: string | null;
    created_at: string;
}

export default function TimekeepingPage() {
    const [data, setData] = useState<Timekeeping[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const response = await apiClient.get('/timekeeping');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to fetch timekeeping data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chi tiết chấm công</h3>
                    <button
                        onClick={fetchData}
                        className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                    >
                        Làm mới
                    </button>
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
                                            <td className="py-3 px-4 text-right">
                                                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded text-xs font-semibold">
                                                    Đã lưu
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-gray-500">
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
