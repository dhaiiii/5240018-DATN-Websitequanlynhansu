'use client';

import { isAdmin, isManager } from '@/lib/utils/auth.utils';
import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Tag, Space, message, Card, Statistic, Row, Col } from 'antd';
import { apiClient } from '@/lib/api/api-client';
import CalculatePayrollModal from '@/components/payroll/CalculatePayrollModal';
import SalaryConfigModal from '@/components/payroll/SalaryConfigModal';

export default function SalaryPage() {
    const [isSysAdmin, setIsSysAdmin] = useState(false);
    const [isSysManager, setSysManager] = useState(false);
    const [loading, setLoading] = useState(true);
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [isCalcModalVisible, setIsCalcModalVisible] = useState(false);
    const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [payrollRes, userRes] = await Promise.all([
                apiClient.get('/payrolls'),
                apiClient.get('/users')
            ]);

            if (payrollRes.ok) setPayrolls(await payrollRes.json());
            if (userRes.ok) setUsers(await userRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('Không thể tải dữ liệu lương');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setIsSysAdmin(isAdmin());
        setSysManager(isManager());
        fetchData();
    }, [fetchData]);

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            const res = await apiClient.put(`/payrolls/${id}/status`, { status });
            if (res.ok) {
                message.success('Cập nhật trạng thái thành công');
                fetchData();
            }
        } catch (error) {
            message.error('Cập nhật thất bại');
        }
    };

    const adminColumns = [
        {
            title: 'Nhân viên',
            key: 'user',
            render: (text: any, record: any) => (
                <Space direction="vertical" size={0}>
                    <span className="font-medium text-gray-900 dark:text-white">
                        {record.user?.last_name} {record.user?.first_name}
                    </span>
                    <span className="text-xs text-gray-500">{record.user?.email}</span>
                </Space>
            )
        },
        {
            title: 'Kỳ lương',
            key: 'period',
            render: (text: any, record: any) => `Tháng ${record.month}/${record.year}`
        },
        {
            title: 'Số công (Thực/Chuẩn)',
            key: 'days',
            render: (text: any, record: any) => `${record.actual_days} / ${record.standard_days}`
        },
        {
            title: 'OT (Giờ/Tiền)',
            key: 'ot',
            render: (text: any, record: any) => `${record.ot_hours}h / ${Number(record.ot_pay).toLocaleString()} đ`
        },
        {
            title: 'Tổng nhận (NET)',
            dataIndex: 'net_salary',
            key: 'net_salary',
            render: (val: any) => <span className="font-bold text-indigo-600 dark:text-indigo-400">{Number(val).toLocaleString()} VNĐ</span>
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const colors: any = { PENDING: 'orange', APPROVED: 'blue', PAID: 'green' };
                const labels: any = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', PAID: 'Đã chi trả' };
                return <Tag color={colors[status]}>{labels[status]}</Tag>;
            }
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (text: any, record: any) => (
                <Space>
                    {record.status === 'PENDING' && (
                        <Button type="link" size="small" onClick={() => handleUpdateStatus(record.id, 'APPROVED')}>Duyệt</Button>
                    )}
                    {record.status === 'APPROVED' && (
                        <Button type="link" size="small" onClick={() => handleUpdateStatus(record.id, 'PAID')}>Thanh toán</Button>
                    )}
                    {record.status !== 'PAID' && (
                        <Button type="link" size="small" onClick={() => {
                            setSelectedUser(record.user);
                            setIsCalcModalVisible(true);
                        }}>Sửa</Button>
                    )}
                </Space>
            )
        }
    ];

    if (!isSysAdmin && !isSysManager) {
        // Simple View for Employees (can be expanded)
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Phiếu lương của tôi</h1>
                <Table
                    dataSource={payrolls.filter(p => p.user_id === JSON.parse(localStorage.getItem('user') || '{}').id)}
                    columns={adminColumns.filter(c => c.key !== 'action')}
                    loading={loading}
                    rowKey="id"
                />
            </div>
        );
    }

    const totalExpense = payrolls.reduce((sum, p) => sum + Number(p.net_salary), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Lương</h1>
                <Space>
                    <Button
                        type="primary"
                        onClick={() => {
                            setSelectedUser(null);
                            setIsCalcModalVisible(true);
                        }}
                    >
                        Tính lương & OT
                    </Button>
                </Space>
            </div>

            <Row gutter={16}>
                <Col span={8}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic title="Tổng quỹ lương" value={totalExpense} suffix="VNĐ" precision={0} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic title="Nhân viên đã tính" value={payrolls.length} suffix={`/ ${users.length}`} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic
                            title="Tỉ lệ thanh toán"
                            value={payrolls.filter(p => p.status === 'PAID').length}
                            suffix={`/ ${payrolls.length}`}
                        />
                    </Card>
                </Col>
            </Row>

            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chi tiết bảng lương</h3>
                </div>
                <Table
                    dataSource={payrolls}
                    columns={adminColumns}
                    loading={loading}
                    rowKey="id"
                />
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Danh sách nhân sự & Cấu hình lương</h3>
                <Table
                    dataSource={users}
                    rowKey="id"
                    columns={[
                        { title: 'Tên', render: (u) => `${u.last_name} ${u.first_name}` },
                        { title: 'Email', dataIndex: 'email' },
                        {
                            title: 'Thao tác',
                            render: (u) => (
                                <Button size="small" onClick={() => {
                                    setSelectedUser(u);
                                    setIsConfigModalVisible(true);
                                }}>Cấu hình lương</Button>
                            )
                        }
                    ]}
                />
            </div>

            <CalculatePayrollModal
                visible={isCalcModalVisible}
                onClose={() => setIsCalcModalVisible(false)}
                userId={selectedUser?.id}
                userName={selectedUser ? `${selectedUser.last_name} ${selectedUser.first_name}` : ''}
                onSuccess={fetchData}
            />

            <SalaryConfigModal
                visible={isConfigModalVisible}
                onClose={() => setIsConfigModalVisible(false)}
                userId={selectedUser?.id}
                userName={selectedUser ? `${selectedUser.last_name} ${selectedUser.first_name}` : ''}
            />
        </div>
    );
}
