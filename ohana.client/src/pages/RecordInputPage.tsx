import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    useLocation,
    useNavigate,
    useParams,
} from 'react-router-dom';

import {
    useAuth,
} from '../auth/useAuth';

import kaizuLogo from '../assets/kaizu-logo.png';

import '../styles/RecordInputPage.css';

type RecordLocationState = {
    residentId: number;
    residentName: string;
    roomNumber: string;
};

type MealType =
    | '朝食'
    | '昼食'
    | 'おやつ'
    | '夕食';

type MealRecord = {
    id: number;
    mealType: MealType;
    riceAmount: number;
    sideDishAmount: number;
    medication: string;
    eyeDrops: string;
    oralCare: string;
    memo: string;
};

type VitalForm = {
    height: string;
    weight: string;
    systolicBloodPressure: string;
    diastolicBloodPressure: string;
    temperature: string;
    respiration: string;
    pulse: string;
    spo2: string;
};

type BathForm = {
    time: string;
    caregiver: string;
    systolicBloodPressure: string;
    diastolicBloodPressure: string;
    bathMethod: string;
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
    const hours =
        String(
            date.getHours(),
        ).padStart(2, '0');

    const minutes =
        String(
            date.getMinutes(),
        ).padStart(2, '0');

    return `${hours}:${minutes}`;
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

function RecordInputPage() {
    const navigate =
        useNavigate();

    const location =
        useLocation();

    const {
        residentId,
    } = useParams<{
        residentId: string;
    }>();

    const {
        user,
    } = useAuth();

    const locationState =
        location.state as
            RecordLocationState
            | null;

    const [
        currentDate,
        setCurrentDate,
    ] = useState(
        () => new Date(),
    );

    const [
        targetDate,
        setTargetDate,
    ] = useState(
        () => new Date(),
    );

    const [
        mealType,
        setMealType,
    ] = useState<MealType>(
        '朝食',
    );

    const [
        riceAmount,
        setRiceAmount,
    ] = useState(
        10,
    );

    const [
        sideDishAmount,
        setSideDishAmount,
    ] = useState(
        10,
    );

    const [
        medication,
        setMedication,
    ] = useState(
        '食後薬',
    );

    const [
        eyeDrops,
        setEyeDrops,
    ] = useState(
        '○',
    );

    const [
        oralCare,
        setOralCare,
    ] = useState(
        'はみがき',
    );

    const [
        memo,
        setMemo,
    ] = useState(
        '',
    );

    const [
        selectedFileName,
        setSelectedFileName,
    ] = useState(
        '',
    );

    const [
        mealRecords,
        setMealRecords,
    ] = useState<MealRecord[]>([
        {
            id: 1,
            mealType: '朝食',
            riceAmount: 10,
            sideDishAmount: 10,
            medication: '食後薬',
            eyeDrops: '○',
            oralCare: 'はみがき',
            memo: '味噌汁が冷たかった',
        },
        {
            id: 2,
            mealType: '昼食',
            riceAmount: 6,
            sideDishAmount: 6,
            medication: '食後薬',
            eyeDrops: '○',
            oralCare: 'うがい',
            memo: '',
        },
    ]);

    const [
        vitalForm,
        setVitalForm,
    ] = useState<VitalForm>({
        height: '',
        weight: '',
        systolicBloodPressure: '',
        diastolicBloodPressure: '',
        temperature: '',
        respiration: '',
        pulse: '',
        spo2: '',
    });

    const [
        bathForm,
        setBathForm,
    ] = useState<BathForm>({
        time: formatTime(
            new Date(),
        ),
        caregiver:
            user?.employeeName
            ?? '',
        systolicBloodPressure: '',
        diastolicBloodPressure: '',
        bathMethod: '全身浴',
    });

    const residentName =
        locationState?.residentName
        ?? '利用者名未取得';

    const roomNumber =
        locationState?.roomNumber
        ?? '---';

    const staffName =
        user?.employeeName
        ?? '担当者名未取得';

    const staffRole =
        getRoleDisplayName(
            user?.role,
        );

    const targetDateText =
        useMemo(
            () => formatDate(
                targetDate,
            ),
            [
                targetDate,
            ],
        );

    useEffect(() => {
        const timerId =
            window.setInterval(
                () => {
                    setCurrentDate(
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

    const handleMoveDate = (
        numberOfDays: number,
    ) => {
        setTargetDate(
            current => {
                const nextDate =
                    new Date(
                        current,
                    );

                nextDate.setDate(
                    nextDate.getDate()
                    + numberOfDays,
                );

                return nextDate;
            },
        );
    };

    const handleMealSave = () => {
        const newRecord:
            MealRecord = {
                id: Date.now(),
                mealType,
                riceAmount,
                sideDishAmount,
                medication,
                eyeDrops,
                oralCare,
                memo,
            };

        setMealRecords(
            currentRecords => [
                ...currentRecords,
                newRecord,
            ],
        );

        setMemo(
            '',
        );

        setSelectedFileName(
            '',
        );
    };

    const handleVitalChange = (
        field: keyof VitalForm,
        value: string,
    ) => {
        setVitalForm(
            current => ({
                ...current,
                [field]: value,
            }),
        );
    };

    const handleBathChange = (
        field: keyof BathForm,
        value: string,
    ) => {
        setBathForm(
            current => ({
                ...current,
                [field]: value,
            }),
        );
    };

    const handleVitalSave = () => {
        window.alert(
            'バイタル情報を保存します。API接続は後ほど実装します。',
        );
    };

    const handleBathSave = () => {
        window.alert(
            '入浴情報を保存します。API接続は後ほど実装します。',
        );
    };

    const handleBackToResidentSelect =
        () => {
            navigate(
                '/residents/floors/1',
            );
        };

    const handleBackToMenu =
        () => {
            navigate(
                '/menu',
            );
        };

    return (
        <main className="record-input-page">
            <div className="record-input-shell">
                <header className="record-input-header">
                    <div className="record-input-brand">
                        <img
                            src={kaizuLogo}
                            alt="からふる庭園海津"
                        />
                    </div>

                    <div className="record-input-title">
                        <span className="record-input-title__tag">
                            介護活動支援システム
                        </span>

                        <h1>
                            記録入力
                        </h1>

                        <p>
                            食事、バイタル、入浴の記録を入力します。
                        </p>
                    </div>

                    <div className="record-input-account">
                        <time className="record-input-clock">
                            {formatDate(
                                currentDate,
                            )}{' '}
                            {formatTime(
                                currentDate,
                            )}
                        </time>

                        <div className="record-input-account__row">
                            <div className="record-input-staff">
                                <div
                                    className="record-input-staff__avatar"
                                    aria-hidden="true"
                                >
                                    👤
                                </div>

                                <div className="record-input-staff__text">
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
                                className="record-input-header-button"
                                onClick={
                                    handleBackToResidentSelect
                                }
                            >
                                利用者選択へ戻る
                            </button>

                            <button
                                type="button"
                                className="record-input-header-button"
                                onClick={
                                    handleBackToMenu
                                }
                            >
                                メニューへ戻る
                            </button>
                        </div>
                    </div>
                </header>

                <section className="record-input-content">
                    <div className="record-input-date-toolbar">
                        <div>
                            <h2>
                                本日の記録情報
                            </h2>

                            <p>
                                対象日を確認して記録してください。
                            </p>
                        </div>

                        <div className="record-input-date-controls">
                            <button
                                type="button"
                                onClick={() => {
                                    handleMoveDate(
                                        -1,
                                    );
                                }}
                            >
                                前日
                            </button>

                            <strong>
                                {targetDateText}
                            </strong>

                            <button
                                type="button"
                                onClick={() => {
                                    handleMoveDate(
                                        1,
                                    );
                                }}
                            >
                                翌日
                            </button>
                        </div>
                    </div>

                    <div className="record-input-resident">
                        <div>
                            <span>
                                利用者
                            </span>

                            <strong>
                                {residentName} 様
                            </strong>
                        </div>

                        <div>
                            <span>
                                居室
                            </span>

                            <strong>
                                {roomNumber}号室
                            </strong>
                        </div>

                        <div>
                            <span>
                                利用者ID
                            </span>

                            <strong>
                                {residentId}
                            </strong>
                        </div>

                        <div>
                            <span>
                                記録者
                            </span>

                            <strong>
                                {staffName}
                            </strong>
                        </div>
                    </div>

                    <div className="record-input-main-grid">
                        <section className="record-panel record-panel--meal">
                            <div className="record-panel__header">
                                <div>
                                    <span
                                        className="record-panel__icon record-panel__icon--meal"
                                        aria-hidden="true"
                                    >
                                        ◔
                                    </span>

                                    <h2>
                                        お食事・服薬・点眼・口腔ケア
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    className="record-save-button"
                                    onClick={
                                        handleMealSave
                                    }
                                >
                                    記録
                                </button>
                            </div>

                            <div className="record-form-field">
                                <label htmlFor="meal-type">
                                    食事区分
                                </label>

                                <select
                                    id="meal-type"
                                    value={
                                        mealType
                                    }
                                    onChange={(event) => {
                                        setMealType(event.target.value as MealType);
                                    }}
                                >
                                    <option value="朝食">
                                        朝食
                                    </option>

                                    <option value="昼食">
                                        昼食
                                    </option>

                                    <option value="おやつ">
                                        おやつ
                                    </option>

                                    <option value="夕食">
                                        夕食
                                    </option>
                                </select>
                            </div>

                            <div className="record-meal-sliders">
                                <div>
                                    <label htmlFor="rice-amount">
                                        ごはん
                                    </label>

                                    <input
                                        id="rice-amount"
                                        type="range"
                                        min="0"
                                        max="10"
                                        value={
                                            riceAmount
                                        }
                                        onChange={
                                            event => {
                                                setRiceAmount(
                                                    Number(
                                                        event.target.value,
                                                    ),
                                                );
                                            }
                                        }
                                    />

                                    <output>
                                        {riceAmount}/10
                                    </output>
                                </div>

                                <div>
                                    <label htmlFor="side-dish-amount">
                                        おかず
                                    </label>

                                    <input
                                        id="side-dish-amount"
                                        type="range"
                                        min="0"
                                        max="10"
                                        value={
                                            sideDishAmount
                                        }
                                        onChange={
                                            event => {
                                                setSideDishAmount(
                                                    Number(
                                                        event.target.value,
                                                    ),
                                                );
                                            }
                                        }
                                    />

                                    <output>
                                        {sideDishAmount}/10
                                    </output>
                                </div>
                            </div>

                            <div className="record-form-grid">
                                <div className="record-form-field">
                                    <label htmlFor="medication">
                                        服薬
                                    </label>

                                    <select
                                        id="medication"
                                        value={
                                            medication
                                        }
                                        onChange={
                                            event => {
                                                setMedication(
                                                    event.target.value,
                                                );
                                            }
                                        }
                                    >
                                        <option value="">
                                            なし
                                        </option>

                                        <option value="食前薬">
                                            食前薬
                                        </option>

                                        <option value="食後薬">
                                            食後薬
                                        </option>

                                        <option value="就寝前薬">
                                            就寝前薬
                                        </option>
                                    </select>
                                </div>

                                <div className="record-form-field">
                                    <label htmlFor="eye-drops">
                                        点眼
                                    </label>

                                    <select
                                        id="eye-drops"
                                        value={
                                            eyeDrops
                                        }
                                        onChange={
                                            event => {
                                                setEyeDrops(
                                                    event.target.value,
                                                );
                                            }
                                        }
                                    >
                                        <option value="">
                                            なし
                                        </option>

                                        <option value="○">
                                            実施
                                        </option>

                                        <option value="拒否">
                                            拒否
                                        </option>
                                    </select>
                                </div>

                                <div className="record-form-field">
                                    <label htmlFor="oral-care">
                                        口腔ケア
                                    </label>

                                    <select
                                        id="oral-care"
                                        value={
                                            oralCare
                                        }
                                        onChange={
                                            event => {
                                                setOralCare(
                                                    event.target.value,
                                                );
                                            }
                                        }
                                    >
                                        <option value="">
                                            なし
                                        </option>

                                        <option value="はみがき">
                                            はみがき
                                        </option>

                                        <option value="うがい">
                                            うがい
                                        </option>

                                        <option value="義歯洗浄">
                                            義歯洗浄
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className="record-file-field">
                                <label htmlFor="meal-photo">
                                    写真
                                </label>

                                <input
                                    id="meal-photo"
                                    type="file"
                                    accept="image/*"
                                    onChange={
                                        event => {
                                            const file =
                                                event.target.files?.[0];

                                            setSelectedFileName(
                                                file?.name
                                                ?? '',
                                            );
                                        }
                                    }
                                />

                                <span>
                                    {
                                        selectedFileName
                                        || '写真は選択されていません'
                                    }
                                </span>
                            </div>

                            <div className="record-form-field">
                                <label htmlFor="meal-memo">
                                    メモ
                                </label>

                                <textarea
                                    id="meal-memo"
                                    value={
                                        memo
                                    }
                                    onChange={
                                        event => {
                                            setMemo(
                                                event.target.value,
                                            );
                                        }
                                    }
                                    placeholder="食事時の様子などを入力"
                                />
                            </div>

                            <div className="record-table-wrap">
                                <table className="record-table">
                                    <thead>
                                        <tr>
                                            <th>
                                                食事
                                            </th>

                                            <th>
                                                主食
                                            </th>

                                            <th>
                                                副食
                                            </th>

                                            <th>
                                                服薬
                                            </th>

                                            <th>
                                                点眼
                                            </th>

                                            <th>
                                                口腔ケア
                                            </th>

                                            <th>
                                                メモ
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {mealRecords.map(
                                            record => (
                                                <tr
                                                    key={
                                                        record.id
                                                    }
                                                >
                                                    <td>
                                                        {
                                                            record.mealType
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            record.riceAmount
                                                        }/10
                                                    </td>

                                                    <td>
                                                        {
                                                            record.sideDishAmount
                                                        }/10
                                                    </td>

                                                    <td>
                                                        {
                                                            record.medication
                                                            || '-'
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            record.eyeDrops
                                                            || '-'
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            record.oralCare
                                                            || '-'
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            record.memo
                                                            || '-'
                                                        }
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="record-panel record-panel--vital">
                            <div className="record-panel__header">
                                <div>
                                    <span
                                        className="record-panel__icon record-panel__icon--vital"
                                        aria-hidden="true"
                                    >
                                        ♥
                                    </span>

                                    <h2>
                                        バイタル
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    className="record-save-button"
                                    onClick={
                                        handleVitalSave
                                    }
                                >
                                    保存
                                </button>
                            </div>

                            <p className="record-panel__time">
                                {targetDateText}{' '}
                                {formatTime(
                                    currentDate,
                                )}
                            </p>

                            <div className="record-vital-grid">
                                <label htmlFor="height">
                                    身長（cm）
                                </label>

                                <input
                                    id="height"
                                    type="number"
                                    inputMode="decimal"
                                    value={
                                        vitalForm.height
                                    }
                                    onChange={
                                        event => {
                                            handleVitalChange(
                                                'height',
                                                event.target.value,
                                            );
                                        }
                                    }
                                />

                                <label htmlFor="weight">
                                    体重（kg）
                                </label>

                                <input
                                    id="weight"
                                    type="number"
                                    inputMode="decimal"
                                    value={
                                        vitalForm.weight
                                    }
                                    onChange={
                                        event => {
                                            handleVitalChange(
                                                'weight',
                                                event.target.value,
                                            );
                                        }
                                    }
                                />

                                <label htmlFor="systolic">
                                    血圧 上
                                </label>

                                <input
                                    id="systolic"
                                    type="number"
                                    inputMode="numeric"
                                    value={
                                        vitalForm
                                            .systolicBloodPressure
                                    }
                                    onChange={
                                        event => {
                                            handleVitalChange(
                                                'systolicBloodPressure',
                                                event.target.value,
                                            );
                                        }
                                    }
                                />

                                <label htmlFor="diastolic">
                                    血圧 下
                                </label>

                                <input
                                    id="diastolic"
                                    type="number"
                                    inputMode="numeric"
                                    value={
                                        vitalForm
                                            .diastolicBloodPressure
                                    }
                                    onChange={
                                        event => {
                                            handleVitalChange(
                                                'diastolicBloodPressure',
                                                event.target.value,
                                            );
                                        }
                                    }
                                />

                                <label htmlFor="temperature">
                                    体温（℃）
                                </label>

                                <input
                                    id="temperature"
                                    type="number"
                                    inputMode="decimal"
                                    step="0.1"
                                    value={
                                        vitalForm.temperature
                                    }
                                    onChange={
                                        event => {
                                            handleVitalChange(
                                                'temperature',
                                                event.target.value,
                                            );
                                        }
                                    }
                                />

                                <label htmlFor="respiration">
                                    呼吸（回/分）
                                </label>

                                <input
                                    id="respiration"
                                    type="number"
                                    inputMode="numeric"
                                    value={
                                        vitalForm.respiration
                                    }
                                    onChange={
                                        event => {
                                            handleVitalChange(
                                                'respiration',
                                                event.target.value,
                                            );
                                        }
                                    }
                                />

                                <label htmlFor="pulse">
                                    脈拍（回/分）
                                </label>

                                <input
                                    id="pulse"
                                    type="number"
                                    inputMode="numeric"
                                    value={
                                        vitalForm.pulse
                                    }
                                    onChange={
                                        event => {
                                            handleVitalChange(
                                                'pulse',
                                                event.target.value,
                                            );
                                        }
                                    }
                                />

                                <label htmlFor="spo2">
                                    SpO2（%）
                                </label>

                                <input
                                    id="spo2"
                                    type="number"
                                    inputMode="numeric"
                                    value={
                                        vitalForm.spo2
                                    }
                                    onChange={
                                        event => {
                                            handleVitalChange(
                                                'spo2',
                                                event.target.value,
                                            );
                                        }
                                    }
                                />
                            </div>
                        </section>

                        <section className="record-panel record-panel--bath">
                            <div className="record-panel__header">
                                <div>
                                    <span
                                        className="record-panel__icon record-panel__icon--bath"
                                        aria-hidden="true"
                                    >
                                        ♨
                                    </span>

                                    <h2>
                                        入浴
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    className="record-save-button"
                                    onClick={
                                        handleBathSave
                                    }
                                >
                                    保存
                                </button>
                            </div>

                            <div className="record-bath-fields">
                                <div className="record-form-field">
                                    <label htmlFor="bath-time">
                                        時刻
                                    </label>

                                    <input
                                        id="bath-time"
                                        type="time"
                                        value={
                                            bathForm.time
                                        }
                                        onChange={
                                            event => {
                                                handleBathChange(
                                                    'time',
                                                    event.target.value,
                                                );
                                            }
                                        }
                                    />
                                </div>

                                <div className="record-form-field">
                                    <label htmlFor="caregiver">
                                        介護者
                                    </label>

                                    <input
                                        id="caregiver"
                                        type="text"
                                        value={
                                            bathForm.caregiver
                                        }
                                        onChange={
                                            event => {
                                                handleBathChange(
                                                    'caregiver',
                                                    event.target.value,
                                                );
                                            }
                                        }
                                    />
                                </div>

                                <div className="record-form-field">
                                    <label htmlFor="bath-systolic">
                                        血圧 上
                                    </label>

                                    <input
                                        id="bath-systolic"
                                        type="number"
                                        inputMode="numeric"
                                        value={
                                            bathForm
                                                .systolicBloodPressure
                                        }
                                        onChange={
                                            event => {
                                                handleBathChange(
                                                    'systolicBloodPressure',
                                                    event.target.value,
                                                );
                                            }
                                        }
                                    />
                                </div>

                                <div className="record-form-field">
                                    <label htmlFor="bath-diastolic">
                                        血圧 下
                                    </label>

                                    <input
                                        id="bath-diastolic"
                                        type="number"
                                        inputMode="numeric"
                                        value={
                                            bathForm
                                                .diastolicBloodPressure
                                        }
                                        onChange={
                                            event => {
                                                handleBathChange(
                                                    'diastolicBloodPressure',
                                                    event.target.value,
                                                );
                                            }
                                        }
                                    />
                                </div>

                                <div className="record-form-field">
                                    <label htmlFor="bath-method">
                                        入浴方法
                                    </label>

                                    <select
                                        id="bath-method"
                                        value={
                                            bathForm.bathMethod
                                        }
                                        onChange={
                                            event => {
                                                handleBathChange(
                                                    'bathMethod',
                                                    event.target.value,
                                                );
                                            }
                                        }
                                    >
                                        <option value="全身浴">
                                            全身浴
                                        </option>

                                        <option value="半身浴">
                                            半身浴
                                        </option>

                                        <option value="シャワー浴">
                                            シャワー浴
                                        </option>

                                        <option value="機械浴">
                                            機械浴
                                        </option>

                                        <option value="清拭">
                                            清拭
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </section>
                    </div>

                    <section className="record-history">
                        <div className="record-history__header">
                            <div>
                                <h2>
                                    記録履歴
                                </h2>

                                <p>
                                    過去の食事、バイタル、入浴記録を表示します。
                                </p>
                            </div>
                        </div>

                        <div className="record-table-wrap">
                            <table className="record-table record-history-table">
                                <thead>
                                    <tr>
                                        <th>
                                            記録日
                                        </th>

                                        <th>
                                            記録者
                                        </th>

                                        <th>
                                            身長
                                        </th>

                                        <th>
                                            体重
                                        </th>

                                        <th>
                                            体温
                                        </th>

                                        <th>
                                            脈拍
                                        </th>

                                        <th>
                                            血圧
                                        </th>

                                        <th>
                                            呼吸
                                        </th>

                                        <th>
                                            SpO2
                                        </th>

                                        <th>
                                            朝食
                                        </th>

                                        <th>
                                            昼食
                                        </th>

                                        <th>
                                            おやつ
                                        </th>

                                        <th>
                                            夕食
                                        </th>

                                        <th>
                                            入浴時刻
                                        </th>

                                        <th>
                                            介護者
                                        </th>

                                        <th>
                                            方法
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr>
                                        <td>
                                            2026/03/02
                                        </td>

                                        <td>
                                            {staffName}
                                        </td>

                                        <td>
                                            166.2
                                        </td>

                                        <td>
                                            63.3
                                        </td>

                                        <td>
                                            36.5
                                        </td>

                                        <td>
                                            65
                                        </td>

                                        <td>
                                            123/66
                                        </td>

                                        <td>
                                            12
                                        </td>

                                        <td>
                                            99
                                        </td>

                                        <td>
                                            10/10
                                        </td>

                                        <td>
                                            10/10
                                        </td>

                                        <td>
                                            10/10
                                        </td>

                                        <td>
                                            10/10
                                        </td>

                                        <td>
                                            20:30
                                        </td>

                                        <td>
                                            {staffName}
                                        </td>

                                        <td>
                                            半身浴
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>
                </section>
            </div>
        </main>
    );
}

export default RecordInputPage;
