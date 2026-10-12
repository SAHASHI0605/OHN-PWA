export type VitalReportQuery = { floor: number; year: number; month: number };
export type VitalReportDay = { date: string; recordCount: number; canSelect: boolean };
export type VitalReportDays = VitalReportQuery & { days: VitalReportDay[] };
