import { Routes, Route } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { HomePage } from '../pages/HomePage';
import { CalendarPage } from '../pages/CalendarPage';
import { ContactPage } from '../pages/ContactPage';
import { SettingPage } from '../pages/SettingPage';
import { LoginPage } from '../pages/LoginPage';

import { ProtectedRoute } from '../auth/ProtectedRoute';

export const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<HomePage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/setting" element={<SettingPage />} />
            </Route>
        </Routes>
    );
};
