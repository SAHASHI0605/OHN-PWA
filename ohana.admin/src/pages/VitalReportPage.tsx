import { adminMenu } from '../routes/adminMenu';

export default function VitalReportPage() {
    const menu = adminMenu[2];
    return (
        <section aria-labelledby="vital-reports-title">
            <div className="admin-page-heading">
                <p className="admin-page-eyebrow">管理メニュー</p>
                <h1 id="vital-reports-title">{menu.label}</h1>
                <p>{menu.description}</p>
            </div>
            <div className="admin-entry-panel">
                <span className="admin-preparing">準備中</span>
                <h2>バイタル記録表の出力</h2>
                <p>{menu.scope}</p>
            </div>
        </section>
    );
}
