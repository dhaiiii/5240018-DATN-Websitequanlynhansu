'use client';

import React, { useState } from 'react';

interface Department {
    id: number;
    code: string;
    name: string;
    description: string;
    manager: string;
    employeeCount: number;
    phone: string;
}

const mockDepartments: Department[] = [
    {
        id: 1,
        code: 'IT',
        name: 'Phòng IT',
        description: 'Phòng quản lý công nghệ thông tin và phát triển phần mềm',
        manager: 'Nguyễn Văn A',
        employeeCount: 15,
        phone: '02838123456',
    },
    {
        id: 2,
        code: 'KD',
        name: 'Phòng Kinh doanh',
        description: 'Phòng phát triển kinh doanh và quản lý bán hàng',
        manager: 'Trần Thị B',
        employeeCount: 12,
        phone: '02838123457',
    },
    {
        id: 3,
        code: 'NS',
        name: 'Phòng Nhân sự',
        description: 'Phòng quản lý nhân sự và tuyển dụng',
        manager: 'Lê Văn C',
        employeeCount: 8,
        phone: '02838123458',
    },
    {
        id: 4,
        code: 'KT',
        name: 'Phòng Kế toán',
        description: 'Phòng quản lý tài chính và kế toán',
        manager: 'Phạm Thị D',
        employeeCount: 10,
        phone: '02838123459',
    },
];

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>(mockDepartments);
    const [showForm, setShowForm] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState<Partial<Department>>({});

    const filteredDepartments = departments.filter(dept =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.manager.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddDepartment = () => {
        setFormData({});
        setSelectedDepartment(null);
        setShowForm(true);
    };

    const handleEditDepartment = (dept: Department) => {
        setFormData(dept);
        setSelectedDepartment(dept);
        setShowForm(true);
    };

    const handleSaveDepartment = () => {
        if (selectedDepartment) {
            setDepartments(departments.map(dept => dept.id === selectedDepartment.id ? { ...dept, ...formData } as Department : dept));
        } else {
            const newDepartment: Department = {
                ...(formData as Department),
                id: Math.max(...departments.map(d => d.id), 0) + 1,
            };
            setDepartments([...departments, newDepartment]);
        }
        setShowForm(false);
        setFormData({});
    };

    const handleDeleteDepartment = (id: number) => {
        setDepartments(departments.filter(dept => dept.id !== id));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Phòng ban</h1>
                <button
                    onClick={handleAddDepartment}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm phòng ban
                </button>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-100 dark:border-zinc-700 p-4">
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, mã phòng hoặc người quản lý..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-white"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDepartments.map((dept) => (
                    <div key={dept.id} className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <span className="inline-block px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded text-xs font-semibold mb-2">
                                    {dept.code}
                                </span>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{dept.name}</h3>
                            </div>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{dept.description}</p>

                        <div className="space-y-2 mb-4 pb-4 border-b border-gray-200 dark:border-zinc-700">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Trưởng phòng:</span> {dept.manager}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Số nhân viên:</span> {dept.employeeCount}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Điện thoại:</span> {dept.phone}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEditDepartment(dept)}
                                className="flex-1 px-3 py-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                            >
                                Chỉnh sửa
                            </button>
                            <button
                                onClick={() => handleDeleteDepartment(dept.id)}
                                className="flex-1 px-3 py-2 text-red-600 hover:text-red-700 font-medium text-sm hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {selectedDepartment ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mã phòng ban</label>
                                    <input
                                        type="text"
                                        placeholder="VD: IT, KD"
                                        value={formData.code || ''}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên phòng ban</label>
                                    <input
                                        type="text"
                                        placeholder="Nhập tên phòng ban"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-white"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
                                    <textarea
                                        placeholder="Nhập mô tả phòng ban"
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trưởng phòng</label>
                                    <input
                                        type="text"
                                        placeholder="Nhập tên trưởng phòng"
                                        value={formData.manager || ''}
                                        onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số nhân viên</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={formData.employeeCount || ''}
                                        onChange={(e) => setFormData({ ...formData, employeeCount: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Điện thoại</label>
                                    <input
                                        type="tel"
                                        placeholder="02838123456"
                                        value={formData.phone || ''}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-700 dark:text-white"
                                    />
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
                                onClick={handleSaveDepartment}
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
