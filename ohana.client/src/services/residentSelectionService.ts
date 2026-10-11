import { apiClient, ApiError } from './apiClient';
import type { ResidentSelection } from '../types/residentSelection';

export async function getFloorResidentsAsync(floor: 1 | 2, signal?: AbortSignal): Promise<ResidentSelection[]> {
    try { return await apiClient<ResidentSelection[]>(`/residents/floors/${floor}`, { signal, cache: 'no-store' }); }
    catch (error) {
        if (error instanceof ApiError && error.status === 409)
            throw new Error('同じ部屋番号・連番に複数の入居中データがあります。管理者に入居者マスタの確認を依頼してください。', { cause: error });
        throw error;
    }
}
