import { useEffect, useRef, type ReactNode } from 'react';

export function StaffDialog({ title, children, busy = false, onClose }: {
    title: string; children: ReactNode; busy?: boolean; onClose: () => void;
}) {
    const dialog = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        const element = dialog.current!;
        element.showModal();
        return () => element.close();
    }, []);
    return (
        <dialog ref={dialog} className="staff-dialog" aria-label={title}
            onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
            <div className="staff-dialog-heading"><h2>{title}</h2>
                <button type="button" className="staff-button staff-button-subtle" aria-label={`${title}を閉じる`} disabled={busy} onClick={onClose}>閉じる</button>
            </div>
            {children}
        </dialog>
    );
}
