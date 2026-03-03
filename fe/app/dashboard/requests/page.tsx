'use client';

import React, { useEffect, useState } from 'react';
import {
    Table,
    Card,
    Button,
    Tag,
    Space,
    Typography,
    Modal,
    Form,
    Select,
    DatePicker,
    Input,
    message,
    Row,
    Col,
    Statistic
} from 'antd';
import {
    PlusOutlined,
    FileTextOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    SyncOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import { apiClient } from '@/lib/api/api-client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

enum RequestType {
    PAID_LEAVE = 'PAID_LEAVE',
    UNPAID_LEAVE = 'UNPAID_LEAVE',
    LEAVE = 'LEAVE',
    OVERTIME = 'OVERTIME',
    BUSINESS_TRIP = 'BUSINESS_TRIP',
    RESIGNATION = 'RESIGNATION',
    ATTENDANCE_ADJUSTMENT = 'ATTENDANCE_ADJUSTMENT',
}

const typeLabels: Record<string, string> = {
    [RequestType.PAID_LEAVE]: 'Nghỉ phép có lương',
    [RequestType.UNPAID_LEAVE]: 'Nghỉ phép không lương',
    [RequestType.LEAVE]: 'Nghỉ phép',
    [RequestType.OVERTIME]: 'Tăng ca',
    [RequestType.BUSINESS_TRIP]: 'Công tác',
    [RequestType.RESIGNATION]: 'Thôi việc',
    [RequestType.ATTENDANCE_ADJUSTMENT]: 'Điều chỉnh chấm công',
};

const statusConfig: Record<string, { color: string, icon: React.ReactNode, label: string }> = {
    PENDING: { color: 'orange', icon: <SyncOutlined spin />, label: 'Chờ duyệt' },
    APPROVED: { color: 'green', icon: <CheckCircleOutlined />, label: 'Đã duyệt' },
    REJECTED: { color: 'red', icon: <CloseCircleOutlined />, label: 'Từ chối' },
};

export default function RequestsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [userEmail, setUserEmail] = useState('');
    const [permissionLevel, setPermissionLevel] = useState('user');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedLevel = localStorage.getItem('permission_level') || 'user';
        setPermissionLevel(storedLevel);

        if (storedUser) {
            const user = JSON.parse(storedUser);
            setUserEmail(user.email);
            fetchRequests(user.email, storedLevel);
        }
    }, []);

    const fetchRequests = async (email: string, level: string) => {
        try {
            setLoading(true);
            const url = (level === 'admin' || level === 'manager')
                ? '/requests'
                : `/requests?email=${email}`;
            const response = await apiClient.get(url);
            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            }
        } catch (error) {
            console.error('Failed to fetch requests:', error);
            message.error('Không thể tải danh sách đơn từ');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequest = async (values: any) => {
        try {
            const [start, end] = values.dates;
            const payload = {
                email: userEmail,
                type: values.type,
                reason: values.reason,
                start_date: start.toISOString(),
                end_date: end.toISOString(),
            };

            const response = await apiClient.post('/requests', payload);
            if (response.ok) {
                message.success('Gửi đơn thành công');
                setIsModalVisible(false);
                form.resetFields();
                fetchRequests(userEmail, permissionLevel);
            } else {
                message.error('Gửi đơn thất bại');
            }
        } catch (error) {
            console.error('Error creating request:', error);
            message.error('Đã xảy ra lỗi khi gửi đơn');
        }
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            const response = await apiClient.patch(`/requests/${id}/status`, {
                status,
                approverEmail: userEmail // Current user is the approver/manager
            });
            if (response.ok) {
                message.success('Cập nhật trạng thái thành công');
                fetchRequests(userEmail, permissionLevel);
            } else {
                message.error('Cập nhật thất bại');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            message.error('Lỗi khi cập nhật trạng thái');
        }
    };

    const columns = [
        {
            title: 'Loại đơn',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => <Text strong>{typeLabels[type] || type}</Text>,
        },
        {
            title: 'Thời gian',
            key: 'duration',
            render: (_: any, record: any) => (
                <Space direction="vertical" size={0}>
                    <Text size="small" type="secondary">
                        {dayjs(record.start_date).format('DD/MM/YYYY HH:mm')}
                    </Text>
                    <Text size="small" type="secondary">
                        đến {dayjs(record.end_date).format('DD/MM/YYYY HH:mm')}
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            key: 'reason',
            ellipsis: true,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const config = statusConfig[status] || { color: 'default', label: status };
                return (
                    <Tag color={config.color} icon={config.icon}>
                        {config.label}
                    </Tag>
                );
            },
        },
        {
            title: 'Người duyệt',
            dataIndex: 'processed_by',
            key: 'processed_by',
            render: (text: string) => text ? <Text type="secondary" italic>{text}</Text> : '-',
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
        },
        ...(permissionLevel === 'admin' || permissionLevel === 'manager' ? [{
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: any) => (
                record.status === 'PENDING' && (
                    <Space>
                        <Button
                            type="primary"
                            size="small"
                            onClick={() => handleUpdateStatus(record.id, 'APPROVED')}
                            className="bg-green-600 hover:bg-green-700 border-none"
                        >
                            Duyệt
                        </Button>
                        <Button
                            danger
                            size="small"
                            onClick={() => handleUpdateStatus(record.id, 'REJECTED')}
                        >
                            Từ chối
                        </Button>
                    </Space>
                )
            ),
        }] : []),
    ];

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Title level={2} className="!mb-1">Quản lý Đơn từ</Title>
                    <Text type="secondary">Quản lý các loại đơn xin nghỉ phép, tăng ca và các yêu cầu khác</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={() => setIsModalVisible(true)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                >
                    Tạo đơn mới
                </Button>
            </div>

            <Row gutter={[16, 16]} className="mb-8">
                <Col xs={24} sm={8}>
                    <Card className="rounded-xl shadow-sm border-gray-100">
                        <Statistic
                            title="Đang chờ duyệt"
                            value={requests.filter((r: any) => r.status === 'PENDING').length}
                            prefix={<ClockCircleOutlined className="text-orange-500" />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="rounded-xl shadow-sm border-gray-100">
                        <Statistic
                            title="Đã được duyệt"
                            value={requests.filter((r: any) => r.status === 'APPROVED').length}
                            prefix={<CheckCircleOutlined className="text-green-500" />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="rounded-xl shadow-sm border-gray-100">
                        <Statistic
                            title="Tổng số đơn"
                            value={requests.length}
                            prefix={<FileTextOutlined className="text-indigo-500" />}
                        />
                    </Card>
                </Col>
            </Row>

            <Card className="rounded-xl shadow-sm border-gray-100 overflow-hidden">
                <Table
                    columns={columns}
                    dataSource={requests}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title="Tạo đơn yêu cầu mới"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={600}
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateRequest}
                    className="mt-4"
                >
                    <Form.Item
                        name="type"
                        label="Loại đơn"
                        rules={[{ required: true, message: 'Vui lòng chọn loại đơn!' }]}
                    >
                        <Select placeholder="Chọn loại đơn muốn nộp">
                            <Select.Option value={RequestType.PAID_LEAVE}>Nghỉ phép có lương</Select.Option>
                            <Select.Option value={RequestType.UNPAID_LEAVE}>Nghỉ phép không lương</Select.Option>
                            <Select.Option value={RequestType.OVERTIME}>Tăng ca</Select.Option>
                            <Select.Option value={RequestType.BUSINESS_TRIP}>Công tác</Select.Option>
                            <Select.Option value={RequestType.ATTENDANCE_ADJUSTMENT}>Điều chỉnh chấm công</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="dates"
                        label="Thời gian"
                        rules={[{ required: true, message: 'Vui lòng chọn thời gian!' }]}
                    >
                        <RangePicker
                            showTime
                            className="w-full"
                            format="DD/MM/YYYY HH:mm"
                            placeholder={['Bắt đầu', 'Kết thúc']}
                        />
                    </Form.Item>

                    <Form.Item
                        name="reason"
                        label="Lý do"
                        rules={[{ required: true, message: 'Vui lòng nhập lý do!' }]}
                    >
                        <TextArea rows={4} placeholder="Nhập lý do chi tiết cho yêu cầu của bạn..." />
                    </Form.Item>

                    <Form.Item className="mb-0 flex justify-end">
                        <Space>
                            <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
                            <Button type="primary" htmlType="submit" className="bg-indigo-600">
                                Gửi yêu cầu
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
