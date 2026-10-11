import { adminMenu } from '../routes/adminMenu';

export default function ResidentListPage() {
    const menu = adminMenu[1];
    return (
        <section aria-labelledby="residents-title">
            <div className="admin-page-heading">
                <p className="admin-page-eyebrow">管理メニュー</p>
                <h1 id="residents-title">{menu.label}</h1>
                <p>{menu.description}</p>
            </div>
            <div className="admin-entry-panel">
                <span className="admin-preparing">準備中</span>
                <h2>入居者情報の管理</h2>
                <p>{menu.scope}</p>
            </div>
        </section>
    );
}
