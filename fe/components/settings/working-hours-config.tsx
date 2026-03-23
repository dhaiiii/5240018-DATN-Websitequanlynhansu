'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, TimePicker, DatePicker, message, Card, Space, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '@/lib/api/api-client';

interface WorkingHours {
    id: number;
    startTime: string;
    endTime: string;
    effectiveDate: string;
    createdAt: string;
}

export default function WorkingHoursConfig() {
    const [data, setData] = useState<WorkingHours[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/working-hours');
            if (res.ok) {
                const result = await res.json();
                setData(result);
            } else {
                message.error('Không thể tải dữ liệu cấu hình giờ làm');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            message.error('Lỗi kết nối máy chủ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = async (values: any) => {
        try {
            const res = await apiClient.post('/working-hours', {
                startTime: values.startTime.format('HH:mm'),
                endTime: values.endTime.format('HH:mm'),
                effectiveDate: values.effectiveDate.format('YYYY-MM-DD'),
            });

            if (res.ok) {
                message.success('Thêm cấu hình giờ làm thành công');
                setIsModalVisible(false);
                form.resetFields();
                fetchData();
            } else {
                message.error('Thêm cấu hình thất bại');
            }
        } catch (error) {
            message.error('Lỗi kết nối');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const res = await apiClient.delete(`/working-hours/${id}`);

            if (res.ok) {
                message.success('Xóa cấu hình thành công');
                fetchData();
            } else {
                message.error('Xóa thất bại');
            }
        } catch (error) {
            message.error('Lỗi kết nối');
        }
    };

    const columns = [
        {
            title: 'Giờ bắt đầu',
            dataIndex: 'startTime',
            key: 'startTime',
            render: (text: string) => <span className="font-semibold text-indigo-600">{text}</span>,
        },
        {
            title: 'Giờ kết thúc',
            dataIndex: 'endTime',
            key: 'endTime',
            render: (text: string) => <span className="font-semibold text-purple-600">{text}</span>,
        },
        {
            title: 'Ngày áp dụng',
            dataIndex: 'effectiveDate',
            key: 'effectiveDate',
            render: (text: string) => dayjs(text).format('DD/MM/YYYY'),
        },
        {
            title: 'Trạng thái',
            key: 'status',
            render: (_: any, record: WorkingHours) => {
                const now = dayjs();
                const effective = dayjs(record.effectiveDate);
                const sorted = [...data].sort((a, b) => dayjs(b.effectiveDate).unix() - dayjs(a.effectiveDate).unix());
                const active = sorted.find(item => dayjs(item.effectiveDate).startOf('day').isBefore(now) || dayjs(item.effectiveDate).isSame(now, 'day'));

                if (active?.id === record.id) {
                    return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Đang áp dụng</span>;
                }
                if (effective.isAfter(now)) {
                    return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">Sắp tới</span>;
                }
                return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Hết hiệu lực</span>;
            }
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: WorkingHours) => (
                <Popconfirm
                    title="Bạn có chắc chắn muốn xóa cấu hình này?"
                    onConfirm={() => handleDelete(record.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                    <HistoryOutlined />
                    <span className="font-medium">Lịch sử cấu hình giờ làm</span>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalVisible(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                >
                    Thêm cấu hình mới
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 5 }}
                className="border rounded-xl overflow-hidden"
            />

            <Modal
                title={
                    <div className="flex items-center gap-2 border-b pb-4 mb-4">
                        <HistoryOutlined className="text-indigo-600" />
                        <span>Thêm cấu hình giờ làm mới</span>
                    </div>
                }
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                centered
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleAdd}
                    initialValues={{
                        effectiveDate: dayjs(),
                    }}
                >
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="startTime"
                            label="Giờ bắt đầu"
                            rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu' }]}
                        >
                            <TimePicker format="HH:mm" className="w-full" />
                        </Form.Item>
                        <Form.Item
                            name="endTime"
                            label="Giờ kết thúc"
                            rules={[{ required: true, message: 'Vui lòng chọn giờ kết thúc' }]}
                        >
                            <TimePicker format="HH:mm" className="w-full" />
                        </Form.Item>
                    </div>
                    <Form.Item
                        name="effectiveDate"
                        label="Ngày áp dụng"
                        rules={[{ required: true, message: 'Vui lòng chọn ngày áp dụng' }]}
                        help="Cấu hình này sẽ bắt đầu có hiệu lực từ ngày đã chọn"
                    >
                        <DatePicker className="w-full" />
                    </Form.Item>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button onClick={() => setIsModalVisible(false)}>Hủy</Button>
                        <Button type="primary" htmlType="submit" className="bg-indigo-600">
                            Lưu cấu hình
                        </Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
