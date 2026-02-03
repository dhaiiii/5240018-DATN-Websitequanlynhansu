'use client';

import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Typography, List, Avatar, Tag, Skeleton } from 'antd';
import {
    UserOutlined,
    ApartmentOutlined,
    ClockCircleOutlined,
    FileDoneOutlined,
    ArrowUpOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const API_BASE = 'http://localhost:3001/api';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        totalDepartments: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [usersRes, deptsRes] = await Promise.all([
                    fetch(`${API_BASE}/users`),
                    fetch(`${API_BASE}/departments`)
                ]);
                const users = await usersRes.json();
                const depts = await deptsRes.json();

                setStats({
                    totalEmployees: users.length,
                    totalDepartments: depts.length,
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const recentActivities = [
        { id: 1, user: 'John Smith', action: 'nộp đơn xin phép', time: '2 giờ trước', status: 'Pending', color: 'orange' },
        { id: 2, user: 'Mary Jane', action: 'vừa chấm công vào', time: '3 giờ trước', status: 'Completed', color: 'green' },
        { id: 3, user: 'Robert King', action: 'đã được duyệt tăng lương', time: '5 giờ trước', status: 'Approved', color: 'blue' },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Title level={2} className="mb-6">Tổng quan hệ thống</Title>

            <Row gutter={[16, 16]}>
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
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic
                            title="Yêu cầu chờ xử lý"
                            value={23}
                            prefix={<FileDoneOutlined />}
                            valueStyle={{ color: '#cf1322' }}
                            loading={loading}
                        />
                        <Text type="secondary">-5% so với tuần trước</Text>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} className="mt-6">
                <Col span={24}>
                    <Card title="Hoạt động gần đây" bordered={false} className="shadow-sm">
                        <List
                            itemLayout="horizontal"
                            dataSource={recentActivities}
                            renderItem={(item) => (
                                <List.Item
                                    extra={<Tag color={item.color}>{item.status}</Tag>}
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar style={{ backgroundColor: '#1890ff' }}>{item.user[0]}</Avatar>}
                                        title={<Text strong>{item.user}</Text>}
                                        description={`${item.action} - ${item.time}`}
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

