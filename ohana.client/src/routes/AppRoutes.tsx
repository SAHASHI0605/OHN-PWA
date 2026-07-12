import {
    Routes,
    Route,
    Navigate,
} from 'react-router-dom';

import { Layout } from '../components/layout/Layout';
import { HomePage } from '../pages/HomePage';
import { CalendarPage } from '../pages/CalendarPage';
import { ContactPage } from '../pages/ContactPage';
import { SettingPage } from '../pages/SettingPage';
import { LoginPage } from '../pages/LoginPage';
import { MenuPage } from '../pages/MenuPage';
import FloorSelectPage from '../pages/FloorSelectPage';
import FirstFloorResidentSelectPage
    from '../pages/FirstFloorResidentSelectPage';

import { ProtectedRoute } from '../auth/ProtectedRoute';

export const AppRoutes = () => {
    return (
        <Routes>
            <Route
                path="/login"
                element={<LoginPage />}
            />

            <Route
                path="/menu"
                element={
                    <ProtectedRoute>
                        <MenuPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/residents/floors"
                element={
                    <ProtectedRoute>
                        <FloorSelectPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/residents/floors/1"
                element={
                    <ProtectedRoute>
                        <FirstFloorResidentSelectPage />
                    </ProtectedRoute>
                }
            />

            <Route
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/menu"
                            replace
                        />
                    }
                />

                <Route
                    path="/home"
                    element={<HomePage />}
                />

                <Route
                    path="/calendar"
                    element={<CalendarPage />}
                />

                <Route
                    path="/contact"
                    element={<ContactPage />}
                />

                <Route
                    path="/setting"
                    element={<SettingPage />}
                />
            </Route>

            <Route
                path="*"
                element={
                    <Navigate
                        to="/menu"
                        replace
                    />
                }
            />
        </Routes>
    );
};
