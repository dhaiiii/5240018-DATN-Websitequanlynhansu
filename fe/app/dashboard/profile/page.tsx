'use client';

import React, { useEffect, useState } from 'react';
import { Card, Avatar, Descriptions, Button, Upload, message, Skeleton } from 'antd';
import {
    UserOutlined,
    EditOutlined,
    CalendarOutlined,
    PhoneOutlined,
    MailOutlined,
    TeamOutlined,
    EnvironmentOutlined,
    FacebookOutlined,
    ArrowLeftOutlined,
} from '@ant-design/icons';
import { apiClient } from '@/lib/api/api-client';
import { useRouter } from 'next/navigation';

interface UserProfile {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    avatar: string | null;
    gender: string;
    role: string;
    is_active: boolean;
    department: {
        id: number;
        name: string;
    } | null;
    role_item: {
        id: number;
        name: string;
    } | null;
    created_at: string;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await apiClient.get('/users/me');
                if (response.ok) {
                    const data = await response.json();
                    setProfile(data);
                } else {
                    message.error('Không thể tải thông tin cá nhân');
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                message.error('Lỗi khi tải thông tin cá nhân');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="p-8">
                <Skeleton avatar paragraph={{ rows: 10 }} active />
            </div>
        );
    }

    if (!profile) {
        return <div className="p-8 text-center text-gray-500">Không tìm thấy thông tin cá nhân</div>;
    }

    const fullName = `${profile.first_name} ${profile.last_name}`;

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            {/* Header Banner */}
            <div className="relative mb-24">
                <div className="h-48 rounded-2xl shadow-sm overflow-hidden relative border border-gray-100">
                    <img
                        src="/company-banner.png"
                        alt="Company Banner"
                        className="w-full h-full object-cover"
                    />
                </div>


                <div className="absolute -bottom-20 left-8 flex items-end gap-6">
                    <div className="relative">
                        <Avatar
                            size={128}
                            src={profile.avatar}
                            icon={<UserOutlined />}
                            className="border-4 border-white shadow-xl bg-white"
                        />
                    </div>
                    <div className="mb-4">
                        <h1 className="text-3xl font-bold text-gray-900 mb-1">{fullName}</h1>
                        <div className="flex gap-4 text-sm text-gray-500 font-medium">
                            <span className="flex items-center gap-1.5"><EnvironmentOutlined /> Hà Nội</span>
                            <span className="flex items-center gap-1.5"><CalendarOutlined /> Gia nhập {new Date(profile.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Details Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <Card
                        title={
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2"><UserOutlined className="text-indigo-500" /> Thông tin cá nhân</span>
                                <Button type="text" size="small" icon={<EditOutlined />} className="text-gray-400 hover:text-indigo-600">Chỉnh sửa</Button>
                            </div>
                        }
                        className="shadow-sm border-gray-100 rounded-xl"
                        styles={{ body: { padding: '24px' } }}
                    >
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Tổng quát</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm text-gray-500">Mã nhân viên</span>
                                        <span className="font-medium text-gray-900 font-mono">E{profile.id.toString().padStart(3, '0')}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm text-gray-500">Tên đầy đủ</span>
                                        <span className="font-medium text-gray-900">{fullName}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm text-gray-500">Ngày sinh</span>
                                        <span className="font-medium text-gray-900">Chưa cài đặt</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm text-gray-500">Thâm niên</span>
                                        <span className="font-medium text-gray-900">0 năm</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm text-gray-500">Phòng ban</span>
                                        <span className="font-medium text-gray-900">{profile.department?.name || 'Chưa phân phối'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm text-gray-500">Chức vụ</span>
                                        <span className="font-medium text-gray-900">{profile.role_item?.name || 'Nhân viên'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-50">
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Liên hệ</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                            <PhoneOutlined />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500">Số điện thoại</span>
                                            <span className="text-sm font-medium text-gray-900">{profile.phone || 'Chưa cài đặt'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                            <MailOutlined />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500">Email công việc</span>
                                            <span className="text-sm font-medium text-gray-900">{profile.email}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 text-xs text-center font-bold">
                                            TG
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500">Telegram</span>
                                            <span className="text-sm font-medium text-gray-900 italic text-gray-400">Chưa cài đặt</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                            <FacebookOutlined />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500">Facebook</span>
                                            <span className="text-sm font-medium text-gray-900 italic text-gray-400">Chưa cài đặt</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <div>
                    <Card
                        className="shadow-sm border-gray-100 rounded-xl"
                        styles={{ body: { padding: '24px' } }}
                    >
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 text-green-600 mb-4">
                                <TeamOutlined style={{ fontSize: '20px' }} />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">Trạng thái nhân sự</h3>
                            <p className="text-sm text-gray-500 mb-6">Thông tin vị trí và vai trò</p>

                            <div className="space-y-3 text-left">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                    <span className="text-sm text-gray-600">Loại nhân viên</span>
                                    <span className="text-sm font-semibold text-gray-900">Chính thức</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                    <span className="text-sm text-gray-600">Vai trò hệ thống</span>
                                    <span className="text-sm font-semibold text-indigo-600 uppercase italic">
                                        {profile.role === 'admin' ? 'Quản trị viên' : profile.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
