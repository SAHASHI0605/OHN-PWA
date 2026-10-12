import { useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../services/apiClient';
import { getCaregivers, getRecords, saveBath, saveMeal, saveVital, type BathRecord, type Caregiver, type MealRecord, type MealType, type RecordKind, type Records, type VitalRecord } from '../services/recordService';
import type { RecordResidentState } from '../types/residentSelection';
import { japanDate, japanTime, nextCalendarDate, timestamp } from '../utilities/recordDate';

export type VitalForm = { height: string; weight: string; systolicBloodPressure: string; diastolicBloodPressure: string; temperature: string; respiration: string; pulse: string; spo2: string };
export type BathForm = { caregiver: string; caregiverName: string; systolicBloodPressure: string; diastolicBloodPressure: string; bathMethod: string };
type MealForm = { riceAmount: string; sideDishAmount: string; medication: string; eyeDrops: string; oralCare: string; memo: string };
type View = { scope: string; phase: 'ready' | 'error'; error: string; data: Records | null; type: MealType; meal: MealForm; vital: VitalForm; bath: BathForm };
const blankMeal = (): MealForm => ({riceAmount:'',sideDishAmount:'',medication:'',eyeDrops:'',oralCare:'',memo:''});
const blankVital = (): VitalForm => ({height:'',weight:'',systolicBloodPressure:'',diastolicBloodPressure:'',temperature:'',respiration:'',pulse:'',spo2:''});
const blankBath = (): BathForm => ({caregiver:'',caregiverName:'',systolicBloodPressure:'',diastolicBloodPressure:'',bathMethod:'全身浴'});
const text = (value: number | null | undefined) => value == null ? '' : String(value);
const mealForm = (value?: MealRecord): MealForm => value ? {riceAmount:text(value.riceAmount),sideDishAmount:text(value.sideDishAmount),medication:value.medicationType ?? '',eyeDrops:value.eyeDrops === '○' ? '実施' : value.eyeDrops ?? '',oralCare:value.oralCare ?? '',memo:value.memo ?? ''} : blankMeal();
const vitalForm = (value: VitalRecord | null): VitalForm => value ? {height:text(value.heightCm),weight:text(value.weightKg),systolicBloodPressure:text(value.systolicBloodPressure),diastolicBloodPressure:text(value.diastolicBloodPressure),temperature:text(value.temperatureC),respiration:text(value.respirationRate),pulse:text(value.pulseRate),spo2:text(value.spo2Percent)} : blankVital();
const bathForm = (value: BathRecord | null): BathForm => value ? {caregiver:value.caregiverCode,caregiverName:value.caregiverName,systolicBloodPressure:text(value.systolicBloodPressure),diastolicBloodPressure:text(value.diastolicBloodPressure),bathMethod:value.bathMethod} : blankBath();
const fromData = (scope: string, data: Records, type: MealType): View => ({scope,phase:'ready',error:'',data,type,meal:mealForm(data.meals.find(value=>value.mealType===type)),vital:vitalForm(data.vital),bath:bathForm(data.bath)});
const message = (error: unknown) => error instanceof ApiError ? error.message : '通信に失敗しました。接続を確認して再度お試しください。';

export function useRecordInput(resident: RecordResidentState | null) {
    const [targetDate,setTargetDate] = useState(japanDate);
    const [view,setView] = useState<View | null>(null);
    const [caregivers,setCaregivers] = useState<Caregiver[]>([]);
    const [caregiverError,setCaregiverError] = useState('');
    const [saving,setSaving] = useState<RecordKind | null>(null);
    const [success,setSuccess] = useState<{scope:string;message:string} | null>(null);
    const [failure,setFailure] = useState<{scope:string;kind:RecordKind;message:string;field?:string;dismissed?:boolean} | null>(null);
    const lock = useRef(false);
    const epoch = useRef(0);
    const roomNo=resident?.roomNumber ?? '', serialNo=resident?.serialNo ?? '', moveInDate=resident?.moveInDate ?? '';
    const validKey = /^(?:\d{3}|VIP)$/.test(roomNo) && /^[12]$/.test(serialNo) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(moveInDate);
    const key=useMemo(()=>({roomNo,serialNo,moveInDate,recordDate:targetDate}),[roomNo,serialNo,moveInDate,targetDate]);
    const scope=JSON.stringify(key);
    const active=view?.scope===scope ? view : null;
    const phase=!validKey ? 'invalid' : active?.phase ?? 'loading';
    useEffect(()=>{
        epoch.current++;
        if (!validKey) return;
        const controller=new AbortController(); let current=true;
        getRecords(key,controller.signal).then(data=>{if(current) setView(fromData(scope,data,'朝食'));})
            .catch(error=>{if(current) setView({scope,phase:'error',error:message(error),data:null,type:'朝食',meal:blankMeal(),vital:blankVital(),bath:blankBath()});});
        return ()=>{current=false;controller.abort();};
    },[key,scope,validKey]);
    useEffect(()=>{
        const controller=new AbortController(); let current=true;
        getCaregivers(controller.signal).then(data=>{if(current){setCaregivers(data);setCaregiverError('');}}).catch(error=>{if(current)setCaregiverError(message(error));});
        return ()=>{current=false;controller.abort();};
    },[key]);
    const meal=active?.meal ?? blankMeal(), vital=active?.vital ?? blankVital(), bath=active?.bath ?? blankBath();
    const type=active?.type ?? '朝食';
    const updateMeal=(field:keyof MealForm,value:string)=>{setFailure(null);setView(current=>current?.scope===scope?{...current,meal:{...current.meal,[field]:value}}:current);};
    const setMealType=(type:MealType)=>{if(lock.current)return;epoch.current++;setSuccess(null);setFailure(null);setView(current=>current?.scope===scope?{...current,type,meal:mealForm(current.data?.meals.find(value=>value.mealType===type))}:current);};
    const handleVitalChange=(field:keyof VitalForm,value:string)=>{setFailure(null);setView(current=>current?.scope===scope?{...current,vital:{...current.vital,[field]:value}}:current);};
    const handleBathChange=(field:keyof BathForm,value:string)=>{setFailure(null);setView(current=>current?.scope===scope?{...current,bath:{...current.bath,[field]:value}}:current);};
    const save=async(kind:RecordKind)=>{
        if(lock.current || phase!=='ready' || !active?.data) return;
        lock.current=true;setSaving(kind);setSuccess(null);setFailure(null);
        const generation=epoch.current;
        const savedAt=timestamp(targetDate,japanTime(new Date(),true));
        try {
            const number=(value:string,field:string,max:number,decimal=false):number|null=>{
                if(value==='')return null;
                const parsed=Number(value);
                const labels:Record<string,string>={riceAmount:'主食',sideDishAmount:'副食',heightCm:'身長',weightKg:'体重',systolicBloodPressure:'血圧 上',diastolicBloodPressure:'血圧 下',temperatureC:'体温',respirationRate:'呼吸',pulseRate:'脈拍',spo2Percent:'SpO2'};
                if(!/^\d+(?:\.\d+)?$/.test(value)||!Number.isFinite(parsed)||parsed<0||parsed>max||(!decimal&&!Number.isInteger(parsed))||(decimal&&(value.split('.')[1]?.length??0)>1))
                    throw new ApiError(`${labels[field] ?? field}は0～${max}${decimal?'、小数第1位まで':'の整数'}で入力してください。`,400,field);
                return parsed;
            };
            if(kind==='meal') await saveMeal(key,type,{performedAt:savedAt,riceAmount:number(meal.riceAmount,'riceAmount',10),sideDishAmount:number(meal.sideDishAmount,'sideDishAmount',10),medicationType:meal.medication||null,eyeDrops:meal.eyeDrops||null,oralCare:meal.oralCare||null,memo:meal.memo||null},active.data.meals.find(row=>row.mealType===type)?.concurrencyToken ?? 'new');
            if(kind==='vital') await saveVital(key,{measuredAt:savedAt,heightCm:number(vital.height,'heightCm',9999.9,true),weightKg:number(vital.weight,'weightKg',9999.9,true),systolicBloodPressure:number(vital.systolicBloodPressure,'systolicBloodPressure',65535),diastolicBloodPressure:number(vital.diastolicBloodPressure,'diastolicBloodPressure',65535),temperatureC:number(vital.temperature,'temperatureC',999.9,true),respirationRate:number(vital.respiration,'respirationRate',65535),pulseRate:number(vital.pulse,'pulseRate',65535),spo2Percent:number(vital.spo2,'spo2Percent',999.9,true)},active.data.vital?.concurrencyToken ?? 'new');
            if(kind==='bath') {
                if(!caregivers.some(value=>value.staffCode===bath.caregiver))throw new ApiError('有効な介護者を選択してください。',400,'caregiverCode');
                await saveBath(key,{bathedAt:savedAt,caregiverCode:bath.caregiver,systolicBloodPressure:number(bath.systolicBloodPressure,'systolicBloodPressure',65535),diastolicBloodPressure:number(bath.diastolicBloodPressure,'diastolicBloodPressure',65535),bathMethod:bath.bathMethod},active.data.bath?.concurrencyToken ?? 'new');
            }
            if(epoch.current!==generation)return;
            // A successful PUT and a failed refresh are reported separately: do not
            // suggest the save itself failed or clear the user's input.
            setSuccess({scope,message:'記録を保存しました。'});
            try {
                const data=await getRecords(key);
                if(epoch.current===generation)setView(current=>current?.scope===scope && current.type===type?({...current,data,meal:kind==='meal'?mealForm(data.meals.find(row=>row.mealType===type)):current.meal,vital:kind==='vital'?vitalForm(data.vital):current.vital,bath:kind==='bath'?bathForm(data.bath):current.bath}):current);
            } catch(error) {
                if(epoch.current===generation)setFailure({scope,kind,message:`保存は完了しましたが、最新記録を取得できませんでした。${message(error)}`});
            }
        } catch(error) {
            if(epoch.current===generation)setFailure({scope,kind,message:message(error),field:error instanceof ApiError?error.field:undefined});
        } finally {lock.current=false;setSaving(null);}
    };
    return {targetDate,scope,phase,loadError:!validKey?'入居者識別情報が不足しています。入居者選択画面から選び直してください。':active?.error??'',caregiverError,caregivers,saving,
        success:success?.scope===scope?success.message:'',failure:failure?.scope===scope?failure:null,closeFailure:()=>setFailure(current=>current?{...current,dismissed:true}:current),fieldError:(field:string,kind:RecordKind)=>failure?.scope===scope&&failure.kind===kind&&failure.field===field?failure.message:undefined,
        handleMoveDate:(delta:number)=>{epoch.current++;setSuccess(null);setFailure(null);setTargetDate(value=>nextCalendarDate(value,delta));},
        records:active?.data??null,mealType:type,setMealType,riceAmount:meal.riceAmount,setRiceAmount:(value:string)=>updateMeal('riceAmount',value),sideDishAmount:meal.sideDishAmount,setSideDishAmount:(value:string)=>updateMeal('sideDishAmount',value),medication:meal.medication,setMedication:(value:string)=>updateMeal('medication',value),eyeDrops:meal.eyeDrops,setEyeDrops:(value:string)=>updateMeal('eyeDrops',value),oralCare:meal.oralCare,setOralCare:(value:string)=>updateMeal('oralCare',value),memo:meal.memo,setMemo:(value:string)=>updateMeal('memo',value),
        vitalForm:vital,bathForm:bath,handleVitalChange,handleBathChange,
        handleMealSave:()=>void save('meal'),handleVitalSave:()=>void save('vital'),handleBathSave:()=>void save('bath')};
}
