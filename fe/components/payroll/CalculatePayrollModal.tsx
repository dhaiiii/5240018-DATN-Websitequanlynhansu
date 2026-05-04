import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Button, Select, message, Descriptions, Divider } from 'antd';
import { apiClient } from '@/lib/api/api-client';

interface CalculatePayrollModalProps {
    visible: boolean;
    onClose: () => void;
    userId?: number;
    userName?: string;
    onSuccess?: () => void;
}

const { Option } = Select;

const CalculatePayrollModal: React.FC<CalculatePayrollModalProps> = ({ visible, onClose, userId, userName, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    useEffect(() => {
        if (visible) {
            if (!userId) {
                fetchUsers();
            } else {
                setSelectedUser({ id: userId, first_name: userName });
                form.setFieldsValue({ user_id: userId });
            }
            form.setFieldsValue({
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                standard_days: 22,
            });
        }
    }, [visible, userId, userName]);

    const fetchUsers = async () => {
        try {
            const res = await apiClient.get('/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleCalculate = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            const res = await apiClient.post('/payrolls/calculate', values);

            if (res.ok) {
                message.success('Tính lương và lưu thành công');
                if (onSuccess) onSuccess();
                onClose();
            } else {
                message.error('Có lỗi xảy ra khi tính lương');
            }
        } catch (error) {
            console.error('Validate failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Tính lương nhân viên"
            open={visible}
            onOk={handleCalculate}
            onCancel={onClose}
            confirmLoading={loading}
            width={500}
            okText="Tính và Lưu"
            cancelText="Hủy"
        >
            <Form form={form} layout="vertical">
                {!userId && (
                    <Form.Item
                        name="user_id"
                        label="Nhân viên"
                        rules={[{ required: true, message: 'Vui lòng chọn nhân viên' }]}
                    >
                        <Select
                            placeholder="Chọn nhân viên"
                            showSearch
                            optionFilterProp="children"
                        >
                            {users.map(u => (
                                <Option key={u.id} value={u.id}>{u.last_name} {u.first_name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Form.Item name="month" label="Tháng" rules={[{ required: true }]}>
                        <InputNumber min={1} max={12} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="year" label="Năm" rules={[{ required: true }]}>
                        <InputNumber min={2020} style={{ width: '100%' }} />
                    </Form.Item>
                </div>

                <Form.Item name="standard_days" label="Số công chuẩn (ngày)" tooltip="Số ngày làm việc quy định trong tháng">
                    <InputNumber min={1} max={31} style={{ width: '100%' }} />
                </Form.Item>

                <Divider orientation={"left" as any} orientationMargin="0">Dữ liệu tùy chỉnh (Overtime)</Divider>

                <div className="grid grid-cols-2 gap-4">
                    <Form.Item name="ot_hours" label="Số giờ tăng ca (OT)" initialValue={0}>
                        <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="ot_pay" label="Tiền tăng ca (VND)" initialValue={0}>
                        <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => Number(value!.replace(/\$\s?|(,*)/g, '')) as any}
                        />
                    </Form.Item>
                </div>

                <Form.Item name="total_deductions" label="Các khoản khấu trừ (VND)" initialValue={0} tooltip="Phạt đi muộn, BHXH, v.v.">
                    <InputNumber
                        min={0}
                        style={{ width: '100%' }}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => Number(value!.replace(/\$\s?|(,*)/g, '')) as any}
                    />
                </Form.Item>

                <Form.Item name="note" label="Ghi chú">
                    <Input.TextArea rows={2} placeholder="Nhập lý do thưởng/phạt hoặc ghi chú khác" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CalculatePayrollModal;
