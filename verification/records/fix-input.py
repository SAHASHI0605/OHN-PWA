from pathlib import Path
p=Path('ohana.client/src/hooks/useRecordInput.ts');s=p.read_text(encoding='utf-8');s=s.replace("const setMealType=(type:MealType)=>{epoch.current++", "const setMealType=(type:MealType)=>{if(lock.current)return;epoch.current++")
s=s.replace('const loadVital=()=>setView(', 'const loadVital=()=>{if(lock.current)return;setView(').replace('vitalTime:recordTime(current.data.vital?.measuredAt ?? null)}:current);','vitalTime:recordTime(current.data.vital?.measuredAt ?? null)}:current);};')
s=s.replace('const loadBath=()=>setView(', 'const loadBath=()=>{if(lock.current)return;setView(').replace('bath:bathForm(current.data.bath,now)}:current);','bath:bathForm(current.data.bath,now)}:current);};')
s=s.replace('const parsed=Number(value);', "const parsed=Number(value);\n                const labels:Record<string,string>={riceAmount:'主食',sideDishAmount:'副食',heightCm:'身長',weightKg:'体重',systolicBloodPressure:'血圧 上',diastolicBloodPressure:'血圧 下',temperatureC:'体温',respirationRate:'呼吸',pulseRate:'脈拍',spo2Percent:'SpO2'};")
s=s.replace('`${field}は0～', '`${labels[field] ?? field}は0～')
p.write_text(s,encoding='utf-8')
p=Path('Ohana.Server/Repositories/RecordRepository.cs');s=p.read_text(encoding='utf-8');s=s.replace('if (meals.Count > 4 ||', 'if (meals.Any(value => !new[] { "朝食", "昼食", "おやつ", "夕食" }.Contains(value.MealType)) || meals.Count > 4 ||');p.write_text(s,encoding='utf-8')
