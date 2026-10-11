import { useEffect, useRef, useState, type FormEvent } from 'react';
import { residentMaintenanceService as service } from '../services/residentMaintenanceService';
import { StaffDialog } from '../components/staff/StaffDialog';
import { residentRooms, type Resident, type ResidentForm, type ResidentPage, type ResidentSearch } from '../types/resident';
import '../styles/StaffMaintenancePage.css';
import '../styles/ResidentMaintenancePage.css';

const initialSearch: ResidentSearch = { roomNo: '', name: '', status: 'current', page: 1 };
const emptyForm: ResidentForm = { roomNo: '', serialNo: '1', tenantName: '', moveInDate: '', moveOutDate: '' };
// Calendar dates and composite keys never pass through JavaScript Date/UTC conversion.
const dateText = (value: string | null) => value ? value.slice(0, 10).replaceAll('-', '/') : '－';
const keyOf = (value: Resident) => `${value.roomNo}/${value.serialNo}/${value.moveInDate}`;
const errorText = (error: unknown) => error instanceof Error ? error.message : '処理に失敗しました。再度お試しください。';
type Editor = { kind: 'create' } | { kind: 'edit'; resident: Resident };

export default function ResidentListPage() {
    const [draft, setDraft] = useState(initialSearch);
    const [search, setSearch] = useState(initialSearch);
    const [result, setResult] = useState<ResidentPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState('');
    const [actionError, setActionError] = useState('');
    const [notice, setNotice] = useState('');
    const [refresh, setRefresh] = useState(0);
    const [editor, setEditor] = useState<Editor | null>(null);
    const [form, setForm] = useState<ResidentForm>(emptyForm);
    const [formError, setFormError] = useState('');
    const [confirmation, setConfirmation] = useState<string[] | null>(null);
    const [saving, setSaving] = useState(false);
    const [openingKey, setOpeningKey] = useState<string | null>(null);
    const sending = useRef(false);
    const detailRequest = useRef(0);

    useEffect(() => {
        let current = true;
        service.search(search).then(data => { if (current) { setResult(data); setLoading(false); } })
            .catch(error => { if (current) { setListError(errorText(error)); setLoading(false); } });
        return () => { current = false; };
    }, [search, refresh]);
    useEffect(() => () => { detailRequest.current += 1; }, []);
    const runSearch = (event: FormEvent) => {
        event.preventDefault(); setLoading(true); setListError(''); setActionError(''); setNotice('');
        setSearch({ ...draft, name: draft.name.trim(), page: 1 });
    };
    const clearSearch = () => {
        setDraft({ ...initialSearch }); setSearch({ ...initialSearch });
        setLoading(true); setListError(''); setActionError(''); setNotice('');
    };
    const goPage = (page: number) => { setLoading(true); setListError(''); setSearch(previous => ({ ...previous, page })); };
    const openCreate = () => {
        detailRequest.current += 1; setOpeningKey(null); setForm({ ...emptyForm });
        setFormError(''); setActionError(''); setNotice(''); setEditor({ kind: 'create' });
    };
    const openEdit = async (item: Resident) => {
        const request = ++detailRequest.current;
        setOpeningKey(keyOf(item)); setActionError(''); setNotice('');
        try {
            const resident = await service.detail(item);
            if (request !== detailRequest.current) return;
            setForm({ roomNo: resident.roomNo, serialNo: resident.serialNo, tenantName: resident.tenantName,
                moveInDate: resident.moveInDate.slice(0, 10), moveOutDate: resident.moveOutDate?.slice(0, 10) ?? '' });
            setFormError(''); setEditor({ kind: 'edit', resident });
        } catch (error) { if (request === detailRequest.current) setActionError(errorText(error)); }
        finally { if (request === detailRequest.current) setOpeningKey(null); }
    };
    const closeEditor = () => { setEditor(null); setForm({ ...emptyForm }); setFormError(''); };
    const prepareSave = (event: FormEvent) => {
        event.preventDefault(); if (!editor || sending.current) return;
        const name = form.tenantName.trim();
        let error = !name || name.length > 20 ? '入居者名は1～20文字で入力してください。' : '';
        if (!residentRooms.some(room => room === form.roomNo)) error = '部屋番号を選択してください。';
        if (!['1', '2'].includes(form.serialNo)) error = '連番は1または2を選択してください。';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(form.moveInDate) || form.moveInDate < '1000-01-01') error = '入居日を入力してください。';
        if (form.moveOutDate && (!/^\d{4}-\d{2}-\d{2}$/.test(form.moveOutDate) || form.moveOutDate < form.moveInDate)) error = '退居日は入居日以降の日付を指定してください。';
        if (error) { setFormError(error); return; }
        setFormError(''); setForm(previous => ({ ...previous, tenantName: name }));
        const summary = [`部屋番号：${form.roomNo}`, `連番：${form.serialNo}`, `入居者名：${name}`, `入居日：${dateText(form.moveInDate)}`, `退居日：${dateText(form.moveOutDate || null)}`];
        if (editor.kind === 'edit') {
            summary[2] = `入居者名：${editor.resident.tenantName} → ${name}`;
            summary[4] = `退居日：${dateText(editor.resident.moveOutDate)} → ${dateText(form.moveOutDate || null)}`;
        }
        setConfirmation(summary);
    };
    const execute = async () => {
        if (!confirmation || !editor || sending.current) return;
        sending.current = true; setSaving(true);
        try {
            const response = editor.kind === 'create' ? await service.create(form) : await service.update(editor.resident, form);
            setNotice(response.message); setConfirmation(null); closeEditor();
            setSearch(previous => ({ ...previous, page: result?.page ?? previous.page }));
            setLoading(true); setListError(''); setRefresh(previous => previous + 1);
        } catch (error) { setFormError(errorText(error)); setConfirmation(null); }
        finally { sending.current = false; setSaving(false); }
    };
    const totalPages = Math.max(1, Math.ceil((result?.totalCount ?? 0) / 20));
    const currentPage = result?.page ?? search.page;
    const pages = [...new Set([1, ...Array.from({ length: 5 }, (_, index) => currentPage - 2 + index), totalPages])].filter(page => page >= 1 && page <= totalPages).sort((a, b) => a - b);
    const start = result && result.totalCount > 0 ? (result.page - 1) * 20 + 1 : 0;
    const end = result ? Math.min(result.page * 20, result.totalCount) : 0;
    return (
        <section className="staff-maintenance resident-maintenance" aria-labelledby="admin-current-page">
            {notice && <p className="staff-notice" role="status">{notice}</p>}
            {listError && <p className="staff-error" role="alert">{listError}</p>}
            {actionError && <p className="staff-error" role="alert">{actionError}</p>}
            <form className="staff-card staff-search" onSubmit={runSearch}>
                <h2>検索条件</h2>
                <div className="staff-search-scroll" role="group" aria-label="検索条件と操作" tabIndex={0}><div className="staff-search-fields">
                    <label>部屋番号<select value={draft.roomNo} onChange={event => setDraft({ ...draft, roomNo: event.target.value })}><option value="">すべて</option>{residentRooms.map(room => <option key={room}>{room}</option>)}</select></label>
                    <label>入居者名<input value={draft.name} maxLength={100} placeholder="入居者名を入力" onChange={event => setDraft({ ...draft, name: event.target.value })} /></label>
                    <label>入居状況<select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value as ResidentSearch['status'] })}><option value="current">入居中</option><option value="departed">退居済み</option><option value="all">すべて</option></select></label>
                    <div className="staff-search-actions"><button className="staff-button staff-button-primary" disabled={loading}>検索</button><button type="button" className="staff-button" disabled={loading} onClick={clearSearch}>クリア</button><button type="button" className="staff-button staff-button-primary" onClick={openCreate}>新規登録</button></div>
                </div></div>
            </form>
            <div className="staff-card staff-list" aria-busy={loading}>
                <div className="staff-list-heading"><h2>入居者一覧</h2><span>{result ? `全${result.totalCount}件  ${start}～${end}件を表示` : ''}</span></div>
                <div className="staff-table-scroll" role="region" aria-label="入居者一覧表" tabIndex={0}>
                    {loading ? <p className="staff-empty" role="status">入居者情報を読み込み中…</p> : listError ? <p className="staff-empty">一覧を取得できませんでした。検索を再実行してください。</p> : result?.items.length ? (
                        <table><thead><tr>{['部屋番号', '連番', '入居者名', '入居日', '退居日', '入居状況', '操作'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
                            <tbody>{result.items.map(item => <tr key={keyOf(item)}><td>{item.roomNo}</td><td>{item.serialNo}</td><td title={item.tenantName}>{item.tenantName}</td><td>{dateText(item.moveInDate)}</td><td>{dateText(item.moveOutDate)}</td><td><span className={`staff-badge ${item.moveOutDate === null ? 'staff-active' : 'staff-inactive'}`}>{item.moveOutDate === null ? '入居中' : '退居済み'}</span></td><td><button type="button" className="staff-button staff-button-edit" aria-label={`${item.roomNo}号室 連番${item.serialNo} ${item.tenantName}を編集`} disabled={openingKey !== null} onClick={() => void openEdit(item)}>{openingKey === keyOf(item) ? '読込中…' : '編集'}</button></td></tr>)}</tbody>
                        </table>
                    ) : <p className="staff-empty">該当する入居者がありません。</p>}
                </div>
                <nav className="staff-pagination" aria-label="入居者一覧のページ切り替え"><span>{currentPage} / {totalPages}ページ</span><button type="button" className="staff-button" disabled={loading || !!listError || currentPage <= 1} onClick={() => goPage(currentPage - 1)}>前へ</button>{pages.map((page, index) => <span className="staff-page-number" key={page}>{index > 0 && page - pages[index - 1] > 1 && <span aria-hidden="true">…</span>}<button type="button" className={`staff-button ${page === currentPage ? 'staff-page-current' : ''}`} aria-label={`${page}ページ目`} aria-current={page === currentPage ? 'page' : undefined} disabled={loading || !!listError || page === currentPage} onClick={() => goPage(page)}>{page}</button></span>)}<button type="button" className="staff-button" disabled={loading || !!listError || currentPage >= totalPages} onClick={() => goPage(currentPage + 1)}>次へ</button></nav>
            </div>
            {editor && <StaffDialog title={editor.kind === 'create' ? '入居者新規登録' : '入居者情報編集'} busy={saving} onClose={closeEditor}>
                <form onSubmit={prepareSave} noValidate>
                    {formError && <p className="staff-error" role="alert">{formError}</p>}
                    <fieldset className="staff-dialog-fields" disabled={saving}>
                        <div className="staff-form-row"><label>部屋番号{editor.kind === 'create' ? <select value={form.roomNo} onChange={event => setForm({ ...form, roomNo: event.target.value })}><option value="">選択してください</option>{residentRooms.map(room => <option key={room}>{room}</option>)}</select> : <span className="staff-readonly">{editor.resident.roomNo}</span>}</label><label>連番{editor.kind === 'create' ? <select value={form.serialNo} onChange={event => setForm({ ...form, serialNo: event.target.value })}><option value="1">1</option><option value="2">2</option></select> : <span className="staff-readonly">{editor.resident.serialNo}</span>}</label></div>
                        <label>入居者名<input value={form.tenantName} maxLength={20} required onChange={event => setForm({ ...form, tenantName: event.target.value })} /></label>
                        <div className="staff-form-row"><label>入居日{editor.kind === 'create' ? <input type="date" min="1000-01-01" max="9999-12-31" value={form.moveInDate} required onChange={event => setForm({ ...form, moveInDate: event.target.value })} /> : <span className="staff-readonly">{dateText(editor.resident.moveInDate)}</span>}</label><label>退居日<input type="date" min={form.moveInDate || '1000-01-01'} max="9999-12-31" value={form.moveOutDate} onChange={event => setForm({ ...form, moveOutDate: event.target.value })} /></label></div>
                        <p className="staff-help">退居日を空欄にすると入居中として保存します。部屋番号・連番・入居日は登録後に変更できません。</p>
                    </fieldset>
                    <div className="staff-dialog-actions"><button type="button" className="staff-button" disabled={saving} onClick={closeEditor}>キャンセル</button><button className="staff-button staff-button-primary" disabled={saving}>{editor.kind === 'create' ? '登録' : '保存'}</button></div>
                </form>
            </StaffDialog>}
            {confirmation && <StaffDialog title="更新内容の確認" busy={saving} onClose={() => setConfirmation(null)}><p>次の内容で{editor?.kind === 'create' ? '登録' : '更新'}します。</p><ul className="staff-confirm-summary">{confirmation.map((line, index) => <li key={index}>{line}</li>)}</ul><div className="staff-dialog-actions"><button type="button" className="staff-button" disabled={saving} onClick={() => setConfirmation(null)}>キャンセル</button><button type="button" className="staff-button staff-button-primary" disabled={saving} onClick={() => void execute()}>{saving ? '処理中…' : '実行'}</button></div></StaffDialog>}
        </section>
    );
}
