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
        <div className={`${prefix}-room${isSelected ? ` ${prefix}-room--selected` : ''}${!available ? ` ${prefix}-room--unavailable` : ''}`} aria-label={`${room.roomNumber}号室`}>
            <button type="button" className={`${prefix}-room__number`} disabled={!available} aria-label={`${room.roomNumber}号室の利用者を選択`} onClick={() => onClick(room)}>{room.roomNumber}</button>
            <div className={`${prefix}-room__resident`}>
                <strong>
                    {phase !== 'ready' ? <span>{phase === 'loading' ? '取得中' : '未取得'}</span> : room.residents.length === 0 ? <span>空室</span> : room.residents.map(resident => {
                        const selected = selectedResident !== null && residentSelectionKey(resident) === residentSelectionKey(selectedResident);
                        return <button key={residentSelectionKey(resident)} type="button" className={`${prefix}-resident-name${selected ? ` ${prefix}-resident-name--selected` : ''}`} aria-pressed={selected} aria-label={`${room.roomNumber}号室 連番${resident.serialNo} ${resident.tenantName}様を選択`} title={`${resident.tenantName} 様`} onClick={() => onSelect(room, resident)}><span className={`${prefix}-resident-name-text`}>{resident.tenantName}</span><span className={`${prefix}-resident-honorific`}>様</span></button>;
                    })}
                </strong>
                <small>{phase === 'ready' ? `入居者 ${room.residents.length}名` : phase === 'loading' ? '取得中' : '未取得'}</small>
            </div>
        </div>
    );
}

