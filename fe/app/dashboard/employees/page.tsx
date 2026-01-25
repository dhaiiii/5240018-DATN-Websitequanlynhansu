'use client';

import React, { useState } from 'react';

interface Employee {
    id: number;
    employeeCode: string;
    fullName: string;
    dateOfBirth: string;
    gender: string;
    email: string;
    phone: string;
    address: string;
    avatar?: string;
    department: string;
    position: string;
    status: string;
    password?: string;
}

const mockEmployees: Employee[] = [
    {
        id: 1,
        employeeCode: 'NV001',
        fullName: 'Nguyễn Văn A',
        dateOfBirth: '1990-05-15',
        gender: 'Nam',
        email: 'nguyenvana@company.com',
        phone: '0912345678',
        address: '123 Đường Lê Lợi, TP.HCM',
        department: 'Phòng IT',
        position: 'Trưởng phòng',
        status: 'Đang làm việc',
    },
    {
        id: 2,
        employeeCode: 'NV002',
        fullName: 'Trần Thị B',
        dateOfBirth: '1992-08-20',
        gender: 'Nữ',
        email: 'tranthib@company.com',
        phone: '0987654321',
        address: '456 Đường Nguyễn Huệ, TP.HCM',
        department: 'Phòng Kinh doanh',
        position: 'Chuyên viên',
        status: 'Đang làm việc',
    },
];

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
    const [showForm, setShowForm] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState<Partial<Employee>>({});

    const filteredEmployees = employees.filter(emp =>
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddEmployee = () => {
        setFormData({ password: 'Mac@12345' });
        setSelectedEmployee(null);
        setShowForm(true);
    };

    const handleEditEmployee = (emp: Employee) => {
        setFormData(emp);
        setSelectedEmployee(emp);
        setShowForm(true);
    };

    const handleSaveEmployee = () => {
        if (selectedEmployee) {
            setEmployees(employees.map(emp => emp.id === selectedEmployee.id ? { ...emp, ...formData } as Employee : emp));
        } else {
            const newEmployee: Employee = {
                id: Math.max(...employees.map(e => e.id), 0) + 1,
                password: 'Mac@12345',
                ...formData as Employee,
            };
            setEmployees([...employees, newEmployee]);
        }
        setShowForm(false);
        setFormData({});
    };

    const handleDeleteEmployee = (id: number) => {
        setEmployees(employees.filter(emp => emp.id !== id));
    };

    const getGenderColor = (gender: string) => {
        return gender === 'Nam' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800';
    };

    const getStatusColor = (status: string) => {
        return status === 'Đang làm việc' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Nhân viên</h1>
                <button
                    onClick={handleAddEmployee}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm nhân viên
                </button>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-700 p-4">
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, mã nhân viên hoặc email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-white"
                />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-700/50">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Mã NV</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Họ tên</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Giới tính</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Phòng ban</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Chức vụ</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Trạng thái</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map((emp) => (
                                <tr key={emp.id} className="border-b border-gray-100 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{emp.employeeCode}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{emp.fullName}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getGenderColor(emp.gender)}`}>
                                            {emp.gender}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{emp.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{emp.department}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{emp.position}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(emp.status)}`}>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm space-x-2">
                                        <button
                                            onClick={() => handleEditEmployee(emp)}
                                            className="text-indigo-600 hover:text-indigo-700 font-medium"
                                        >
                                            Chỉnh sửa
                                        </button>
                                        <button
                                            onClick={() => handleDeleteEmployee(emp.id)}
                                            className="text-red-600 hover:text-red-700 font-medium"
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {selectedEmployee ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
                            </h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Thông tin cá nhân */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thông tin cá nhân</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mã nhân viên</label>
                                        <input
                                            type="text"
                                            placeholder="VD: NV001"
                                            value={formData.employeeCode || ''}
                                            onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ tên</label>
                                        <input
                                            type="text"
                                            placeholder="Nhập họ tên"
                                            value={formData.fullName || ''}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày sinh</label>
                                        <input
                                            type="date"
                                            value={formData.dateOfBirth || ''}
                                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giới tính</label>
                                        <select
                                            value={formData.gender || ''}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-white"
                                        >
                                            <option value="">Chọn giới tính</option>
                                            <option value="Nam">Nam</option>
                                            <option value="Nữ">Nữ</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                        <input
                                            type="email"
                                            placeholder="email@company.com"
                                            value={formData.email || ''}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại</label>
                                        <input
                                            type="tel"
                                            placeholder="0912345678"
                                            value={formData.phone || ''}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-white"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Địa chỉ</label>
                                        <input
                                            type="text"
                                            placeholder="Nhập địa chỉ"
                                            value={formData.address || ''}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin công việc */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thông tin công việc</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phòng ban</label>
                                        <select
                                            value={formData.department || ''}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-white"
                                        >
                                            <option value="">Chọn phòng ban</option>
                                            <option value="Phòng IT">Phòng IT</option>
                                            <option value="Phòng Kinh doanh">Phòng Kinh doanh</option>
                                            <option value="Phòng Nhân sự">Phòng Nhân sự</option>
                                            <option value="Phòng Kế toán">Phòng Kế toán</option>
                                            <option value="Phòng Marketing">Phòng Marketing</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chức vụ</label>
                                        <select
                                            value={formData.position || ''}
                                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-white"
                                        >
                                            <option value="">Chọn chức vụ</option>
                                            <option value="Trưởng phòng">Trưởng phòng</option>
                                            <option value="Phó phòng">Phó phòng</option>
                                            <option value="Chuyên viên">Chuyên viên</option>
                                            <option value="Nhân viên">Nhân viên</option>
                                            <option value="Thực tập sinh">Thực tập sinh</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái làm việc</label>
                                        <select
                                            value={formData.status || ''}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-white"
                                        >
                                            <option value="">Chọn trạng thái</option>
                                            <option value="Đang làm việc">Đang làm việc</option>
                                            <option value="Tạm dừng">Tạm dừng</option>
                                            <option value="Đã nghỉ">Đã nghỉ</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-white dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveEmployee}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
