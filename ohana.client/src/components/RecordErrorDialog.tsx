import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export function RecordErrorDialog({message,onClose}:{message:string;onClose:()=>void}) {
    const ref=useRef<HTMLDialogElement>(null);
    useEffect(()=>{
        const dialog=ref.current!;const opener=document.activeElement;const overflow=document.body.style.overflow;
        document.body.style.overflow='hidden';dialog.showModal();
        return()=>{dialog.close();document.body.style.overflow=overflow;if(opener instanceof HTMLElement)opener.focus();};
    },[]);
    return createPortal(<dialog className="record-input-dialog" ref={ref} aria-labelledby="record-error-title" onCancel={event=>{event.preventDefault();onClose();}}>
        <div className="record-input-dialog__header"><h2 id="record-error-title">記録の処理を確認してください</h2></div>
        <div className="record-input-dialog__body"><p role="alert">{message}</p><p>入力内容は保持されています。内容を確認して再試行してください。</p></div>
        <div className="record-input-dialog__footer"><button type="button" onClick={onClose}>閉じる</button></div>
    </dialog>,document.body);
}
