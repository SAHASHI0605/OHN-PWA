import {
    Navigate,
    Outlet,
} from 'react-router-dom';

import {
    useEffect,
} from 'react';

import {
    useAuth,
} from '../../auth/useAuth';

import {
    isAdminRole,
} from '../../auth/adminRole';

export function ProtectedRoute() {
    const {
        isAuthenticated,
        user,
        logout,
    } = useAuth();

    const hasAdminRole =
        isAuthenticated &&
        user !== null &&
        isAdminRole(
            user.role,
        );

    useEffect(() => {
        if (
            isAuthenticated &&
            !hasAdminRole
        ) {
            logout();
        }
    }, [
        isAuthenticated,
        hasAdminRole,
        logout,
    ]);

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    if (!hasAdminRole) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    return <Outlet />;
}
