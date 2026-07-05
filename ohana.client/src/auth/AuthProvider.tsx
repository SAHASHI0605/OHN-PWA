import { useState } from 'react';
import { AuthContext } from './AuthContext';

type Props = {
    children: React.ReactNode;
};

export const AuthProvider = ({ children }: Props) => {
    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem('access_token');
    });

    const login = (token: string) => {
        localStorage.setItem('access_token', token);
        setToken(token);
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        setToken(null);
    };

    return (
        <AuthContext.Provider
            value={{
                token,
                isAuthenticated: !!token,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
