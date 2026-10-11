import { RecordInputField } from '../components/RecordInputField';
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
import type { RecordResidentState } from '../types/residentSelection';

type RecordLocationState = RecordResidentState;

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
                `/residents/floors/${locationState?.floor ?? 1}`,
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
                                {locationState?.serialNo ? '連番・入居日' : '利用者ID'}
                            </span>

                            <strong>
                                {locationState?.serialNo ? `${locationState.serialNo}・${locationState.moveInDate?.slice(0, 10).replaceAll('-', '/')}` : residentId}
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

                                <RecordInputField id="meal-type" label="食事区分" kind="select" value={mealType} onConfirm={value => setMealType(value as MealType)} options={[{ value: '朝食', label: '朝食' }, { value: '昼食', label: '昼食' }, { value: 'おやつ', label: 'おやつ' }, { value: '夕食', label: '夕食' }]} />
                            </div>

                            <div className="record-meal-sliders">
                                <div>
                                    <label htmlFor="rice-amount">
                                        ごはん
                                    </label>

                                    <RecordInputField id="rice-amount" label="ごはん" kind="select" value={String(riceAmount)} displayValue={`${riceAmount}/10`} onConfirm={value => setRiceAmount(Number(value))} options={Array.from({length: 11}, (_,value) => ({value: String(value), label: String(value)}))} />
                                </div>

                                <div>
                                    <label htmlFor="side-dish-amount">
                                        おかず
                                    </label>

                                    <RecordInputField id="side-dish-amount" label="おかず" kind="select" value={String(sideDishAmount)} displayValue={`${sideDishAmount}/10`} onConfirm={value => setSideDishAmount(Number(value))} options={Array.from({length: 11}, (_,value) => ({value: String(value), label: String(value)}))} />
                                </div>
                            </div>

                            <div className="record-form-grid">
                                <div className="record-form-field">
                                    <label htmlFor="medication">
                                        服薬
                                    </label>

                                    <RecordInputField id="medication" label="服薬" kind="select" value={medication} onConfirm={setMedication} options={[{ value: '', label: 'なし' }, { value: '食前薬', label: '食前薬' }, { value: '食後薬', label: '食後薬' }, { value: '食前後薬', label: '食前後薬' }, { value: '就寝前薬', label: '就寝前薬' }]} />
                                </div>

                                <div className="record-form-field">
                                    <label htmlFor="eye-drops">
                                        点眼
                                    </label>

                                    <RecordInputField id="eye-drops" label="点眼" kind="select" value={eyeDrops} onConfirm={setEyeDrops} options={[{ value: '', label: 'なし' }, { value: '○', label: '実施' }, { value: '拒否', label: '拒否' }]} />
                                </div>

                                <div className="record-form-field">
                                    <label htmlFor="oral-care">
                                        口腔ケア
                                    </label>

                                    <RecordInputField id="oral-care" label="口腔ケア" kind="select" value={oralCare} onConfirm={setOralCare} options={[{ value: '', label: 'なし' }, { value: 'はみがき', label: 'はみがき' }, { value: 'うがい', label: 'うがい' }, { value: '義歯洗浄', label: '義歯洗浄' }]} />
                                </div>
                            </div>


                            <div className="record-form-field">
                                <label htmlFor="meal-memo">
                                    メモ
                                </label>

                                <RecordInputField id="meal-memo" label="メモ" kind="memo" value={memo} onConfirm={setMemo} placeholder="メモを入力" />
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
                                <label htmlFor="systolic">
                                    血圧 上
                                </label>

                                <RecordInputField id="systolic" label="血圧 上" kind="number" value={vitalForm.systolicBloodPressure} onConfirm={value => handleVitalChange('systolicBloodPressure', value)} />

                                <label htmlFor="diastolic">
                                    血圧 下
                                </label>

                                <RecordInputField id="diastolic" label="血圧 下" kind="number" value={vitalForm.diastolicBloodPressure} onConfirm={value => handleVitalChange('diastolicBloodPressure', value)} />

                                <label htmlFor="temperature">
                                    体温（℃）
                                </label>

                                <RecordInputField id="temperature" label="体温（℃）" kind="number" value={vitalForm.temperature} onConfirm={value => handleVitalChange('temperature', value)} decimal decimalPlaces={1} />

                                <label htmlFor="respiration">
                                    呼吸（回/分）
                                </label>

                                <RecordInputField id="respiration" label="呼吸（回/分）" kind="number" value={vitalForm.respiration} onConfirm={value => handleVitalChange('respiration', value)} />

                                <label htmlFor="pulse">
                                    脈拍（回/分）
                                </label>

                                <RecordInputField id="pulse" label="脈拍（回/分）" kind="number" value={vitalForm.pulse} onConfirm={value => handleVitalChange('pulse', value)} />

                                <label htmlFor="spo2">
                                    SpO2（%）
                                </label>

                                <RecordInputField id="spo2" label="SpO2（%）" kind="number" value={vitalForm.spo2} onConfirm={value => handleVitalChange('spo2', value)} />
                                <label htmlFor="height">
                                    身長（cm）
                                </label>

                                <RecordInputField id="height" label="身長（cm）" kind="number" value={vitalForm.height} onConfirm={value => handleVitalChange('height', value)} decimal />

                                <label htmlFor="weight">
                                    体重（kg）
                                </label>

                                <RecordInputField id="weight" label="体重（kg）" kind="number" value={vitalForm.weight} onConfirm={value => handleVitalChange('weight', value)} decimal />

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

                                    <RecordInputField id="bath-time" label="時刻" kind="time" value={bathForm.time} onConfirm={value => handleBathChange('time', value)} />
                                </div>

                                <div className="record-form-field">
                                    <label htmlFor="caregiver">
                                        介護者
                                    </label>

                                    <RecordInputField id="caregiver" label="介護者" kind="text" value={bathForm.caregiver} onConfirm={value => handleBathChange('caregiver', value)} />
                                </div>

                                <div className="record-form-field">
                                    <label htmlFor="bath-systolic">
                                        血圧 上
                                    </label>

                                    <RecordInputField id="bath-systolic" label="血圧 上" kind="number" value={bathForm.systolicBloodPressure} onConfirm={value => handleBathChange('systolicBloodPressure', value)} />
                                </div>

                                <div className="record-form-field">
                                    <label htmlFor="bath-diastolic">
                                        血圧 下
                                    </label>

                                    <RecordInputField id="bath-diastolic" label="血圧 下" kind="number" value={bathForm.diastolicBloodPressure} onConfirm={value => handleBathChange('diastolicBloodPressure', value)} />
                                </div>

                                <div className="record-form-field">
                                    <label htmlFor="bath-method">
                                        入浴方法
                                    </label>

                                    <RecordInputField id="bath-method" label="入浴方法" kind="select" value={bathForm.bathMethod} onConfirm={value => handleBathChange('bathMethod', value)} options={[{ value: '全身浴', label: '全身浴' }, { value: '半身浴', label: '半身浴' }, { value: 'シャワー浴', label: 'シャワー浴' }, { value: '機械浴', label: '機械浴' }, { value: '清拭', label: '清拭' }]} />
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
