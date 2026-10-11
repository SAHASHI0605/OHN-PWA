export type ResidentSelection = {
    roomNo: string;
    serialNo: string;
    tenantName: string;
    moveInDate: string;
};
// This master has no numeric person ID. Retain all three actual primary-key fields.
export const residentSelectionKey = (resident: ResidentSelection) =>
    `${resident.roomNo}|${resident.serialNo}|${resident.moveInDate}`;

export type RecordResidentState = {
    floor?: 1 | 2;
    residentId: string | number;
    residentName: string;
    roomNumber: string;
    serialNo?: string;
    moveInDate?: string;
};
