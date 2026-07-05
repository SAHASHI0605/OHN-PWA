import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export const Layout = () => {
    return (
        <div className="app-layout">
            <Header />

            <main className="app-main">
                <Outlet />
            </main>

            <BottomNav />
        </div>
    );
};
