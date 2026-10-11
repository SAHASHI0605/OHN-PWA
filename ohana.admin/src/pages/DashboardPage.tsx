import { Link } from 'react-router-dom';
import { adminMenu } from '../routes/adminMenu';
import '../styles/DashboardPage.css';

export default function DashboardPage() {
    return (
        <section aria-labelledby="dashboard-title">
            <div className="admin-page-heading">
                <p className="admin-page-eyebrow">管理者ポータル</p>
                <h1 id="dashboard-title">ダッシュボード</h1>
                <p>利用するメニューを選択してください。</p>
            </div>
            <div className="admin-dashboard-cards">
                {adminMenu.map(item => (
                    <Link key={item.path} className="admin-dashboard-card" to={item.path}>
                        <div className="admin-card-top">
                            <span className="admin-card-symbol" aria-hidden="true">{item.symbol}</span>
                            {!item.available && <span className="admin-preparing">準備中</span>}
                        </div>
                        <h2>{item.label}</h2>
                        <p>{item.description}</p>
                        <span className="admin-card-link">{item.available ? '画面を開く' : '入口画面へ'}<span aria-hidden="true"> →</span></span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
