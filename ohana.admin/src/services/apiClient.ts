import {
    authStorage,
} from '../auth/authStorage';

import {
    dispatchAuthExpired,
} from '../auth/authEvents';

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ??
    'https://localhost:7090/api';

const DEFAULT_TIMEOUT_MS = 10000;

type ApiRequestOptions = RequestInit & {
    timeoutMs?: number;
};

async function request<T>(
    path: string,
    options: ApiRequestOptions = {},
): Promise<T> {
    const {
        timeoutMs = DEFAULT_TIMEOUT_MS,
        headers,
        ...requestOptions
    } = options;

    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
        controller.abort();
    }, timeoutMs);

    try {
        const response = await fetch(
            `${API_BASE_URL}${path}`,
            {
                ...requestOptions,
                headers: {
                    'Content-Type': 'application/json',

                    ...(authStorage.getToken()
                        ? {
                            Authorization:
                                `Bearer ${authStorage.getToken()}`,
                        }
                        : {}),

                    ...headers,
                },
                signal: controller.signal,
            },
        );

        if (response.status === 401) {
            authStorage.removeToken();

            dispatchAuthExpired();

            throw new Error(
                'Authentication expired.',
            );
        }

        if (!response.ok) {
            throw new Error(
                `API request failed: ${response.status} ${response.statusText}`,
            );
        }

        if (response.status === 204) {
            return undefined as T;
        }

        const contentType =
            response.headers.get('content-type');

        if (
            contentType?.includes(
                'application/json',
            )
        ) {
            return (await response.json()) as T;
        }

        return (await response.text()) as T;
    }
    catch (error) {
        if (
            error instanceof DOMException &&
            error.name === 'AbortError'
        ) {
            throw new Error(
                'API request timed out.',
                {
                    cause: error,
                },
            );
        }

        throw error;
    }
    finally {
        window.clearTimeout(timeoutId);
    }
}

export const apiClient = {
    get<T>(
        path: string,
        options?: ApiRequestOptions,
    ): Promise<T> {
        return request<T>(
            path,
            {
                ...options,
                method: 'GET',
            },
        );
    },

    post<T>(
        path: string,
        body?: unknown,
        options?: ApiRequestOptions,
    ): Promise<T> {
        return request<T>(
            path,
            {
                ...options,
                method: 'POST',
                body:
                    body === undefined
                        ? undefined
                        : JSON.stringify(body),
            },
        );
    },

    put<T>(
        path: string,
        body?: unknown,
        options?: ApiRequestOptions,
    ): Promise<T> {
        return request<T>(
            path,
            {
                ...options,
                method: 'PUT',
                body:
                    body === undefined
                        ? undefined
                        : JSON.stringify(body),
            },
        );
    },

    delete<T>(
        path: string,
        options?: ApiRequestOptions,
    ): Promise<T> {
        return request<T>(
            path,
            {
                ...options,
                method: 'DELETE',
            },
        );
    },
};
