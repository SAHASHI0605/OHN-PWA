import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import '../styles/RecordSaveResultDialog.css';

type Props = { kind: 'success' | 'error' | 'warning'; message?: string; onRestoreFocus: () => void; onClose: () => void };
const fallbackMessage = '保存中にエラーが発生しました。もう一度お試しください。';

function displayMessage(message?: string) {
    const text = message?.trim();
    // Only user-facing messages belong in this dialog; do not expose unexpected diagnostics.
    if (!text || /stack\s*trace|\b(?:System\.|MySqlConnector\.|MySqlException|SqlException|SELECT\s|INSERT\s+INTO|UPDATE\s+\w+\s+SET|API request failed)|(?:^|\n)\s*at\s+\S+|https?:\/\/\S+/i.test(text)) return fallbackMessage;
    return text;
}

export function RecordSaveResultDialog({ kind, message, onRestoreFocus, onClose }: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const restoreFocusRef = useRef(onRestoreFocus);
    const titleId = useId();
    const messageId = useId();
    useEffect(() => {
        const dialog = dialogRef.current!;
        const restoreFocus = restoreFocusRef.current;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        // Native modal dialogs make the background inert and keep focus in the modal.
        dialog.showModal();
        closeRef.current?.focus();
        return () => {
            dialog.close();
            document.body.style.overflow = overflow;
            restoreFocus();
        };
    }, []);
    const title = kind === 'success' ? '保存が完了しました' : kind === 'error' ? '保存に失敗しました' : '保存は完了しました';
    return createPortal(<dialog ref={dialogRef} className={`record-save-result record-save-result--${kind}`}
        role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={messageId}
        onCancel={event => event.preventDefault()}
        onKeyDown={event => {
            if (event.key === 'Tab') { event.preventDefault(); closeRef.current?.focus(); }
        }}>
        <div className="record-save-result__content">
            <span className="record-save-result__icon" aria-hidden="true">{kind === 'success' ? '✓' : kind === 'error' ? '✕' : '!'}</span>
            <h2 id={titleId}>{title}</h2>
            <p id={messageId}>{kind === 'success' ? '記録を正常に保存しました。' : displayMessage(message)}</p>
        </div>
        <button ref={closeRef} type="button" className="record-save-result__close" onClick={onClose}>閉じる</button>
    </dialog>, document.body);
}
