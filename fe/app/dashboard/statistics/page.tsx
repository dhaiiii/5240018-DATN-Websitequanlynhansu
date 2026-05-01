'use client';

import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Spin, Typography, message, Button } from 'antd';
import { UserOutlined, CheckCircleOutlined, StopOutlined, TeamOutlined, DownloadOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import { apiClient } from '@/lib/api/api-client';
import * as XLSX from 'xlsx';

const { Title } = Typography;

// Dynamically import charts to avoid SSR issues
const Pie = dynamic(() => import('@ant-design/plots').then((mod) => mod.Pie), { ssr: false });
const Column = dynamic(() => import('@ant-design/plots').then((mod) => mod.Column), { ssr: false });

const API_BASE = 'http://localhost:3001/api';

export default function StatisticsPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/statistics/summary');
            if (!response.ok) throw new Error('Failed to fetch stats');
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
            message.error('Không thể tải dữ liệu thống kê');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading || !stats) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spin size="large" tip="Đang tải dữ liệu thống kê..." />
            </div>
        );
    }

    const { overview, departmentDistribution, attendanceToday } = stats;

    // --- Export to Excel via Backend API ---
    const handleExportExcel = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const link = document.createElement('a');
            link.href = `http://localhost:3001/api/statistics/export-excel?token=${token}`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            message.success('Đang tải file Excel...');
        } catch (error) {
            console.error('Export error:', error);
            message.error('Không thể xuất file Excel');
        }
    };

    // Config for Pie Chart (Department)
    const pieConfig = {
        data: departmentDistribution,
        angleField: 'count',
        colorField: 'name',
        radius: 0.8,
        label: {
            text: 'name',
            position: 'outside',
        },
        legend: {
            color: {
                title: false,
                position: 'right',
                rowPadding: 5,
            },
        },
    };

    // Data and Config for Column Chart (Attendance)
    const columnData = [
        { type: 'Đi làm', count: attendanceToday.working },
        { type: 'Nghỉ', count: attendanceToday.leave },
        { type: 'Vắng', count: attendanceToday.absent },
    ];

    const columnConfig = {
        data: columnData,
        xField: 'type',
        yField: 'count',
        colorField: 'type',
        scale: {
            color: {
                range: ['#52c41a', '#1890ff', '#ff4d4f'], // Green, Blue, Red
            },
        },
        label: {
            text: 'count',
            textBaseline: 'bottom',
            position: 'inside',
        },
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thống kê</h1>
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExportExcel}
                    className="bg-green-600 hover:bg-green-700"
                >
                    Xuất Excel
                </Button>
            </div>

            {/* 1. Overview Cards */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                    <Card bordered={false} className="shadow-sm border border-gray-100">
                        <Statistic
                            title="Tổng số nhân viên"
                            value={overview.total}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card bordered={false} className="shadow-sm border border-gray-100">
                        <Statistic
                            title="Nhân viên đang làm"
                            value={overview.active}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card bordered={false} className="shadow-sm border border-gray-100">
                        <Statistic
                            title="Nhân viên đã nghỉ"
                            value={overview.retired}
                            prefix={<StopOutlined />}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                {/* 2. Employee by Department (Pie Chart) */}
                <Col xs={24} lg={12}>
                    <Card title="Nhân viên theo phòng ban" bordered={false} className="shadow-sm border border-gray-100 h-full">
                        <div className="h-[400px]">
                            <Pie {...pieConfig} />
                        </div>
                    </Card>
                </Col>

                {/* 3. Daily Attendance Status (Column Chart) */}
                <Col xs={24} lg={12}>
                    <Card title="Tình trạng chấm công hôm nay" bordered={false} className="shadow-sm border border-gray-100 h-full">
                        <div className="h-[400px]">
                            <Column {...columnConfig} />
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
