'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/api-client';
import { Modal, Form, Input, Select, message, Button, Space } from 'antd';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
    role: string;
}

export default function AccountsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get('/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEdit = (user: User) => {
        setEditingUser(user);
        form.setFieldsValue({
            full_name: `${user.first_name} ${user.last_name}`,
            role: user.role,
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (values: any) => {
        if (!editingUser) return;
        setSubmitting(true);

        const nameParts = values.full_name.trim().split(' ');
        const last_name = nameParts.pop() || '';
        const first_name = nameParts.join(' ') || '';

        try {
            const response = await apiClient.patch(`/users/${editingUser.id}`, {
                first_name,
                last_name,
                role: values.role,
            });

            if (response.ok) {
                message.success('Cập nhật tài khoản thành công');
                setIsEditModalOpen(false);
                fetchUsers();
            } else {
                message.error('Cập nhật thất bại');
            }
        } catch (error) {
            message.error('Lỗi khi cập nhật tài khoản');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = async () => {
        if (!editingUser) return;

        Modal.confirm({
            title: 'Xác nhận đặt lại mật khẩu',
            content: 'Mật khẩu sẽ được đặt lại thành "123456". Bạn có chắc chắn không?',
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    const response = await apiClient.patch(`/users/${editingUser.id}`, {
                        password: '123456',
                    });
                    if (response.ok) {
                        message.success('Đã đặt lại mật khẩu thành 123456');
                    } else {
                        message.error('Đặt lại mật khẩu thất bại');
                    }
                } catch (error) {
                    message.error('Lỗi khi đặt lại mật khẩu');
                }
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Tài khoản</h1>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Thêm tài khoản
                </button>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 p-6">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-zinc-700">
                                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Tên người dùng</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Email</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Vai trò</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Trạng thái</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-500">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-red-500">
                                        {error}
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-500">
                                        Không có dữ liệu
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="border-b border-gray-100 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700/30">
                                        <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                                            {`${user.first_name} ${user.last_name}`}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                                            {user.role === 'admin' ? 'Quản trị viên' :
                                                user.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${user.is_active
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {user.is_active ? 'Hoạt động' : 'Bị khóa'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
                                            >
                                                Chỉnh sửa
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                title="Chỉnh sửa tài khoản"
                open={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdate}
                    className="mt-4"
                >
                    <Form.Item
                        name="full_name"
                        label="Họ và tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="role"
                        label="Vai trò hệ thống"
                        rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
                    >
                        <Select>
                            <Select.Option value="admin">Quản trị viên</Select.Option>
                            <Select.Option value="manager">Quản lý</Select.Option>
                            <Select.Option value="user">Nhân viên</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item label="Mật khẩu">
                        <Button
                            type="dashed"
                            danger
                            block
                            onClick={handleResetPassword}
                        >
                            Đặt lại mật khẩu mặc định
                        </Button>
                    </Form.Item>

                    <Form.Item className="mb-0 text-right">
                        <Space>
                            <Button onClick={() => setIsEditModalOpen(false)}>Hủy</Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={submitting}
                                className="bg-indigo-600"
                            >
                                Lưu thay đổi
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div >
    );
}
