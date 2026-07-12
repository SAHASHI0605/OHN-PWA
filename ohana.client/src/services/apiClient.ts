import {
    dispatchAuthExpired,
} from '../auth/authEvents';

const API_BASE_URL =
    'https://localhost:7090/api';

export class ApiError extends Error {
    status: number;

    constructor(
        message: string,
        status: number
    ) {
        super(message);

        this.name = 'ApiError';
        this.status = status;
    }
}

export const apiClient = async <TResponse>(
    endpoint: string,
    options: RequestInit = {}
): Promise<TResponse> => {
    const token =
        localStorage.getItem(
            'access_token'
        );

    const headers =
        new Headers(options.headers);

    headers.set(
        'Content-Type',
        'application/json'
    );

    if (token) {
        headers.set(
            'Authorization',
            `Bearer ${token}`
        );
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers,
        }
    );

    /*
     * JWTが無効または期限切れの場合
     */
    if (
        response.status === 401 &&
        token
    ) {
        sessionStorage.setItem(
            'logout_message',
            'ログインの有効期限が切れました。再度ログインしてください。'
        );

        dispatchAuthExpired();

        throw new ApiError(
            '認証の有効期限が切れました。',
            response.status
        );
    }

    if (!response.ok) {
        throw new ApiError(
            `API Error: ${response.status}`,
            response.status
        );
    }

    /*
     * 204 No Content対策
     */
    if (response.status === 204) {
        return undefined as TResponse;
    }

    return (
        await response.json()
    ) as TResponse;
};
