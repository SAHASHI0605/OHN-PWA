import { apiClient, ApiError } from './apiClient';
import { dispatchAuthExpired } from '../auth/authEvents';
import type { Staff, StaffForm, StaffPage, StaffSearch } from '../types/staff';

const base = '/admin/staff';
async function adminRequest<T>(request: Promise<T>): Promise<T> {
    try { return await request; }
    catch (error) {
        if (error instanceof ApiError && error.status === 403) dispatchAuthExpired();
        throw error;
    }
}
export const staffMaintenanceService = {
    search(search: StaffSearch) {
        const query = new URLSearchParams({ keyword: search.keyword, page: String(search.page),
            isActive: search.active === 'all' ? '' : search.active });
        if (search.role !== '') query.set('role', search.role);
        return adminRequest(apiClient.get<StaffPage>(`${base}?${query}`));
    },
    detail(code: string) { return adminRequest(apiClient.get<Staff>(`${base}/${encodeURIComponent(code)}`)); },
    create(form: StaffForm) { return adminRequest(apiClient.post<{ message: string }>(base, form)); },
    update(staff: Staff, form: StaffForm) {
        return adminRequest(apiClient.put<{ message: string }>(`${base}/${encodeURIComponent(staff.staffCode)}`,
            { staffName: form.staffName, role: form.role, isActive: form.isActive, version: staff.version }));
    },
    resetPassword(staff: Staff, password: string, passwordConfirmation: string) {
        return adminRequest(apiClient.put<{ message: string }>(`${base}/${encodeURIComponent(staff.staffCode)}/password`,
            { password, passwordConfirmation, version: staff.version }));
    },
};
