export default function TimekeepingPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chấm công</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700">
                    <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Hôm nay có mặt</h3>
                    <p className="text-3xl font-bold text-green-600">156/200</p>
                    <p className="text-gray-500 text-sm mt-2">78% tỉ lệ chấm công</p>
                </div>
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700">
                    <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Vắng</h3>
                    <p className="text-3xl font-bold text-red-600">44</p>
                    <p className="text-gray-500 text-sm mt-2">22% vắng không phép</p>
                </div>
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700">
                    <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Xin phép</h3>
                    <p className="text-3xl font-bold text-yellow-600">12</p>
                    <p className="text-gray-500 text-sm mt-2">6% xin phép</p>
                </div>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Chi tiết chấm công</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-zinc-700">
                                <th className="text-left py-3 px-4 font-semibold">Nhân viên</th>
                                <th className="text-left py-3 px-4 font-semibold">Vào</th>
                                <th className="text-left py-3 px-4 font-semibold">Ra</th>
                                <th className="text-left py-3 px-4 font-semibold">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4, 5].map((_, i) => (
                                <tr key={i} className="border-b border-gray-100 dark:border-zinc-700">
                                    <td className="py-3 px-4">Nhân viên {i + 1}</td>
                                    <td className="py-3 px-4">08:00</td>
                                    <td className="py-3 px-4">17:00</td>
                                    <td className="py-3 px-4">
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Có mặt</span>
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
