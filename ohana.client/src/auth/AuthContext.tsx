import { createContext } from 'react';

export type AuthUser = {
    employeeName: string;
    role: string;
};

export type AuthContextType = {
    token: string | null;
    user: AuthUser | null;
    isAuthenticated: boolean;

    login: (
        token: string,
        user: AuthUser
    ) => void;

    logout: () => void;
};

export const AuthContext =
    createContext<AuthContextType | null>(null);
