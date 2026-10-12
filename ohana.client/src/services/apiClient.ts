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
    field?: string;

    constructor(
        message: string,
        status: number,
        field?: string,
    ) {
        super(message);

        this.name = 'ApiError';
        this.status = status;
        this.field = field;
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
        let message = `API Error: ${response.status}`;
        let field: string | undefined;
        try {
            const error = await response.json();
            if (typeof error.message === 'string') message = error.message;
            if (typeof error.field === 'string') field = error.field;
        } catch { /* Keep the existing status fallback for non-JSON responses. */ }
        throw new ApiError(
            message,
            response.status,
            field,
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
