'use client';

import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Typography, List, Avatar, Tag, message, Button } from 'antd';
import {
    UserOutlined,
    ApartmentOutlined,
    ClockCircleOutlined,
    FileDoneOutlined,
    ArrowUpOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

import { isAdmin, isManager } from '../../lib/utils/auth.utils';

const { Title, Text } = Typography;

const API_BASE = 'http://localhost:3001/api';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        totalDepartments: 0,
        pendingRequestsCount: 0,
    });
    const [recentActivities, setRecentActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPrivileged, setIsPrivileged] = useState(false);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const privileged = isAdmin() || isManager();
            setIsPrivileged(privileged);

            const email = localStorage.getItem('userEmail');
            const statsUrl = privileged
                ? `${API_BASE}/requests/stats`
                : `${API_BASE}/requests/stats?email=${email}`;

            const fetchPromises = [
                fetch(statsUrl)
            ];

            // Only fetch counts if privileged
            if (privileged) {
                fetchPromises.push(fetch(`${API_BASE}/users`));
                fetchPromises.push(fetch(`${API_BASE}/departments`));
            }

            const responses = await Promise.all(fetchPromises);
            const dashboardStats = await responses[0].json();

            let totalEmployees = 0;
            let totalDepartments = 0;

            if (privileged) {
                const users = await responses[1].json();
                const depts = await responses[2].json();
                totalEmployees = Array.isArray(users) ? users.length : 0;
                totalDepartments = Array.isArray(depts) ? depts.length : 0;
            }

            setStats({
                totalEmployees,
                totalDepartments,
                pendingRequestsCount: dashboardStats.pendingCount || 0,
            });
            setRecentActivities(dashboardStats.recentActivities || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            message.error('Không thể tải dữ liệu dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const getRequestTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'PAID_LEAVE': 'Nghỉ phép có lương',
            'UNPAID_LEAVE': 'Nghỉ phép không lương',
            'OVERTIME': 'Làm thêm giờ',
            'BUSINESS_TRIP': 'Công tác',
            'RESIGNATION': 'Thôi việc',
            'ATTENDANCE_ADJUSTMENT': 'Điều chỉnh công'
        };
        return labels[type] || type;
    };

    const handleStatusUpdate = async (id: number, status: string) => {
        try {
            const userEmail = localStorage.getItem('userEmail');
            if (!userEmail) {
                message.error('Không tìm thấy thông tin người duyệt');
                return;
            }

            const res = await fetch(`${API_BASE}/requests/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status,
                    approverEmail: userEmail
                }),
            });

            if (res.ok) {
                message.success(status === 'APPROVED' ? 'Đã duyệt đơn' : 'Đã từ chối đơn');
                fetchDashboardData();
            } else {
                message.error('Cập nhật trạng thái thất bại');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            message.error('Lỗi kết nối server');
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <Title level={2} className="mb-6">
                {isPrivileged ? 'Tổng quan hệ thống' : 'Tổng quan của tôi'}
            </Title>

            <Row gutter={[16, 16]}>
                {isPrivileged && (
                    <>
                        <Col xs={24} sm={12} lg={6}>
                            <Card bordered={false} className="shadow-sm">
                                <Statistic
                                    title="Tổng nhân viên"
                                    value={stats.totalEmployees}
                                    prefix={<UserOutlined />}
                                    valueStyle={{ color: '#3f8600' }}
                                    loading={loading}
                                />
                                <Text type="secondary"><ArrowUpOutlined /> +12% so với tháng trước</Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card bordered={false} className="shadow-sm">
                                <Statistic
                                    title="Phòng ban hoạt động"
                                    value={stats.totalDepartments}
                                    prefix={<ApartmentOutlined />}
                                    valueStyle={{ color: '#1890ff' }}
                                    loading={loading}
                                />
                                <Text type="secondary">Hoạt động ổn định</Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card bordered={false} className="shadow-sm">
                                <Statistic
                                    title="Tỉ lệ chấm công"
                                    value={98.5}
                                    precision={1}
                                    suffix="%"
                                    prefix={<ClockCircleOutlined />}
                                    loading={loading}
                                />
                                <Text type="secondary">Ngày hôm nay</Text>
                            </Card>
                        </Col>
                    </>
                )}
                <Col xs={24} sm={12} lg={isPrivileged ? 6 : 24}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic
                            title={isPrivileged ? "Yêu cầu chờ xử lý" : "Đơn từ đang chờ của tôi"}
                            value={stats.pendingRequestsCount}
                            prefix={<FileDoneOutlined />}
                            valueStyle={{ color: '#cf1322' }}
                            loading={loading}
                        />
                        <Text type="secondary">
                            {isPrivileged ? "Cần phê duyệt ngay" : "Đang chờ admin phê duyệt"}
                        </Text>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} className="mt-6">
                <Col span={24}>
                    <Card
                        title={isPrivileged ? "Đơn từ đang chờ duyệt" : "Đơn từ mới nộp của tôi"}
                        bordered={false}
                        className="shadow-sm"
                    >
                        <List
                            itemLayout="horizontal"
                            loading={loading}
                            dataSource={recentActivities}
                            renderItem={(item) => (
                                <List.Item
                                    actions={isPrivileged ? [
                                        <Button
                                            key="approve"
                                            type="primary"
                                            size="small"
                                            className="bg-green-500 hover:bg-green-600 border-none"
                                            onClick={() => handleStatusUpdate(item.id, 'APPROVED')}
                                        >
                                            Duyệt
                                        </Button>,
                                        <Button
                                            key="reject"
                                            type="primary"
                                            danger
                                            size="small"
                                            onClick={() => handleStatusUpdate(item.id, 'REJECTED')}
                                        >
                                            Từ chối
                                        </Button>
                                    ] : []}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar
                                                src={item.avatar ? `${API_BASE}/uploads/${item.avatar}` : undefined}
                                                icon={!item.avatar && <UserOutlined />}
                                                style={{ backgroundColor: '#1890ff' }}
                                            />
                                        }
                                        title={<Text strong>{item.userName}</Text>}
                                        description={`${getRequestTypeLabel(item.type)} - ${dayjs(item.time).fromNow()}`}
                                    />
                                </List.Item>
                            )}
                            locale={{ emptyText: 'Không có đơn từ nào' }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

