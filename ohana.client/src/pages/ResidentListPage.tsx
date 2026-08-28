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

import '../styles/ResidentListPage.css';

type ResidentTask = {
    id: number;
    name: string;
    age: number;
    staffName: string;

    morningMedication: boolean;
    morningMeal: boolean;
    morningRecorder: string;

    noonMedication: boolean;
    noonMeal: boolean;
    noonRecorder: string;

    eveningMedication: boolean;
    eveningMeal: boolean;
    eveningRecorder: string;

    vital: boolean;
    bath: boolean;

    sharedMemo: string;
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

const residentTasks: ResidentTask[] = [
    {
        id: 1,
        name: '徳田雄一郎',
        age: 76,
        staffName: '山川健太郎',

        morningMedication: true,
        morningMeal: true,
        morningRecorder: '山川健太郎',

        noonMedication: true,
        noonMeal: true,
        noonRecorder: '山川健太郎',

        eveningMedication: false,
        eveningMeal: false,
        eveningRecorder: '',

        vital: true,
        bath: false,

        sharedMemo: '朝から体温が高い',
    },
    {
        id: 2,
        name: '山下清美',
        age: 73,
        staffName: '山川健太郎',

        morningMedication: true,
        morningMeal: true,
        morningRecorder: '山川健太郎',

        noonMedication: false,
        noonMeal: false,
        noonRecorder: '',

        eveningMedication: false,
        eveningMeal: false,
        eveningRecorder: '',

        vital: true,
        bath: false,

        sharedMemo: 'リハビリ 9～13',
    },
    {
        id: 3,
        name: '酒井優斗',
        age: 89,
        staffName: '山川健太郎',

        morningMedication: true,
        morningMeal: true,
        morningRecorder: '山川健太郎',

        noonMedication: true,
        noonMeal: true,
        noonRecorder: '山川健太郎',

        eveningMedication: false,
        eveningMeal: false,
        eveningRecorder: '',

        vital: true,
        bath: false,

        sharedMemo: '',
    },
    {
        id: 4,
        name: '三坂裕子',
        age: 92,
        staffName: '山川健太郎',

        morningMedication: true,
        morningMeal: true,
        morningRecorder: '山川健太郎',

        noonMedication: true,
        noonMeal: true,
        noonRecorder: '山川健太郎',

        eveningMedication: false,
        eveningMeal: false,
        eveningRecorder: '',

        vital: true,
        bath: false,

        sharedMemo: 'おなかが痛いと主張',
    },
    {
        id: 5,
        name: '大川洋子',
        age: 76,
        staffName: '大川健司',

        morningMedication: true,
        morningMeal: true,
        morningRecorder: '大川健司',

        noonMedication: true,
        noonMeal: true,
        noonRecorder: '大川健司',

        eveningMedication: false,
        eveningMeal: false,
        eveningRecorder: '',

        vital: true,
        bath: false,

        sharedMemo: '',
    },
    {
        id: 6,
        name: '山田健太郎',
        age: 73,
        staffName: '大川健司',

        morningMedication: true,
        morningMeal: true,
        morningRecorder: '大川健司',

        noonMedication: false,
        noonMeal: false,
        noonRecorder: '',

        eveningMedication: false,
        eveningMeal: false,
        eveningRecorder: '',

        vital: true,
        bath: false,

        sharedMemo: 'リハビリ 8～14',
    },
    {
        id: 7,
        name: '鈴木敏江',
        age: 91,
        staffName: '佐藤実',

        morningMedication: true,
        morningMeal: true,
        morningRecorder: '佐藤実',

        noonMedication: true,
        noonMeal: true,
        noonRecorder: '大川健司',

        eveningMedication: false,
        eveningMeal: false,
        eveningRecorder: '',

        vital: true,
        bath: false,

        sharedMemo: '',
    },
    {
        id: 8,
        name: '坂下八重子',
        age: 82,
        staffName: '大川健司',

        morningMedication: true,
        morningMeal: true,
        morningRecorder: '大川健司',

        noonMedication: true,
        noonMeal: true,
        noonRecorder: '大川健司',

        eveningMedication: false,
        eveningMeal: false,
        eveningRecorder: '',

        vital: true,
        bath: false,

        sharedMemo: '排泄 つまり気味',
    },
];

function TaskCheck({
    completed,
}: {
    completed: boolean;
}) {
    if (!completed) {
        return null;
    }

    return (
        <span
            className="resident-list-check"
            aria-label="完了"
        >
            ✓
        </span>
    );
}

function ResidentListPage() {
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

    const handleResidentClick =
        (
            resident: ResidentTask,
        ) => {
            navigate(
                `/records/${resident.id}`,
                {
                    state: {
                        residentId:
                            resident.id,
                        residentName:
                            resident.name,
                        roomNumber: '---',
                    },
                },
            );
        };

    return (
        <main className="resident-list-page">
            <div className="resident-list-shell">
                <header className="resident-list-header">
                    <div className="resident-list-brand">
                        <div
                            className="resident-list-brand__mark"
                            aria-hidden="true"
                        >
                            🌿
                        </div>

                        <div className="resident-list-brand__name">
                            <strong>
                                からふる庭園海津
                            </strong>

                            <span>
                                Care Support System
                            </span>
                        </div>
                    </div>

                    <div className="resident-list-title">
                        <span className="resident-list-title__tag">
                            介護活動支援システム
                        </span>

                        <h1>
                            利用者一覧
                        </h1>

                        <p>
                            本日の記録状況を確認できます。
                        </p>
                    </div>

                    <div className="resident-list-account">
                        <time className="resident-list-clock">
                            {formatDate(
                                currentDateTime,
                            )}
                            {' '}
                            {formatTime(
                                currentDateTime,
                            )}
                        </time>

                        <div className="resident-list-account__row">
                            <div className="resident-list-staff">
                                <div
                                    className="resident-list-staff__avatar"
                                    aria-hidden="true"
                                >
                                    👤
                                </div>

                                <div className="resident-list-staff__text">
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
                                className="resident-list-menu-button"
                                onClick={
                                    handleBackToMenu
                                }
                            >
                                メニューへ戻る
                            </button>
                        </div>
                    </div>
                </header>

                <section className="resident-list-content">
                    <div className="resident-list-guide">
                        <div>
                            <h2>
                                記録タスク
                                <span>
                                    （共有）
                                </span>
                            </h2>

                            <p>
                                利用者ごとの本日の
                                記録状況を一覧で確認できます。
                            </p>
                        </div>

                        <div className="resident-list-today">
                            <span>
                                TODAY
                            </span>

                            <strong>
                                {formatDate(
                                    currentDateTime,
                                )}
                            </strong>
                        </div>
                    </div>

                    <div className="resident-list-table-wrapper">
                        <table className="resident-list-table">
                            <thead>
                                <tr>
                                    <th
                                        rowSpan={2}
                                        className="resident-list-name-column"
                                    >
                                        お名前
                                    </th>

                                    <th
                                        rowSpan={2}
                                        className="resident-list-staff-column"
                                    >
                                        担当
                                    </th>

                                    <th
                                        colSpan={3}
                                        className="resident-list-period-heading"
                                    >
                                        朝
                                    </th>

                                    <th
                                        colSpan={3}
                                        className="resident-list-period-heading"
                                    >
                                        昼
                                    </th>

                                    <th
                                        colSpan={3}
                                        className="resident-list-period-heading"
                                    >
                                        夜
                                    </th>

                                    <th rowSpan={2}>
                                        バイタル
                                    </th>

                                    <th rowSpan={2}>
                                        入浴
                                    </th>

                                    <th
                                        rowSpan={2}
                                        className="resident-list-memo-column"
                                    >
                                        共有メモ
                                    </th>
                                </tr>

                                <tr>
                                    <th>薬</th>
                                    <th>食事</th>
                                    <th>記録者</th>

                                    <th>薬</th>
                                    <th>食事</th>
                                    <th>記録者</th>

                                    <th>薬</th>
                                    <th>食事</th>
                                    <th>記録者</th>
                                </tr>
                            </thead>

                            <tbody>
                                {residentTasks.map(
                                    (
                                        resident,
                                    ) => (
                                        <tr
                                            key={
                                                resident.id
                                            }
                                        >
                                            <td className="resident-list-name-cell">
                                                <button
                                                    type="button"
                                                    className="resident-list-name-button"
                                                    onClick={() =>
                                                        handleResidentClick(
                                                            resident,
                                                        )
                                                    }
                                                >
                                                    {
                                                        resident.name
                                                    }
                                                    <span>
                                                        （
                                                        {
                                                            resident.age
                                                        }
                                                        ）
                                                    </span>
                                                </button>
                                            </td>

                                            <td>
                                                {
                                                    resident.staffName
                                                }
                                            </td>

                                            <td>
                                                <TaskCheck
                                                    completed={
                                                        resident.morningMedication
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <TaskCheck
                                                    completed={
                                                        resident.morningMeal
                                                    }
                                                />
                                            </td>

                                            <td className="resident-list-recorder-cell">
                                                {
                                                    resident.morningRecorder
                                                }
                                            </td>

                                            <td>
                                                <TaskCheck
                                                    completed={
                                                        resident.noonMedication
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <TaskCheck
                                                    completed={
                                                        resident.noonMeal
                                                    }
                                                />
                                            </td>

                                            <td className="resident-list-recorder-cell">
                                                {
                                                    resident.noonRecorder
                                                }
                                            </td>

                                            <td>
                                                <TaskCheck
                                                    completed={
                                                        resident.eveningMedication
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <TaskCheck
                                                    completed={
                                                        resident.eveningMeal
                                                    }
                                                />
                                            </td>

                                            <td className="resident-list-recorder-cell">
                                                {
                                                    resident.eveningRecorder
                                                }
                                            </td>

                                            <td>
                                                <TaskCheck
                                                    completed={
                                                        resident.vital
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <TaskCheck
                                                    completed={
                                                        resident.bath
                                                    }
                                                />
                                            </td>

                                            <td className="resident-list-memo-cell">
                                                {
                                                    resident.sharedMemo
                                                }
                                            </td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <footer className="resident-list-footer">
                    <span>
                        Colorful Garden Kaizu
                        Care Support System
                    </span>

                    <span>
                        利用者名をタップすると
                        記録入力画面へ移動します。
                    </span>
                </footer>
            </div>
        </main>
    );
}

export default ResidentListPage;
