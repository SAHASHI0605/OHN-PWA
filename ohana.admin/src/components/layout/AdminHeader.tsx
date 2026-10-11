import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

export function AdminHeader() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };
    return (
        <header className="admin-header">
            <Link className="admin-brand" to="/dashboard">
                <span className="admin-brand-mark" aria-hidden="true">O</span>
                <span>Ohana 管理システム<small>からふる庭園海津</small></span>
            </Link>
            <div className="admin-header-account">
                <span className="admin-user-name">ログイン：<strong>{user?.name || user?.employeeNumber}</strong></span>
                <button className="admin-logout" type="button" onClick={handleLogout}>ログアウト</button>
            </div>
        </header>
    );
}
