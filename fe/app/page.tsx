'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (token) {
      // Có token, chuyển đến dashboard
      router.push('/dashboard');
    } else {
      // Không có token, chuyển đến trang đăng nhập
      router.push('/login');
    }
  }, [router]);

  // Hiển thị loading trong khi đang kiểm tra và chuyển hướng
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-xl font-semibold">Đang tải...</p>
      </div>
    </div>
  );
}
