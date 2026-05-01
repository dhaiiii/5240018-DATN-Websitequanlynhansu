'use client';

import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Typography, List, Avatar, Tag, message, Button, notification } from 'antd';
import {
    UserOutlined,
    ApartmentOutlined,
    ClockCircleOutlined,
    FileDoneOutlined,
    ArrowUpOutlined,
    LoginOutlined,
    LogoutOutlined,
    EnvironmentOutlined,
    SettingOutlined,
    CheckCircleFilled,
    CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

import { isAdmin, isManager } from '../../lib/utils/auth.utils';

const { Title, Text } = Typography;

import { apiClient } from '@/lib/api/api-client';

const API_BASE = 'http://localhost:3001/api';

// Tọa độ công ty ban đầu (Mặc định: trung tâm Hà Nội). Sẽ được ghi đè bằng LocalStorage nếu Admin thiết lập.
const DEFAULT_COMPANY_LOCATION = {
    latitude: 21.028511,
    longitude: 105.804817,
};
const MAX_DISTANCE_METERS = 100;

// Tính khoảng cách giữa 2 điểm GPS dùng công thức Haversine
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Đơn vị: mét
    const φ1 = lat1 * Math.PI / 180; // φ, λ theo radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Khoảng cách bằng mét
};

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        totalDepartments: 0,
        pendingRequestsCount: 0,
    });
    const [recentActivities, setRecentActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPrivileged, setIsPrivileged] = useState(false);
    const [isAdminRole, setIsAdminRole] = useState(false);

    // Timekeeping states
    const [hasCheckedIn, setHasCheckedIn] = useState(false);
    const [hasCheckedOut, setHasCheckedOut] = useState(false);
    const [isCheckingTime, setIsCheckingTime] = useState(false);
    const [isSettingLocation, setIsSettingLocation] = useState(false);
    const [companyLoc, setCompanyLoc] = useState(DEFAULT_COMPANY_LOCATION);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const privileged = isAdmin() || isManager();
            setIsPrivileged(privileged);
            setIsAdminRole(isAdmin());

            // Đọc cấu hình tọa độ công ty (nếu có)
            const savedLoc = localStorage.getItem('company_gps');
            if (savedLoc) {
                try {
                    setCompanyLoc(JSON.parse(savedLoc));
                } catch (e) {
                    console.error('Lỗi đọc tọa độ công ty', e);
                }
            }

            const email = localStorage.getItem('userEmail');
            const statsUrl = privileged
                ? `/requests/stats`
                : `/requests/stats?email=${email}`;

            const fetchPromises = [
                apiClient.get(statsUrl)
            ];

            // Only fetch counts if privileged
            if (privileged) {
                fetchPromises.push(apiClient.get(`/users`));
                fetchPromises.push(apiClient.get(`/departments`));
            }

            // Fetch timekeeping status for current user
            fetchPromises.push(apiClient.get(`/timekeeping`));

            // Fetch company GPS setting from DB
            fetchPromises.push(apiClient.get(`/settings/company_gps`));

            const responses = await Promise.all(fetchPromises);

            // Lấy JSON data nếu response hợp lệ
            const dashboardStats = responses[0].ok ? await responses[0].json() : {};

            let totalEmployees = 0;
            let totalDepartments = 0;

            if (privileged) {
                const users = responses[1].ok ? await responses[1].json() : [];
                const depts = responses[2].ok ? await responses[2].json() : [];
                totalEmployees = Array.isArray(users) ? users.length : 0;
                totalDepartments = Array.isArray(depts) ? depts.length : 0;
            }

            setStats({
                totalEmployees,
                totalDepartments,
                pendingRequestsCount: dashboardStats.pendingCount || 0,
            });
            setRecentActivities(dashboardStats.recentActivities || []);

            // Process company location from DB
            const settingsRes = responses[responses.length - 1].ok ? await responses[responses.length - 1].json() : null;
            if (settingsRes && settingsRes.value) {
                try {
                    const dbLoc = JSON.parse(settingsRes.value);
                    setCompanyLoc(dbLoc);
                    localStorage.setItem('company_gps', settingsRes.value);
                } catch (e) {
                    console.error('Lỗi parse tọa độ từ DB', e);
                }
            }

            // Process timekeeping logic
            const timekeepingRes = responses[responses.length - 2].ok ? await responses[responses.length - 2].json() : [];
            if (Array.isArray(timekeepingRes) && email) {
                const todayStr = new Date().toLocaleDateString('vi-VN');
                const todayRecord = timekeepingRes.find((record: any) =>
                    record.email === email &&
                    new Date(record.created_at).toLocaleDateString('vi-VN') === todayStr
                );

                if (todayRecord) {
                    setHasCheckedIn(true);
                    if (todayRecord.end_time) setHasCheckedOut(true);
                } else {
                    setHasCheckedIn(false);
                    setHasCheckedOut(false);
                }
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            message.error('Không thể tải dữ liệu dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const getRequestTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'PAID_LEAVE': 'Nghỉ phép có lương',
            'UNPAID_LEAVE': 'Nghỉ phép không lương',
            'OVERTIME': 'Làm thêm giờ',
            'BUSINESS_TRIP': 'Công tác',
            'RESIGNATION': 'Thôi việc',
            'ATTENDANCE_ADJUSTMENT': 'Cập nhật công'
        };
        return labels[type] || type;
    };

    const handleStatusUpdate = async (id: number, status: string) => {
        try {
            const userEmail = localStorage.getItem('userEmail');
            if (!userEmail) {
                message.error('Không tìm thấy thông tin người duyệt');
                return;
            }

            const res = await apiClient.patch(`/requests/${id}/status`, {
                status,
                approverEmail: userEmail
            });

            if (res.ok) {
                message.success(status === 'APPROVED' ? 'Đã duyệt đơn' : 'Đã từ chối đơn');
                fetchDashboardData();
            } else {
                message.error('Cập nhật trạng thái thất bại');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            message.error('Lỗi kết nối server');
        }
    };

    const handleSetCompanyLocation = () => {
        setIsSettingLocation(true);
        if (!navigator.geolocation) {
            message.error('Trình duyệt không hỗ trợ định vị GPS.');
            setIsSettingLocation(false);
            return;
        }

        message.loading({ content: 'Đang lấy tọa độ hiện tại...', key: 'gps' });
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const updatedLoc = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };

                // Save to LocalStorage for immediate use
                localStorage.setItem('company_gps', JSON.stringify(updatedLoc));
                setCompanyLoc(updatedLoc);

                // Save to Database
                apiClient.post(`/settings`, {
                    key: 'company_gps',
                    value: JSON.stringify(updatedLoc)
                }).then(res => {
                    if (res.ok) {
                        message.success({ content: `Đã lưu tọa độ công ty vào hệ thống!`, key: 'gps' });
                    } else {
                        message.warning({ content: 'Tọa độ đã lưu cục bộ nhưng chưa đồng bộ được với máy chủ.', key: 'gps' });
                    }
                }).catch(err => {
                    console.error('Lỗi lưu tọa độ vào DB', err);
                });

                setIsSettingLocation(false);
            },
            (error) => {
                console.error("Lỗi lấy vị trí: ", error);
                message.error({ content: 'Đã xảy ra lỗi khi lấy vị trí của bạn.', key: 'gps' });
                setIsSettingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const handleTimekeeping = async (type: 'in' | 'out') => {
        setIsCheckingTime(true);

        if (!navigator.geolocation) {
            message.error('Trình duyệt của bạn không hỗ trợ định vị GPS.');
            setIsCheckingTime(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                const distance = calculateDistance(
                    userLat, userLng,
                    companyLoc.latitude, companyLoc.longitude
                );

                if (distance > MAX_DISTANCE_METERS) {
                    message.error(`Bạn đang ở ngoài phạm vi chấm công! (Cách công ty ${Math.round(distance)}m)`);
                    setIsCheckingTime(false);
                    return;
                }

                try {
                    const email = localStorage.getItem('userEmail');
                    if (!email) {
                        message.error('Không tìm thấy thông tin email.');
                        setIsCheckingTime(false);
                        return;
                    }

                    const now = new Date().toLocaleTimeString('en-GB'); // HH:mm:ss format

                    const res = await apiClient.post(`/timekeeping`, {
                        email,
                        start_time: type === 'in' ? now : undefined,
                        end_time: type === 'out' ? now : undefined,
                    });

                    if (res.ok) {
                        const isIn = type === 'in';
                        const today = new Date().toLocaleDateString('vi-VN', {
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        });
                        notification.success({
                            message: isIn ? '✅ Chấm công vào ca thành công!' : '✅ Chấm công tan ca thành công!',
                            description: (
                                <div style={{ lineHeight: '1.8' }}>
                                    <div><CalendarOutlined style={{ marginRight: 6, color: '#1890ff' }} />{today}</div>
                                    <div><ClockCircleOutlined style={{ marginRight: 6, color: isIn ? '#52c41a' : '#ff4d4f' }} />
                                        {isIn ? 'Giờ vào: ' : 'Giờ ra: '}<strong>{now}</strong>
                                    </div>
                                    <div style={{ marginTop: 4, color: '#8c8c8c', fontSize: 12 }}>
                                        {isIn ? 'Chúc bạn có một ngày làm việc hiệu quả! 💪' : 'Hẹn gặp lại bạn vào ngày mai! 👋'}
                                    </div>
                                </div>
                            ),
                            placement: 'topRight',
                            duration: 5,
                            style: {
                                borderLeft: `4px solid ${isIn ? '#52c41a' : '#ff4d4f'}`,
                                borderRadius: 8,
                            }
                        });
                        if (type === 'in') setHasCheckedIn(true);
                        if (type === 'out') setHasCheckedOut(true);
                    } else {
                        const errData = await res.json().catch(() => ({}));
                        notification.error({
                            message: `Chấm công thất bại`,
                            description: errData?.message || `Không thể thực hiện thao tác ${type === 'in' ? 'vào ca' : 'tan ca'}. Vui lòng thử lại.`,
                            placement: 'topRight',
                            duration: 5,
                        });
                    }
                } catch (err) {
                    console.error('Lỗi khi chấm công:', err);
                    message.error('Lỗi kết nối server');
                } finally {
                    setIsCheckingTime(false);
                }
            },
            (error) => {
                console.error("Lỗi lấy vị trí: ", error);
                message.error('Vui lòng cấp quyền truy cập vị trí để chấm công.');
                setIsCheckingTime(false);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    return (
        <div style={{ padding: 24 }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <Title level={2} style={{ margin: 0 }}>
                    {isPrivileged ? 'Tổng quan hệ thống' : 'Tổng quan của tôi'}
                </Title>

                {/* Chấm công Card cho tất cả người dùng */}
                <div className="flex flex-col sm:flex-row items-center gap-3 bg-white px-5 py-3 rounded-lg shadow-sm border border-gray-100">
                    <span className="text-gray-600 font-medium whitespace-nowrap"><ClockCircleOutlined className="mr-2" />Chấm công hôm nay: </span>
                    <div className="flex items-center gap-2">
                        {!hasCheckedIn ? (
                            <Button
                                type="primary"
                                icon={<LoginOutlined />}
                                onClick={() => handleTimekeeping('in')}
                                loading={isCheckingTime}
                                className="bg-green-500 hover:bg-green-600 border-none"
                            >
                                Vào ca
                            </Button>
                        ) : !hasCheckedOut ? (
                            <Button
                                type="primary"
                                danger
                                icon={<LogoutOutlined />}
                                onClick={() => handleTimekeeping('out')}
                                loading={isCheckingTime}
                            >
                                Tan ca
                            </Button>
                        ) : (
                            <Tag color="success" className="text-sm px-3 py-1 m-0">Đã hoàn thành</Tag>
                        )}

                        {/* Nút thiết lập vị trí dành riêng cho Admin */}
                        {isAdminRole && (
                            <Button
                                type="default"
                                icon={<EnvironmentOutlined />}
                                loading={isSettingLocation}
                                onClick={handleSetCompanyLocation}
                                title="Thiết lập vị trí hiện tại làm vị trí công ty"
                                className="text-gray-500 hover:text-blue-600"
                            />
                        )}
                    </div>
                </div>
            </div>

            <Row gutter={[16, 16]}>
                {isPrivileged && (
                    <>
                        <Col xs={24} sm={12} lg={6}>
                            <Card bordered={false} className="shadow-sm">
                                <Statistic
                                    title="Tổng nhân viên"
                                    value={stats.totalEmployees}
                                    prefix={<UserOutlined />}
                                    valueStyle={{ color: '#3f8600' }}
                                    loading={loading}
                                />
                                <Text type="secondary"><ArrowUpOutlined /> +12% so với tháng trước</Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card bordered={false} className="shadow-sm">
                                <Statistic
                                    title="Phòng ban hoạt động"
                                    value={stats.totalDepartments}
                                    prefix={<ApartmentOutlined />}
                                    valueStyle={{ color: '#1890ff' }}
                                    loading={loading}
                                />
                                <Text type="secondary">Hoạt động ổn định</Text>
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card bordered={false} className="shadow-sm">
                                <Statistic
                                    title="Tỉ lệ chấm công"
                                    value={98.5}
                                    precision={1}
                                    suffix="%"
                                    prefix={<ClockCircleOutlined />}
                                    loading={loading}
                                />
                                <Text type="secondary">Ngày hôm nay</Text>
                            </Card>
                        </Col>
                    </>
                )}
                <Col xs={24} sm={12} lg={isPrivileged ? 6 : 24}>
                    <Card bordered={false} className="shadow-sm">
                        <Statistic
                            title={isPrivileged ? "Yêu cầu chờ xử lý" : "Đơn từ đang chờ của tôi"}
                            value={stats.pendingRequestsCount}
                            prefix={<FileDoneOutlined />}
                            valueStyle={{ color: '#cf1322' }}
                            loading={loading}
                        />
                        <Text type="secondary">
                            {isPrivileged ? "Cần phê duyệt ngay" : "Đang chờ admin phê duyệt"}
                        </Text>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} className="mt-6">
                <Col span={24}>
                    <Card
                        title={isPrivileged ? "Đơn từ đang chờ duyệt" : "Đơn từ mới nộp của tôi"}
                        bordered={false}
                        className="shadow-sm"
                    >
                        <List
                            itemLayout="horizontal"
                            loading={loading}
                            dataSource={recentActivities}
                            renderItem={(item) => (
                                <List.Item
                                    actions={isPrivileged ? [
                                        <Button
                                            key="approve"
                                            type="primary"
                                            size="small"
                                            className="bg-green-500 hover:bg-green-600 border-none"
                                            onClick={() => handleStatusUpdate(item.id, 'APPROVED')}
                                        >
                                            Duyệt
                                        </Button>,
                                        <Button
                                            key="reject"
                                            type="primary"
                                            danger
                                            size="small"
                                            onClick={() => handleStatusUpdate(item.id, 'REJECTED')}
                                        >
                                            Từ chối
                                        </Button>
                                    ] : []}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar
                                                src={item.avatar ? `${API_BASE}/uploads/${item.avatar}` : undefined}
                                                icon={!item.avatar && <UserOutlined />}
                                                style={{ backgroundColor: '#1890ff' }}
                                            />
                                        }
                                        title={<Text strong>{item.userName}</Text>}
                                        description={`${getRequestTypeLabel(item.type)} - ${dayjs(item.time).fromNow()}`}
                                    />
                                </List.Item>
                            )}
                            locale={{ emptyText: 'Không có đơn từ nào' }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

