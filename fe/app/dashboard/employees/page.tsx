'use client';

import React, { useState, useEffect } from 'react';
import {
    Table, Button, Input, Space, Avatar, Tag, Modal, Form, Select,
    message, Popconfirm, Typography, Card, DatePicker, Tabs, List, Upload
} from 'antd';
import {
    PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined,
    UserOutlined, DownloadOutlined, UploadOutlined, FileTextOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { apiClient } from '@/lib/api/api-client';
import { getAvatarUrl } from '@/lib/utils/image.utils';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface Department { id: number; name: string; }
interface Role { id: number; role_name: string; }
interface DocumentInfo { id: number; filename: string; original_name: string; type: string; uploaded_at: string; }
interface HistoryInfo { id: number; action: string; created_at: string; admin?: { first_name: string, last_name: string }; changes: any; }

interface Employee {
    id: number; employeeCode: string; fullName: string; dateOfBirth: string; gender: string;
    email: string; phone: string; birth_date?: string; address: string; avatar?: string;
    department?: Department; role_item?: Role; position: string; status: string;
    password?: string; citizen_id?: string; join_date?: string; contract_type?: string;
}

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

    // Admin Management states
    const [documents, setDocuments] = useState<DocumentInfo[]>([]);
    const [histories, setHistories] = useState<HistoryInfo[]>([]);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [docName, setDocName] = useState('');
    const [docContent, setDocContent] = useState('');

    // Filters
    const [filterDept, setFilterDept] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, deptsRes, rolesRes] = await Promise.all([
                apiClient.get('/users'),
                apiClient.get('/departments'),
                apiClient.get('/roles')
            ]);
            if (!usersRes.ok || !deptsRes.ok || !rolesRes.ok) throw new Error('Failed to fetch data');
            const [users, depts, rolesList] = await Promise.all([usersRes.json(), deptsRes.json(), rolesRes.json()]);

            const mappedData = users.map((u: any) => ({
                id: u.id,
                employeeCode: `NV${u.id.toString().padStart(3, '0')}`,
                fullName: `${u.first_name} ${u.last_name}`,
                email: u.email,
                position: u.role_item?.role_name || u.role || 'Nhân viên',
                department: u.department,
                role_item: u.role_item,
                status: u.is_active ? 'Đang làm việc' : 'Đã nghỉ việc',
                phone: u.phone,
                birth_date: u.birth_date,
                avatar: u.avatar,
                gender: u.gender || 'Nam',
                address: u.address,
                citizen_id: u.citizen_id,
                join_date: u.join_date,
                contract_type: u.contract_type,
            }));
            setEmployees(mappedData);
            setDepartments(depts);
            setRoles(rolesList);
        } catch (error) {
            message.error('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Load additional info when editing an employee
    useEffect(() => {
        if (editingEmployee) {
            const loadExtra = async () => {
                try {
                    const [docRes, histRes] = await Promise.all([
                        apiClient.get(`/users/${editingEmployee.id}/documents`),
                        apiClient.get(`/users/${editingEmployee.id}/history`)
                    ]);
                    if (docRes.ok) setDocuments(await docRes.json());
                    if (histRes.ok) setHistories(await histRes.json());
                } catch (e) { console.error('Failed to load extra profile data'); }
            };
            loadExtra();
        } else {
            setDocuments([]);
            setHistories([]);
        }
    }, [editingEmployee]);

    const handleAdd = () => {
        setEditingEmployee(null);
        setAvatarPreview(null);
        form.resetFields();
        form.setFieldsValue({ status: 'Đang làm việc', gender: 'Nam', password: 'Mac@12345' });
        setIsModalOpen(true);
    };

    const handleEdit = (record: any) => {
        setEditingEmployee(record);
        setAvatarPreview(record.avatar || null);
        form.setFieldsValue({
            ...record,
            departmentId: record.department?.id,
            roleId: record.role_item?.id,
            birth_date: record.birth_date ? dayjs(record.birth_date) : null,
            join_date: record.join_date ? dayjs(record.join_date) : null,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            const res = await apiClient.delete(`/users/${id}`);
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
        const nameParts = values.fullName ? values.fullName.trim().split(' ') : [];
        const lastName = nameParts.length > 0 ? nameParts[nameParts.length - 1] : 'Name';
        const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : ' ';

        const payload: any = {
            first_name: firstName,
            last_name: lastName,
            email: values.email,
            phone: values.phone,
            address: values.address,
            avatar: avatarPreview,
            gender: values.gender,
            is_active: values.status === 'Đang làm việc',
            departmentId: values.departmentId,
            roleId: values.roleId,
            birth_date: values.birth_date ? values.birth_date.format('YYYY-MM-DD') : null,
            join_date: values.join_date ? values.join_date.format('YYYY-MM-DD') : null,
            citizen_id: values.citizen_id,
            contract_type: values.contract_type
        };

        if (!editingEmployee) {
            payload.password = 'Mac@12345';
        }

        try {
            let res;
            if (editingEmployee) {
                res = await apiClient.patch(`/users/${editingEmployee.id}`, payload);
            } else {
                res = await apiClient.post('/users', payload);
            }

            if (res.ok) {
                message.success(editingEmployee ? 'Cập nhật thành công' : 'Thêm mới thành công');
                setIsModalOpen(false);
                fetchData();
            } else {
                const data = await res.json();
                message.error(data.message || 'Có lỗi xảy ra khi lưu dữ liệu');
            }
        } catch (error) {
            message.error('Lỗi kết nối server');
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setAvatarPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleExportExcel = async () => {
        try {
            const res = await apiClient.get('/users/export/excel');
            if (!res.ok) throw new Error('Fetch failed');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'DanhSachNhanSu.xlsx';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            message.error("Lỗi khi xuất file Excel");
        }
    };

    // Document Management in Admin
    const handleAddTextDocument = async () => {
        if (!docName || !docContent) {
            message.warning('Vui lòng nhập Tên giấy tờ và Nội dung/Số hiệu');
            return;
        }
        setUploadingDoc(true);
        try {
            const res = await apiClient.post(`/users/${editingEmployee.id}/documents/text`, {
                document_name: docName,
                document_content: docContent,
                type: 'Khác'
            });
            if (res.ok) {
                message.success('Thêm giấy tờ thành công');
                setDocName('');
                setDocContent('');
                const docsRes = await apiClient.get(`/users/${editingEmployee.id}/documents`);
                if (docsRes.ok) setDocuments(await docsRes.json());
            } else {
                message.error('Lỗi khi thêm giấy tờ');
            }
        } catch (err) {
            message.error('Lỗi kết nối server');
        } finally {
            setUploadingDoc(false);
        }
    };

    const handleDeleteDocument = async (docId: number) => {
        try {
            const res = await apiClient.delete(`/users/${editingEmployee.id}/documents/${docId}`);
            if (res.ok) {
                message.success('Đã xóa tài liệu');
                setDocuments(docs => docs.filter(d => d.id !== docId));
            }
        } catch (e) {
            message.error('Lỗi khi xóa tài liệu');
        }
    };


    const columns: ColumnsType<Employee> = [
        { title: 'Mã NV', dataIndex: 'employeeCode', key: 'employeeCode' },
        {
            title: 'Họ tên', key: 'fullName',
            render: (_, record) => (
                <Space>
                    <Avatar src={getAvatarUrl(record.avatar)} icon={<UserOutlined />} />
                    {record.fullName}
                </Space>
            )
        },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        {
            title: 'Ngày sinh', dataIndex: 'birth_date', key: 'birth_date',
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : 'Chưa đặt',
        },
        {
            title: 'Phòng ban', key: 'department',
            render: (_, record) => record.department?.name || '...',
        },
        {
            title: 'Chức vụ', key: 'position',
            render: (_, record) => record.role_item?.role_name || record.position || '...',
        },
        {
            title: 'Trạng thái', dataIndex: 'status', key: 'status',
            render: (status) => (
                <Tag color={status === 'Đang làm việc' ? 'success' : 'error'}>{status}</Tag>
            ),
        },
        {
            title: 'Hành động', key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} className="text-blue-600" />
                    <Popconfirm
                        title="Xóa nhân viên?"
                        description="Bạn có chắc chắn muốn xóa nhân viên này khỏi hệ thống?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Có" cancelText="Không"
                    >
                        <Button type="text" icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const filteredData = employees.filter(item => {
        const matchSearch = item.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
            item.employeeCode.toLowerCase().includes(searchText.toLowerCase()) ||
            item.email.toLowerCase().includes(searchText.toLowerCase());
        const matchDept = filterDept ? item.department?.name === filterDept : true;
        const matchStatus = filterStatus ? item.status === filterStatus : true;
        return matchSearch && matchDept && matchStatus;
    });

    // Form elements for Modal (reused)
    const generalInfoForm = (
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ gender: 'Nam', status: 'Đang làm việc' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex justify-center mb-4">
                    <div className="text-center">
                        <Avatar size={100} src={avatarPreview} icon={<UserOutlined />} className="mb-2" />
                        <div>
                            <input type="file" accept="image/*" id="avatar-upload" style={{ display: 'none' }} onChange={handleAvatarChange} />
                            <Button size="small" icon={<EditOutlined />} onClick={() => document.getElementById('avatar-upload')?.click()}>Đổi ảnh đại diện</Button>
                        </div>
                    </div>
                </div>

                <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
                    <Input placeholder="Nguyễn Văn A" />
                </Form.Item>
                <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Bắt buộc' }, { type: 'email', message: 'Email lỗi' }]}>
                    <Input placeholder="email@company.com" />
                </Form.Item>
                <Form.Item name="phone" label="Số điện thoại"><Input placeholder="0912..." /></Form.Item>
                <Form.Item name="citizen_id" label="Căn cước công dân"><Input placeholder="00120..." /></Form.Item>
                <Form.Item name="gender" label="Giới tính">
                    <Select><Option value="Nam">Nam</Option><Option value="Nữ">Nữ</Option><Option value="Khác">Khác</Option></Select>
                </Form.Item>
                <Form.Item name="birth_date" label="Ngày sinh"><DatePicker className="w-full" format="DD/MM/YYYY" /></Form.Item>
                <Form.Item name="departmentId" label="Phòng ban">
                    <Select placeholder="Chọn phòng ban">
                        {departments.map(dept => (<Option key={dept.id} value={dept.id}>{dept.name}</Option>))}
                    </Select>
                </Form.Item>
                <Form.Item name="roleId" label="Chức vụ">
                    <Select placeholder="Chọn chức vụ">
                        {roles.map(role => (<Option key={role.id} value={role.id}>{role.role_name}</Option>))}
                    </Select>
                </Form.Item>
                <Form.Item name="join_date" label="Ngày vào làm"><DatePicker className="w-full" format="DD/MM/YYYY" /></Form.Item>
                <Form.Item name="contract_type" label="Loại hợp đồng">
                    <Select placeholder="Chọn loại hợp đồng">
                        <Option value="Thử việc">Thử việc</Option>
                        <Option value="Chính thức">Chính thức</Option>
                        <Option value="Thời vụ">Thời vụ</Option>
                        <Option value="Thực tập">Thực tập</Option>
                    </Select>
                </Form.Item>
                <Form.Item name="status" label="Trạng thái làm việc">
                    <Select><Option value="Đang làm việc">Đang làm việc</Option><Option value="Đã nghỉ việc">Đã nghỉ việc</Option></Select>
                </Form.Item>

                <Form.Item name="address" label="Địa chỉ" className="md:col-span-2"><Input.TextArea rows={2} /></Form.Item>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={loading}>{editingEmployee ? 'Cập nhật' : 'Thêm mới'}</Button>
            </div>
        </Form>
    );

    const documentTab = (
        <div className="p-2">
            <div className="mb-6 p-4 bg-gray-50 border rounded-lg">
                <Text strong className="mb-2 block">Thêm giấy tờ mới (Bằng cấp, CCCD, ...)</Text>
                <div className="flex gap-2">
                    <Input placeholder="Tên giấy tờ (VD: Bằng Đại học)" value={docName} onChange={e => setDocName(e.target.value)} className="w-1/3" />
                    <Input placeholder="Nội dung / Số hiệu (VD: Xếp loại Giỏi - 2026)" value={docContent} onChange={e => setDocContent(e.target.value)} className="w-2/3" />
                    <Button type="primary" icon={<PlusOutlined />} loading={uploadingDoc} onClick={handleAddTextDocument}>Thêm</Button>
                </div>
            </div>
            <List
                grid={{ gutter: 16, column: 2 }}
                dataSource={documents}
                renderItem={item => (
                    <List.Item>
                        <Card size="small" actions={[
                            <Popconfirm title="Xóa tài liệu này?" onConfirm={() => handleDeleteDocument(item.id)} key="del">
                                <DeleteOutlined className="text-red-500" />
                            </Popconfirm>,
                            (item.filename && item.filename.startsWith('doc-')) ?
                                <a href={`http://localhost:3001/uploads/documents/${item.filename}`} target="_blank" rel="noreferrer" key="download">
                                    <DownloadOutlined />
                                </a> : null
                        ].filter(Boolean)}>
                            <Card.Meta
                                avatar={<FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                                title={<div className="truncate font-semibold" title={item.original_name}>{item.original_name}</div>}
                                description={
                                    <div>
                                        <div className="text-black mb-1">{item.filename && item.filename.startsWith('doc-') ? 'File đính kèm' : item.filename}</div>
                                        <div className="text-xs text-gray-400">Ngày thêm: {dayjs(item.uploaded_at).format('DD/MM/YYYY')}</div>
                                    </div>
                                }
                            />
                        </Card>
                    </List.Item>
                )}
            />
        </div>
    );

    const flattenedEmployeeHistories: any[] = [];
    histories.forEach(item => {
        if (item.changes && Object.keys(item.changes).length > 0) {
            Object.entries(item.changes).forEach(([key, value]: [string, any]) => {
                const fieldNames: Record<string, string> = {
                    first_name: 'Tên', last_name: 'Họ', email: 'Email', phone: 'Số điện thoại',
                    address: 'Địa chỉ thường trú', avatar: 'Ảnh đại diện', gender: 'Giới tính',
                    is_active: 'Trạng thái HĐ', departmentId: 'Phòng ban', roleId: 'Chức vụ',
                    birth_date: 'Ngày sinh', join_date: 'Ngày vào làm', citizen_id: 'Số CMND/CCCD',
                    contract_type: 'Loại hợp đồng', password: 'Mật khẩu'
                };
                const formatValue = (val: any) => {
                    if (val === null || val === undefined || val === '') return '(trống)';
                    if (typeof val === 'boolean') return val ? 'Có' : 'Không';
                    if (key === 'avatar') return '(ảnh)';
                    if (key === 'password') return '***';
                    return String(val);
                };

                flattenedEmployeeHistories.push({
                    key: `${item.id}-${key}`,
                    date: item.created_at,
                    field: fieldNames[key] || key,
                    oldValue: formatValue(value.old),
                    newValue: formatValue(value.new),
                    admin: item.admin ? `${item.admin.first_name} ${item.admin.last_name}` : 'Hệ thống',
                    action: item.action
                });
            });
        } else {
            flattenedEmployeeHistories.push({
                key: `${item.id}-action`,
                date: item.created_at,
                field: 'Hành động chung',
                oldValue: '-',
                newValue: item.action,
                admin: item.admin ? `${item.admin.first_name} ${item.admin.last_name}` : 'Hệ thống',
                action: item.action
            });
        }
    });

    const historyColumns: ColumnsType<any> = [
        {
            title: 'Ngày giờ',
            dataIndex: 'date',
            key: 'date',
            render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Trường thay đổi',
            dataIndex: 'field',
            key: 'field',
            render: (text) => <span className="font-medium">{text}</span>
        },
        {
            title: 'Giá trị cũ',
            dataIndex: 'oldValue',
            key: 'oldValue',
            render: (text) => <span style={{ textDecoration: 'line-through', color: '#888' }} className="truncate block max-w-[150px]" title={text}>{text}</span>
        },
        {
            title: 'Giá trị mới',
            dataIndex: 'newValue',
            key: 'newValue',
            render: (text) => <span className="truncate block max-w-[150px]" title={text}>{text}</span>
        },
        {
            title: 'Người thực hiện',
            dataIndex: 'admin',
            key: 'admin',
        }
    ];

    const historyTab = (
        <div className="p-2">
            <Table
                columns={historyColumns}
                dataSource={flattenedEmployeeHistories}
                pagination={{ pageSize: 10 }}
                size="small"
                bordered
                scroll={{ x: 'max-content' }}
            />
        </div>
    );

    return (
        <div style={{ padding: 24 }}>
            <div className="flex justify-between items-center mb-6">
                <Title level={2} style={{ margin: 0 }}>Quản lý Nhân sự</Title>
                <Space>
                    <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>Xuất Excel</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Thêm nhân viên</Button>
                </Space>
            </div>

            <Card bordered={false} className="shadow-sm">
                <div className="flex flex-wrap gap-4 mb-6">
                    <Input placeholder="Tìm kiếm tên, hoặc mã nhân viên..." prefix={<SearchOutlined />}
                        value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 300 }} />

                    <Select allowClear placeholder="Lọc theo phòng ban" style={{ width: 200 }} onChange={setFilterDept}>
                        {departments.map(d => <Option key={d.id} value={d.name}>{d.name}</Option>)}
                    </Select>

                    <Select allowClear placeholder="Trạng thái" style={{ width: 150 }} onChange={setFilterStatus}>
                        <Option value="Đang làm việc">Đang làm việc</Option>
                        <Option value="Đã nghỉ việc">Đã nghỉ việc</Option>
                    </Select>
                </div>

                <Table columns={columns} dataSource={filteredData} rowKey="id" loading={loading} pagination={{ pageSize: 15 }} />
            </Card>

            <Modal
                title={editingEmployee ? `Cập nhật hồ sơ: ${editingEmployee.fullName}` : "Thêm nhân viên mới"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={850}
                destroyOnClose
            >
                {editingEmployee ? (
                    <Tabs
                        defaultActiveKey="1"
                        items={[
                            { key: '1', label: 'Thông tin chung', children: generalInfoForm },
                            { key: '2', label: 'Tài liệu hành chính', children: documentTab },
                            { key: '3', label: 'Lịch sử cập nhật', children: historyTab }
                        ]}
                        className="mt-4"
                    />
                ) : (
                    <div className="mt-4">{generalInfoForm}</div>
                )}
            </Modal>
        </div>
    );
}

