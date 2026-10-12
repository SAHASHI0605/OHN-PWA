import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError } from '../services/apiClient';
import { vitalReportService as service } from '../services/vitalReportService';
import type { VitalReportDays } from '../types/vitalReport';
import '../styles/VitalReportPage.css';

const currentMonth = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit' }).format(new Date());
const weekday = (date: string) => '日月火水木金土'[new Date(`${date}T12:00:00`).getDay()];
const errorMessage = (error: unknown) => error instanceof Error ? error.message : '処理に失敗しました。再度お試しください。';

export default function VitalReportPage() {
    const [floor, setFloor] = useState(2);
    const [month, setMonth] = useState(currentMonth);
    const [result, setResult] = useState<VitalReportDays | null>(null);
    const [selected, setSelected] = useState<string[]>([]);
    const [busy, setBusy] = useState<'search' | 'export' | null>(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const sending = useRef(false);
    const mounted = useRef(true);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    const clearResult = () => { setResult(null); setSelected([]); setError(''); setNotice(''); };
    const search = async (event: FormEvent) => {
        event.preventDefault();
        if (sending.current) return;
        const [year, monthNumber] = month.split('-').map(Number);
        if (!year || year < 1000 || year > 9999 || !monthNumber) { setError('対象年月を正しく指定してください。'); return; }
        sending.current = true; setBusy('search'); clearResult();
        try {
            const data = await service.days({ floor, year, month: monthNumber });
            if (mounted.current) { setResult(data); setNotice('検索しました。出力する日付を選択してください。'); }
        } catch (error) { if (mounted.current) setError(errorMessage(error)); }
        finally { sending.current = false; if (mounted.current) setBusy(null); }
    };
    const download = async () => {
        if (sending.current || !result || selected.length === 0) return;
        sending.current = true; setBusy('export'); setError(''); setNotice('');
        const query = { floor: result.floor, year: result.year, month: result.month };
        try {
            const blob = await service.export(query, [...selected].sort());
            if (!mounted.current) return;
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `バイタル記録表_${query.floor}F_${query.year}${String(query.month).padStart(2, '0')}.zip`;
            document.body.append(anchor);
            try { anchor.click(); } finally { anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
            setNotice(`${selected.length}日分の記録表をダウンロードしました。`);
        } catch (error) {
            if (mounted.current) {
                setError(errorMessage(error));
                if (error instanceof ApiError && error.status === 409) { setResult(null); setSelected([]); }
            }
        } finally { sending.current = false; if (mounted.current) setBusy(null); }
    };
    return <section className="vital-report-page" aria-label="バイタル記録表出力">
        <form className="vital-report-card" onSubmit={search}>
            <h2>検索条件</h2>
            <fieldset disabled={busy !== null} className="vital-report-filters">
                <label>対象階<select value={floor} onChange={event => { setFloor(Number(event.target.value)); clearResult(); }}><option value={1}>1F</option><option value={2}>2F</option></select></label>
                <label>対象年月<input type="month" min="1000-01" max="9999-12" required value={month} onInput={event => { setMonth(event.currentTarget.value); clearResult(); }} onChange={event => { setMonth(event.target.value); clearResult(); }} /></label>
                <button type="submit">{busy === 'search' ? '検索中…' : '検索'}</button>
            </fieldset>
        </form>
        {error && <p className="vital-report-error" role="alert">{error}</p>}
        {notice && <p className="vital-report-notice" role="status">{notice}</p>}
        <div className="vital-report-card">
            <div className="vital-report-toolbar">
                <h2>出力対象日{result && <small> {result.floor}F／{result.year}年{result.month}月</small>}</h2>
                <div className="vital-report-actions">
                    <button type="button" className="secondary" disabled={!result || !!busy || !result.days.some(day => day.canSelect)} onClick={() => setSelected(result!.days.filter(day => day.canSelect).map(day => day.date))}>全選択</button>
                    <button type="button" className="secondary" disabled={!!busy || selected.length === 0} onClick={() => setSelected([])}>全解除</button>
                    <span>選択：<strong>{selected.length}</strong>日</span>
                    <button type="button" disabled={!result || !!busy || selected.length === 0} onClick={download}>{busy === 'export' ? '出力中…' : 'ZIPダウンロード'}</button>
                </div>
            </div>
            {!result ? <p className="vital-report-empty">階と年月を指定して検索してください。</p> : <div className="vital-report-table-scroll">
                <table><thead><tr><th scope="col">選択</th><th scope="col">日付</th><th scope="col">曜日</th><th scope="col">バイタル登録件数</th></tr></thead><tbody>
                    {result.days.map(day => <tr key={day.date} className={day.canSelect ? '' : 'unavailable'}>
                        <td><input type="checkbox" aria-label={`${day.date.replaceAll('-', '/')}を選択`} disabled={!day.canSelect || !!busy} checked={selected.includes(day.date)} onChange={event => setSelected(previous => event.target.checked ? [...previous, day.date] : previous.filter(date => date !== day.date))} /></td>
                        <td>{day.date.replaceAll('-', '/')}</td><td>{weekday(day.date)}</td><td>{day.recordCount}件</td>
                    </tr>)}
                </tbody></table>
            </div>}
            <p className="vital-report-help">登録がある日だけ選択できます。選択した日ごとのExcel帳票をZIPでまとめて出力します。</p>
        </div>
    </section>;
}
