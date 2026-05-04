import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Button, Space, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { apiClient } from '@/lib/api/api-client';

interface SalaryConfigModalProps {
    visible: boolean;
    onClose: () => void;
    userId: number;
    userName: string;
}

const SalaryConfigModal: React.FC<SalaryConfigModalProps> = ({ visible, onClose, userId, userName }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && userId) {
            fetchConfig();
        }
    }, [visible, userId]);

    const fetchConfig = async () => {
        try {
            const res = await apiClient.get(`/payrolls/config/${userId}`);
            if (res.ok) {
                const data = await res.json();
                form.setFieldsValue({
                    base_salary: data.base_salary,
                    allowances: data.allowances || [],
                    bank_account_number: data.bank_account_number,
                    bank_name: data.bank_name,
                });
            }
        } catch (error) {
            console.error('Error fetching salary config:', error);
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            const res = await apiClient.post('/payrolls/config', {
                ...values,
                user_id: userId,
            });

            if (res.ok) {
                message.success('Cấu hình lương thành công');
                onClose();
            } else {
                message.error('Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Validate failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={`Cấu hình lương - ${userName}`}
            open={visible}
            onOk={handleOk}
            onCancel={onClose}
            confirmLoading={loading}
            width={600}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="base_salary"
                    label="Lương cơ bản"
                    rules={[{ required: true, message: 'Vui lòng nhập lương cơ bản' }]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                        addonAfter="VND"
                    />
                </Form.Item>

                <Form.List name="allowances">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'label']}
                                        rules={[{ required: true, message: 'Nhập tên phụ cấp' }]}
                                    >
                                        <Input placeholder="Tên phụ cấp (ví dụ: Ăn trưa)" />
                                    </Form.Item>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'amount']}
                                        rules={[{ required: true, message: 'Nhập số tiền' }]}
                                    >
                                        <InputNumber
                                            placeholder="Số tiền"
                                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                                        />
                                    </Form.Item>
                                    <MinusCircleOutlined onClick={() => remove(name)} />
                                </Space>
                            ))}
                            <Form.Item>
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    Thêm phụ cấp
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>

                <div className="grid grid-cols-2 gap-4">
                    <Form.Item name="bank_account_number" label="Số tài khoản">
                        <Input placeholder="Nhập số tài khoản" />
                    </Form.Item>
                    <Form.Item name="bank_name" label="Ngân hàng">
                        <Input placeholder="Tên ngân hàng" />
                    </Form.Item>
                </div>
            </Form>
        </Modal>
    );
};

export default SalaryConfigModal;
