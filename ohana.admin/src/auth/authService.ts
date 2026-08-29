import { apiClient } from '../services/apiClient';

export type LoginRequest = {
    employeeNumber: string;
    password: string;
};

export type LoginResponse = {
    token: string;
};

export async function loginAsync(
    request: LoginRequest,
): Promise<LoginResponse> {
    return await apiClient.post<LoginResponse>(
        '/auth/login',
        request,
    );
}
