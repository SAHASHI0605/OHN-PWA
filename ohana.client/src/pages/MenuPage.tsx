import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import kaizuLogo from '../assets/kaizu-logo.png';
import '../styles/MenuPage.css';

type MenuItem = {
    id: string;
    title: string;
    description: string;
    actionLabel: string;
    icon: string;
    path?: string;
    primary?: boolean;
};

const menuItems: MenuItem[] = [
    {
        id: 'users',
        title: '利用者一覧',
        description:
            '利用者を検索・選択し、基本情報や当日の状況を確認します。',
        actionLabel: '利用者を選択',
        icon: '👥',
        path: '/users',
        primary: true,
    },
    {
        id: 'records',
        title: '記録入力',
        description:
            'バイタル、食事、入浴、排泄、申し送りなどの日常記録を入力します。',
        actionLabel: '記録を開始',
        icon: '📝',
        path: '/records',
        primary: true,
    },
    {
        id: 'patrol',
        title: '定期巡回',
        description:
            '巡回対象と実施状況を確認し、巡回結果を登録します。',
        actionLabel: '巡回状況を確認',
        icon: '🔄',
        path: '/patrol',
    },
    {
        id: 'daily',
        title: 'デイリー',
        description:
            '本日の予定、対応事項、施設内の動きを一覧で確認します。',
        actionLabel: '今日の予定を表示',
        icon: '📅',
        path: '/daily',
    },
    {
        id: 'analysis',
        title: 'データ分析',
        description:
            '記録データの傾向や集計結果をグラフ・一覧で確認します。',
        actionLabel: '集計画面へ',
        icon: '📊',
        path: '/analysis',
    },
    {
        id: 'chat',
        title: 'チャット・お知らせ',
        description:
            'スタッフ間の連絡や施設からのお知らせを確認します。',
        actionLabel: '共有情報を確認',
        icon: '💬',
        path: '/chat',
    },
];

const weekdays = [
    '日',
    '月',
    '火',
    '水',
    '木',
    '金',
    '土',
];

const formatDate = (date: Date) => {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
        date.getDate()
    ).padStart(2, '0');

    const weekday = weekdays[date.getDay()];

    return `${year}/${month}/${day}(${weekday})`;
};

const formatTime = (date: Date) => {
    const hour = String(
        date.getHours()
    ).padStart(2, '0');

    const minute = String(
        date.getMinutes()
    ).padStart(2, '0');

    return `${hour}:${minute}`;
};

const getRoleDisplayName = (
    role: string | undefined
): string => {
    switch (role) {
        case '0':
        case 'Administrator':
        case 'Admin':
            return '管理者';

        case '1':
        case 'Staff':
        case 'General':
            return 'スタッフ';

        default:
            return role || '権限未取得';
    }
};

export const MenuPage = () => {
    const navigate = useNavigate();

    const {
        user,
        logout,
    } = useAuth();

    const [currentDateTime, setCurrentDateTime] =
        useState(new Date());

    const [message, setMessage] = useState('');

    const staffName =
        user?.employeeName ??
        '担当者名未取得';

    const staffRole =
        getRoleDisplayName(
            user?.role
        );

    useEffect(() => {
        const timerId = window.setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);

        return () => {
            window.clearInterval(timerId);
        };
    }, []);

    useEffect(() => {
        if (!message) {
            return;
        }

        const timerId = window.setTimeout(() => {
            setMessage('');
        }, 2400);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [message]);

    const handleMenuClick = (
        menuItem: MenuItem
    ) => {
        /*
         * 遷移先画面が完成したら、
         * setMessageを削除してnavigateを有効にします。
         */

        setMessage(
            `${menuItem.title}は現在準備中です。`
        );

        // 遷移先画面作成後に有効化
        // if (menuItem.path) {
        //     navigate(menuItem.path);
        // }
    };

    const handleLogout = () => {
        logout();
        navigate('/login', {
            replace: true,
        });
    };

    return (
        <div className="menu-page">
            <div className="menu-shell">
                <header className="menu-header">
                    <div className="menu-brand-box">
                        <img
                            src={kaizuLogo}
                            alt="からふる庭園海津 ロゴ"
                        />
                    </div>

                    <div className="menu-header-title">
                        <span className="menu-header-tag">
                            介護活動支援システム
                        </span>

                        <h1>業務メニュー</h1>

                        <p>
                            利用する機能を選択してください。
                        </p>
                    </div>

                    <div className="menu-account">
                        <div className="menu-clock">
                            {formatDate(
                                currentDateTime
                            )}{' '}
                            {formatTime(
                                currentDateTime
                            )}
                        </div>

                        <div className="menu-staff-row">
                            <div className="menu-staff-chip">
                                <div className="menu-staff-avatar">
                                    👤
                                </div>

                                <div className="menu-staff-text">
                                    <strong>
                                        {staffName} さん
                                    </strong>

                                    <span>
                                        権限：{staffRole}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="menu-logout-button"
                                onClick={handleLogout}
                            >
                                ログアウト
                            </button>
                        </div>
                    </div>
                </header>

                <main className="menu-content">
                    <section className="menu-welcome-panel">
                        <div>
                            <h2>
                                お疲れさまです。
                                今日の業務を始めましょう。
                            </h2>

                            <p>
                                記録入力、巡回確認、
                                日々の予定、情報共有を
                                この画面から操作できます。
                            </p>
                        </div>

                        <div className="menu-today-badge">
                            <span>TODAY</span>

                            <strong>
                                {formatDate(
                                    currentDateTime
                                )}
                            </strong>
                        </div>
                    </section>

                    <div className="menu-section-heading">
                        <h2>メニュー</h2>

                        <p>
                            タップする機能を選択してください
                        </p>
                    </div>

                    <section className="menu-grid">
                        {menuItems.map((menuItem) => (
                            <button
                                key={menuItem.id}
                                type="button"
                                className={[
                                    'menu-card',
                                    menuItem.primary
                                        ? 'menu-card-primary'
                                        : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                                onClick={() =>
                                    handleMenuClick(
                                        menuItem
                                    )
                                }
                            >
                                <div className="menu-card-icon">
                                    {menuItem.icon}
                                </div>

                                <h3>
                                    {menuItem.title}
                                </h3>

                                <p>
                                    {
                                        menuItem.description
                                    }
                                </p>

                                <div className="menu-card-footer">
                                    <span>
                                        {
                                            menuItem.actionLabel
                                        }
                                    </span>

                                    <span className="menu-card-arrow">
                                        ›
                                    </span>
                                </div>
                            </button>
                        ))}
                    </section>
                </main>

                <footer className="menu-footer">
                    <span>
                        Colorful Garden Kaizu Care
                        Support System
                    </span>

                    <span>
                        共用端末では、利用後に必ず
                        ログアウトしてください。
                    </span>
                </footer>
            </div>

            {message && (
                <div
                    className="menu-toast"
                    role="status"
                    aria-live="polite"
                >
                    {message}
                </div>
            )}
        </div>
    );
};
