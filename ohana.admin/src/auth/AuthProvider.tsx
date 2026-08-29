import {
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    AuthContext,
    type AuthUser,
} from './AuthContext';

import {
    authStorage,
} from './authStorage';

import {
    AUTH_EXPIRED_EVENT,
} from './authEvents';

import {
    getEmployeeNumberFromToken,
    getNameFromToken,
    getRoleFromToken,
    getTokenExpirationTime,
    isTokenExpired,
    parseJwt,
} from './jwtUtils';

type AuthProviderProps = {
    children: ReactNode;
};

function createUserFromToken(
    token: string,
): AuthUser | null {
    const payload =
        parseJwt(token);

    if (!payload) {
        return null;
    }

    return {
        employeeNumber:
            getEmployeeNumberFromToken(
                token,
            ),

        name:
            getNameFromToken(
                token,
            ),

        role:
            getRoleFromToken(
                token,
            ),
    };
}
function getInitialToken(): string | null {
    const token =
        authStorage.getToken();

    if (!token) {
        return null;
    }

    if (
        isTokenExpired(token)
    ) {
        authStorage.removeToken();

        return null;
    }

    return token;
}

export function AuthProvider({
    children,
}: AuthProviderProps) {
    const [
        token,
        setToken,
    ] = useState<string | null>(
        getInitialToken,
    );

    const user = useMemo(
        () =>
            token
                ? createUserFromToken(
                    token,
                )
                : null,
        [token],
    );

    const login = useCallback(
        (
            newToken: string,
        ) => {
            authStorage.setToken(
                newToken,
            );

            setToken(newToken);
        },
        [],
    );

    const logout = useCallback(
        () => {
            authStorage.removeToken();

            setToken(null);
        },
        [],
    );

    useEffect(() => {
        const handleAuthExpired =
            () => {
                logout();
            };

        window.addEventListener(
            AUTH_EXPIRED_EVENT,
            handleAuthExpired,
        );

        return () => {
            window.removeEventListener(
                AUTH_EXPIRED_EVENT,
                handleAuthExpired,
            );
        };
    }, [logout]);

    useEffect(() => {
        if (!token) {
            return;
        }

        const expirationTime =
            getTokenExpirationTime(
                token,
            );

        if (!expirationTime) {
            const timerId =
                window.setTimeout(
                    () => {
                        logout();
                    },
                    0,
                );

            return () => {
                window.clearTimeout(
                    timerId,
                );
            };
        }

        const remainingTime =
            expirationTime -
            Date.now();

        const timeout =
            Math.max(
                remainingTime,
                0,
            );

        const timerId =
            window.setTimeout(
                () => {
                    logout();
                },
                timeout,
            );

        return () => {
            window.clearTimeout(
                timerId,
            );
        };
    }, [
        token,
        logout,
    ]);

    const value =
        useMemo(
            () => ({
                isAuthenticated:
                    token !== null &&
                    user !== null,

                user,

                login,
                logout,
            }),
            [
                token,
                user,
                login,
                logout,
            ],
        );

    return (
        <AuthContext.Provider
            value={value}
        >
            {children}
        </AuthContext.Provider>
    );
}
