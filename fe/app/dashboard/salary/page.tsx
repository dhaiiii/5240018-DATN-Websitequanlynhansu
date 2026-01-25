export default function SalaryPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Lương</h1>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    Tính lương tháng này
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700">
                    <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Tổng chi phí lương</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">2,450,000,000 VND</p>
                    <p className="text-gray-500 text-sm mt-2">Tháng hiện tại</p>
                </div>
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700">
                    <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Lương trung bình</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">12.2M VND</p>
                    <p className="text-gray-500 text-sm mt-2">Trên nhân viên</p>
                </div>
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700">
                    <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Đã thanh toán</h3>
                    <p className="text-3xl font-bold text-green-600">200</p>
                    <p className="text-gray-500 text-sm mt-2">Trong số 200 nhân viên</p>
                </div>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Chi tiết lương</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-zinc-700">
                                <th className="text-left py-3 px-4 font-semibold">Tên</th>
                                <th className="text-left py-3 px-4 font-semibold">Lương cơ bản</th>
                                <th className="text-left py-3 px-4 font-semibold">Phụ cấp</th>
                                <th className="text-left py-3 px-4 font-semibold">Tổng</th>
                                <th className="text-left py-3 px-4 font-semibold">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5].map((_, i) => (
                                <tr key={i} className="border-b border-gray-100 dark:border-zinc-700">
                                    <td className="py-3 px-4">Nhân viên {i + 1}</td>
                                    <td className="py-3 px-4">10,000,000</td>
                                    <td className="py-3 px-4">2,000,000</td>
                                    <td className="py-3 px-4 font-medium">12,000,000 VND</td>
                                    <td className="py-3 px-4">
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Đã thanh toán</span>
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
