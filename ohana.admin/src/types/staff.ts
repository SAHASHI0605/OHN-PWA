export type Staff = {
    staffCode: string;
    staffName: string;
    role: number;
    isActive: boolean;
    lastLoginAt: string | null;
    version: string;
};
export type StaffSearch = { keyword: string; role: '' | '0' | '1'; active: 'all' | 'true' | 'false'; page: number };
export type StaffPage = { items: Staff[]; totalCount: number; page: number; pageSize: number };
export type StaffForm = { staffCode: string; staffName: string; role: number; isActive: boolean; password: string; passwordConfirmation: string };
