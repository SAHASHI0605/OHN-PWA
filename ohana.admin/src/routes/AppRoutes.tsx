import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { AdminLayout } from '../components/layout/AdminLayout';
import { LoginPage } from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import ResidentListPage from '../pages/ResidentListPage';
import StaffListPage from '../pages/StaffListPage';
import VitalReportPage from '../pages/VitalReportPage';

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/staff" element={<StaffListPage />} />
                    <Route path="/residents" element={<ResidentListPage />} />
                    <Route path="/vital-reports" element={<VitalReportPage />} />
                </Route>
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}
