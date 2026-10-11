import { adminMenu } from '../routes/adminMenu';

export default function StaffListPage() {
    const menu = adminMenu[0];
    return (
        <section aria-labelledby="staff-title">
            <div className="admin-page-heading">
                <p className="admin-page-eyebrow">管理メニュー</p>
                <h1 id="staff-title">{menu.label}</h1>
                <p>{menu.description}</p>
            </div>
            <div className="admin-entry-panel">
                <span className="admin-preparing">準備中</span>
                <h2>スタッフ情報の管理</h2>
                <p>{menu.scope}</p>
            </div>
        </section>
    );
}
