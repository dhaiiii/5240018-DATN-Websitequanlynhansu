const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('access_token');

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Handle unauthorized error (e.g., redirect to login)
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }

    return response;
}

export const apiClient = {
    get: (url: string, options?: RequestInit) => fetchWithAuth(url, { ...options, method: 'GET' }),
    post: (url: string, body: any, options?: RequestInit) => fetchWithAuth(url, {
        ...options,
        method: 'POST',
        body: JSON.stringify(body)
    }),
    patch: (url: string, body: any, options?: RequestInit) => fetchWithAuth(url, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(body)
    }),
    delete: (url: string, options?: RequestInit) => fetchWithAuth(url, { ...options, method: 'DELETE' }),
};
