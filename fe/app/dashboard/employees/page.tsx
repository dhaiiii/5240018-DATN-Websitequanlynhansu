'use client';

import React, { useState, useEffect } from 'react';

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

const API_URL = 'http://localhost:3001/api/users';

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState<Partial<Employee>>({});
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const fetchEmployees = async () => {
        try {
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            // Map backend fields to frontend interface if needed, or adjust interface
            // Assuming backend returns User[] with first_name, last_name. 
            // We map them to match our Employee interface temporarily or update interface.
            const mappedData = data.map((u: any) => ({
                id: u.id,
                employeeCode: `NV${u.id.toString().padStart(3, '0')}`, // Mock code gen
                fullName: `${u.first_name} ${u.last_name}`,
                email: u.email,
                position: u.role || 'Nhân viên', // Map role to position logic
                department: 'Chưa phân loại', // Backend lacks department currently
                status: u.is_active ? 'Đang làm việc' : 'Đã nghỉ',
                phone: u.phone,
                avatar: u.avatar,
                gender: 'Nam', // Default
            }));
            setEmployees(mappedData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const filteredEmployees = employees.filter(emp =>
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddEmployee = () => {
        setFormData({ password: 'Mac@12345', status: 'Đang làm việc' });
        setAvatarPreview(null);
        setSelectedEmployee(null);
        setShowForm(true);
    };

    const handleEditEmployee = (emp: Employee) => {
        setFormData(emp);
        setAvatarPreview(emp.avatar || null);
        setSelectedEmployee(emp);
        setShowForm(true);
    };

    const handleSaveEmployee = async () => {
        const payload = {
            first_name: formData.fullName?.split(' ').slice(0, -1).join(' ') || 'User',
            last_name: formData.fullName?.split(' ').slice(-1).join(' ') || 'Name',
            email: formData.email,
            password: 'Mac@12345',
            phone: formData.phone,
            address: formData.address,
            avatar: formData.avatar, // Base64 string
            role: formData.position || 'user',
            is_active: formData.status === 'Đang làm việc',
        };

        try {
            if (selectedEmployee) {
                // Update
                const res = await fetch(`${API_URL}/${selectedEmployee.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (res.ok) fetchEmployees();
            } else {
                // Create
                const res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (res.ok) fetchEmployees();
            }
            setShowForm(false);
            setFormData({});
            setAvatarPreview(null);
        } catch (error) {
            console.error('Error saving:', error);
            alert('Có lỗi xảy ra khi lưu dữ liệu');
        }
    };

    const handleDeleteEmployee = async (id: number) => {
        if (!confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;
        try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            fetchEmployees();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const getGenderColor = (gender: string) => {
        return gender === 'Nam' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800';
    };

    const getStatusColor = (status: string) => {
        return status === 'Đang làm việc' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Preview
            const url = URL.createObjectURL(file);
            setAvatarPreview(url);

            // Convert to Base64 for API
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setFormData({ ...formData, avatar: base64String });
            };
            reader.readAsDataURL(file);
        }
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
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                        <div className="flex items-center gap-3">
                                            {emp.avatar ? (
                                                <img src={emp.avatar} alt={emp.fullName} className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                    {emp.fullName.charAt(0)}
                                                </div>
                                            )}
                                            {emp.fullName}
                                        </div>
                                    </td>
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-800 rounded-3xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden grid grid-cols-1 md:grid-cols-12 relative animate-in zoom-in-95 duration-200">

                        {/* Close Button - Absolute Top Right */}
                        <button
                            onClick={() => setShowForm(false)}
                            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Left Side - Decorative/Info */}
                        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-zinc-700 dark:to-zinc-800 p-8 flex-col justify-center items-center text-center relative overflow-hidden">
                            {/* Decorative background circles */}
                            <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                            <div className="relative z-10 flex flex-col items-center">
                                <h3 className="text-2xl font-bold text-indigo-900 dark:text-white mb-2">
                                    Quản lý Nhân sự
                                </h3>
                                <p className="text-indigo-700 dark:text-indigo-200 mb-8 max-w-xs mx-auto">
                                    Thêm nhân viên mới vào hệ thống để bắt đầu quản lý hồ sơ.
                                </p>

                                <div className="relative group cursor-pointer">
                                    <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-white shadow-xl flex items-center justify-center bg-white hover:border-indigo-200 transition-all duration-300">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-indigo-400">
                                                <svg className="w-20 h-20 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-base font-medium">Tải ảnh lên</span>
                                            </div>
                                        )}

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Action Button/Label */}
                                    <label htmlFor="avatar-upload-left" className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white text-indigo-600 px-4 py-1.5 rounded-full shadow-lg text-sm font-medium hover:bg-indigo-50 transition-colors cursor-pointer border border-indigo-100 whitespace-nowrap">
                                        Chọn ảnh
                                    </label>
                                    <input
                                        id="avatar-upload-left"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Form */}
                        <div className="col-span-1 md:col-span-7 p-8 overflow-y-auto max-h-[90vh]">
                            <div className="mb-8 text-center md:text-left">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    {selectedEmployee ? 'Cập nhật thông tin' : 'Thêm nhân viên mới'}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Vui lòng nhập đầy đủ thông tin bên dưới
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ và tên</label>
                                    <input
                                        type="text"
                                        placeholder="Nhập họ tên nhân viên"
                                        value={formData.fullName || ''}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-white transition-all bg-gray-50 dark:bg-zinc-900/50"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mã nhân viên</label>
                                        <input
                                            type="text"
                                            placeholder="VD: NV001"
                                            value={formData.employeeCode || ''}
                                            onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-white transition-all bg-gray-50 dark:bg-zinc-900/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chức vụ</label>
                                        <select
                                            value={formData.position || ''}
                                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-white transition-all bg-gray-50 dark:bg-zinc-900/50"
                                        >
                                            <option value="">Chọn chức vụ</option>
                                            <option value="Trưởng phòng">Trưởng phòng</option>
                                            <option value="Phó phòng">Phó phòng</option>
                                            <option value="Chuyên viên">Chuyên viên</option>
                                            <option value="Nhân viên">Nhân viên</option>
                                            <option value="Thực tập sinh">Thực tập sinh</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                        <input
                                            type="email"
                                            placeholder="email@company.com"
                                            value={formData.email || ''}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-white transition-all bg-gray-50 dark:bg-zinc-900/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại</label>
                                        <input
                                            type="tel"
                                            placeholder="0912345678"
                                            value={formData.phone || ''}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-white transition-all bg-gray-50 dark:bg-zinc-900/50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phòng ban</label>
                                        <select
                                            value={formData.department || ''}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-white transition-all bg-gray-50 dark:bg-zinc-900/50"
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
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
                                        <select
                                            value={formData.status || ''}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-800 dark:text-white transition-all bg-gray-50 dark:bg-zinc-900/50"
                                        >
                                            <option value="Đang làm việc">Đang làm việc</option>
                                            <option value="Đã nghỉ">Đã nghỉ</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-8 pt-4">
                                    <button
                                        onClick={handleSaveEmployee}
                                        className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all shadow-lg hover:shadow-indigo-200"
                                    >
                                        {selectedEmployee ? 'Cập nhật nhân viên' : 'Thêm nhân viên ngay'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
