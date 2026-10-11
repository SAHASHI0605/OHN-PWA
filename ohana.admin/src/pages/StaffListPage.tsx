import { useEffect, useRef, useState, type FormEvent } from 'react';
import { staffMaintenanceService as service } from '../services/staffMaintenanceService';
import { StaffDialog } from '../components/staff/StaffDialog';
import type { Staff, StaffForm, StaffPage, StaffSearch } from '../types/staff';
import '../styles/StaffMaintenancePage.css';

const initialSearch: StaffSearch = { keyword: '', role: '', active: 'true', page: 1 };
const emptyForm: StaffForm = { staffCode: '', staffName: '', role: 1, isActive: true, password: '', passwordConfirmation: '' };
const roleLabel = (role: number) => role === 0 ? '管理者' : '一般スタッフ';
const activeLabel = (active: boolean) => active ? '有効' : '無効';
function loginDate(value: string | null) {
    if (!value) return '未ログイン';
    // MySQL DATETIME is returned without a timezone; preserve the server's wall time.
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
    return match ? `${match[1]}/${match[2]}/${match[3]} ${match[4]}:${match[5]}` : '日時不明';
}
const errorText = (error: unknown) => error instanceof Error ? error.message : '処理に失敗しました。再度お試しください。';
type Editor = { kind: 'create' } | { kind: 'edit'; staff: Staff };
type Confirmation = { kind: 'create' | 'edit' | 'password'; summary: string[] };

export default function StaffListPage() {
    const [draft, setDraft] = useState(initialSearch);
    const [search, setSearch] = useState(initialSearch);
    const [result, setResult] = useState<StaffPage | null>(null);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState('');
    const [actionError, setActionError] = useState('');
    const [notice, setNotice] = useState('');
    const [refresh, setRefresh] = useState(0);
    const [editor, setEditor] = useState<Editor | null>(null);
    const [form, setForm] = useState<StaffForm>(emptyForm);
    const [formError, setFormError] = useState('');
    const [resetOpen, setResetOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [resetError, setResetError] = useState('');
    const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
    const [saving, setSaving] = useState(false);
    const [openingCode, setOpeningCode] = useState<string | null>(null);
    const sending = useRef(false);
    const detailRequest = useRef(0);

    useEffect(() => {
        let current = true;
        service.search(search).then(data => {
            if (!current) return;
            setResult(data);
            setLoading(false);
        }).catch(error => {
            if (!current) return;
            setListError(errorText(error));
            setLoading(false);
        });
        return () => { current = false; };
    }, [search, refresh]);

    useEffect(() => () => { detailRequest.current += 1; }, []);

    const runSearch = (event: FormEvent) => {
        event.preventDefault();
        setLoading(true); setListError(''); setActionError(''); setNotice('');
        setSearch({ ...draft, keyword: draft.keyword.trim(), page: 1 });
    };
    const clearSearch = () => {
        setDraft({ ...initialSearch }); setSearch({ ...initialSearch });
        setLoading(true); setListError(''); setActionError(''); setNotice('');
    };
    const goPage = (page: number) => {
        setLoading(true); setListError('');
        setSearch(previous => ({ ...previous, page }));
    };
    const openCreate = () => {
        detailRequest.current += 1; setOpeningCode(null);
        setForm({ ...emptyForm }); setFormError(''); setActionError(''); setNotice(''); setEditor({ kind: 'create' });
    };
    const openEdit = async (code: string) => {
        const request = ++detailRequest.current;
        setOpeningCode(code); setActionError(''); setNotice('');
        try {
            const staff = await service.detail(code);
            if (request !== detailRequest.current) return;
            setForm({ ...emptyForm, staffCode: staff.staffCode, staffName: staff.staffName, role: staff.role, isActive: staff.isActive });
            setFormError(''); setEditor({ kind: 'edit', staff });
        } catch (error) { if (request === detailRequest.current) setActionError(errorText(error)); }
        finally { if (request === detailRequest.current) setOpeningCode(null); }
    };
    const closeEditor = () => { setEditor(null); setForm({ ...emptyForm }); setFormError(''); };
    const validatePassword = (value: string, confirmation: string) => {
        if (value.length < 8 || value.length > 64) return 'パスワードは8～64文字で入力してください。';
        if (value !== confirmation) return 'パスワードが一致しません。';
        return '';
    };
    const prepareSave = (event: FormEvent) => {
        event.preventDefault();
        if (!editor || sending.current) return;
        const code = form.staffCode.trim(); const name = form.staffName.trim();
        let error = !name || name.length > 20 ? 'スタッフ名は1～20文字で入力してください。' : '';
        if (editor.kind === 'create') {
            if (!code || code.length > 8) error = 'スタッフコードは1～8文字で入力してください。';
            if (!error) error = validatePassword(form.password, form.passwordConfirmation);
        }
        if (error) { setFormError(error); return; }
        setFormError(''); setForm(previous => ({ ...previous, staffCode: code, staffName: name }));
        const summary = [`スタッフコード：${code}`, `スタッフ名：${name}`, `権限：${roleLabel(form.role)}`, `状態：${activeLabel(form.isActive)}`];
        if (editor.kind === 'edit') {
            const original = editor.staff;
            summary[1] = `スタッフ名：${original.staffName} → ${name}`;
            summary[2] = `権限：${roleLabel(original.role)} → ${roleLabel(form.role)}`;
            summary[3] = `状態：${activeLabel(original.isActive)} → ${activeLabel(form.isActive)}`;
        }
        setConfirmation({ kind: editor.kind, summary });
    };
    const preparePassword = (event: FormEvent) => {
        event.preventDefault();
        const error = validatePassword(password, passwordConfirmation);
        if (error) { setResetError(error); return; }
        if (editor?.kind !== 'edit' || sending.current) return;
        setResetError('');
        setConfirmation({ kind: 'password', summary: [`スタッフコード：${editor.staff.staffCode}`, `スタッフ名：${editor.staff.staffName}`, 'パスワードを再設定します。'] });
    };
    const execute = async () => {
        if (!confirmation || !editor || sending.current) return;
        sending.current = true; setSaving(true);
        try {
            const response = confirmation.kind === 'create' ? await service.create(form)
                : confirmation.kind === 'edit' && editor.kind === 'edit' ? await service.update(editor.staff, form)
                : confirmation.kind === 'password' && editor.kind === 'edit' ? await service.resetPassword(editor.staff, password, passwordConfirmation)
                : null;
            if (!response) return;
            setNotice(response.message); setConfirmation(null); setResetOpen(false);
            setPassword(''); setPasswordConfirmation(''); closeEditor();
            // Preserve applied filters and the displayed page. The API clamps removed pages.
            setSearch(previous => ({ ...previous, page: result?.page ?? previous.page }));
            setLoading(true); setListError(''); setRefresh(previous => previous + 1);
        } catch (error) {
            if (confirmation.kind === 'password') setResetError(errorText(error));
            else setFormError(errorText(error));
            setConfirmation(null);
        } finally { sending.current = false; setSaving(false); }
    };
    const totalPages = Math.max(1, Math.ceil((result?.totalCount ?? 0) / 20));
    const currentPage = result?.page ?? search.page;
    const pageNumbers = [...new Set([1, ...Array.from({ length: 5 }, (_, i) => currentPage - 2 + i), totalPages])]
        .filter(page => page >= 1 && page <= totalPages).sort((a, b) => a - b);
    const start = result && result.totalCount > 0 ? (result.page - 1) * 20 + 1 : 0;
    const end = result ? Math.min(result.page * 20, result.totalCount) : 0;

    return (
        <section className="staff-maintenance" aria-labelledby="admin-current-page">
            {notice && <p className="staff-notice" role="status">{notice}</p>}
            {listError && <p className="staff-error" role="alert">{listError}</p>}
            {actionError && <p className="staff-error" role="alert">{actionError}</p>}
            <form className="staff-card staff-search" onSubmit={runSearch}>
                <h2>検索条件</h2>
                <div className="staff-search-scroll" role="group" aria-label="検索条件と操作" tabIndex={0}>
                <div className="staff-search-fields">
                    <label className="staff-keyword">スタッフコード・氏名<input value={draft.keyword} maxLength={100} onChange={event => setDraft({ ...draft, keyword: event.target.value })} placeholder="スタッフコードまたは氏名を入力" /></label>
                    <label>権限<select value={draft.role} onChange={event => setDraft({ ...draft, role: event.target.value as StaffSearch['role'] })}><option value="">すべて</option><option value="0">管理者</option><option value="1">一般スタッフ</option></select></label>
                    <label>状態<select value={draft.active} onChange={event => setDraft({ ...draft, active: event.target.value as StaffSearch['active'] })}><option value="all">すべて</option><option value="true">有効</option><option value="false">無効</option></select></label>
                    <div className="staff-search-actions"><button className="staff-button staff-button-primary" disabled={loading}>検索</button><button type="button" className="staff-button" disabled={loading} onClick={clearSearch}>クリア</button><button type="button" className="staff-button staff-button-primary" onClick={openCreate}>新規登録</button></div>
                </div>
                </div>
            </form>
            <div className="staff-card staff-list" aria-busy={loading}>
                <div className="staff-list-heading"><h2>スタッフ一覧</h2><span>{result ? `全${result.totalCount}件  ${start}～${end}件を表示` : ''}</span></div>
                <div className="staff-table-scroll" role="region" aria-label="スタッフ一覧表" tabIndex={0}>
                {loading ? <p className="staff-empty" role="status">スタッフ情報を読み込み中…</p> : listError ? <p className="staff-empty">一覧を取得できませんでした。検索を再実行してください。</p> : result?.items.length ? (
                    <table><thead><tr><th scope="col">スタッフコード</th><th scope="col">スタッフ名</th><th scope="col">権限</th><th scope="col">状態</th><th scope="col">最終ログイン日時</th><th scope="col">操作</th></tr></thead>
                        <tbody>{result.items.map(staff => <tr key={staff.staffCode}>
                            <td title={staff.staffCode}>{staff.staffCode}</td><td title={staff.staffName}>{staff.staffName}</td>
                            <td><span className={`staff-badge ${staff.role === 0 ? 'staff-role-admin' : 'staff-role-general'}`}>{roleLabel(staff.role)}</span></td>
                            <td><span className={`staff-badge ${staff.isActive ? 'staff-active' : 'staff-inactive'}`}>{activeLabel(staff.isActive)}</span></td>
                            <td>{loginDate(staff.lastLoginAt)}</td><td><button type="button" className="staff-button staff-button-edit" aria-label={`${staff.staffCode} ${staff.staffName}を編集`} disabled={openingCode !== null} onClick={() => void openEdit(staff.staffCode)}>{openingCode === staff.staffCode ? '読込中…' : '編集'}</button></td>
                        </tr>)}</tbody>
                    </table>
                ) : <p className="staff-empty">該当するスタッフがありません。</p>}
                </div>
                <nav className="staff-pagination" aria-label="スタッフ一覧のページ切り替え">
                    <span>{currentPage} / {totalPages}ページ</span>
                    <button type="button" className="staff-button" disabled={loading || !!listError || currentPage <= 1} onClick={() => goPage(currentPage - 1)}>前へ</button>
                    {pageNumbers.map((page, index) => <span className="staff-page-number" key={page}>{index > 0 && page - pageNumbers[index - 1] > 1 && <span aria-hidden="true">…</span>}<button type="button" className={`staff-button ${page === currentPage ? 'staff-page-current' : ''}`} aria-label={`${page}ページ目`} aria-current={page === currentPage ? 'page' : undefined} disabled={loading || !!listError || page === currentPage} onClick={() => goPage(page)}>{page}</button></span>)}
                    <button type="button" className="staff-button" disabled={loading || !!listError || currentPage >= totalPages} onClick={() => goPage(currentPage + 1)}>次へ</button>
                </nav>
            </div>
            {editor && <StaffDialog title={editor.kind === 'create' ? 'スタッフ新規登録' : 'スタッフ編集'} busy={saving} onClose={closeEditor}>
                <form onSubmit={prepareSave} noValidate>
                    {formError && <p className="staff-error" role="alert">{formError}</p>}
                    <fieldset className="staff-dialog-fields" disabled={saving}>
                        <label>スタッフコード{editor.kind === 'create' ? <input value={form.staffCode} maxLength={8} required onChange={event => setForm({ ...form, staffCode: event.target.value })} /> : <span className="staff-readonly">{editor.staff.staffCode}</span>}</label>
                        <label>スタッフ名<input value={form.staffName} maxLength={20} required onChange={event => setForm({ ...form, staffName: event.target.value })} /></label>
                        <div className="staff-form-row"><label>権限<select value={form.role} onChange={event => setForm({ ...form, role: Number(event.target.value) })}><option value={0}>管理者</option><option value={1}>一般スタッフ</option></select></label><label>有効状態<select value={String(form.isActive)} onChange={event => setForm({ ...form, isActive: event.target.value === 'true' })}><option value="true">有効</option><option value="false">無効</option></select></label></div>
                        {editor.kind === 'create' ? <><label>パスワード<input type="password" autoComplete="new-password" value={form.password} maxLength={64} required onChange={event => setForm({ ...form, password: event.target.value })} /></label><label>パスワード確認<input type="password" autoComplete="new-password" value={form.passwordConfirmation} maxLength={64} required onChange={event => setForm({ ...form, passwordConfirmation: event.target.value })} /></label><p className="staff-help">パスワードは8～64文字で入力してください。</p></> : <><label>最終ログイン日時<span className="staff-readonly">{loginDate(editor.staff.lastLoginAt)}</span></label><button type="button" className="staff-button" onClick={() => { setPassword(''); setPasswordConfirmation(''); setResetError(''); setResetOpen(true); }}>パスワード再設定</button></>}
                    </fieldset>
                    <div className="staff-dialog-actions"><button type="button" className="staff-button" disabled={saving} onClick={closeEditor}>キャンセル</button><button className="staff-button staff-button-primary" disabled={saving}>{editor.kind === 'create' ? '登録' : '保存'}</button></div>
                </form>
            </StaffDialog>}
            {resetOpen && editor?.kind === 'edit' && <StaffDialog title="パスワード再設定" busy={saving} onClose={() => { setResetOpen(false); setPassword(''); setPasswordConfirmation(''); }}>
                <form onSubmit={preparePassword} noValidate>
                    <p>{editor.staff.staffCode}  {editor.staff.staffName}</p>
                    {resetError && <p className="staff-error" role="alert">{resetError}</p>}
                    <fieldset className="staff-dialog-fields" disabled={saving}><label>新しいパスワード<input type="password" autoComplete="new-password" maxLength={64} value={password} onChange={event => setPassword(event.target.value)} /></label><label>新しいパスワード（確認）<input type="password" autoComplete="new-password" maxLength={64} value={passwordConfirmation} onChange={event => setPasswordConfirmation(event.target.value)} /></label><p className="staff-help">8～64文字で入力してください。</p></fieldset>
                    <div className="staff-dialog-actions"><button type="button" className="staff-button" disabled={saving} onClick={() => { setResetOpen(false); setPassword(''); setPasswordConfirmation(''); }}>キャンセル</button><button className="staff-button staff-button-primary" disabled={saving}>再設定</button></div>
                </form>
            </StaffDialog>}
            {confirmation && <StaffDialog title="更新内容の確認" busy={saving} onClose={() => setConfirmation(null)}>
                <p>次の内容で{confirmation.kind === 'create' ? '登録' : confirmation.kind === 'password' ? 'パスワードを再設定' : '更新'}します。</p>
                <ul className="staff-confirm-summary">{confirmation.summary.map((line, index) => <li key={index}>{line}</li>)}</ul>
                <div className="staff-dialog-actions"><button type="button" className="staff-button" disabled={saving} onClick={() => setConfirmation(null)}>キャンセル</button><button type="button" className="staff-button staff-button-primary" disabled={saving} onClick={() => void execute()}>{saving ? '処理中…' : '実行'}</button></div>
            </StaffDialog>}
        </section>
    );
}
