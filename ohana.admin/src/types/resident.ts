export const residentRooms = [
    '101', '102', '103', '105', '106', '107', '108', '110', '111', '112', '113', '115', '116', '117', '118', '120', '121', '122', 'VIP',
    '201', '202', '203', '205', '206', '207', '208', '210', '211', '212', '213', '215', '216', '217', '218', '220', '221', '222', '223', '225', '226', '227', '228',
] as const;
export type Resident = { roomNo: string; serialNo: string; tenantName: string; moveInDate: string; moveOutDate: string | null; version: string };
export type ResidentSearch = { roomNo: string; name: string; status: 'current' | 'departed' | 'all'; page: number };
export type ResidentPage = { items: Resident[]; totalCount: number; page: number; pageSize: number };
export type ResidentForm = { roomNo: string; serialNo: string; tenantName: string; moveInDate: string; moveOutDate: string };
