export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: 'Tổng nhân viên', value: '1,234', change: '+12%', color: 'indigo' },
                    { title: 'Phòng ban hoạt động', value: '15', change: '0%', color: 'purple' },
                    { title: 'Tỉ lệ chấm công', value: '98.5%', change: '+2.1%', color: 'green' },
                    { title: 'Yêu cầu chờ xử lý', value: '23', change: '-5%', color: 'orange' },
                ].map((stat, index) => (
                    <div key={index} className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</h3>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
                            <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-600' : stat.change === '0%' ? 'text-gray-500' : 'text-red-600'}`}>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Hoạt động gần đây</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-zinc-700/30 rounded-xl transition-colors">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <span className="font-bold text-sm">JS</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">John Smith nộp đơn xin phép</p>
                                <p className="text-xs text-gray-500">2 giờ trước</p>
                            </div>
                            <span className="px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30 rounded-full">
                                Chờ xử lý
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
