export default function StatisticsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thống kê</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Nhân viên theo phòng ban</h3>
                    <div className="space-y-3">
                        {[
                            { name: 'Phòng IT', count: 45 },
                            { name: 'Phòng Kinh doanh', count: 32 },
                            { name: 'Phòng Nhân sự', count: 28 },
                            { name: 'Phòng Kế toán', count: 22 },
                        ].map((dept, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-gray-700 dark:text-gray-300">{dept.name}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-indigo-600"
                                            style={{ width: `${(dept.count / 45) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm text-gray-500 w-8 text-right">{dept.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tỉ lệ chấm công hàng tháng</h3>
                    <div className="space-y-3">
                        {[
                            { month: 'Tháng 1', rate: 95 },
                            { month: 'Tháng 2', rate: 92 },
                            { month: 'Tháng 3', rate: 98 },
                            { month: 'Tháng 4', rate: 96 },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-gray-700 dark:text-gray-300">{item.month}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-green-600"
                                            style={{ width: `${item.rate}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm text-gray-500 w-8 text-right">{item.rate}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
