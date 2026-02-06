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
    UserOutlined,
    IdcardOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { apiClient } from '@/lib/api/api-client';

const { Title, Text } = Typography;

interface Role {
    id: number;
    role_name: string;
    description: string;
    employee_count: number;
    users?: any[];
}

const API_URL = 'http://localhost:3001/api/roles';

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [viewingRole, setViewingRole] = useState<Role | null>(null);
    const [searchText, setSearchText] = useState('');
    const [form] = Form.useForm();

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/roles');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setRoles(data);
        } catch (error) {
            console.error(error);
            message.error('Không thể tải danh sách chức vụ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleAdd = () => {
        setEditingRole(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (record: Role) => {
        setEditingRole(record);
        form.setFieldsValue({ ...record });
        setIsModalOpen(true);
    };

    const handleView = async (id: number) => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/roles/${id}`);
            if (!res.ok) throw new Error('Failed to fetch details');
            const data = await res.json();
            setViewingRole(data);
            setIsViewOpen(true);
        } catch (error) {
            message.error('Không thể tải chi tiết chức vụ');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const res = await apiClient.delete(`/roles/${id}`);
            if (res.ok) {
                message.success('Xóa chức vụ thành công');
                fetchRoles();
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
            if (editingRole) {
                res = await apiClient.patch(`/roles/${editingRole.id}`, values);
            } else {
                res = await apiClient.post('/roles', values);
            }

            if (res.ok) {
                message.success(editingRole ? 'Cập nhật thành công' : 'Thêm mới thành công');
                setIsModalOpen(false);
                fetchRoles();
            } else {
                const err = await res.json();
                message.error(err.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            message.error('Lỗi kết nối server');
        }
    };

    const columns: ColumnsType<Role> = [
        {
            title: 'Tên chức vụ',
            dataIndex: 'role_name',
            key: 'role_name',
            render: (text) => (
                <Space>
                    <IdcardOutlined className="text-blue-500" />
                    <span className="font-semibold">{text}</span>
                </Space>
            ),
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Số nhân viên',
            dataIndex: 'employee_count',
            key: 'employee_count',
            render: (count) => <Tag color="cyan">{count || 0} nhân viên</Tag>,
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record.id)} className="text-green-600" />
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} className="text-blue-600" />
                    <Popconfirm
                        title="Xóa chức vụ?"
                        description="Bạn có chắc chắn muốn xóa chức vụ này không?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button type="text" icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const filteredData = roles.filter(item =>
        item.role_name.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div style={{ padding: 24 }}>
            <div className="flex justify-between items-center mb-6">
                <Title level={2} style={{ margin: 0 }}>Quản lý Chức vụ</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
                    Thêm chức vụ
                </Button>
            </div>

            <Card bordered={false} className="shadow-sm">
                <div className="mb-4">
                    <Input
                        placeholder="Tìm kiếm theo tên chức vụ..."
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
                title="Chi tiết chức vụ"
                open={isViewOpen}
                onCancel={() => setIsViewOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsViewOpen(false)}>Đóng</Button>
                ]}
                width={700}
            >
                {viewingRole && (
                    <div className="py-2">
                        <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                            <div className="col-span-2">
                                <Text type="secondary">Tên chức vụ:</Text>
                                <div className="font-bold text-lg">{viewingRole.role_name}</div>
                            </div>
                            <div>
                                <Text type="secondary">Số nhân viên:</Text>
                                <div><Tag color="cyan">{viewingRole.employee_count} người</Tag></div>
                            </div>
                            <div className="col-span-2">
                                <Text type="secondary">Mô tả:</Text>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{viewingRole.description || 'Không có mô tả'}</div>
                            </div>
                        </div>

                        <Title level={5}><TeamOutlined style={{ marginRight: 8 }} />Nhân viên giữ chức vụ này</Title>
                        <List
                            itemLayout="horizontal"
                            dataSource={viewingRole.users || []}
                            locale={{ emptyText: 'Chưa có nhân viên nào giữ chức vụ này' }}
                            renderItem={(user: any) => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<Avatar src={user.avatar} icon={<UserOutlined />} />}
                                        title={<Text strong>{user.first_name || ''} {user.last_name || ''}</Text>}
                                        description={
                                            <Space split={<span className="text-gray-300">|</span>}>
                                                <Text type="secondary">{user.email}</Text>
                                                <Text type="secondary">{user.department?.name || 'Không có phòng ban'}</Text>
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
                title={editingRole ? "Cập nhật chức vụ" : "Thêm chức vụ mới"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    className="mt-4"
                >
                    <Form.Item
                        name="role_name"
                        label="Tên chức vụ"
                        rules={[{ required: true, message: 'Vui lòng nhập tên chức vụ' }]}
                    >
                        <Input placeholder="Ví dụ: Trưởng phòng kinh doanh" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Mô tả"
                    >
                        <Input.TextArea rows={4} placeholder="Mô tả chi tiết về chức năng, nhiệm vụ..." />
                    </Form.Item>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
                        <Button type="primary" htmlType="submit">
                            {editingRole ? 'Cập nhật' : 'Lưu'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
