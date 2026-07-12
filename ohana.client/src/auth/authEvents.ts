export const AUTH_EXPIRED_EVENT =
    'auth:expired';

export const dispatchAuthExpired = () => {
    window.dispatchEvent(
        new Event(AUTH_EXPIRED_EVENT)
    );
};
