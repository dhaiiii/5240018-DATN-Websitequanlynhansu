export default function AccountsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Tài khoản</h1>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Thêm tài khoản
                </button>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 p-6">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-zinc-700">
                                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Tên đăng nhập</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Email</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Vai trò</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Trạng thái</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { username: 'admin', email: 'admin@company.com', role: 'Quản trị viên', status: 'Hoạt động' },
                                { username: 'manager1', email: 'manager1@company.com', role: 'Quản lý', status: 'Hoạt động' },
                                { username: 'user1', email: 'user1@company.com', role: 'Nhân viên', status: 'Hoạt động' },
                                { username: 'user2', email: 'user2@company.com', role: 'Nhân viên', status: 'Bị khóa' },
                            ].map((account, i) => (
                                <tr key={i} className="border-b border-gray-100 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700/30">
                                    <td className="py-3 px-4 text-gray-900 dark:text-white">{account.username}</td>
                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{account.email}</td>
                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{account.role}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            account.status === 'Hoạt động' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {account.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <button className="text-indigo-600 hover:text-indigo-700 text-sm">Chỉnh sửa</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
