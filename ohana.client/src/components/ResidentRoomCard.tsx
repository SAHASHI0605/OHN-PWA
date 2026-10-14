import { residentSelectionKey, type ResidentSelection as Resident } from '../types/residentSelection';
import '../styles/ResidentSelection.css';
export type Room = {
    roomNumber: string;
    residents: Resident[];
};

type RoomButtonProps = {
    prefix: 'first-floor' | 'second-floor';
    room: Room;
    selectedResident: Resident | null;
    phase: 'loading' | 'ready' | 'error';
    onClick: (room: Room) => void;
    onSelect: (room: Room, resident: Resident) => void;
};

export function RoomButton({ prefix, room, selectedResident, phase, onClick, onSelect }: RoomButtonProps) {
    const isSelected = selectedResident?.roomNo === room.roomNumber;
    const available = phase === 'ready' && room.residents.length > 0;
    return (
        <button type="button" className={`${prefix}-room${isSelected ? ` ${prefix}-room--selected` : ''}${!available ? ` ${prefix}-room--unavailable` : ''}`}
            disabled={!available} aria-label={`${room.roomNumber}号室の利用者を選択${available ? `（${room.residents.map(resident => `${resident.tenantName}様`).join('、')}）` : ''}`}
            aria-pressed={isSelected} aria-haspopup={available && room.residents.length > 1 ? 'dialog' : undefined}
            onClick={() => {
                if (!available) return;
                if (room.residents.length === 1) onSelect(room, room.residents[0]);
                else onClick(room);
            }}>
            <span className={`${prefix}-room__number`}>{room.roomNumber}</span>
            <span className={`${prefix}-room__resident`}>
                <strong>
                    {phase !== 'ready' ? <span>{phase === 'loading' ? '取得中' : '未取得'}</span> : room.residents.length === 0 ? <span>空室</span> : room.residents.map(resident => {
                        const selected = selectedResident !== null && residentSelectionKey(resident) === residentSelectionKey(selectedResident);
                        return <span key={residentSelectionKey(resident)} className={`${prefix}-resident-name${selected ? ` ${prefix}-resident-name--selected` : ''}`} title={`${resident.tenantName} 様`}><span className={`${prefix}-resident-name-text`}>{resident.tenantName}</span><span className={`${prefix}-resident-honorific`}>様</span></span>;
                    })}
                </strong>
                <small>{phase === 'ready' ? `入居者 ${room.residents.length}名` : phase === 'loading' ? '取得中' : '未取得'}</small>
            </span>
        </button>
    );
}

