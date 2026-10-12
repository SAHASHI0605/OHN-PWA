from pathlib import Path
import re
p=Path('ohana.client/src/hooks/useRecordInput.ts');s=p.read_text(encoding='utf-8')
s=s.replace('japanDate, nextCalendarDate, recordTime, timestamp','japanDate, japanTime, nextCalendarDate, timestamp').replace(' | null, now: string)', ' | null)')
s=s.replace('time: string; ', '').replace('vitalTime: string; ', '').replace("time:'',",'')
s=s.replace('const blankBath = (time: string): BathForm => ({time,','const blankBath = (): BathForm => ({')
s=s.replace('time:recordTime(value.performedAt),','').replace('time:recordTime(value.bathedAt),','').replace(' : blankBath(now)', ' : blankBath()')
s=s.replace('const fromData = (scope: string, data: Records, type: MealType, now: string)', 'const fromData = (scope: string, data: Records, type: MealType)').replace("vitalTime:recordTime(data.vital?.measuredAt ?? null),",'').replace('bath:bathForm(data.bath,now)', 'bath:bathForm(data.bath)')
s=s.replace('export function useRecordInput(resident: RecordResidentState | null, now: string)', 'export function useRecordInput(resident: RecordResidentState | null)')
s=s.replace('    const [refresh,setRefresh] = useState(0);\n','')
s=s.replace('    const nowRef = useRef(now);\n    useEffect(()=>{nowRef.current=now;},[now]);\n','')
s=s.replace("fromData(scope,data,'朝食',nowRef.current)", "fromData(scope,data,'朝食')").replace("vitalTime:'',",'').replace('blankBath(nowRef.current)', 'blankBath()').replace('},[key,scope,validKey,refresh]);','},[key,scope,validKey]);').replace('},[refresh]);','},[]);').replace('blankBath(now)', 'blankBath()')
s=re.sub(r'    const loadVital=.*?\n    const save=', '    const save=',s,flags=re.S)
s=s.replace('        const generation=epoch.current;','        const generation=epoch.current;\n        const savedAt=timestamp(targetDate,japanTime(new Date(),true));')
s=re.sub(r'            const clock=.*?\n            if\(kind===\'meal\'\)', "            if(kind==='meal')",s,flags=re.S)
s=s.replace("clock(meal.time||now,'performedAt')", 'savedAt').replace("clock(active.vitalTime||now,'measuredAt')", 'savedAt').replace("clock(bath.time,'bathedAt')", 'savedAt')
s=s.replace("vitalTime:kind==='vital'?recordTime(data.vital?.measuredAt??null):current.vitalTime,",'').replace('bathForm(data.bath,nowRef.current)', 'bathForm(data.bath)')
s=s.replace('        reload:()=>{setFailure(null);setSuccess(null);epoch.current++;setRefresh(value=>value+1);},','        ')
s=s.replace('records:active?.data??null,mealRecords:active?.data?.meals??[],','records:active?.data??null,')
a=s.index('        performedTime:');b=s.index('vitalForm:vital',a);s=s[:a]+'        '+s[b:]
s=s.replace('        loadVital,loadBath,','        ')
p.write_text(s,encoding='utf-8')
p=Path('ohana.client/src/utilities/recordDate.ts');s=p.read_text(encoding='utf-8').replace('japanTime = (date: Date)', 'japanTime = (date: Date, seconds = false)').replace("minute:'2-digit',hourCycle:","minute:'2-digit',second:seconds?'2-digit':undefined,hourCycle:")
s=re.sub(r'export const recordTime =.*?\n','',s);p.write_text(s,encoding='utf-8')
p=Path('ohana.client/src/pages/RecordInputPage.tsx');s=p.read_text(encoding='utf-8')
s=s.replace('fieldError,reload,records','fieldError,records').replace('        mealRecords,mealType,','        mealType,')
s=s.replace('performedTime,setPerformedTime,measuredTime,setMeasuredTime,','').replace('handleBathChange,loadVital,loadBath,','handleBathChange,').replace('useRecordInput(locationState,formatTime(currentDate))','useRecordInput(locationState)')
s=re.sub(r'                            <div className="record-form-field record-meal-time">.*?</div>\n','',s)
s=re.sub(r'                            <div className="record-form-field record-panel__time">.*?</div>\n','',s)
s=re.sub(r'                                <div className="record-form-field">\s*<label htmlFor="bath-time">.*?</div>\n','',s,flags=re.S)
a=s.index('                            <div className="record-table-wrap">');b=s.index('                        </section>',a);s=s[:a]+s[b:]
a=s.index('                    <section className="record-history">');b=s.index('                    </section>',a)+len('                    </section>');s=s[:a]+s[b:]
s=re.sub(r"                    \{phase !== 'invalid' && <button.*?</button>\}\n",'',s)
# Place feedback in the existing target-day subtitle instead of adding a vertical row.
a=s.index("                    {phase === 'loading'");b=s.index('                    <fieldset',a);s=s[:a]+s[b:]
s=s.replace('                                対象日を確認して記録してください。', "                                <span role={phase==='error'||phase==='invalid'||caregiverError?'alert':'status'} className={phase==='error'||phase==='invalid'||caregiverError?'record-feedback--error':''}>{phase==='error'||phase==='invalid'?loadError:caregiverError?`介護者一覧：${caregiverError}`:saving?'記録を保存しています…':success||'対象日を確認して記録してください。'}</span>")
p.write_text(s,encoding='utf-8')
