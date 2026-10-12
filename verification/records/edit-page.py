from pathlib import Path
import re
p=Path('ohana.client/src/pages/RecordInputPage.tsx');s=p.read_text(encoding='utf-8-sig')
s=s.replace('    useMemo,\n','')
a=s.index('type MealType =');b=s.index('function formatDate',a);s=s[:a]+s[b:]
a=s.index('function formatDate');b=s.index('function getRoleDisplayName',a);s=s[:a]+'''function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('ja-JP', {timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short'}).format(date);
}
function formatTime(date: Date): string { return japanTime(date); }

'''+s[b:]
s="import { useRecordInput } from '../hooks/useRecordInput';\nimport { RecordErrorDialog } from '../components/RecordErrorDialog';\nimport { japanTime } from '../utilities/recordDate';\nimport type { MealType } from '../services/recordService';\n"+s
start=s.index('function RecordInputPage()');end=s.index('    return (\n        <main',start)
s=s[:start]+'''function RecordInputPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { residentId } = useParams<{residentId:string}>();
    const { user } = useAuth();
    const locationState = location.state as RecordLocationState | null;
    const [currentDate,setCurrentDate] = useState(()=>new Date());
    useEffect(()=>{const timer=window.setInterval(()=>setCurrentDate(new Date()),1000);return()=>window.clearInterval(timer);},[]);
    const { targetDate,scope,phase,loadError,caregiverError,caregivers,saving,success,failure,closeFailure,fieldError,reload,records,
        mealRecords,mealType,setMealType,riceAmount,setRiceAmount,sideDishAmount,setSideDishAmount,medication,setMedication,eyeDrops,setEyeDrops,oralCare,setOralCare,memo,setMemo,
        performedTime,setPerformedTime,measuredTime,setMeasuredTime,vitalForm,bathForm,handleVitalChange,handleBathChange,loadVital,loadBath,handleMoveDate,handleMealSave,handleVitalSave,handleBathSave } = useRecordInput(locationState,formatTime(currentDate));
    const residentName = records?.tenantName ?? locationState?.residentName ?? '利用者名未取得';
    const roomNumber = locationState?.roomNumber ?? '---';
    const staffName = user?.employeeName ?? '担当者名未取得';
    const staffRole = getRoleDisplayName(user?.role);
    const targetDateText = formatDate(new Date(`${targetDate}T12:00:00+09:00`));
    const handleBackToResidentSelect = ()=>navigate(`/residents/floors/${locationState?.floor??1}`);
    const handleBackToMenu = ()=>navigate('/menu');

'''+s[end:]
# Preserve meal UI values as strings, with empty distinct from 0.
s=s.replace('onConfirm={value => setRiceAmount(Number(value))}', 'onConfirm={setRiceAmount}').replace('onConfirm={value => setSideDishAmount(Number(value))}', 'onConfirm={setSideDishAmount}')
s=s.replace('displayValue={`${riceAmount}/10`}', "displayValue={riceAmount === '' ? '未入力' : `${riceAmount}/10`}").replace('displayValue={`${sideDishAmount}/10`}', "displayValue={sideDishAmount === '' ? '未入力' : `${sideDishAmount}/10`}")
s=s.replace('options={Array.from({length: 11}, (_,value) => ({value: String(value), label: String(value)}))}', "options={[{value:'',label:'未入力'}, ...Array.from({length: 11}, (_,value) => ({value: String(value), label: String(value)}))]}")
s=s.replace("options={[{ value: '', label: 'なし' }, { value: '食前薬'", "options={[{value:'',label:'未選択'}, { value: 'なし', label: 'なし' }, { value: '食前薬'")
s=s.replace("options={[{ value: '', label: 'なし' }, { value: '○', label: '実施' }", "options={[{ value: '', label: '未選択' }, { value: '実施', label: '実施' }")
s=s.replace("options={[{ value: '', label: 'なし' }, { value: 'はみがき'", "options={[{ value: '', label: '未選択' }, { value: 'はみがき'")
s=s.replace('kind="text" value={bathForm.caregiver} onConfirm={value => handleBathChange(\'caregiver\', value)}', '''kind="select" value={bathForm.caregiver} displayValue={caregivers.find(value=>value.staffCode===bathForm.caregiver)?.staffName || bathForm.caregiverName || '介護者を選択'} onConfirm={value => handleBathChange('caregiver', value)} options={[{value:'',label:'未選択'},...caregivers.map(value=>({value:value.staffCode,label:value.staffName}))]}''')
s=s.replace('record.id','record.recordId').replace('record.medication\n','record.medicationType\n')
# Null amounts display a dash, never /10 or zero.
s=re.sub(r'\{\s*record.riceAmount\s*\}/10', "{record.riceAmount == null ? '-' : `${record.riceAmount}/10`}",s)
s=re.sub(r'\{\s*record.sideDishAmount\s*\}/10', "{record.sideDishAmount == null ? '-' : `${record.sideDishAmount}/10`}",s)
s=s.replace('                                    記録\n                                </button>', "                                    {saving === 'meal' ? '保存中…' : '記録'}\n                                </button>")
# Per-field errors and DB limits.
meta={'rice-amount':('riceAmount','meal'),'side-dish-amount':('sideDishAmount','meal'),'medication':('medicationType','meal'),'eye-drops':('eyeDrops','meal'),'oral-care':('oralCare','meal'),'meal-memo':('memo','meal'),'height':('heightCm','vital'),'weight':('weightKg','vital'),'temperature':('temperatureC','vital'),'systolic':('systolicBloodPressure','vital'),'diastolic':('diastolicBloodPressure','vital'),'respiration':('respirationRate','vital'),'pulse':('pulseRate','vital'),'spo2':('spo2Percent','vital'),'bath-time':('bathedAt','bath'),'caregiver':('caregiverCode','bath'),'bath-systolic':('systolicBloodPressure','bath'),'bath-diastolic':('diastolicBloodPressure','bath'),'bath-method':('bathMethod','bath')}
for id,(field,kind) in meta.items():
 s=s.replace(f'<RecordInputField id="{id}"',f'<RecordInputField error={{fieldError(\'{field}\',\'{kind}\')}} id="{id}"')
 s=re.sub(f'(id="{id}"[^\\n]+?)( />)',lambda m:m[1]+(' decimalPlaces={1}' if id in ['height','weight'] else ' decimal decimalPlaces={1}' if id=='spo2' else '')+(' max={9999.9}' if id in ['height','weight'] else ' max={999.9}' if id in ['temperature','spo2'] else ' max={65535}' if id in ['systolic','diastolic','respiration','pulse','bath-systolic','bath-diastolic'] else ' maxBytes={65535}' if id=='meal-memo' else '')+m[2],s)
# Time input fields are separate from the clock header; loaded record timestamps are retained.
s=s.replace('                            <div className="record-form-field">\n                                <label htmlFor="meal-type">', '''                            <div className="record-form-field record-meal-time"><label htmlFor="performed-time">実施時刻</label><RecordInputField id="performed-time" label="食事 実施時刻" kind="time" value={performedTime} onConfirm={setPerformedTime} error={fieldError('performedAt','meal')} /></div>
                            <div className="record-form-field">
                                <label htmlFor="meal-type">''')
s=re.sub(r'<p className="record-panel__time">.*?</p>', '''<div className="record-form-field record-panel__time"><label htmlFor="measured-time">測定時刻</label><RecordInputField id="measured-time" label="バイタル 測定時刻" kind="time" value={measuredTime} onConfirm={setMeasuredTime} error={fieldError('measuredAt','vital')} /></div>''',s,flags=re.S)
s=s.replace('                    <div className="record-input-main-grid">', '''                    {phase === 'loading' && <p role="status" className="record-message">記録を取得しています…</p>}
                    {(phase === 'error' || phase === 'invalid') && <p role="alert" className="record-message record-message--error">{loadError}</p>}
                    {caregiverError && <p role="alert" className="record-message record-message--error">介護者一覧：{caregiverError}</p>}
                    {saving && <p role="status" className="record-message">記録を保存しています…</p>}
                    {success && <p role="status" className="record-message">{success}</p>}
                    {phase !== 'invalid' && <button type="button" disabled={saving !== null} className="record-input-header-button record-reload" onClick={reload}>最新記録を再取得（入力を置換）</button>}
                    <fieldset key={scope} className="record-input-form" disabled={phase !== 'ready' || saving !== null}>
                    <div className="record-input-main-grid">''')
s=s.replace('                    <section className="record-history">', '                    </fieldset>\n                    <section className="record-history">')
# Make existing meal rows load that meal without saving.
s=s.replace('                                                    key={\n                                                        record.recordId\n                                                    }', '''                                                    key={record.recordId} tabIndex={0} aria-label={`${record.mealType}の記録を読み込み`} onClick={()=>setMealType(record.mealType)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setMealType(record.mealType);}}}''')
a=s.index('                        <div className="record-table-wrap">',s.index('                    <section className="record-history">'));b=s.index('                    </section>',a)
s=s[:a]+'''                        <div className="record-table-wrap">
                            <table className="record-table record-history-table"><thead><tr><th>記録</th><th>記録日時</th><th>入力内容</th><th>更新者</th><th>更新日時</th></tr></thead>
                                <tbody>
                                    {mealRecords.map(record=><tr key={`meal-${record.recordId}`} onClick={()=>setMealType(record.mealType)}><td><button type="button" disabled={phase!=='ready'||saving!==null} onClick={()=>setMealType(record.mealType)}>{record.mealType}を編集</button></td><td>{record.performedAt?.replace('T',' ')||'-'}</td><td>主食 {record.riceAmount??'-'}/10・副食 {record.sideDishAmount??'-'}/10・服薬 {record.medicationType??'未選択'}・点眼 {record.eyeDrops??'未選択'}・口腔ケア {record.oralCare??'未選択'}・{record.memo||'-'}</td><td>{record.updatedByName}</td><td>{record.updatedAt.replace('T',' ')}</td></tr>)}
                                    {records?.vital && <tr onClick={loadVital}><td><button type="button" disabled={phase!=='ready'||saving!==null} onClick={loadVital}>バイタルを編集</button></td><td>{records.vital.measuredAt?.replace('T',' ')||'-'}</td><td>血圧 {records.vital.systolicBloodPressure??'-'}/{records.vital.diastolicBloodPressure??'-'}・体温 {records.vital.temperatureC??'-'}℃・呼吸 {records.vital.respirationRate??'-'}・脈拍 {records.vital.pulseRate??'-'}・SpO2 {records.vital.spo2Percent??'-'}%・身長 {records.vital.heightCm??'-'}cm・体重 {records.vital.weightKg??'-'}kg</td><td>{records.vital.updatedByName}</td><td>{records.vital.updatedAt.replace('T',' ')}</td></tr>}
                                    {records?.bath && <tr onClick={loadBath}><td><button type="button" disabled={phase!=='ready'||saving!==null} onClick={loadBath}>入浴を編集</button></td><td>{records.bath.bathedAt.replace('T',' ')}</td><td>{records.bath.caregiverName}・血圧 {records.bath.systolicBloodPressure??'-'}/{records.bath.diastolicBloodPressure??'-'}・{records.bath.bathMethod}</td><td>{records.bath.updatedByName}</td><td>{records.bath.updatedAt.replace('T',' ')}</td></tr>}
                                    {phase==='ready' && mealRecords.length===0 && !records?.vital && !records?.bath && <tr><td colSpan={5}>対象日の記録はありません。</td></tr>}
                                </tbody>
                            </table>
                        </div>
'''+s[b:]
s=s.replace('        </main>', "            {failure && !failure.dismissed && <RecordErrorDialog message={failure.message} onClose={closeFailure} />}\n        </main>")
p.write_text(s,encoding='utf-8')
p=Path('ohana.client/src/hooks/useRecordInput.ts');s=p.read_text(encoding='utf-8');s=s.replace('field?:string} | null>', 'field?:string;dismissed?:boolean} | null>');s=s.replace('closeFailure:()=>setFailure(null)', 'closeFailure:()=>setFailure(current=>current?{...current,dismissed:true}:current)');s=s.replace("reload:()=>{epoch.current++;", "reload:()=>{setFailure(null);setSuccess(null);epoch.current++;")
s=s.replace('fromData(scope,data,type,nowRef.current):current', "({...current,data,meal:kind==='meal'?mealForm(data.meals.find(row=>row.mealType===type)):current.meal,vital:kind==='vital'?vitalForm(data.vital):current.vital,vitalTime:kind==='vital'?recordTime(data.vital?.measuredAt??null):current.vitalTime,bath:kind==='bath'?bathForm(data.bath,nowRef.current):current.bath}):current")
p.write_text(s,encoding='utf-8')
