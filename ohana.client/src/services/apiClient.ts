import {
    dispatchAuthExpired,
} from '../auth/authEvents';

/*
 * 開発環境：
 * .env.development の VITE_API_BASE_URL を使用
 *
 * 本番環境：
 * 環境変数がなければ、同一ホストの /api を使用
 */
const API_BASE_URL =
    import.meta.env
        .VITE_API_BASE_URL ||
    '/api';

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

    /*
     * FormDataの場合はブラウザに
     * Content-Typeを設定させる
     */
    if (
        !(options.body instanceof FormData)
    ) {
        headers.set(
            'Content-Type',
            'application/json'
        );
    }

    if (token) {
        headers.set(
            'Authorization',
            `Bearer ${token}`
        );
    }

    const normalizedEndpoint =
        endpoint.startsWith('/')
            ? endpoint
            : `/${endpoint}`;

    const response = await fetch(
        `${API_BASE_URL}${normalizedEndpoint}`,
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

    /*
     * Content-Lengthが0の場合の対策
     */
    const contentLength =
        response.headers.get(
            'content-length'
        );

    if (contentLength === '0') {
        return undefined as TResponse;
    }

    return (
        await response.json()
    ) as TResponse;
};
