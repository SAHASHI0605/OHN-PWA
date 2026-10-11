import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFloorResidentsAsync } from '../services/residentSelectionService';
import { residentSelectionKey, type ResidentSelection as Resident, type RecordResidentState } from '../types/residentSelection';
import type { Room } from '../components/ResidentRoomCard';

export function useResidentSelection(floor: 1 | 2, roomNumbers: readonly string[]) {
    const navigate = useNavigate();
    const [residents, setResidents] = useState<Resident[]>([]);
    const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
    const [loadError, setLoadError] = useState('');
    const [refresh, setRefresh] = useState(0);
    const rooms = useMemo(() => new Map(roomNumbers.map(roomNumber => [roomNumber, {
        roomNumber, residents: residents.filter(resident => resident.roomNo === roomNumber).sort((a, b) => a.serialNo.localeCompare(b.serialNo)),
    }])), [residents, roomNumbers]);
    const [
        selectedRoom,
        setSelectedRoom,
    ] = useState<Room | null>(
        null,
    );

    const [
        selectedResident,
        setSelectedResident,
    ] = useState<Resident | null>(
        null,
    );

    const [
        dialogRoom,
        setDialogRoom,
    ] = useState<Room | null>(
        null,
    );

    useEffect(() => {
        const controller = new AbortController();
        let current = true;
        getFloorResidentsAsync(floor, controller.signal).then(data => {
            if (current) { setResidents(data); setPhase('ready'); setLoadError(''); }
        }).catch(error => {
            if (current) {
                setPhase('error');
                setLoadError(error instanceof Error && error.message.startsWith('同じ部屋番号') ? error.message : '入居者情報を取得できませんでした。接続を確認して再取得してください。');
            }
        });
        return () => { current = false; controller.abort(); };
    }, [floor, refresh]);
    const reloadResidents = () => {
        setSelectedRoom(null); setSelectedResident(null); setDialogRoom(null);
        setResidents([]); setPhase('loading'); setLoadError(''); setRefresh(value => value + 1);
    };

    const selectedText =
        useMemo(() => {
            if (
                !selectedRoom
                || !selectedResident
            ) {
                return '利用者を選択してください';
            }

            return (
                `${selectedRoom.roomNumber}号室` +
                `${selectedResident.tenantName} 様`
            );
        }, [
            selectedRoom,
            selectedResident,
        ]);

    const handleRoomSelect = (
        room: Room,
    ) => {
        if (phase !== 'ready' || room.residents.length === 0) return;
        if (
            room.residents.length
            === 1
        ) {
            setSelectedRoom(
                room,
            );

            setSelectedResident(
                room.residents[0],
            );

            return;
        }

        setDialogRoom(
            room,
        );
    };

    const handleResidentSelect = (
        room: Room,
        resident: Resident,
    ) => {
        setSelectedRoom(
            room,
        );

        setSelectedResident(
            resident,
        );

        setDialogRoom(
            null,
        );
    };

    const handleClearSelection =
        () => {
            setSelectedRoom(
                null,
            );

            setSelectedResident(
                null,
            );
        };

    const handleProceed = () => {
        if (
            !selectedRoom
            || !selectedResident
        ) {
            return;
        }

        navigate(
            `/records/${encodeURIComponent(residentSelectionKey(selectedResident))}`,
            {
                state: {
                    floor,
                    residentId:
                        residentSelectionKey(selectedResident),

                    residentName:
                        selectedResident.tenantName,

                    roomNumber: selectedRoom.roomNumber,
                    serialNo: selectedResident.serialNo,
                    moveInDate: selectedResident.moveInDate,
                } satisfies RecordResidentState,
            },
        );
    };

    return { rooms, phase, loadError, reloadResidents, selectedRoom, selectedResident, dialogRoom, setDialogRoom, selectedText, handleRoomSelect, handleResidentSelect, handleClearSelection, handleProceed };
}
