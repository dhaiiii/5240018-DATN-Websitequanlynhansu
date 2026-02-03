'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const menuItems = [
    {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: <Link href="/dashboard">Tổng quan</Link>,
    },
    {
        key: '/dashboard/employees',
        icon: <UserOutlined />,
        label: <Link href="/dashboard/employees">Nhân viên</Link>,
    },
    {
        key: '/dashboard/departments',
        icon: <TeamOutlined />,
        label: <Link href="/dashboard/departments">Phòng ban</Link>,
    },
    {
        key: '/dashboard/timekeeping',
        icon: <ScheduleOutlined />,
        label: <Link href="/dashboard/timekeeping">Chấm công</Link>,
    },
    {
        key: '/dashboard/salary',
        icon: <DollarOutlined />,
        label: <Link href="/dashboard/salary">Lương</Link>,
    },
    {
        key: '/dashboard/statistics',
        icon: <BarChartOutlined />,
        label: <Link href="/dashboard/statistics">Thống kê</Link>,
    },
    {
        key: '/dashboard/accounts',
        icon: <SolutionOutlined />,
        label: <Link href="/dashboard/accounts">Tài khoản</Link>,
    },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

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
                                <Avatar style={{ backgroundColor: '#87d068' }} icon={<UserOutlined />} />
                                <div className="hidden md:block text-sm">
                                    <div className="font-medium text-gray-900">Người dùng Admin</div>
                                    <div className="text-xs text-gray-500">admin@company.com</div>
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
