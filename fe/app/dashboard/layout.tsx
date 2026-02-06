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
} from '@ant-design/icons';
import { isAdmin } from '@/lib/utils/auth.utils';

const { Header, Sider, Content } = Layout;

const allMenuItems = [
    {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: <Link href="/dashboard">Tổng quan</Link>,
        roles: ['admin', 'user'],
    },
    {
        key: '/dashboard/employees',
        icon: <UserOutlined />,
        label: <Link href="/dashboard/employees">Nhân viên</Link>,
        roles: ['admin'],
    },
    {
        key: '/dashboard/departments',
        icon: <TeamOutlined />,
        label: <Link href="/dashboard/departments">Phòng ban</Link>,
        roles: ['admin', 'user'],
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
        roles: ['admin', 'user'],
    },
    {
        key: '/dashboard/salary',
        icon: <DollarOutlined />,
        label: <Link href="/dashboard/salary">Lương</Link>,
        roles: ['admin'],
    },
    {
        key: '/dashboard/statistics',
        icon: <BarChartOutlined />,
        label: <Link href="/dashboard/statistics">Thống kê</Link>,
        roles: ['admin'],
    },
    {
        key: '/dashboard/accounts',
        icon: <SolutionOutlined />,
        label: <Link href="/dashboard/accounts">Tài khoản</Link>,
        roles: ['admin'],
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

    // Filter menu items based on user role
    useEffect(() => {
        const userRole = localStorage.getItem('userRole') || 'user';
        const filtered = allMenuItems.filter(item =>
            item.roles.includes(userRole)
        );
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
                label: 'Thông tin cá nhân',
            },
            {
                key: 'settings',
                label: 'Cài đặt',
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
        <Layout style={{ minHeight: '100vh' }}>
            <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
                <div className="h-16 flex items-center justify-center border-b border-gray-100">
                    <h1 className={`font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent duration-200 ${collapsed ? 'text-xs' : 'text-xl'}`}>
                        {collapsed ? 'QLNS' : 'Hệ thống QLNS'}
                    </h1>
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
                        <Dropdown menu={userMenu as any} trigger={['click']}>
                            <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
                                <Avatar
                                    src={user?.avatar}
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
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
