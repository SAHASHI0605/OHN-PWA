import { apiClient } from './apiClient';

export type HealthResponse = {
    status: string;
    message: string;
};

export const healthService = {
    getStatus: async (): Promise<HealthResponse> => {
        return await apiClient.get<HealthResponse>(
            '/health',
        );
    },
};
