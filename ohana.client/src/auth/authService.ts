import { apiClient } from '../services/apiClient';

export type LoginRequest = {
    employeeNumber: string;
    password: string;
};

export type LoginResponse = {
    token: string;
    employeeName: string;
    role: string;
};

export const loginAsync = async (
    request: LoginRequest
): Promise<LoginResponse> => {
    return await apiClient<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(request),
    });
};
