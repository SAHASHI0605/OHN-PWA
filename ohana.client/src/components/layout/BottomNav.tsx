import { NavLink } from 'react-router-dom';

export const BottomNav = () => {
    return (
        <nav
            style={{
                height: '60px',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                borderTop: '1px solid #ddd',
            }}
        >
            <NavLink to="/">ホーム</NavLink>
            <NavLink to="/calendar">予定</NavLink>
            <NavLink to="/contact">連絡</NavLink>
            <NavLink to="/setting">設定</NavLink>
        </nav>
    );
};
