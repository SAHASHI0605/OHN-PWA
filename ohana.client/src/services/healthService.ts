import { apiClient } from './apiClient';

export const healthService = {
  getStatus: async (): Promise<string> => {
    const response = await apiClient.get<string>('/health');
    return response.data;
  },
};
