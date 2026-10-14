import { useRecordInput } from '../hooks/useRecordInput';
import { RecordSaveResultDialog } from '../components/RecordSaveResultDialog';
import { japanTime } from '../utilities/recordDate';
import type { MealType } from '../services/recordService';
import { RecordInputField } from '../components/RecordInputField';
import {
    useEffect,
    useRef,
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

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('ja-JP', {timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short'}).format(date);
}
function formatTime(date: Date): string { return japanTime(date); }

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
    const navigate = useNavigate();
    const location = useLocation();
    const { residentId } = useParams<{residentId:string}>();
    const { user } = useAuth();
    const locationState = location.state as RecordLocationState | null;
    const [currentDate,setCurrentDate] = useState(()=>new Date());
    const saveOpener = useRef<HTMLButtonElement>(null);
    useEffect(()=>{const timer=window.setInterval(()=>setCurrentDate(new Date()),1000);return()=>window.clearInterval(timer);},[]);
    const { targetDate,scope,phase,loadError,caregiverError,caregivers,saving,success,closeSuccess,failure,closeFailure,fieldError,records,
        mealType,setMealType,riceAmount,setRiceAmount,sideDishAmount,setSideDishAmount,medication,setMedication,eyeDrops,setEyeDrops,oralCare,setOralCare,memo,setMemo,
        vitalForm,bathForm,handleVitalChange,handleBathChange,handleMoveDate,handleMealSave,handleVitalSave,handleBathSave } = useRecordInput(locationState);
    const residentName = records?.tenantName ?? locationState?.residentName ?? '利用者名未取得';
    const roomNumber = locationState?.roomNumber ?? '---';
    const staffName = user?.employeeName ?? '担当者名未取得';
    const staffRole = getRoleDisplayName(user?.role);
    const targetDateText = formatDate(new Date(`${targetDate}T12:00:00+09:00`));
    const handleBackToResidentSelect = ()=>navigate(`/residents/floors/${locationState?.floor??1}`);
    const handleBackToMenu = ()=>navigate('/menu');

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
                                <span role={phase==='error'||phase==='invalid'||caregiverError?'alert':'status'} className={phase==='error'||phase==='invalid'||caregiverError?'record-feedback--error':''}>{phase==='error'||phase==='invalid'?loadError:phase==='loading'?'記録を取得しています…':caregiverError?`介護者一覧：${caregiverError}`:saving?'記録を保存しています…':'対象日を確認して記録してください。'}</span>
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

                    <fieldset key={scope} className="record-input-form" disabled={phase !== 'ready' || saving !== null}>
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
                                        event => { saveOpener.current = event.currentTarget; handleMealSave(); }
                                    }
                                >
                                    {saving === 'meal' ? '保存中…' : '記録'}
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

                                    <RecordInputField error={fieldError('riceAmount','meal')} id="rice-amount" optionLayout="amount" label="ごはん" kind="select" value={String(riceAmount)} displayValue={riceAmount === '' ? '未入力' : `${riceAmount}/10`} onConfirm={setRiceAmount} options={[{value:'',label:'未入力'}, ...Array.from({length: 11}, (_,value) => ({value: String(value), label: String(value)}))]} />
                                </div>

                                <div>
                                    <label htmlFor="side-dish-amount">
                                        おかず
                                    </label>

                                    <RecordInputField error={fieldError('sideDishAmount','meal')} id="side-dish-amount" optionLayout="amount" label="おかず" kind="select" value={String(sideDishAmount)} displayValue={sideDishAmount === '' ? '未入力' : `${sideDishAmount}/10`} onConfirm={setSideDishAmount} options={[{value:'',label:'未入力'}, ...Array.from({length: 11}, (_,value) => ({value: String(value), label: String(value)}))]} />
                                </div>
                            </div>

                            <div className="record-form-grid">
                                <div className="record-form-field">
                                    <label htmlFor="medication">
                                        服薬
                                    </label>

                                    <RecordInputField error={fieldError('medicationType','meal')} id="medication" label="服薬" kind="select" value={medication} onConfirm={setMedication} options={[{value:'',label:'未選択'}, { value: 'なし', label: 'なし' }, { value: '食前薬', label: '食前薬' }, { value: '食後薬', label: '食後薬' }, { value: '食前後薬', label: '食前後薬' }, { value: '就寝前薬', label: '就寝前薬' }]} />
                                </div>

                                <div className="record-form-field">
                                    <label htmlFor="eye-drops">
                                        点眼
                                    </label>

                                    <RecordInputField error={fieldError('eyeDrops','meal')} id="eye-drops" label="点眼" kind="select" value={eyeDrops} onConfirm={setEyeDrops} options={[{ value: '', label: '未選択' }, { value: '実施', label: '実施' }, { value: '拒否', label: '拒否' }]} />
                                </div>

                                <div className="record-form-field">
                                    <label htmlFor="oral-care">
                                        口腔ケア
                                    </label>

                                    <RecordInputField error={fieldError('oralCare','meal')} id="oral-care" label="口腔ケア" kind="select" value={oralCare} onConfirm={setOralCare} options={[{ value: '', label: '未選択' }, { value: 'はみがき', label: 'はみがき' }, { value: 'うがい', label: 'うがい' }, { value: '義歯洗浄', label: '義歯洗浄' }]} />
                                </div>
                            </div>


                            <div className="record-form-field">
                                <label htmlFor="meal-memo">
                                    メモ
                                </label>

                                <RecordInputField error={fieldError('memo','meal')} id="meal-memo" label="メモ" kind="memo" value={memo} onConfirm={setMemo} placeholder="メモを入力" maxBytes={65535} />
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
                                        event => { saveOpener.current = event.currentTarget; handleVitalSave(); }
                                    }
                                >
                                    保存
                                </button>
                            </div>


                            <div className="record-vital-grid">
                                <label htmlFor="systolic">
                                    血圧 上
                                </label>

                                <RecordInputField error={fieldError('systolicBloodPressure','vital')} id="systolic" label="血圧 上" kind="number" value={vitalForm.systolicBloodPressure} onConfirm={value => handleVitalChange('systolicBloodPressure', value)} max={65535} />

                                <label htmlFor="diastolic">
                                    血圧 下
                                </label>

                                <RecordInputField error={fieldError('diastolicBloodPressure','vital')} id="diastolic" label="血圧 下" kind="number" value={vitalForm.diastolicBloodPressure} onConfirm={value => handleVitalChange('diastolicBloodPressure', value)} max={65535} />

                                <label htmlFor="temperature">
                                    体温（℃）
                                </label>

                                <RecordInputField error={fieldError('temperatureC','vital')} id="temperature" label="体温（℃）" kind="number" value={vitalForm.temperature} onConfirm={value => handleVitalChange('temperature', value)} decimal decimalPlaces={1} max={999.9} />

                                <label htmlFor="respiration">
                                    呼吸（回/分）
                                </label>

                                <RecordInputField error={fieldError('respirationRate','vital')} id="respiration" label="呼吸（回/分）" kind="number" value={vitalForm.respiration} onConfirm={value => handleVitalChange('respiration', value)} max={65535} />

                                <label htmlFor="pulse">
                                    脈拍（回/分）
                                </label>

                                <RecordInputField error={fieldError('pulseRate','vital')} id="pulse" label="脈拍（回/分）" kind="number" value={vitalForm.pulse} onConfirm={value => handleVitalChange('pulse', value)} max={65535} />

                                <label htmlFor="spo2">
                                    SpO2（%）
                                </label>

                                <RecordInputField error={fieldError('spo2Percent','vital')} id="spo2" label="SpO2（%）" kind="number" value={vitalForm.spo2} onConfirm={value => handleVitalChange('spo2', value)} decimal decimalPlaces={1} max={999.9} />
                                <label htmlFor="height">
                                    身長（cm）
                                </label>

                                <RecordInputField error={fieldError('heightCm','vital')} id="height" label="身長（cm）" kind="number" value={vitalForm.height} onConfirm={value => handleVitalChange('height', value)} decimal decimalPlaces={1} max={9999.9} />

                                <label htmlFor="weight">
                                    体重（kg）
                                </label>

                                <RecordInputField error={fieldError('weightKg','vital')} id="weight" label="体重（kg）" kind="number" value={vitalForm.weight} onConfirm={value => handleVitalChange('weight', value)} decimal decimalPlaces={1} max={9999.9} />

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
                                        event => { saveOpener.current = event.currentTarget; handleBathSave(); }
                                    }
                                >
                                    保存
                                </button>
                            </div>

                            <div className="record-bath-fields">

                                <div className="record-form-field">
                                    <label htmlFor="caregiver">
                                        介護者
                                    </label>

                                    <RecordInputField error={fieldError('caregiverCode','bath')} id="caregiver" label="介護者" kind="select" value={bathForm.caregiver} displayValue={caregivers.find(value=>value.staffCode===bathForm.caregiver)?.staffName || bathForm.caregiverName || '介護者を選択'} onConfirm={value => handleBathChange('caregiver', value)} options={[{value:'',label:'未選択'},...caregivers.map(value=>({value:value.staffCode,label:caregivers.filter(person=>person.staffName===value.staffName).length>1?`${value.staffName}（${value.staffCode}）`:value.staffName}))]} />
                                </div>

                                <div className="record-form-field">
                                    <label htmlFor="bath-systolic">
                                        血圧 上
                                    </label>

                                    <RecordInputField error={fieldError('systolicBloodPressure','bath')} id="bath-systolic" label="血圧 上" kind="number" value={bathForm.systolicBloodPressure} onConfirm={value => handleBathChange('systolicBloodPressure', value)} max={65535} />
                                </div>

                                <div className="record-form-field">
                                    <label htmlFor="bath-diastolic">
                                        血圧 下
                                    </label>

                                    <RecordInputField error={fieldError('diastolicBloodPressure','bath')} id="bath-diastolic" label="血圧 下" kind="number" value={bathForm.diastolicBloodPressure} onConfirm={value => handleBathChange('diastolicBloodPressure', value)} max={65535} />
                                </div>

                                <div className="record-form-field">
                                    <label htmlFor="bath-method">
                                        入浴方法
                                    </label>

                                    <RecordInputField error={fieldError('bathMethod','bath')} id="bath-method" label="入浴方法" kind="select" value={bathForm.bathMethod} onConfirm={value => handleBathChange('bathMethod', value)} options={[{ value: '全身浴', label: '全身浴' }, { value: '半身浴', label: '半身浴' }, { value: 'シャワー浴', label: 'シャワー浴' }, { value: '機械浴', label: '機械浴' }, { value: '清拭', label: '清拭' }]} />
                                </div>
                            </div>
                        </section>
                    </div>

                    </fieldset>

                </section>
            </div>
            {saving === null && ((failure && !failure.dismissed) || success) && <RecordSaveResultDialog
                kind={failure && !failure.dismissed ? success ? 'warning' : 'error' : 'success'}
                message={failure && !failure.dismissed ? failure.message : undefined}
                onRestoreFocus={() => { if (saveOpener.current?.isConnected) saveOpener.current.focus(); }}
                onClose={() => { closeFailure(); closeSuccess(); }} />}
        </main>
    );
}

export default RecordInputPage;
