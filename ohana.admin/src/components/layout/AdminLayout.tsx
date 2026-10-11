import { Outlet, useLocation } from 'react-router-dom';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';
import '../../styles/AdminLayout.css';

export function AdminLayout() {
    const { pathname } = useLocation();
    return (
        <div className="admin-layout">
            <a className="admin-skip-link" href="#admin-main">メイン領域へ移動</a>
            <AdminHeader />
            <div className="admin-layout-body">
                <AdminSidebar />
                <main id="admin-main" className={`admin-main${pathname === '/staff' || pathname === '/residents' ? ' admin-main-staff' : ''}`} tabIndex={-1}><Outlet /></main>
            </div>
        </div>
    );
}
