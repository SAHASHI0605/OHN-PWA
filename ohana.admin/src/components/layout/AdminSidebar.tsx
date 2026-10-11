import { NavLink } from 'react-router-dom';
import { adminMenu } from '../../routes/adminMenu';

export function AdminSidebar() {
    return (
        <aside className="admin-sidebar">
            <p className="admin-sidebar-caption">管理メニュー</p>
            <nav aria-label="管理メニュー">
                <NavLink className="admin-nav-link" to="/dashboard" end>ダッシュボード</NavLink>
                {adminMenu.map(item => (
                    <NavLink key={item.path} className="admin-nav-link" to={item.path}>{item.label}</NavLink>
                ))}
            </nav>
            <p className="admin-sidebar-footer">Ohana<br />Administrator Portal</p>
        </aside>
    );
}
