import {
    useEffect,
    useState,
} from 'react';

import {
    useNavigate,
} from 'react-router-dom';

import {
    useAuth,
} from '../auth/useAuth';

import '../styles/PatrolPage.css';

type PatrolResult =
    | 'normal'
    | 'abnormal'
    | null;

type PatrolResident = {
    id: number;
    name: string;
    age: number;
    result: PatrolResult;
    note: string;
};

type PatrolRound = {
    round: number;
    time: string;
    staffName: string;
};

const WEEKDAYS = [
    '日',
    '月',
    '火',
    '水',
    '木',
    '金',
    '土',
];

const initialResidents: PatrolResident[] = [
    {
        id: 1,
        name: '徳田雄一郎',
        age: 76,
        result: 'abnormal',
        note: '容体急変。38.8℃。コロナ？',
    },
    {
        id: 2,
        name: '山下清美',
        age: 73,
        result: 'normal',
        note: '',
    },
    {
        id: 3,
        name: '酒井優斗',
        age: 89,
        result: 'normal',
        note: '',
    },
    {
        id: 4,
        name: '三坂裕子',
        age: 92,
        result: 'normal',
        note: '',
    },
    {
        id: 5,
        name: '大川洋子',
        age: 76,
        result: 'normal',
        note: '',
    },
    {
        id: 6,
        name: '山田健太郎',
        age: 73,
        result: 'normal',
        note: '',
    },
];

const patrolRounds: PatrolRound[] = [
    {
        round: 1,
        time: '22:12',
        staffName: '高山健一',
    },
    {
        round: 2,
        time: '00:30',
        staffName: '高山健一',
    },
    {
        round: 3,
        time: '02:12',
        staffName: '高山健一',
    },
    {
        round: 4,
        time: '',
        staffName: '',
    },
    {
        round: 5,
        time: '',
        staffName: '',
    },
];

function formatDate(
    date: Date,
): string {
    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1,
        ).padStart(2, '0');

    const day =
        String(
            date.getDate(),
        ).padStart(2, '0');

    const weekday =
        WEEKDAYS[
            date.getDay()
        ];

    return (
        `${year}/${month}/${day}` +
        `(${weekday})`
    );
}

function formatTime(
    date: Date,
): string {
    const hour =
        String(
            date.getHours(),
        ).padStart(2, '0');

    const minute =
        String(
            date.getMinutes(),
        ).padStart(2, '0');

    return `${hour}:${minute}`;
}

function getRoleDisplayName(
    role: string | undefined,
): string {
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
}

function PatrolPage() {
    const navigate =
        useNavigate();

    const {
        user,
    } = useAuth();

    const [
        currentDateTime,
        setCurrentDateTime,
    ] = useState(
        () => new Date(),
    );

    const [
        selectedDate,
        setSelectedDate,
    ] = useState(
        () => new Date(),
    );

    const [
        residents,
        setResidents,
    ] = useState<PatrolResident[]>(
        initialResidents,
    );

    useEffect(() => {
        const timerId =
            window.setInterval(
                () => {
                    setCurrentDateTime(
                        new Date(),
                    );
                },
                1000,
            );

        return () => {
            window.clearInterval(
                timerId,
            );
        };
    }, []);

    const staffName =
        user?.employeeName
        ?? '担当者名未取得';

    const staffRole =
        getRoleDisplayName(
            user?.role,
        );

    const handleBackToMenu =
        () => {
            navigate('/menu');
        };

    const handlePreviousDay =
        () => {
            setSelectedDate(
                current => {
                    const date =
                        new Date(current);

                    date.setDate(
                        date.getDate() - 1,
                    );

                    return date;
                },
            );
        };

    const handleNextDay =
        () => {
            setSelectedDate(
                current => {
                    const date =
                        new Date(current);

                    date.setDate(
                        date.getDate() + 1,
                    );

                    return date;
                },
            );
        };

    const handleToday =
        () => {
            setSelectedDate(
                new Date(),
            );
        };

    const handleResultChange =
        (
            residentId: number,
            result: PatrolResult,
        ) => {
            setResidents(
                current =>
                    current.map(
                        resident =>
                            resident.id ===
                            residentId
                                ? {
                                    ...resident,
                                    result,
                                }
                                : resident,
                    ),
            );
        };

    const handleNoteChange =
        (
            residentId: number,
            note: string,
        ) => {
            setResidents(
                current =>
                    current.map(
                        resident =>
                            resident.id ===
                            residentId
                                ? {
                                    ...resident,
                                    note,
                                }
                                : resident,
                    ),
            );
        };

    const handleAllNormal =
        () => {
            setResidents(
                current =>
                    current.map(
                        resident => ({
                            ...resident,
                            result: 'normal',
                        }),
                    ),
            );
        };

    return (
        <main className="patrol-page">
            <div className="patrol-shell">

                <header className="patrol-header">
                    <div className="patrol-brand">
                        <div
                            className="patrol-brand__mark"
                            aria-hidden="true"
                        >
                            🌿
                        </div>

                        <div className="patrol-brand__name">
                            <strong>
                                からふる庭園海津
                            </strong>

                            <span>
                                Care Support System
                            </span>
                        </div>
                    </div>

                    <div className="patrol-title">
                        <span className="patrol-title__tag">
                            介護活動支援システム
                        </span>

                        <h1>
                            定期巡回
                        </h1>

                        <p>
                            利用者の巡回結果を
                            確認・登録します。
                        </p>
                    </div>

                    <div className="patrol-account">
                        <time className="patrol-clock">
                            {formatDate(
                                currentDateTime,
                            )}
                            {' '}
                            {formatTime(
                                currentDateTime,
                            )}
                        </time>

                        <div className="patrol-account__row">
                            <div className="patrol-staff">
                                <div
                                    className="patrol-staff__avatar"
                                    aria-hidden="true"
                                >
                                    👤
                                </div>

                                <div className="patrol-staff__text">
                                    <strong>
                                        {staffName} さん
                                    </strong>

                                    <span>
                                        権限：
                                        {staffRole}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="patrol-menu-button"
                                onClick={
                                    handleBackToMenu
                                }
                            >
                                メニューへ戻る
                            </button>
                        </div>
                    </div>
                </header>

                <section className="patrol-content">

                    <div className="patrol-toolbar">
                        <div>
                            <h2>
                                巡回記録
                                <span>
                                    （共有）
                                </span>
                            </h2>

                            <p>
                                巡回時の利用者の
                                状態を登録してください。
                            </p>
                        </div>

                        <div className="patrol-date-navigation">
                            <button
                                type="button"
                                onClick={
                                    handlePreviousDay
                                }
                                aria-label="前日"
                            >
                                ‹
                            </button>

                            <div className="patrol-selected-date">
                                <span>
                                    対象日
                                </span>

                                <strong>
                                    {formatDate(
                                        selectedDate,
                                    )}
                                </strong>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    handleNextDay
                                }
                                aria-label="翌日"
                            >
                                ›
                            </button>

                            <button
                                type="button"
                                className="patrol-today-button"
                                onClick={
                                    handleToday
                                }
                            >
                                本日
                            </button>
                        </div>
                    </div>

                    <div className="patrol-round-card">
                        <div className="patrol-round-heading">
                            <div>
                                <strong>
                                    巡回実施状況
                                </strong>

                                <span>
                                    実施時刻・担当者
                                </span>
                            </div>

                            <div className="patrol-action-buttons">
                                <button
                                    type="button"
                                    className="patrol-all-normal-button"
                                    onClick={
                                        handleAllNormal
                                    }
                                >
                                    ✓ 全員 異常なし
                                </button>

                                <button
                                    type="button"
                                    className="patrol-register-button"
                                    onClick={() => {
                                        console.log(
                                            '登録',
                                            residents
                                        );
                                    }}
                                >
                                    登録
                                </button>
                            </div>
                        </div>

                        <div className="patrol-round-grid">
                            {patrolRounds.map(
                                round => (
                                    <div
                                        key={
                                            round.round
                                        }
                                        className={[
                                            'patrol-round-item',
                                            round.time
                                                ? 'patrol-round-item--done'
                                                : '',
                                        ]
                                            .filter(Boolean)
                                            .join(' ')}
                                    >
                                        <span className="patrol-round-number">
                                            {round.round}回目
                                        </span>

                                        {round.time ? (
                                            <>
                                                <strong>
                                                    {round.time}
                                                </strong>

                                                <small>
                                                    {
                                                        round.staffName
                                                    }
                                                </small>
                                            </>
                                        ) : (
                                            <span className="patrol-round-pending">
                                                未実施
                                            </span>
                                        )}
                                    </div>
                                ),
                            )}
                        </div>
                    </div>

                    <div className="patrol-table-wrapper">
                        <table className="patrol-table">
                            <thead>
                                <tr>
                                    <th className="patrol-name-column">
                                        お名前
                                    </th>

                                    <th className="patrol-result-column">
                                        巡回結果
                                    </th>

                                    <th className="patrol-note-column">
                                        状態・申し送り
                                    </th>

                                    {patrolRounds.map(
                                        round => (
                                            <th
                                                key={
                                                    round.round
                                                }
                                                className="patrol-status-column"
                                            >
                                                {round.round}回目
                                            </th>
                                        ),
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {residents.map(
                                    resident => (
                                        <tr
                                            key={
                                                resident.id
                                            }
                                        >
                                            <td className="patrol-resident-name">
                                                <strong>
                                                    {
                                                        resident.name
                                                    }
                                                </strong>

                                                <span>
                                                    （
                                                    {
                                                        resident.age
                                                    }
                                                    ）
                                                </span>
                                            </td>

                                            <td>
                                                <div className="patrol-result-buttons">
                                                    <button
                                                        type="button"
                                                        className={[
                                                            'patrol-result-button',
                                                            'patrol-result-button--normal',
                                                            resident.result ===
                                                            'normal'
                                                                ? 'is-selected'
                                                                : '',
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' ')}
                                                        onClick={() =>
                                                            handleResultChange(
                                                                resident.id,
                                                                'normal',
                                                            )
                                                        }
                                                    >
                                                        ✓
                                                        <span>
                                                            異常なし
                                                        </span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className={[
                                                            'patrol-result-button',
                                                            'patrol-result-button--abnormal',
                                                            resident.result ===
                                                            'abnormal'
                                                                ? 'is-selected'
                                                                : '',
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' ')}
                                                        onClick={() =>
                                                            handleResultChange(
                                                                resident.id,
                                                                'abnormal',
                                                            )
                                                        }
                                                    >
                                                        !
                                                        <span>
                                                            異常あり
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>

                                            <td>
                                                <input
                                                    type="text"
                                                    className={[
                                                        'patrol-note-input',
                                                        resident.result ===
                                                        'abnormal'
                                                            ? 'patrol-note-input--alert'
                                                            : '',
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' ')}
                                                    value={
                                                        resident.note
                                                    }
                                                    placeholder="状態・申し送りを入力"
                                                    onChange={
                                                        event =>
                                                            handleNoteChange(
                                                                resident.id,
                                                                event.target.value,
                                                            )
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <span className="patrol-status patrol-status--normal">
                                                    ✓
                                                </span>
                                            </td>

                                            <td>
                                                <span className="patrol-status patrol-status--normal">
                                                    ✓
                                                </span>
                                            </td>

                                            <td>
                                                <span
                                                    className={[
                                                        'patrol-status',
                                                        resident.id ===
                                                        1
                                                            ? 'patrol-status--abnormal'
                                                            : 'patrol-status--normal',
                                                    ].join(' ')}
                                                >
                                                    {
                                                        resident.id ===
                                                        1
                                                            ? '×'
                                                            : '✓'
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                <span className="patrol-status patrol-status--pending">
                                                    －
                                                </span>
                                            </td>

                                            <td>
                                                <span className="patrol-status patrol-status--pending">
                                                    －
                                                </span>
                                            </td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <footer className="patrol-footer">
                    <span>
                        Colorful Garden Kaizu
                        Care Support System
                    </span>

                    <span>
                        巡回結果は確認後に
                        登録してください。
                    </span>
                </footer>
            </div>
        </main>
    );
}

export default PatrolPage;
