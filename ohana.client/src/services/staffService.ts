import { apiClient } from './apiClient';

export type StaffOption = {
    employeeNumber: string;
    name: string;
};

export const getLoginStaffOptionsAsync =
    async (): Promise<StaffOption[]> => {
        return await apiClient<StaffOption[]>(
            '/staff/login-options'
        );
    };
