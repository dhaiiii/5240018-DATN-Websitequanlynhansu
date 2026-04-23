'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
    Statistic,
    Alert,
    Badge,
    Empty,
    Popconfirm,
    Divider,
    Avatar,
} from 'antd';
import {
    PlusOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    TeamOutlined,
    EnvironmentOutlined,
    ArrowRightOutlined,
    ThunderboltOutlined,
    UserOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { apiClient } from '@/lib/api/api-client';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface Room {
    id: string;
    name: string;
    capacity: number;
    location?: string;
    is_active: boolean;
}

interface Employee {
    id: number;
    name: string;
    email: string;
}

interface Organizer {
    id: number;
    name: string;
    email: string;
}

interface Meeting {
    id: string;
    title: string;
    description?: string;
    organizer?: Organizer[];
    room: Room;
    room_id: string;
    start_time: string;
    end_time: string;
    status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
    created_at: string;
}

const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    SCHEDULED: { color: 'blue', label: 'Đã lên lịch', icon: <CalendarOutlined /> },
    CANCELLED: { color: 'red', label: 'Đã huỷ', icon: <CloseCircleOutlined /> },
    COMPLETED: { color: 'green', label: 'Hoàn thành', icon: <CheckCircleOutlined /> },
};

const roomColors: Record<string, string> = {
    'Phòng A': '#6366f1',
    'Phòng B': '#8b5cf6',
    'Phòng C': '#06b6d4',
};

const avatarColors = ['#6366f1', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#f97316'];
function getAvatarColor(name: string) {
    let sum = 0;
    for (const c of name) sum += c.charCodeAt(0);
    return avatarColors[sum % avatarColors.length];
}

function getInitials(name: string) {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getRoomColor(name: string) {
    return roomColors[name] || '#6366f1';
}

export default function MeetingSchedulerPage() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [conflictInfo, setConflictInfo] = useState<{
        message: string;
        alternatives: Room[];
    } | null>(null);
    const [form] = Form.useForm();

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [meetingsRes, roomsRes, employeesRes] = await Promise.all([
                apiClient.get('/meeting-scheduler/meetings'),
                apiClient.get('/meeting-scheduler/rooms'),
                apiClient.get('/meeting-scheduler/employees'),
            ]);
            if (meetingsRes.ok) setMeetings(await meetingsRes.json());
            if (roomsRes.ok) setRooms(await roomsRes.json());
            if (employeesRes.ok) setEmployees(await employeesRes.json());
        } catch {
            message.error('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = () => {
        setConflictInfo(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleBookMeeting = async (values: any) => {
        try {
            setSubmitting(true);
            setConflictInfo(null);

            const [start, end] = values.timeRange;

            // Chuyển mảng ID người tổ chức → mảng object {id, name, email}
            const organizerList: Organizer[] = (values.organizer_ids || []).map((empId: number) => {
                const emp = employees.find(e => e.id === empId);
                return emp ? { id: emp.id, name: emp.name, email: emp.email } : null;
            }).filter(Boolean);

            const payload = {
                title: values.title,
                room_id: values.room_id,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                description: values.description,
                organizer: organizerList,
            };

            const res = await apiClient.post('/meeting-scheduler/meetings', payload);

            if (res.ok) {
                message.success('🎉 Đặt phòng họp thành công!');
                setIsModalVisible(false);
                form.resetFields();
                fetchData();
            } else if (res.status === 409) {
                const data = await res.json();
                setConflictInfo({
                    message: data.message,
                    alternatives: data.alternatives || [],
                });
                message.warning('Phòng đã được đặt, hãy xem gợi ý bên dưới!');
            } else {
                const data = await res.json();
                message.error(data.message || 'Đặt phòng thất bại');
            }
        } catch {
            message.error('Đã xảy ra lỗi khi đặt phòng');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSelectAlternative = (room: Room) => {
        form.setFieldValue('room_id', room.id);
        setConflictInfo(null);
        message.info(`Đã chọn ${room.name}. Nhấn "Đặt phòng" để tiếp tục.`);
    };

    const handleCancel = async (id: string) => {
        try {
            const res = await apiClient.patch(`/meeting-scheduler/meetings/${id}/cancel`, {});
            if (res.ok) {
                message.success('Đã huỷ cuộc họp');
                fetchData();
            } else {
                const data = await res.json();
                message.error(data.message || 'Huỷ thất bại');
            }
        } catch {
            message.error('Lỗi khi huỷ cuộc họp');
        }
    };

    const scheduled = meetings.filter(m => m.status === 'SCHEDULED').length;

    const columns = [
        {
            title: 'Cuộc họp',
            key: 'meeting',
            render: (_: any, record: Meeting) => (
                <Space direction="vertical" size={4}>
                    <Text strong style={{ fontSize: 14 }}>{record.title}</Text>
                    {record.description && (
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.description}</Text>
                    )}
                    {record.organizer && record.organizer.length > 0 && (
                        <Avatar.Group maxCount={4} size="small">
                            {record.organizer.map(org => (
                                <Avatar
                                    key={org.id}
                                    size="small"
                                    style={{ backgroundColor: getAvatarColor(org.name), fontSize: 11 }}
                                    title={`${org.name} (${org.email})`}
                                >
                                    {getInitials(org.name)}
                                </Avatar>
                            ))}
                        </Avatar.Group>
                    )}
                </Space>
            ),
        },
        {
            title: 'Phòng họp',
            key: 'room',
            render: (_: any, record: Meeting) => (
                <Space direction="vertical" size={0}>
                    <Tag
                        color={getRoomColor(record.room?.name)}
                        style={{
                            borderRadius: 20,
                            padding: '2px 12px',
                            fontWeight: 600,
                            border: 'none',
                            color: '#fff',
                        }}
                    >
                        {record.room?.name}
                    </Tag>
                    {record.room?.location && (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            <EnvironmentOutlined className="mr-1" />
                            {record.room.location}
                        </Text>
                    )}
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        <TeamOutlined className="mr-1" />
                        {record.room?.capacity} người
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Thời gian',
            key: 'time',
            render: (_: any, record: Meeting) => (
                <Space direction="vertical" size={2}>
                    <Text style={{ fontSize: 13 }}>
                        <ClockCircleOutlined className="mr-1 text-indigo-500" />
                        {dayjs(record.start_time).format('DD/MM/YYYY')}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(record.start_time).format('HH:mm')}
                        <ArrowRightOutlined className="mx-1" />
                        {dayjs(record.end_time).format('HH:mm')}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        ({Math.round((new Date(record.end_time).getTime() - new Date(record.start_time).getTime()) / 60000)} phút)
                    </Text>
                </Space>
            ),
        },
        {
            title: 'Tham gia',
            key: 'attendees',
            render: (_: any, record: Meeting) => {
                const orgs = record.organizer || [];
                return orgs.length === 0 ? (
                    <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
                ) : (
                    <Space direction="vertical" size={2}>
                        {orgs.map(org => (
                            <div key={org.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Avatar
                                    size={22}
                                    style={{ backgroundColor: getAvatarColor(org.name), fontSize: 10, minWidth: 22 }}
                                >
                                    {getInitials(org.name)}
                                </Avatar>
                                <Text style={{ fontSize: 12 }}>{org.name}</Text>
                            </div>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const cfg = statusConfig[status] || statusConfig['SCHEDULED'];
                return (
                    <Tag icon={cfg.icon} color={cfg.color} style={{ borderRadius: 20, padding: '2px 10px' }}>
                        {cfg.label}
                    </Tag>
                );
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: Meeting) => (
                record.status === 'SCHEDULED' ? (
                    <Popconfirm
                        title="Huỷ cuộc họp?"
                        description="Bạn có chắc muốn huỷ cuộc họp này không?"
                        onConfirm={() => handleCancel(record.id)}
                        okText="Huỷ họp"
                        cancelText="Không"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger size="small" icon={<CloseCircleOutlined />}>
                            Huỷ họp
                        </Button>
                    </Popconfirm>
                ) : (
                    <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
                )
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                <div>
                    <Title level={2} style={{ margin: 0, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        📅 Lịch Họp
                    </Title>
                    <Text type="secondary">Đặt phòng họp, quản lý lịch và tránh xung đột thời gian</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={handleOpenModal}
                    style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 600,
                        boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                    }}
                >
                    Đặt lịch họp
                </Button>
            </div>

            {/* Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                    <Card
                        style={{ borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.2)' }}
                        bodyStyle={{ padding: '20px 24px' }}
                    >
                        <Statistic
                            title={<Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Tổng cuộc họp</Text>}
                            value={meetings.length}
                            prefix={<CalendarOutlined style={{ color: '#fff' }} />}
                            valueStyle={{ color: '#fff', fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card
                        style={{ borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', boxShadow: '0 4px 20px rgba(6,182,212,0.2)' }}
                        bodyStyle={{ padding: '20px 24px' }}
                    >
                        <Statistic
                            title={<Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Đã lên lịch</Text>}
                            value={scheduled}
                            prefix={<CheckCircleOutlined style={{ color: '#fff' }} />}
                            valueStyle={{ color: '#fff', fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card
                        style={{ borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 20px rgba(245,158,11,0.2)' }}
                        bodyStyle={{ padding: '20px 24px' }}
                    >
                        <Statistic
                            title={<Text style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Nhân viên</Text>}
                            value={employees.length}
                            prefix={<TeamOutlined style={{ color: '#fff' }} />}
                            valueStyle={{ color: '#fff', fontWeight: 700 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Room Cards */}
            {rooms.length > 0 && (
                <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
                    {rooms.map(room => {
                        const activeCount = meetings.filter(
                            m => m.room_id === room.id && m.status === 'SCHEDULED'
                        ).length;
                        return (
                            <Col key={room.id} xs={24} sm={8}>
                                <Card
                                    style={{
                                        borderRadius: 12,
                                        border: `2px solid ${getRoomColor(room.name)}22`,
                                        background: `${getRoomColor(room.name)}0a`,
                                    }}
                                    bodyStyle={{ padding: '16px 20px' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <Text strong style={{ fontSize: 15, color: getRoomColor(room.name) }}>
                                                {room.name}
                                            </Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                <TeamOutlined className="mr-1" />{room.capacity} người
                                                {room.location && <span className="ml-2"><EnvironmentOutlined className="mr-1" />{room.location}</span>}
                                            </Text>
                                        </div>
                                        <Badge
                                            count={activeCount}
                                            showZero
                                            style={{ backgroundColor: activeCount > 0 ? getRoomColor(room.name) : '#d9d9d9' }}
                                            overflowCount={99}
                                        >
                                            <div
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: 10,
                                                    background: `${getRoomColor(room.name)}20`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <CalendarOutlined style={{ color: getRoomColor(room.name), fontSize: 18 }} />
                                            </div>
                                        </Badge>
                                    </div>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* Meeting Table */}
            <Card
                title={
                    <Space>
                        <CalendarOutlined style={{ color: '#6366f1' }} />
                        <Text strong>Danh sách cuộc họp</Text>
                    </Space>
                }
                style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
            >
                <Table
                    columns={columns}
                    dataSource={meetings}
                    rowKey="id"
                    loading={loading}
                    scroll={{ x: 900 }}
                    pagination={{ pageSize: 8, showSizeChanger: false, showTotal: total => `Tổng ${total} cuộc họp` }}
                    locale={{ emptyText: <Empty description="Chưa có cuộc họp nào" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                    rowClassName={(record) => record.status === 'CANCELLED' ? 'opacity-50' : ''}
                />
            </Card>

            {/* Book Meeting Modal */}
            <Modal
                title={
                    <Space>
                        <CalendarOutlined style={{ color: '#6366f1' }} />
                        <span style={{ fontWeight: 700 }}>Đặt lịch họp mới</span>
                    </Space>
                }
                open={isModalVisible}
                onCancel={() => { setIsModalVisible(false); setConflictInfo(null); }}
                footer={null}
                width={660}
                centered
                styles={{ body: { paddingTop: 8 } }}
            >
                {/* Conflict Alert */}
                {conflictInfo && (
                    <Alert
                        type="warning"
                        showIcon
                        icon={<ClockCircleOutlined />}
                        message={<Text strong>Phòng đã được đặt!</Text>}
                        description={
                            <div>
                                <Paragraph style={{ margin: '4px 0 12px' }}>{conflictInfo.message}</Paragraph>

                                {conflictInfo.alternatives.length > 0 ? (
                                    <>
                                        <Text strong style={{ color: '#6366f1' }}>
                                            <ThunderboltOutlined className="mr-1" />
                                            Phòng trống trong cùng khung giờ:
                                        </Text>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                                            {conflictInfo.alternatives.map(room => (
                                                <Button
                                                    key={room.id}
                                                    size="small"
                                                    onClick={() => handleSelectAlternative(room)}
                                                    style={{
                                                        background: `${getRoomColor(room.name)}15`,
                                                        borderColor: getRoomColor(room.name),
                                                        color: getRoomColor(room.name),
                                                        borderRadius: 20,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {room.name}
                                                    <Text style={{ fontSize: 11, color: 'inherit', marginLeft: 4 }}>
                                                        ({room.capacity} người)
                                                    </Text>
                                                </Button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <Text type="secondary">❌ Không còn phòng trống trong khung giờ này. Vui lòng chọn thời gian khác.</Text>
                                )}
                            </div>
                        }
                        style={{ marginBottom: 20, borderRadius: 10 }}
                    />
                )}

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleBookMeeting}
                    style={{ marginTop: 8 }}
                >
                    {/* Tên cuộc họp */}
                    <Form.Item
                        name="title"
                        label="Tên cuộc họp"
                        rules={[
                            { required: true, message: 'Vui lòng nhập tên cuộc họp!' },
                            { min: 3, message: 'Tên phải có ít nhất 3 ký tự' },
                        ]}
                    >
                        <Input
                            placeholder="VD: Họp review Q1 2025..."
                            prefix={<CalendarOutlined style={{ color: '#6366f1' }} />}
                            size="large"
                            style={{ borderRadius: 8 }}
                        />
                    </Form.Item>

                    {/* Phòng họp */}
                    <Form.Item
                        name="room_id"
                        label="Phòng họp"
                        rules={[{ required: true, message: 'Vui lòng chọn phòng họp!' }]}
                    >
                        <Select
                            placeholder="Chọn phòng họp"
                            size="large"
                            style={{ borderRadius: 8 }}
                            optionLabelProp="label"
                        >
                            {rooms.map(room => (
                                <Select.Option key={room.id} value={room.id} label={room.name}>
                                    <Space>
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                background: getRoomColor(room.name),
                                            }}
                                        />
                                        <span>{room.name}</span>
                                        <Text type="secondary" style={{ fontSize: 12 }}>({room.capacity} người)</Text>
                                        {room.location && <Text type="secondary" style={{ fontSize: 12 }}>– {room.location}</Text>}
                                    </Space>
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* Người tham gia (multi-select nhân viên) */}
                    <Form.Item
                        name="organizer_ids"
                        label={
                            <Space>
                                <TeamOutlined style={{ color: '#8b5cf6' }} />
                                <span>Người tham gia</span>
                                <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>(có thể chọn nhiều nhân viên)</Text>
                            </Space>
                        }
                    >
                        <Select
                            mode="multiple"
                            size="large"
                            placeholder="Tìm và chọn nhân viên..."
                            showSearch
                            filterOption={(input, option) => {
                                const label = String(option?.label || '').toLowerCase();
                                return label.includes(input.toLowerCase());
                            }}
                            optionLabelProp="label"
                            style={{ borderRadius: 8 }}
                            maxTagCount={4}
                            maxTagPlaceholder={(omitted) => `+${omitted.length} người`}
                            suffixIcon={<SearchOutlined style={{ color: '#8b5cf6' }} />}
                            notFoundContent={
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="Không tìm thấy nhân viên"
                                    style={{ padding: '8px 0' }}
                                />
                            }
                        >
                            {employees.map(emp => (
                                <Select.Option
                                    key={emp.id}
                                    value={emp.id}
                                    label={emp.name}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
                                        <Avatar
                                            size={28}
                                            style={{ backgroundColor: getAvatarColor(emp.name), fontSize: 11, minWidth: 28 }}
                                        >
                                            {getInitials(emp.name)}
                                        </Avatar>
                                        <div style={{ lineHeight: 1.3 }}>
                                            <div style={{ fontWeight: 500, fontSize: 13 }}>{emp.name}</div>
                                            <div style={{ fontSize: 11, color: '#9ca3af' }}>{emp.email}</div>
                                        </div>
                                    </div>
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* Thời gian họp */}
                    <Form.Item
                        name="timeRange"
                        label="Thời gian họp"
                        rules={[{ required: true, message: 'Vui lòng chọn thời gian!' }]}
                    >
                        <RangePicker
                            showTime={{ format: 'HH:mm', minuteStep: 15 }}
                            format="DD/MM/YYYY HH:mm"
                            placeholder={['Bắt đầu', 'Kết thúc']}
                            size="large"
                            style={{ width: '100%', borderRadius: 8 }}
                            disabledDate={current => current && current < dayjs().startOf('day')}
                        />
                    </Form.Item>

                    {/* Mô tả */}
                    <Form.Item name="description" label="Mô tả / Nội dung">
                        <TextArea
                            rows={3}
                            placeholder="Nội dung cuộc họp, chương trình nghị sự..."
                            style={{ borderRadius: 8 }}
                        />
                    </Form.Item>

                    <Divider style={{ margin: '12px 0' }} />

                    <Form.Item style={{ marginBottom: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <Button
                                onClick={() => { setIsModalVisible(false); setConflictInfo(null); }}
                                size="large"
                                style={{ borderRadius: 8 }}
                            >
                                Huỷ
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                loading={submitting}
                                icon={<CheckCircleOutlined />}
                                style={{
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    border: 'none',
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                                }}
                            >
                                Đặt phòng
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
