    const API_BASE_URL = 'https://localhost:7090/api';

export const apiClient = async <TResponse>(
    endpoint: string,
    options: RequestInit = {}
): Promise<TResponse> => {
    const token = localStorage.getItem('access_token');

    const headers = new Headers(options.headers);
    
    headers.set('Content-Type', 'application/json');

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    return (await response.json()) as TResponse;
};
