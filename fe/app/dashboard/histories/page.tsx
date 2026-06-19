'use client';

import React, { useState, useEffect } from 'react';
import { Table, Typography, Card, Input, DatePicker, Select, Button, Dropdown, message, Menu } from 'antd';
import { SearchOutlined, DownOutlined, HistoryOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { apiClient } from '@/lib/api/api-client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface ProfileHistory {
    id: number;
    action: string;
    created_at: string;
    changes: any;
    admin: any;
    user: any;
}

export default function GlobalHistoryPage() {
    const [histories, setHistories] = useState<ProfileHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [dateRange, setDateRange] = useState<any>(null);
    const [selectedUser, setSelectedUser] = useState<number | null>(null);

    // Unique users for filter
    const [users, setUsers] = useState<{ id: number, name: string }[]>([]);

    useEffect(() => {
        fetchHistories();
    }, []);

    const fetchHistories = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/users/histories/all');
            if (res.ok) {
                const data = await res.json();
                setHistories(data);

                // Extract unique users
                const userMap = new Map();
                data.forEach((h: any) => {
                    if (h.user && !userMap.has(h.user.id)) {
                        userMap.set(h.user.id, `${h.user.first_name} ${h.user.last_name}`);
                    }
                });
                setUsers(Array.from(userMap.entries()).map(([id, name]) => ({ id, name: name as string })));
            } else {
                message.error('Không thể tải lịch sử');
            }
        } catch (error) {
            message.error('Lỗi kết nối server');
        } finally {
            setLoading(false);
        }
    };

    const flattenedHistories: any[] = [];
    histories.forEach(item => {
        if (item.changes && Object.keys(item.changes).length > 0) {
            Object.entries(item.changes).forEach(([key, value]: [string, any]) => {
                const fieldNames: Record<string, string> = {
                    first_name: 'Tên', last_name: 'Họ', email: 'Email', phone: 'Số điện thoại',
                    address: 'Địa chỉ thường trú', avatar: 'Ảnh đại diện', gender: 'Giới tính',
                    is_active: 'Trạng thái HĐ', departmentId: 'Phòng ban', roleId: 'Chức vụ',
                    birth_date: 'Ngày sinh', join_date: 'Ngày vào làm', citizen_id: 'Số CMND/CCCD',
                    contract_type: 'Loại hợp đồng', password: 'Mật khẩu'
                };
                const formatValue = (val: any) => {
                    if (val === null || val === undefined || val === '') return '(trống)';
                    if (typeof val === 'boolean') return val ? 'Có' : 'Không';
                    if (key === 'avatar') return '(ảnh)';
                    if (key === 'password') return '***';
                    return String(val);
                };

                flattenedHistories.push({
                    key: `${item.id}-${key}`,
                    userId: item.user?.id || 'N/A',
                    userName: item.user ? `${item.user.first_name} ${item.user.last_name}` : 'Không rõ',
                    date: item.created_at,
                    field: fieldNames[key] || key,
                    oldValue: formatValue(value.old),
                    newValue: formatValue(value.new),
                    admin: item.admin ? `Admin: ${item.admin.first_name} ${item.admin.last_name}` : 'Hệ thống',
                    status: 'Thành công'
                });
            });
        }
    });

    const filteredHistories = flattenedHistories.filter(h => {
        // User filter
        if (selectedUser && h.userId !== selectedUser) return false;

        // Search filter
        const matchSearch = h.field.toLowerCase().includes(searchText.toLowerCase()) ||
            h.oldValue.toLowerCase().includes(searchText.toLowerCase()) ||
            h.newValue.toLowerCase().includes(searchText.toLowerCase()) ||
            h.admin.toLowerCase().includes(searchText.toLowerCase()) ||
            (h.userName && h.userName.toLowerCase().includes(searchText.toLowerCase()));

        // Date range filter
        let matchDate = true;
        if (dateRange && dateRange[0] && dateRange[1]) {
            const start = dateRange[0].startOf('day');
            const end = dateRange[1].endOf('day');
            const itemDate = dayjs(h.date);
            matchDate = itemDate.isAfter(start) && itemDate.isBefore(end);
        }

        return matchSearch && matchDate;
    });

    const columns: ColumnsType<any> = [
        {
            title: 'ID Người Dùng',
            dataIndex: 'userId',
            key: 'userId',
            width: 140,
        },
        {
            title: 'Họ Tên',
            dataIndex: 'userName',
            key: 'userName',
            width: 200,
            render: (text) => <span className="font-medium text-gray-800">{text}</span>
        },
        {
            title: 'Ngày & Giờ Cập Nhật',
            dataIndex: 'date',
            key: 'date',
            width: 180,
            render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Trường Thông Tin',
            dataIndex: 'field',
            key: 'field',
            width: 160,
            render: (text) => <span className="font-medium">{text}</span>
        },
        {
            title: 'Giá Trị Cũ',
            dataIndex: 'oldValue',
            key: 'oldValue',
            render: (text) => <span style={{ textDecoration: 'line-through', color: '#888' }} className="truncate block w-[160px]" title={text}>{text}</span>
        },
        {
            title: 'Giá Trị Mới',
            dataIndex: 'newValue',
            key: 'newValue',
            render: (text) => <span className="truncate block w-[160px]" title={text}>{text}</span>
        },
        {
            title: 'Người Thực Hiện',
            dataIndex: 'admin',
            key: 'admin',
            width: 220,
        },
        {
            title: 'Trạng Thái',
            dataIndex: 'status',
            key: 'status',
            width: 130,
            render: (text) => <span className="text-green-600 font-medium whitespace-nowrap">{text}</span>
        }
    ];

    const bulkMenuProps = {
        items: [{ key: '1', label: 'Xuất Excel', icon: <DownloadOutlined /> }]
    };

    return (
        <div className="h-full flex flex-col">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-[#003087] mb-2 flex items-center gap-2">
                        <HistoryOutlined />
                        Lịch Sử Cập Nhật Thông Tin Số Lượng Lớn
                    </h1>
                    <Text type="secondary">Theo dõi toàn bộ lịch sử thay đổi thông tin nhân sự trên hệ thống</Text>
                </div>
                <div className="flex bg-green-50 text-green-700 px-3 py-1 rounded-md text-xs font-semibold border border-green-200">
                    Bulk Update: System ID 455321
                </div>
            </div>

            <Card bordered={false} className="shadow-sm flex-1 overflow-hidden" bodyStyle={{ padding: 20, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="flex flex-wrap gap-4 mb-4 justify-between items-center">
                    <div className="flex flex-wrap gap-4">
                        <Select
                            allowClear
                            placeholder="All Người Dùng ..."
                            style={{ width: 220 }}
                            onChange={setSelectedUser}
                            showSearch
                            optionFilterProp="children"
                        >
                            {users.map(u => (
                                <Option key={u.id} value={u.id}>{u.name}</Option>
                            ))}
                        </Select>

                        <RangePicker
                            format="DD/MM/YYYY"
                            onChange={(dates) => setDateRange(dates)}
                            className="w-[280px]"
                        />

                        <Input
                            placeholder="Tìm kiếm..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            style={{ width: 200 }}
                        />
                    </div>

                    <Dropdown menu={bulkMenuProps}>
                        <Button>
                            Bulk Actions <DownOutlined />
                        </Button>
                    </Dropdown>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredHistories}
                    pagination={{ pageSize: 15, showSizeChanger: true }}
                    rowSelection={{ type: 'checkbox' }}
                    size="middle"
                    bordered
                    loading={loading}
                    scroll={{ x: 'max-content', y: 'calc(100vh - 300px)' }}
                />
            </Card>
        </div>
    );
}
