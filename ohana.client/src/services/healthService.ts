import { apiClient } from './apiClient';

export type HealthResponse = {
    status: string;
    message: string;
};

export const getHealthAsync = async () => {
    return apiClient<HealthResponse>('/health');
};
