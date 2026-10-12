import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../styles/RecordInputDialog.css';

type Option = { value: string; label: string };
type Props = {
    id: string;
    label: string;
    value: string;
    onConfirm: (value: string) => void;
    kind: 'select' | 'number' | 'time' | 'text' | 'memo';
    options?: Option[];
    decimal?: boolean;
    decimalPlaces?: number;
    displayValue?: string;
    placeholder?: string;
    error?: string;
    max?: number;
    maxBytes?: number;
    optionLayout?: 'list' | 'amount';
};

export function RecordInputField(props: Props) {
    const [open, setOpen] = useState(false);
    return <>
        <button id={props.id} type="button" className={`record-popup-field${props.kind === 'memo' ? ' record-popup-field--memo' : ''}${props.error ? ' record-popup-field--error' : ''}`} aria-label={props.label} aria-invalid={!!props.error} aria-haspopup="dialog" onClick={() => setOpen(true)}>
            {props.displayValue ?? ((props.kind === 'select' ? (props.options?.find(option => option.value === props.value)?.label ?? props.value) : props.value) || props.placeholder || '未入力')}
            {props.error && <small>{props.error}</small>}
        </button>
        {open && createPortal(<InputDialog {...props} onCancel={() => setOpen(false)} onConfirm={value => { props.onConfirm(value); setOpen(false); }} />, document.body)}
    </>;
}

function InputDialog({ label, value, onConfirm, onCancel, kind, options, decimal, decimalPlaces, max, maxBytes, optionLayout }: Props & { onCancel: () => void }) {
    const [draft, setDraft] = useState(value);
    const [error, setError] = useState('');
    const dialogRef = useRef<HTMLDialogElement>(null);
    const openerRef = useRef(document.activeElement);
    const titleId = useId();
    const errorId = useId();
    useEffect(() => {
        const dialog = dialogRef.current!;
        const opener = openerRef.current;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        dialog.showModal();
        return () => {
            dialog.close();
            document.body.style.overflow = overflow;
            if (opener instanceof HTMLElement) opener.focus();
        };
    }, []);
    const numericPattern = decimal ? /^\d*(?:\.\d*)?$/ : /^\d*$/;
    const changeNumber = (next: string) => {
        if (numericPattern.test(next)) { setDraft(next); setError(''); }
    };
    const confirm = () => {
        if (kind === 'number' && draft !== '') {
            if (!/^\d+(?:\.\d+)?$/.test(draft) || !Number.isFinite(Number(draft))) {
                setError('数値を正しく入力してください。'); return;
            }
            if (decimalPlaces !== undefined && (draft.split('.')[1]?.length ?? 0) > decimalPlaces) {
                setError(`小数点以下は${decimalPlaces}桁まで入力してください。`); return;
            }
            if (max !== undefined && Number(draft) > max) { setError(`0～${max}の範囲で入力してください。`); return; }
        }
        if (maxBytes !== undefined && new TextEncoder().encode(draft).length > maxBytes) { setError('保存できる文字数を超えています。'); return; }
        if (kind === 'time' && draft !== '' && !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(draft)) {
            setError('時刻を選択してください。'); return;
        }
        onConfirm(draft);
    };
    const [hour, minute] = draft.split(':');
    return <dialog ref={dialogRef} className="record-input-dialog" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onCancel(); }} onClick={event => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onCancel();
    }}>
        <div className="record-input-dialog__header"><h2 id={titleId}>{label}</h2><p>「決定」で入力値を反映します。</p></div>
        <div className="record-input-dialog__body">
            {kind === 'select' && <div className={`record-dialog-options${optionLayout === 'amount' ? ' record-dialog-options--amount' : ''}`}>
                {options?.map(option => <button key={option.value} type="button" aria-pressed={draft === option.value} onClick={() => setDraft(option.value)}>{option.label}</button>)}
            </div>}
            {kind === 'number' && <>
                <input autoFocus aria-label={`${label}の入力値`} aria-describedby={error ? errorId : undefined} aria-invalid={!!error} className="record-dialog-number" type="text" inputMode={decimal ? 'decimal' : 'numeric'} value={draft} placeholder="未入力" onChange={event => changeNumber(event.target.value)} />
                <div className="record-dialog-keypad">{['1','2','3','4','5','6','7','8','9','.','0','⌫'].map(key => <button key={key} type="button" aria-label={key === '⌫' ? '1文字削除' : key} disabled={key === '.' && (!decimal || draft.includes('.'))} onClick={() => changeNumber(key === '⌫' ? draft.slice(0, -1) : key === '.' && draft === '' ? '0.' : draft + key)}>{key}</button>)}</div>
                <button type="button" className="record-dialog-clear" onClick={() => { setDraft(''); setError(''); }}>クリア</button>
            </>}
            {kind === 'time' && <div className="record-dialog-time">
                <label>時<select aria-label="時" value={hour ?? ''} onChange={event => { setDraft(`${event.target.value}:${minute || '00'}`); setError(''); }}><option value="" disabled>--</option>{Array.from({length:24}, (_,i) => String(i).padStart(2,'0')).map(time => <option key={time}>{time}</option>)}</select></label>
                <span>：</span>
                <label>分<select aria-label="分" value={minute ?? ''} onChange={event => { setDraft(`${hour || '00'}:${event.target.value}`); setError(''); }}><option value="" disabled>--</option>{Array.from({length:60}, (_,i) => String(i).padStart(2,'0')).map(time => <option key={time}>{time}</option>)}</select></label>
            </div>}
            {kind === 'text' && <input autoFocus type="text" aria-label={`${label}の入力値`} value={draft} onChange={event => setDraft(event.target.value)} />}
            {kind === 'memo' && <textarea autoFocus aria-label={`${label}の入力値`} value={draft} rows={6} onChange={event => setDraft(event.target.value)} />}
            {error && <p id={errorId} className="record-dialog-error" role="alert">{error}</p>}
        </div>
        <div className="record-input-dialog__footer"><button type="button" onClick={onCancel}>キャンセル</button><button type="button" className="record-dialog-confirm" onClick={confirm}>決定</button></div>
    </dialog>;
}
