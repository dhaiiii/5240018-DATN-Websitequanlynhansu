'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, LoginRequest } from '@/lib/api/auth';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    // Initial load: Check token and remembered credentials
    useEffect(() => {
        // Load remembered credentials
        const savedEmail = localStorage.getItem('rememberedEmail');
        const savedPassword = localStorage.getItem('rememberedPassword');
        if (savedEmail && savedPassword) {
            setEmail(savedEmail);
            setPassword(savedPassword);
            setRememberMe(true);
        }

        // Check if user is already logged in
        const token = localStorage.getItem('access_token');
        if (token) {
            router.push('/dashboard');
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            const credentials: LoginRequest = { email, password };
            const response = await authApi.login(credentials);

            // Lưu thông tin user vào localStorage
            localStorage.setItem('user', JSON.stringify(response));
            localStorage.setItem('userEmail', response.email);
            localStorage.setItem('userRole', response.role);
            localStorage.setItem('permission_level', response.permission_level);
            localStorage.setItem('access_token', response.access_token);

            // Handle Remember Me
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
                localStorage.setItem('rememberedPassword', password);
            } else {
                localStorage.removeItem('rememberedEmail');
                localStorage.removeItem('rememberedPassword');
            }

            setSuccess('Đăng nhập thành công!');

            // Chuyển hướng tới dashboard sau 1 giây
            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-white font-sans text-gray-800">
            <div className="w-full max-w-[420px] p-8 md:p-10 border border-gray-100 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.05)] bg-white">
                <div className="flex flex-col items-center justify-center mb-8">
                    {/* Company Logo MACIT */}
                    <div className="w-14 h-14 bg-gradient-to-br from-[#003087] to-[#0070ba] rounded-2xl flex items-center justify-center shadow-md mb-3">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <span className="text-[26px] font-bold tracking-tight text-[#003087] uppercase mb-1">MACIT</span>
                    <h1 className="text-xl font-medium text-gray-600">Đăng nhập tài khoản</h1>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm text-center">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-600 text-sm text-center">
                            {success}
                        </div>
                    )}

                    <div>
                        <input
                            id="email"
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-3.5 border border-gray-300 rounded-md focus:outline-none focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba] transition-colors placeholder-gray-500 text-[15px]"
                            placeholder="Email hoặc số điện thoại"
                        />
                    </div>

                    <div>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-3.5 border border-gray-300 rounded-md focus:outline-none focus:border-[#0070ba] focus:ring-1 focus:ring-[#0070ba] transition-colors placeholder-gray-500 text-[15px]"
                            placeholder="Mật khẩu"
                        />
                    </div>

                    <div className="flex items-center mt-1">
                        <label className="flex items-center text-sm text-gray-600 cursor-pointer group">
                            <div className="relative flex items-center justify-center w-5 h-5 mr-3 border-2 border-gray-300 rounded focus-within:border-[#0070ba] transition-colors overflow-hidden group-hover:border-[#0070ba]">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {rememberMe && (
                                    <div className="absolute inset-0 bg-[#0070ba] flex items-center justify-center pointer-events-none">
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            Ghi nhớ mật khẩu
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 mt-2 bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold text-[15px] rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            'Đăng nhập'
                        )}
                    </button>

                    <div className="text-center mt-2">
                        <a href="#" className="font-semibold text-[#0070ba] hover:text-[#005ea6] hover:underline text-[14px]">
                            Quên mật khẩu?
                        </a>
                    </div>

                    <div className="flex items-center justify-center my-3">
                        <div className="h-px bg-gray-300 flex-1"></div>
                        <span className="px-4 text-gray-500 text-[13px]">hoặc</span>
                        <div className="h-px bg-gray-300 flex-1"></div>
                    </div>

                    <button
                        type="button"
                        className="w-full py-3.5 bg-[#f5f7fa] border border-gray-200 hover:bg-[#ebedf0] text-gray-800 font-bold text-[15px] rounded-md transition-colors"
                    >
                        Đăng ký
                    </button>
                </form>
            </div>
        </div>
    );
}
