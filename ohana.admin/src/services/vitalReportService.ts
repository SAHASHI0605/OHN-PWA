import { apiClient } from './apiClient';
import type { VitalReportDays, VitalReportQuery } from '../types/vitalReport';
export const vitalReportService = {
    days(query: VitalReportQuery) {
        const parameters = new URLSearchParams(Object.entries(query).map(([key, value]) => [key, String(value)]));
        return apiClient.get<VitalReportDays>(`/admin/vital-reports/days?${parameters}`, { timeoutMs: 30000 });
    },
    export(query: VitalReportQuery, dates: string[]) {
        return apiClient.postBlob('/admin/vital-reports/export', { ...query, dates }, { timeoutMs: 120000 });
    },
};
