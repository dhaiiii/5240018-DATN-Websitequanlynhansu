'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
    Card, Avatar, Button, message, Skeleton, Modal, Form, Input, Select,
    Row, Col, Space, Upload, DatePicker, Tabs, Table, Tag, Badge,
    Tooltip, Divider, Typography
} from 'antd';
import {
    UserOutlined, EditOutlined, CalendarOutlined, PhoneOutlined,
    MailOutlined, TeamOutlined, EnvironmentOutlined, LockOutlined,
    UploadOutlined, FileTextOutlined, DeleteOutlined, DownloadOutlined,
    BankOutlined, DollarOutlined, SafetyCertificateOutlined, CheckCircleOutlined,
    CloseCircleOutlined, IdcardOutlined, FileDoneOutlined,
} from '@ant-design/icons';
import { apiClient } from '@/lib/api/api-client';
import { getAvatarUrl } from '@/lib/utils/image.utils';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface UserProfile {
    id: number;
    first_name: string;
    last_name: string;
    birth_date: string | null;
    email: string;
    phone: string;
    address: string;
    avatar: string | null;
    gender: string;
    role: string;
    is_active: boolean;
    department: { id: number; name: string } | null;
    role_item: { id: number; name: string; permission_level?: string } | null;
    created_at: string;
}

interface UserDocument {
    id: number;
    type: string;
    filename: string;
    original_name: string;
    uploaded_at: string;
}

interface SalaryConfig {
    id: number;
    base_salary: number;
    allowances: { label: string; amount: number }[] | null;
    bank_account_number: string | null;
    bank_name: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const DOCUMENT_TYPES = [
    { value: 'CCCD', label: 'CCCD / Chứng minh nhân dân' },
    { value: 'Hộ chiếu', label: 'Hộ chiếu' },
    { value: 'Bằng cấp/Chứng chỉ', label: 'Bằng cấp / Chứng chỉ' },
    { value: 'Khác', label: 'Khác' },
];

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [documents, setDocuments] = useState<UserDocument[]>([]);
    const [contract, setContract] = useState<SalaryConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [docsLoading, setDocsLoading] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [isDocUploadModalVisible, setIsDocUploadModalVisible] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [docForm] = Form.useForm();
    const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/users/me');
            if (response.ok) {
                const data = await response.json();
                setProfile(data);
                const userData = localStorage.getItem('user');
                if (userData) {
                    const user = JSON.parse(userData);
                    localStorage.setItem('user', JSON.stringify({
                        ...user,
                        avatar: data.avatar,
                        firstName: data.first_name,
                        lastName: data.last_name,
                    }));
                }
            } else {
                message.error('Không thể tải thông tin cá nhân');
            }
        } catch {
            message.error('Lỗi khi tải thông tin cá nhân');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDocuments = useCallback(async () => {
        try {
            setDocsLoading(true);
            const res = await apiClient.get('/users/me/documents');
            if (res.ok) setDocuments(await res.json());
        } catch {
            message.error('Không thể tải danh sách tài liệu');
        } finally {
            setDocsLoading(false);
        }
    }, []);

    const fetchContract = useCallback(async () => {
        try {
            const res = await apiClient.get('/users/me/contract');
            if (res.ok) {
                const data = await res.json();
                setContract(data);
            }
        } catch {
            // no contract is ok
        }
    }, []);

    useEffect(() => {
        fetchProfile();
        fetchDocuments();
        fetchContract();
    }, [fetchProfile, fetchDocuments, fetchContract]);

    // ── Edit Profile ──────────────────────────────────────────────────────
    const openEditModal = () => {
        if (!profile) return;
        form.setFieldsValue({
            phone: profile.phone,
            email: profile.email,
            address: profile.address,
            gender: profile.gender,
            birth_date: profile.birth_date ? dayjs(profile.birth_date) : null,
        });
        setIsEditModalVisible(true);
    };

    const handleEditProfile = async (values: any) => {
        try {
            const submitValues = {
                ...values,
                birth_date: values.birth_date ? values.birth_date.format('YYYY-MM-DD') : null,
            };
            const response = await apiClient.patch('/users/me', submitValues);
            if (response.ok) {
                message.success('Cập nhật thông tin thành công');
                setIsEditModalVisible(false);
                fetchProfile();
            } else {
                const err = await response.json().catch(() => ({}));
                message.error(err?.message || 'Cập nhật thất bại');
            }
        } catch {
            message.error('Đã xảy ra lỗi khi cập nhật');
        }
    };

    // ── Change Password ──────────────────────────────────────────────────
    const handleChangePassword = async (values: any) => {
        if (values.new_password !== values.confirm_password) {
            message.error('Mật khẩu xác nhận không khớp');
            return;
        }
        try {
            const response = await apiClient.patch('/users/me/change-password', { password: values.new_password });
            if (response.ok) {
                message.success('Đổi mật khẩu thành công');
                setIsPasswordModalVisible(false);
                passwordForm.resetFields();
            } else {
                message.error('Đổi mật khẩu thất bại');
            }
        } catch {
            message.error('Đã xảy ra lỗi');
        }
    };

    // ── Avatar Upload ────────────────────────────────────────────────────
    const handleAvatarUpload = async (options: any) => {
        const { file, onSuccess, onError } = options;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_URL}/users/avatar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            if (response.ok) {
                message.success('Cập nhật ảnh đại diện thành công');
                fetchProfile();
                onSuccess(await response.json());
            } else {
                message.error('Tải ảnh lên thất bại');
                onError(new Error('Upload failed'));
            }
        } catch (err) {
            message.error('Lỗi khi tải ảnh lên');
            onError(err);
        }
    };

    // ── Document Upload ──────────────────────────────────────────────────
    const handleDocumentUpload = async () => {
        const type = docForm.getFieldValue('type');
        if (!selectedDocFile) { message.warning('Vui lòng chọn file'); return; }
        if (!type) { message.warning('Vui lòng chọn loại giấy tờ'); return; }

        setUploadingDoc(true);
        const formData = new FormData();
        formData.append('file', selectedDocFile);
        formData.append('type', type);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`${API_URL}/users/me/documents`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            if (response.ok) {
                message.success('Tải lên tài liệu thành công');
                setIsDocUploadModalVisible(false);
                docForm.resetFields();
                setSelectedDocFile(null);
                fetchDocuments();
            } else {
                message.error('Tải lên thất bại');
            }
        } catch {
            message.error('Lỗi khi tải lên');
        } finally {
            setUploadingDoc(false);
        }
    };

    const handleDeleteDocument = async (docId: number) => {
        Modal.confirm({
            title: 'Xóa tài liệu',
            content: 'Bạn có chắc muốn xóa tài liệu này?',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    const res = await apiClient.delete(`/users/me/documents/${docId}`);
                    if (res.ok) {
                        message.success('Xóa tài liệu thành công');
                        fetchDocuments();
                    } else {
                        message.error('Xóa thất bại');
                    }
                } catch {
                    message.error('Đã xảy ra lỗi');
                }
            },
        });
    };

    const handleDownloadDocument = (doc: UserDocument) => {
        const token = localStorage.getItem('access_token');
        const url = `${API_URL.replace('/api', '')}/uploads/documents/${doc.filename}`;
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.original_name;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // ─────────────────────────────────────────────────────────────────────
    if (loading) return <div className="p-8"><Skeleton avatar paragraph={{ rows: 10 }} active /></div>;
    if (!profile) return <div className="p-8 text-center text-gray-500">Không tìm thấy thông tin cá nhân</div>;

    const fullName = `${profile.first_name} ${profile.last_name}`;
    const roleLabel = profile.role === 'admin' ? 'Quản trị viên' : profile.role === 'manager' ? 'Quản lý' : 'Nhân viên';

    // ── Documents table columns
    const docColumns = [
        {
            title: 'Loại giấy tờ',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => <Tag color="blue">{type}</Tag>,
        },
        {
            title: 'Tên file',
            dataIndex: 'original_name',
            key: 'original_name',
            ellipsis: true,
        },
        {
            title: 'Ngày tải lên',
            dataIndex: 'uploaded_at',
            key: 'uploaded_at',
            render: (d: string) => dayjs(d).format('DD/MM/YYYY HH:mm'),
            width: 160,
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 100,
            render: (_: any, record: UserDocument) => (
                <Space>
                    <Tooltip title="Tải xuống">
                        <Button
                            type="text" size="small" icon={<DownloadOutlined />}
                            className="text-blue-500"
                            onClick={() => handleDownloadDocument(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Button
                            type="text" size="small" icon={<DeleteOutlined />}
                            danger
                            onClick={() => handleDeleteDocument(record.id)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const tabItems = [
        // ── TAB 1: Personal Info ──────────────────────────────────────────
        {
            key: '1',
            label: <span className="flex items-center gap-1.5"><UserOutlined />Thông tin cá nhân</span>,
            children: (
                <div className="space-y-6">
                    {/* Profile header card */}
                    <Card className="rounded-xl shadow-sm border-gray-100">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            <div className="relative group cursor-pointer flex-shrink-0">
                                <Upload name="file" showUploadList={false} customRequest={handleAvatarUpload}>
                                    <div className="relative">
                                        <Avatar
                                            size={100}
                                            src={getAvatarUrl(profile.avatar)}
                                            icon={<UserOutlined />}
                                            className="border-4 border-white shadow-xl bg-gray-100 group-hover:opacity-80 transition-opacity"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                            <div className="bg-black/40 rounded-full p-1.5 text-white">
                                                <EditOutlined style={{ fontSize: '18px' }} />
                                            </div>
                                        </div>
                                        <Tooltip title="Nhấn để thay đổi ảnh">
                                            <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow">
                                                <EditOutlined style={{ fontSize: '11px' }} />
                                            </div>
                                        </Tooltip>
                                    </div>
                                </Upload>
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <Title level={4} className="mb-0.5">{fullName}</Title>
                                <Text type="secondary" className="text-sm">
                                    {profile.role_item?.name || 'Nhân viên'}
                                    {profile.department ? ` · ${profile.department.name}` : ''}
                                </Text>
                                <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                                    <Badge
                                        status={profile.is_active ? 'success' : 'error'}
                                        text={profile.is_active ? 'Đang làm việc' : 'Nghỉ việc'}
                                        className="text-sm"
                                    />
                                    <Tag color="geekblue" className="ml-1">{roleLabel}</Tag>
                                </div>
                            </div>
                            <div className="flex gap-2 self-start">
                                <Button icon={<EditOutlined />} onClick={openEditModal} type="primary" ghost>
                                    Chỉnh sửa
                                </Button>
                                <Button icon={<LockOutlined />} onClick={() => setIsPasswordModalVisible(true)}>
                                    Đổi mật khẩu
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* General info */}
                        <Card
                            title={<span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Thông tin chung</span>}
                            className="rounded-xl shadow-sm border-gray-100"
                            styles={{ body: { padding: '20px' } }}
                        >
                            <div className="space-y-4">
                                <InfoRow label="Mã nhân viên" value={`E${profile.id.toString().padStart(3, '0')}`} mono />
                                <InfoRow label="Họ và tên" value={fullName} />
                                <InfoRow label="Giới tính" value={profile.gender} />
                                <InfoRow
                                    label="Ngày sinh"
                                    value={profile.birth_date ? dayjs(profile.birth_date).format('DD/MM/YYYY') : 'Chưa cài đặt'}
                                />
                                <InfoRow
                                    label="Ngày gia nhập"
                                    value={dayjs(profile.created_at).format('DD/MM/YYYY')}
                                />
                            </div>
                        </Card>

                        {/* Contact info */}
                        <Card
                            title={<span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Liên hệ</span>}
                            className="rounded-xl shadow-sm border-gray-100"
                            styles={{ body: { padding: '20px' } }}
                        >
                            <div className="space-y-4">
                                <InfoRowIcon icon={<PhoneOutlined className="text-indigo-400" />} label="Số điện thoại" value={profile.phone || 'Chưa cài đặt'} />
                                <InfoRowIcon icon={<MailOutlined className="text-indigo-400" />} label="Email" value={profile.email} />
                                <InfoRowIcon icon={<EnvironmentOutlined className="text-indigo-400" />} label="Địa chỉ" value={profile.address || 'Chưa cài đặt'} />
                            </div>
                        </Card>
                    </div>
                </div>
            ),
        },

        // ── TAB 2: Documents ──────────────────────────────────────────────
        {
            key: '2',
            label: <span className="flex items-center gap-1.5"><FileTextOutlined />Hồ sơ & Giấy tờ</span>,
            children: (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <Title level={5} className="mb-0">Giấy tờ cá nhân</Title>
                            <Text type="secondary" className="text-sm">Tải lên CCCD, hộ chiếu, bằng cấp và các tài liệu khác</Text>
                        </div>
                        <Button
                            type="primary"
                            icon={<UploadOutlined />}
                            onClick={() => { docForm.resetFields(); setSelectedDocFile(null); setIsDocUploadModalVisible(true); }}
                        >
                            Tải lên giấy tờ
                        </Button>
                    </div>
                    <Card className="rounded-xl shadow-sm border-gray-100">
                        <Table
                            columns={docColumns}
                            dataSource={documents}
                            rowKey="id"
                            loading={docsLoading}
                            pagination={false}
                            locale={{ emptyText: 'Chưa có giấy tờ nào được tải lên' }}
                        />
                    </Card>
                </div>
            ),
        },

        // ── TAB 3: Work & Contract ────────────────────────────────────────
        {
            key: '3',
            label: <span className="flex items-center gap-1.5"><FileDoneOutlined />Công việc & Hợp đồng</span>,
            children: (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Department & Role */}
                        <Card
                            title={<span className="flex items-center gap-2"><TeamOutlined className="text-indigo-500" />Vị trí công tác</span>}
                            className="rounded-xl shadow-sm border-gray-100"
                            styles={{ body: { padding: '20px' } }}
                        >
                            <div className="space-y-4">
                                <ReadonlyField
                                    icon={<TeamOutlined />}
                                    label="Phòng ban"
                                    value={profile.department?.name || 'Chưa phân công'}
                                />
                                <ReadonlyField
                                    icon={<IdcardOutlined />}
                                    label="Chức vụ"
                                    value={profile.role_item?.name || 'Nhân viên'}
                                />
                                <ReadonlyField
                                    icon={<SafetyCertificateOutlined />}
                                    label="Quyền hệ thống"
                                    value={roleLabel}
                                />
                            </div>
                        </Card>

                        {/* Work status */}
                        <Card
                            title={<span className="flex items-center gap-2"><CheckCircleOutlined className="text-green-500" />Trạng thái làm việc</span>}
                            className="rounded-xl shadow-sm border-gray-100"
                            styles={{ body: { padding: '20px' } }}
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                    <Text className="text-sm text-gray-600">Trạng thái</Text>
                                    <span className={`flex items-center gap-1.5 text-sm font-semibold ${profile.is_active ? 'text-green-600' : 'text-red-500'}`}>
                                        {profile.is_active ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                                        {profile.is_active ? 'Đang làm việc' : 'Đã nghỉ việc'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                    <Text className="text-sm text-gray-600">Loại nhân viên</Text>
                                    <span className="text-sm font-semibold text-gray-900">Chính thức</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                    <Text className="text-sm text-gray-600">Ngày bắt đầu</Text>
                                    <span className="text-sm font-semibold text-gray-900">{dayjs(profile.created_at).format('DD/MM/YYYY')}</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Salary Config */}
                    <Card
                        title={<span className="flex items-center gap-2"><DollarOutlined className="text-yellow-500" />Thông tin lương & Hợp đồng</span>}
                        className="rounded-xl shadow-sm border-gray-100"
                        styles={{ body: { padding: '20px' } }}
                        extra={<Tag color="orange">Chỉ xem</Tag>}
                    >
                        {contract ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100">
                                        <Text type="secondary" className="text-xs uppercase tracking-wider">Lương cơ bản</Text>
                                        <div className="text-2xl font-bold text-indigo-700 mt-1">
                                            {Number(contract.base_salary).toLocaleString('vi-VN')} ₫
                                        </div>
                                    </div>
                                    {contract.bank_name && (
                                        <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                                            <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-1">
                                                <BankOutlined /> Ngân hàng
                                            </div>
                                            <div className="font-semibold text-gray-800">{contract.bank_name}</div>
                                            <div className="text-sm text-gray-500">{contract.bank_account_number}</div>
                                        </div>
                                    )}
                                </div>
                                {contract.allowances && contract.allowances.length > 0 && (
                                    <>
                                        <Divider className="my-3" />
                                        <div>
                                            <Text type="secondary" className="text-xs uppercase tracking-wider mb-3 block">Phụ cấp</Text>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {contract.allowances.map((a, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                                        <Text className="text-sm text-gray-600">{a.label}</Text>
                                                        <Text className="text-sm font-semibold text-gray-900">{Number(a.amount).toLocaleString('vi-VN')} ₫</Text>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <DollarOutlined style={{ fontSize: 32 }} className="mb-2 block" />
                                <Text type="secondary">Chưa có thông tin hợp đồng lương</Text>
                            </div>
                        )}
                    </Card>
                </div>
            ),
        },
    ];

    return (
        <div className="max-w-5xl mx-auto py-6 px-4">
            {/* Banner */}
            <div className="relative mb-6">
                <div className="h-40 rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                    <img src="/company-banner.png" alt="Company Banner" className="w-full h-full object-cover" />
                </div>
            </div>

            {/* Tabs */}
            <Tabs
                defaultActiveKey="1"
                items={tabItems}
                size="large"
                className="profile-tabs"
            />

            {/* ── Edit Profile Modal ──────────────────────────────────────── */}
            <Modal
                title={<span className="flex items-center gap-2"><EditOutlined />Chỉnh sửa thông tin cá nhân</span>}
                open={isEditModalVisible}
                onCancel={() => setIsEditModalVisible(false)}
                footer={null}
                centered
                width={500}
            >
                <div className="mt-1 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                    ⚠️ Một số thông tin (Mã NV, Phòng ban, Chức vụ, Quyền tài khoản) chỉ quản trị viên mới có thể thay đổi.
                </div>
                <Form form={form} layout="vertical" onFinish={handleEditProfile}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="phone" label="Số điện thoại">
                                <Input placeholder="Nhập số điện thoại" prefix={<PhoneOutlined />} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
                                <Input placeholder="Nhập email" prefix={<MailOutlined />} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="address" label="Địa chỉ">
                        <Input placeholder="Nhập địa chỉ" prefix={<EnvironmentOutlined />} />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="gender" label="Giới tính">
                                <Select>
                                    <Select.Option value="Nam">Nam</Select.Option>
                                    <Select.Option value="Nữ">Nữ</Select.Option>
                                    <Select.Option value="Khác">Khác</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="birth_date" label="Ngày sinh">
                                <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày sinh" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item className="mb-0 flex justify-end">
                        <Space>
                            <Button onClick={() => setIsEditModalVisible(false)}>Hủy</Button>
                            <Button type="primary" htmlType="submit">Lưu thay đổi</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* ── Change Password Modal ──────────────────────────────────── */}
            <Modal
                title={<span className="flex items-center gap-2"><LockOutlined />Đổi mật khẩu</span>}
                open={isPasswordModalVisible}
                onCancel={() => { setIsPasswordModalVisible(false); passwordForm.resetFields(); }}
                footer={null}
                centered
                width={420}
            >
                <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword} className="mt-4">
                    <Form.Item
                        name="new_password"
                        label="Mật khẩu mới"
                        rules={[{ required: true, min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }]}
                    >
                        <Input.Password placeholder="Nhập mật khẩu mới" />
                    </Form.Item>
                    <Form.Item
                        name="confirm_password"
                        label="Xác nhận mật khẩu"
                        rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu' }]}
                    >
                        <Input.Password placeholder="Nhập lại mật khẩu mới" />
                    </Form.Item>
                    <Form.Item className="mb-0 flex justify-end">
                        <Space>
                            <Button onClick={() => { setIsPasswordModalVisible(false); passwordForm.resetFields(); }}>Hủy</Button>
                            <Button type="primary" htmlType="submit" danger>Đổi mật khẩu</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* ── Document Upload Modal ──────────────────────────────────── */}
            <Modal
                title={<span className="flex items-center gap-2"><UploadOutlined />Tải lên giấy tờ</span>}
                open={isDocUploadModalVisible}
                onCancel={() => { setIsDocUploadModalVisible(false); docForm.resetFields(); setSelectedDocFile(null); }}
                footer={null}
                centered
                width={460}
            >
                <Form form={docForm} layout="vertical" className="mt-4">
                    <Form.Item name="type" label="Loại giấy tờ" rules={[{ required: true, message: 'Vui lòng chọn loại giấy tờ' }]}>
                        <Select placeholder="Chọn loại giấy tờ">
                            {DOCUMENT_TYPES.map(d => (
                                <Select.Option key={d.value} value={d.value}>{d.label}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item label="File tài liệu" required>
                        <Upload
                            beforeUpload={(file) => { setSelectedDocFile(file); return false; }}
                            maxCount={1}
                            onRemove={() => setSelectedDocFile(null)}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        >
                            <Button icon={<UploadOutlined />}>Chọn file</Button>
                            <span className="ml-2 text-xs text-gray-400">PDF, JPG, PNG, DOC (tối đa 10MB)</span>
                        </Upload>
                    </Form.Item>
                    <Form.Item className="mb-0 flex justify-end">
                        <Space>
                            <Button onClick={() => { setIsDocUploadModalVisible(false); docForm.resetFields(); setSelectedDocFile(null); }}>Hủy</Button>
                            <Button type="primary" loading={uploadingDoc} onClick={handleDocumentUpload}>Tải lên</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

// ── Helper Components ────────────────────────────────────────────────────────

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-400">{label}</span>
            <span className={`text-sm font-medium text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</span>
        </div>
    );
}

function InfoRowIcon({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0">{icon}</div>
            <div className="flex flex-col">
                <span className="text-xs text-gray-400">{label}</span>
                <span className="text-sm font-medium text-gray-800">{value}</span>
            </div>
        </div>
    );
}

function ReadonlyField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-600">
                <span className="text-gray-400">{icon}</span>
                <span className="text-sm">{label}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{value}</span>
        </div>
    );
}
