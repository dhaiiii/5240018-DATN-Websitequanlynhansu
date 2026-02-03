'use client';

import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Input,
    Space,
    Avatar,
    Tag,
    Modal,
    Form,
    Select,
    message,
    Popconfirm,
    Typography,
    Card
} from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    UserOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Option } = Select;

interface Department {
    id: number;
    name: string;
}

interface Role {
    id: number;
    role_name: string;
}

interface Employee {
    id: number;
    employeeCode: string;
    fullName: string;
    dateOfBirth: string;
    gender: string;
    email: string;
    phone: string;
    address: string;
    avatar?: string;
    department?: Department;
    role_item?: Role;
    position: string;
    status: string;
    password?: string;
}

const API_URL = 'http://localhost:3001/api/users';
const DEPT_API_URL = 'http://localhost:3001/api/departments';
const ROLE_API_URL = 'http://localhost:3001/api/roles';

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
    const [searchText, setSearchText] = useState('');
    const [form] = Form.useForm();
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, deptsRes, rolesRes] = await Promise.all([
                fetch(API_URL),
                fetch(DEPT_API_URL),
                fetch(ROLE_API_URL)
            ]);

            if (!usersRes.ok || !deptsRes.ok || !rolesRes.ok) throw new Error('Failed to fetch data');

            const [users, depts, rolesList] = await Promise.all([
                usersRes.json(),
                deptsRes.json(),
                rolesRes.json()
            ]);

            const mappedData = users.map((u: any) => ({
                id: u.id,
                employeeCode: `NV${u.id.toString().padStart(3, '0')}`,
                fullName: `${u.first_name} ${u.last_name}`,
                email: u.email,
                position: u.role_item?.role_name || u.role || 'Nhân viên',
                department: u.department,
                role_item: u.role_item,
                status: u.is_active ? 'Đang làm việc' : 'Đã nghỉ',
                phone: u.phone,
                avatar: u.avatar,
                gender: u.gender || 'Nam',
                address: u.address,
            }));

            setEmployees(mappedData);
            setDepartments(depts);
            setRoles(rolesList);
        } catch (error) {
            console.error(error);
            message.error('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = () => {
        setEditingEmployee(null);
        setAvatarPreview(null);
        form.resetFields();
        form.setFieldsValue({
            status: 'Đang làm việc',
            gender: 'Nam',
            password: 'Mac@12345'
        });
        setIsModalOpen(true);
    };

    const handleEdit = (record: any) => {
        setEditingEmployee(record);
        setAvatarPreview(record.avatar || null);
        form.setFieldsValue({
            ...record,
            departmentId: record.department?.id,
            roleId: record.role_item?.id
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (res.ok) {
                message.success('Xóa nhân viên thành công');
                fetchData();
            } else {
                message.error('Xóa thất bại');
            }
        } catch (error) {
            message.error('Có lỗi xảy ra');
        }
    };

    const onFinish = async (values: any) => {
        const payload = {
            first_name: values.fullName?.split(' ').slice(0, -1).join(' ') || 'User',
            last_name: values.fullName?.split(' ').slice(-1).join(' ') || 'Name',
            email: values.email,
            password: values.password || 'Mac@12345',
            phone: values.phone,
            address: values.address,
            avatar: avatarPreview,
            gender: values.gender,
            is_active: values.status === 'Đang làm việc',
            departmentId: values.departmentId,
            roleId: values.roleId,
        };

        try {
            let res;
            if (editingEmployee) {
                res = await fetch(`${API_URL}/${editingEmployee.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } else {
                res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }

            if (res.ok) {
                message.success(editingEmployee ? 'Cập nhật thành công' : 'Thêm mới thành công');
                setIsModalOpen(false);
                fetchData();
            } else {
                message.error('Có lỗi xảy ra khi lưu dữ liệu');
            }
        } catch (error) {
            message.error('Lỗi kết nối server');
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const columns: ColumnsType<Employee> = [
        {
            title: 'Mã NV',
            dataIndex: 'employeeCode',
            key: 'employeeCode',
        },
        {
            title: 'Họ tên',
            key: 'fullName',
            render: (_, record) => (
                <Space>
                    <Avatar src={record.avatar} icon={<UserOutlined />} />
                    {record.fullName}
                </Space>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Phòng ban',
            key: 'department',
            render: (_, record) => record.department?.name || 'Chưa phân loại',
        },
        {
            title: 'Chức vụ',
            key: 'position',
            render: (_, record) => record.role_item?.role_name || record.position || 'Chưa xác định',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'Đang làm việc' ? 'success' : 'error'}>
                    {status}
                </Tag>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} className="text-blue-600" />
                    <Popconfirm
                        title="Xóa nhân viên?"
                        description="Bạn có chắc chắn muốn xóa nhân viên này không?"
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

    const filteredData = employees.filter(item =>
        item.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
        item.employeeCode.toLowerCase().includes(searchText.toLowerCase()) ||
        item.email.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <div style={{ padding: 24 }}>
            <div className="flex justify-between items-center mb-6">
                <Title level={2} style={{ margin: 0 }}>Quản lý Nhân viên</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} size="large">
                    Thêm nhân viên
                </Button>
            </div>

            <Card bordered={false} className="shadow-sm">
                <div className="mb-4">
                    <Input
                        placeholder="Tìm kiếm theo tên, mã NV, email..."
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
                title={editingEmployee ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={800}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ gender: 'Nam', status: 'Đang làm việc' }}
                    className="mt-4"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 flex justify-center mb-4">
                            <div className="text-center">
                                <Avatar size={100} src={avatarPreview} icon={<UserOutlined />} className="mb-2" />
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="avatar-upload"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                    <label htmlFor="avatar-upload">
                                        <Button size="small" icon={<EditOutlined />}>Chọn ảnh</Button>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <Form.Item
                            name="fullName"
                            label="Họ và tên"
                            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                        >
                            <Input placeholder="Nguyễn Văn A" />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                                { required: true, message: 'Vui lòng nhập email' },
                                { type: 'email', message: 'Email không hợp lệ' }
                            ]}
                        >
                            <Input placeholder="email@company.com" />
                        </Form.Item>

                        <Form.Item
                            name="phone"
                            label="Số điện thoại"
                        >
                            <Input placeholder="0912345678" />
                        </Form.Item>

                        <Form.Item name="gender" label="Giới tính">
                            <Select>
                                <Option value="Nam">Nam</Option>
                                <Option value="Nữ">Nữ</Option>
                                <Option value="Khác">Khác</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item name="departmentId" label="Phòng ban">
                            <Select placeholder="Chọn phòng ban">
                                {departments.map(dept => (
                                    <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item name="roleId" label="Chức vụ" rules={[{ required: true, message: 'Vui lòng chọn chức vụ' }]}>
                            <Select placeholder="Chọn chức vụ">
                                {roles.map(role => (
                                    <Option key={role.id} value={role.id}>{role.role_name}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item name="status" label="Trạng thái">
                            <Select>
                                <Option value="Đang làm việc">Đang làm việc</Option>
                                <Option value="Đã nghỉ">Đã nghỉ</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="address"
                            label="Địa chỉ"
                            className="md:col-span-2"
                        >
                            <Input.TextArea rows={2} />
                        </Form.Item>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            {editingEmployee ? 'Cập nhật' : 'Lưu'}
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
