'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Layout, Menu, Avatar, Dropdown, theme } from 'antd';
import {
    DashboardOutlined,
    UserOutlined,
    TeamOutlined,
    ScheduleOutlined,
    DollarOutlined,
    BarChartOutlined,
    SolutionOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    DownOutlined,
    IdcardOutlined,
    FileTextOutlined,
    SettingOutlined,
    CalendarOutlined,
} from '@ant-design/icons';
import { isAdmin, isManager, isUser } from '@/lib/utils/auth.utils';
import { getAvatarUrl } from '@/lib/utils/image.utils';
import NotificationsBell from '@/components/layout/NotificationsBell';

const { Header, Sider, Content } = Layout;

const allMenuItems = [
    {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: <Link href="/dashboard">Tổng quan</Link>,
        roles: ['admin', 'manager', 'user'],
    },
    {
        key: '/dashboard/employees',
        icon: <UserOutlined />,
        label: <Link href="/dashboard/employees">Nhân viên</Link>,
        roles: ['admin', 'manager'],
    },
    {
        key: '/dashboard/departments',
        icon: <TeamOutlined />,
        label: <Link href="/dashboard/departments">Phòng ban</Link>,
        roles: ['admin', 'manager', 'user'],
    },
    {
        key: '/dashboard/roles',
        icon: <IdcardOutlined />,
        label: <Link href="/dashboard/roles">Chức vụ</Link>,
        roles: ['admin'],
    },
    {
        key: '/dashboard/timekeeping',
        icon: <ScheduleOutlined />,
        label: <Link href="/dashboard/timekeeping">Chấm công</Link>,
        roles: ['admin', 'manager', 'user'],
    },
    {
        key: '/dashboard/requests',
        icon: <FileTextOutlined />,
        label: <Link href="/dashboard/requests">Đơn từ</Link>,
        roles: ['admin', 'manager', 'user'],
    },
    {
        key: '/dashboard/salary',
        icon: <DollarOutlined />,
        label: <Link href="/dashboard/salary">Lương</Link>,
        roles: ['admin', 'user'],
    },
    {
        key: '/dashboard/statistics',
        icon: <BarChartOutlined />,
        label: <Link href="/dashboard/statistics">Thống kê</Link>,
        roles: ['admin', 'manager'],
    },
    {
        key: '/dashboard/meeting-scheduler',
        icon: <CalendarOutlined />,
        label: <Link href="/dashboard/meeting-scheduler">Lịch họp</Link>,
        roles: ['admin', 'manager', 'user'],
    },
    {
        key: '/dashboard/accounts',
        icon: <SolutionOutlined />,
        label: <Link href="/dashboard/accounts">Tài khoản</Link>,
        roles: ['admin'],
    },
    {
        key: '/dashboard/settings',
        icon: <SettingOutlined />,
        label: 'Cài đặt',
        roles: ['admin'],
        children: [
            {
                key: '/dashboard/settings/working-hours',
                label: <Link href="/dashboard/settings/working-hours">Giờ làm việc</Link>,
            },
        ]
    },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<{ firstName: string; lastName: string; email: string; avatar: string | null } | null>(null);
    const [collapsed, setCollapsed] = useState(false);
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const pathname = usePathname();
    const router = useRouter();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    // Check if user is authenticated
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            router.push('/login');
        }
    }, [router]);

    useEffect(() => {
        const checkRoleInclude = (itemRoles: string[]) => {
            if (isAdmin() && itemRoles.includes('admin')) return true;
            if (isManager() && itemRoles.includes('manager')) return true;
            if (isUser() && itemRoles.includes('user')) return true;

            // Allow admin to see user items if they want to? By default admin should probably see everything except if excluded
            if (isAdmin()) return true;

            return false;
        };

        const filtered = allMenuItems.filter(item => checkRoleInclude(item.roles));
        setMenuItems(filtered);


        // Get user info for header
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                setUser(JSON.parse(userData));
            } catch (e) {
                console.error('Error parsing user data', e);
            }
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        localStorage.removeItem('permission_level');
        router.push('/login');
    };

    const handleMenuClick = (e: any) => {
        if (e.key === 'logout') {
            handleLogout();
        }
    };

    const userMenu = {
        items: [
            {
                key: 'profile',
                label: <Link href="/dashboard/profile">Thông tin cá nhân</Link>,
            },
            {
                key: 'settings',
                label: <Link href="/dashboard/settings">Cài đặt</Link>,
            },
            {
                type: 'divider',
            },
            {
                key: 'logout',
                label: 'Đăng xuất',
                danger: true,
            },
        ],
        onClick: handleMenuClick,
    };


    return (
        <Layout style={{ height: '100vh', overflow: 'hidden' }}>
            <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
                <div className="h-16 flex items-center justify-center border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        {/* Company Logo MACIT */}
                        <div className="w-8 h-8 bg-gradient-to-br from-[#003087] to-[#0070ba] rounded-lg flex items-center justify-center shadow-sm">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        {!collapsed && (
                            <span className="text-xl font-bold tracking-tight text-[#003087] uppercase ml-1">MACIT</span>
                        )}
                    </div>
                </div>
                <Menu
                    theme="light"
                    mode="inline"
                    selectedKeys={[pathname]}
                    items={menuItems}
                    style={{ borderRight: 0 }}
                />
            </Sider>
            <Layout>
                <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div
                        className="cursor-pointer text-lg hover:text-indigo-600 transition-colors"
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationsBell />
                        <Dropdown menu={userMenu as any} trigger={['click']}>
                            <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
                                <Avatar
                                    src={getAvatarUrl(user?.avatar || null)}
                                    style={{ backgroundColor: user?.avatar ? 'transparent' : '#87d068' }}
                                    icon={!user?.avatar && <UserOutlined />}
                                />
                                <div className="hidden md:block text-sm">
                                    <div className="font-medium text-gray-900">
                                        {user ? `${user.firstName} ${user.lastName}` : 'Người dùng'}
                                    </div>
                                    <div className="text-xs text-gray-500">{user?.email || 'email@company.com'}</div>
                                </div>
                                <DownOutlined className="text-xs text-gray-400" />
                            </div>
                        </Dropdown>
                    </div>
                </Header>
                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 24,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                        overflowY: 'auto',
                    }}
                >
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
