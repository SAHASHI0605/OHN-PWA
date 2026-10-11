import { apiClient, ApiError } from './apiClient';
import { dispatchAuthExpired } from '../auth/authEvents';
import type { Resident, ResidentForm, ResidentPage, ResidentSearch } from '../types/resident';

const base = '/admin/residents';
async function adminRequest<T>(request: Promise<T>): Promise<T> {
    try { return await request; }
    catch (error) {
        if (error instanceof ApiError && error.status === 403) dispatchAuthExpired();
        throw error;
    }
}
const detailPath = (resident: Resident) => `${base}/${encodeURIComponent(resident.roomNo)}/${encodeURIComponent(resident.serialNo)}?${new URLSearchParams({ moveInDate: resident.moveInDate })}`;
export const residentMaintenanceService = {
    search(search: ResidentSearch) {
        return adminRequest(apiClient.get<ResidentPage>(`${base}?${new URLSearchParams({ roomNo: search.roomNo, name: search.name, status: search.status, page: String(search.page) })}`));
    },
    detail(resident: Resident) { return adminRequest(apiClient.get<Resident>(detailPath(resident))); },
    create(form: ResidentForm) {
        return adminRequest(apiClient.post<{ message: string }>(base, { ...form, moveOutDate: form.moveOutDate || null }));
    },
    update(resident: Resident, form: ResidentForm) {
        return adminRequest(apiClient.put<{ message: string }>(detailPath(resident), { tenantName: form.tenantName, moveOutDate: form.moveOutDate || null, version: resident.version }));
    },
};
