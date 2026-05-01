'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/api-client';
import { Modal, Form, Input, Select, message, Button, Space, Descriptions, Tag, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { getPermissionLevel } from '@/lib/utils/auth.utils';
import { useRouter } from 'next/navigation';

const { Text } = Typography;

interface Department {
    id: number;
    name: string;
}

interface RoleItem {
    id: number;
    role_name: string;
    permission_level: string;
}

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
    role: string;
    phone?: string;
    address?: string;
    gender?: string;
    birth_date?: string;
    department?: Department;
    role_item?: RoleItem;
}

export default function AccountsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [viewingUser, setViewingUser] = useState<User | null>(null);

    const [departments, setDepartments] = useState<Department[]>([]);
    const [roles, setRoles] = useState<RoleItem[]>([]);

    const [form] = Form.useForm();
    const [createForm] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

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

    const fetchDeptsAndRoles = async () => {
        try {
            const [deptRes, roleRes] = await Promise.all([
                apiClient.get('/departments'),
                apiClient.get('/roles')
            ]);
            if (deptRes.ok) setDepartments(await deptRes.json());
            if (roleRes.ok) setRoles(await roleRes.json());
        } catch (error) {
            console.error('Failed to fetch depts/roles:', error);
        }
    };

    useEffect(() => {
        const level = getPermissionLevel();
        if (level !== 'admin' && level !== 'manager') {
            message.error('Bạn không có quyền truy cập trang này');
            router.push('/dashboard');
            return;
        }
        fetchUsers();
        fetchDeptsAndRoles();
    }, [router]);

    const handleEdit = (user: User) => {
        setEditingUser(user);
        form.setFieldsValue({
            full_name: `${user.first_name} ${user.last_name}`,
            role: user.role,
            departmentId: user.department?.id,
            roleId: user.role_item?.id,
            is_active: user.is_active
        });
        setIsEditModalOpen(true);
    };

    const handleView = (user: User) => {
        setViewingUser(user);
        setIsViewModalOpen(true);
    };

    const handleDelete = (user: User) => {
        Modal.confirm({
            title: 'Xác nhận xóa tài khoản',
            icon: <ExclamationCircleOutlined />,
            content: `Bạn có chắc chắn muốn xóa tài khoản "${user.first_name} ${user.last_name}"? Hành động này không thể hoàn tác.`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    const response = await apiClient.delete(`/users/${user.id}`);
                    if (response.ok) {
                        message.success('Đã xóa tài khoản thành công');
                        fetchUsers();
                    } else {
                        const errorData = await response.json().catch(() => ({}));
                        message.error(errorData.message || 'Xóa tài khoản thất bại');
                    }
                } catch (error) {
                    message.error('Lỗi khi xóa tài khoản');
                }
            },
        });
    };

    const handleCreate = async (values: any) => {
        setSubmitting(true);

        const nameParts = values.full_name.trim().split(' ');
        const last_name = nameParts.pop() || '';
        const first_name = nameParts.join(' ') || '';

        try {
            const response = await apiClient.post('/users', {
                first_name,
                last_name,
                email: values.email,
                password: values.password || undefined,
                role: 'user', // Default permission role
                departmentId: values.departmentId,
                roleId: values.roleId,
                is_active: true
            });

            if (response.ok) {
                message.success('Thêm tài khoản thành công');
                setIsCreateModalOpen(false);
                createForm.resetFields();
                fetchUsers();
            } else {
                if (response.status === 409) {
                    message.error('Đã tồn tại Email');
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    message.error(errorData.message || 'Thêm tài khoản thất bại');
                }
            }

        } catch (error) {
            message.error('Lỗi khi thêm tài khoản');
        } finally {
            setSubmitting(false);
        }
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
                departmentId: values.departmentId,
                roleId: values.roleId,
                is_active: values.is_active
            });

            if (response.ok) {
                message.success('Cập nhật tài khoản thành công');
                setIsEditModalOpen(false);
                fetchUsers();
            } else {
                const errorData = await response.json().catch(() => ({}));
                message.error(errorData.message || 'Cập nhật thất bại');
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
                        const errorData = await response.json().catch(() => ({}));
                        const errMsg = Array.isArray(errorData.message)
                            ? errorData.message.join(', ')
                            : errorData.message || `Lỗi ${response.status}`;
                        console.error('Reset password error:', errorData);
                        message.error(`Đặt lại mật khẩu thất bại: ${errMsg}`);
                    }
                } catch (error) {
                    console.error('Reset password exception:', error);
                    message.error('Lỗi khi đặt lại mật khẩu');
                }
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Tài khoản</h1>
                <button
                    onClick={() => {
                        createForm.resetFields();
                        setIsCreateModalOpen(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
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
                                            <div className="flex flex-col">
                                                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                                                    {user.role === 'admin' ? 'Quản trị viên' :
                                                        user.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
                                                </span>
                                                {user.role_item && (
                                                    <span className="text-xs text-gray-500">
                                                        ({user.role_item.role_name})
                                                    </span>
                                                )}
                                            </div>
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
                                            <Space size="middle">
                                                <Button
                                                    type="text"
                                                    icon={<EyeOutlined />}
                                                    onClick={() => handleView(user)}
                                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                                />
                                                {!(getPermissionLevel() === 'manager' && user.role === 'admin') && (
                                                    <>
                                                        <Button
                                                            type="text"
                                                            icon={<EditOutlined />}
                                                            onClick={() => handleEdit(user)}
                                                            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                                                        />
                                                        <Button
                                                            type="text"
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                            onClick={() => handleDelete(user)}
                                                        />
                                                    </>
                                                )}
                                            </Space>
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
                        <Select placeholder="Chọn quyền hệ thống">
                            {getPermissionLevel() === 'admin' && (
                                <Select.Option value="admin">Quản trị viên</Select.Option>
                            )}
                            <Select.Option value="manager">Quản lý</Select.Option>
                            <Select.Option value="user">Nhân viên</Select.Option>
                        </Select>
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="departmentId"
                            label="Phòng ban"
                        >
                            <Select placeholder="Chọn phòng ban" allowClear>
                                {departments.map(d => (
                                    <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="roleId"
                            label="Chức danh"
                        >
                            <Select placeholder="Chọn chức danh" allowClear>
                                {roles.map(r => (
                                    <Select.Option key={r.id} value={r.id}>{r.role_name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="is_active"
                        label="Trạng thái tài khoản"
                    >
                        <Select>
                            <Select.Option value={true}>Hoạt động</Select.Option>
                            <Select.Option value={false}>Bị khóa</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item label="Mật khẩu">
                        <Button
                            danger
                            block
                            onClick={handleResetPassword}
                            style={{
                                backgroundColor: '#fff2f0',
                                borderStyle: 'dashed',
                                borderColor: '#ffccc7',
                                color: '#ff4d4f'
                            }}
                        >
                            Đặt lại mật khẩu mặc định (123456)
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

            <Modal
                title="Chi tiết tài khoản"
                open={isViewModalOpen}
                onCancel={() => setIsViewModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsViewModalOpen(false)}>
                        Đóng
                    </Button>
                ]}
                width={600}
            >
                {viewingUser && (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl font-bold">
                                {viewingUser.first_name[0]}{viewingUser.last_name[0]}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">{viewingUser.first_name} {viewingUser.last_name}</h3>
                                <div className="flex space-x-2 mt-1">
                                    <Tag color={viewingUser.role === 'admin' ? 'red' : viewingUser.role === 'manager' ? 'orange' : 'blue'}>
                                        {viewingUser.role === 'admin' ? 'Quản trị viên' : viewingUser.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
                                    </Tag>
                                    <Tag color={viewingUser.is_active ? 'green' : 'gray'}>
                                        {viewingUser.is_active ? 'Đang hoạt động' : 'Đã khóa'}
                                    </Tag>
                                </div>
                            </div>
                        </div>

                        <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label="Email">{viewingUser.email}</Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại">{viewingUser.phone || 'Chưa cập nhật'}</Descriptions.Item>
                            <Descriptions.Item label="Địa chỉ">{viewingUser.address || 'Chưa cập nhật'}</Descriptions.Item>
                            <Descriptions.Item label="Giới tính">{viewingUser.gender || 'Chưa cập nhật'}</Descriptions.Item>
                            <Descriptions.Item label="Ngày sinh">{viewingUser.birth_date ? new Date(viewingUser.birth_date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</Descriptions.Item>
                            <Descriptions.Item label="Phòng ban">{viewingUser.department?.name || <Text type="secondary">N/A</Text>}</Descriptions.Item>
                            <Descriptions.Item label="Chức danh">{viewingUser.role_item?.role_name || <Text type="secondary">N/A</Text>}</Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
            </Modal>

            <Modal
                title="Thêm tài khoản mới"
                open={isCreateModalOpen}
                onCancel={() => {
                    createForm.resetFields();
                    setIsCreateModalOpen(false);
                }}
                footer={null}
                destroyOnClose
            >
                <Form
                    form={createForm}
                    layout="vertical"
                    onFinish={handleCreate}
                    className="mt-4"
                    autoComplete="off"
                >
                    <Form.Item
                        name="full_name"
                        label="Họ và tên"
                        rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                    >
                        <Input placeholder="Nguyễn Văn A" autoComplete="off" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' }
                        ]}
                    >
                        <Input placeholder="email@company.com" autoComplete="off" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Mật khẩu"
                        extra="Mặc định là 123456 nếu bỏ trống"
                    >
                        <Input.Password placeholder="******" autoComplete="new-password" />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="departmentId"
                            label="Phòng ban"
                        >
                            <Select placeholder="Chọn phòng ban" allowClear>
                                {departments.map(d => (
                                    <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="roleId"
                            label="Chức danh"
                        >
                            <Select placeholder="Chọn chức danh" allowClear>
                                {roles.map(r => (
                                    <Select.Option key={r.id} value={r.id}>{r.role_name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item className="mb-0 text-right">
                        <Space>
                            <Button onClick={() => {
                                createForm.resetFields();
                                setIsCreateModalOpen(false);
                            }}>
                                Hủy
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={submitting}
                                className="bg-indigo-600"
                            >
                                Lưu
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div >
    );
}
