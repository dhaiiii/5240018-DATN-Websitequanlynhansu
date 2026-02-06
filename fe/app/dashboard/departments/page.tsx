'use client';

import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Input,
    Space,
    Tag,
    Modal,
    Form,
    message,
    Popconfirm,
    Typography,
    Card,
    List,
    Avatar
} from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    TeamOutlined,
    EyeOutlined,
    UserOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { apiClient } from '@/lib/api/api-client';
import { isAdmin } from '@/lib/utils/auth.utils';

const { Title, Text } = Typography;

interface Department {
    id: number;
    name: string;
    description: string;
    manager: string;
    employee_count: number;
    phone: string;
    users?: any[];
}

const API_URL = 'http://localhost:3001/api/departments';

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [viewingDepartment, setViewingDepartment] = useState<Department | null>(null);
    const [searchText, setSearchText] = useState('');
    const [form] = Form.useForm();
    const [userIsAdmin, setUserIsAdmin] = useState(false);

    useEffect(() => {
        setUserIsAdmin(isAdmin());
    }, []);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/departments');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setDepartments(data);
        } catch (error) {
            console.error(error);
            message.error('Không thể tải danh sách phòng ban');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleAdd = () => {
        setEditingDepartment(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (record: Department) => {
        setEditingDepartment(record);
        form.setFieldsValue({ ...record });
        setIsModalOpen(true);
    };

    const handleView = async (id: number) => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/departments/${id}`);
            if (!res.ok) throw new Error('Failed to fetch details');
            const data = await res.json();
            setViewingDepartment(data);
            setIsViewOpen(true);
        } catch (error) {
            message.error('Không thể tải chi tiết phòng ban');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const res = await apiClient.delete(`/departments/${id}`);
            if (res.ok) {
                message.success('Xóa phòng ban thành công');
                fetchDepartments();
            } else {
                message.error('Xóa thất bại');
            }
        } catch (error) {
            message.error('Có lỗi xảy ra');
        }
    };

    const onFinish = async (values: any) => {
        try {
            let res;
            if (editingDepartment) {
                res = await apiClient.patch(`/departments/${editingDepartment.id}`, values);
            } else {
                res = await apiClient.post('/departments', values);
            }

            if (res.ok) {
                message.success(editingDepartment ? 'Cập nhật thành công' : 'Thêm mới thành công');
                setIsModalOpen(false);
                fetchDepartments();
            } else {
                message.error('Có lỗi xảy ra khi lưu dữ liệu');
            }
        } catch (error) {
            message.error('Lỗi kết nối server');
        }
    };

    const columns: ColumnsType<Department> = [
        {
            title: 'Tên phòng ban',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <span className="font-semibold">{text}</span>,
        },
        {
            title: 'Trưởng phòng',
            dataIndex: 'manager',
            key: 'manager',
        },
        {
            title: 'Số nhân viên',
            dataIndex: 'employee_count',
            key: 'employee_count',
            render: (count) => <Tag color="blue">{count || 0} nhân viên</Tag>,
        },
        {
            title: 'Điện thoại',
            dataIndex: 'phone',
            key: 'phone',
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record.id)} className="text-green-600" />
                    {userIsAdmin && (
                        <>
                            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} className="text-blue-600" />
                            <Popconfirm
                                title="Xóa phòng ban?"
                                description="Bạn có chắc chắn muốb xóa phòng ban này không?"
                                onConfirm={() => handleDelete(record.id)}
                                okText="Có"
                                cancelText="Không"
                            >
                                <Button type="text" icon={<DeleteOutlined />} danger />
                            </Popconfirm>
                        </>
                    )}
                </Space>
            ),
        },
    ];

    const filteredData = departments.filter(item =>
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.manager?.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div style={{ padding: 24 }}>
            <div className="flex justify-between items-center mb-6">
                <Title level={2} style={{ margin: 0 }}>Quản lý Phòng ban</Title>
                {userIsAdmin && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
                        Thêm phòng ban
                    </Button>
                )}
            </div>

            <Card bordered={false} className="shadow-sm">
                <div className="mb-4">
                    <Input
                        placeholder="Tìm kiếm theo tên phòng, trưởng phòng..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: 300 }}
                        size="large"
                    />
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title="Chi tiết phòng ban"
                open={isViewOpen}
                onCancel={() => setIsViewOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsViewOpen(false)}>Đóng</Button>
                ]}
                width={700}
            >
                {viewingDepartment && (
                    <div className="py-2">
                        <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <Text type="secondary">Tên phòng ban:</Text>
                                <div className="font-bold text-lg">{viewingDepartment.name}</div>
                            </div>
                            <div>
                                <Text type="secondary">Trưởng phòng:</Text>
                                <div className="font-bold text-lg">{viewingDepartment.manager || 'N/A'}</div>
                            </div>
                            <div>
                                <Text type="secondary">Số điện thoại:</Text>
                                <div>{viewingDepartment.phone || 'N/A'}</div>
                            </div>
                            <div>
                                <Text type="secondary">Số nhân viên:</Text>
                                <div><Tag color="blue">{(viewingDepartment.users?.length || viewingDepartment.employee_count || 0)} người</Tag></div>
                            </div>
                            <div className="col-span-2">
                                <Text type="secondary">Mô tả:</Text>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{viewingDepartment.description || 'Không có mô tả'}</div>
                            </div>
                        </div>

                        <Title level={5}><TeamOutlined style={{ marginRight: 8 }} />Danh sách nhân viên</Title>
                        <List
                            itemLayout="horizontal"
                            dataSource={viewingDepartment.users || []}
                            locale={{ emptyText: 'Chưa có nhân viên nào đang làm việc tại phòng ban này' }}
                            renderItem={(user: any) => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<Avatar src={user.avatar} icon={<UserOutlined />} />}
                                        title={<Text strong>{user.first_name || ''} {user.last_name || ''}</Text>}
                                        description={
                                            <Space split={<span className="text-gray-300">|</span>}>
                                                <Text type="secondary">{user.email}</Text>
                                                <Tag>{user.role || 'Nhân viên'}</Tag>
                                            </Space>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </div>
                )}
            </Modal>

            <Modal
                title={editingDepartment ? "Cập nhật phòng ban" : "Thêm phòng ban mới"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    className="mt-4"
                >
                    <Form.Item
                        name="name"
                        label="Tên phòng ban"
                        rules={[{ required: true, message: 'Vui lòng nhập tên phòng ban' }]}
                    >
                        <Input placeholder="VD: Phòng IT" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Mô tả"
                    >
                        <Input.TextArea rows={3} placeholder="Mô tả nhiệm vụ của phòng ban" />
                    </Form.Item>

                    <Form.Item
                        name="manager"
                        label="Trưởng phòng"
                    >
                        <Input placeholder="Nguyễn Văn A" />
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        label="Số điện thoại"
                    >
                        <Input placeholder="02838123456" />
                    </Form.Item>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            {editingDepartment ? 'Cập nhật' : 'Lưu'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
