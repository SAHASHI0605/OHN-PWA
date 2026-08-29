import {
    createContext,
} from 'react';

export type AuthUser = {
    employeeNumber: string;
    name: string;
    role: string;
};

export type AuthContextValue = {
    isAuthenticated: boolean;
    user: AuthUser | null;

    login: (
        token: string,
    ) => void;

    logout: () => void;
};

export const AuthContext =
    createContext<
        AuthContextValue | undefined
        >(undefined);
