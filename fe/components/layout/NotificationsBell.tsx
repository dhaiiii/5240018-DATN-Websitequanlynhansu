'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Badge, Dropdown, List, Typography, Button, Spin, Tag, Empty } from 'antd';
import { BellOutlined, CheckOutlined, ClockCircleOutlined, CheckCircleOutlined, InfoCircleOutlined, CloseCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { apiClient } from '@/lib/api/api-client';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Text } = Typography;

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    metadata: any;
}

export default function NotificationsBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const listRes = await apiClient.get('/notifications');
            const data = await listRes.json();
            setNotifications(data || []);

            const countRes = await apiClient.get('/notifications/unread-count');
            const countData = await countRes.json();
            setUnreadCount(countData?.count || 0);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, []);

    useEffect(() => {
        // Fetch ngay khi mount
        fetchNotifications();

        // Polling mỗi 30s để cập nhật thông báo mới
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleMarkAsRead = async (id: number) => {
        try {
            await apiClient.patch(`/notifications/${id}/read`, {});
            // Update local state
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await apiClient.patch('/notifications/read-all', {});
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all read', error);
        }
    };

    const handleVisibleChange = (flag: boolean) => {
        setIsOpen(flag);
        if (flag && notifications.length === 0) {
            fetchNotifications();
        }
    };

    const getIconPrefix = (type: string) => {
        switch (type) {
            case 'TIMEKEEPING_IN': return <CheckCircleOutlined className="text-green-500 text-lg" />;
            case 'TIMEKEEPING_OUT': return <CheckCircleOutlined className="text-orange-500 text-lg" />;
            case 'REQUEST_APPROVED': return <CheckCircleOutlined className="text-blue-500 text-lg" />;
            case 'REQUEST_REJECTED': return <CloseCircleOutlined className="text-red-500 text-lg" />;
            case 'MEETING_INVITE': return <CalendarOutlined className="text-indigo-500 text-lg" />;
            default: return <InfoCircleOutlined className="text-gray-500 text-lg" />;
        }
    };

    const menuContent = (
        <div className="bg-white rounded-lg shadow-xl border border-gray-100 max-w-sm w-[350px] overflow-hidden flex flex-col max-h-[500px]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <span className="font-semibold text-gray-800">Thông báo {unreadCount > 0 && <Tag color="red" className="ml-2 rounded-full px-2" bordered={false}>{unreadCount} mới</Tag>}</span>
                {unreadCount > 0 && (
                    <Button type="text" size="small" className="text-xs text-blue-500 hover:text-blue-600 font-medium p-0" onClick={handleMarkAllAsRead}>
                        Đánh dấu tất cả đã đọc
                    </Button>
                )}
            </div>

            <div className="overflow-y-auto flex-1 p-0">
                {loading && notifications.length === 0 ? (
                    <div className="flex justify-center py-6"><Spin size="small" /></div>
                ) : notifications.length > 0 ? (
                    <List
                        itemLayout="horizontal"
                        dataSource={notifications}
                        renderItem={item => (
                            <List.Item
                                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors ${!item.is_read ? 'bg-blue-50/20' : ''}`}
                                onClick={() => {
                                    if (!item.is_read) handleMarkAsRead(item.id);
                                }}
                            >
                                <div className="flex gap-3 items-start w-full">
                                    <div className="mt-0.5 relative">
                                        {getIconPrefix(item.type)}
                                        {!item.is_read && <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white"></span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <span className={`text-sm truncate pr-2 ${!item.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                {item.title}
                                            </span>
                                        </div>
                                        <div className={`text-sm leading-snug mb-1 line-clamp-2 ${!item.is_read ? 'text-gray-800' : 'text-gray-500'}`}>
                                            {item.message}
                                        </div>
                                        <div className="flex items-center text-xs text-gray-400 gap-1.5">
                                            <ClockCircleOutlined className="text-[10px]" />
                                            <span>{dayjs(item.created_at).fromNow()}</span>
                                        </div>
                                    </div>
                                </div>
                            </List.Item>
                        )}
                    />
                ) : (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<span className="text-gray-400">Không có thông báo nào</span>}
                        className="py-10 my-0"
                    />
                )}
            </div>

            <div className="border-t border-gray-100 p-2 bg-gray-50 text-center">
                <Button type="text" block className="text-gray-500 hover:text-blue-600 font-medium h-8">
                    Xem tất cả
                </Button>
            </div>
        </div>
    );

    return (
        <Dropdown
            dropdownRender={() => menuContent}
            trigger={['click']}
            open={isOpen}
            onOpenChange={handleVisibleChange}
            placement="bottomRight"
        >
            <div className="cursor-pointer p-2 rounded-full hover:bg-gray-100 transition-colors mr-2">
                <Badge count={unreadCount} overflowCount={99} size="small" offset={[2, 0]}>
                    <BellOutlined className="text-[20px] text-gray-600 hover:text-gray-900" />
                </Badge>
            </div>
        </Dropdown>
    );
}
