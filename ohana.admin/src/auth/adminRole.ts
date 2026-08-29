export const ADMIN_ROLE =
    '0';

export function isAdminRole(
    role: string,
): boolean {
    return role === ADMIN_ROLE;
}
