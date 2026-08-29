export const AUTH_EXPIRED_EVENT =
    'ohana-admin-auth-expired';

export function dispatchAuthExpired(): void {
    window.dispatchEvent(
        new Event(
            AUTH_EXPIRED_EVENT,
        ),
    );
}
