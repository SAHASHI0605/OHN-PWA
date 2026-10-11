import { RoomButton } from '../components/ResidentRoomCard';
import { useResidentSelection } from '../hooks/useResidentSelection';
import {
    useEffect,
    useState,
} from 'react';

import {
    useNavigate,
} from 'react-router-dom';

import {
    useAuth,
} from '../auth/useAuth';

import kaizuLogo from '../assets/kaizu-logo.png';

import '../styles/FirstFloorResidentSelectPage.css';
import { residentSelectionKey } from '../types/residentSelection';

const WEEKDAYS = [
    '日',
    '月',
    '火',
    '水',
    '木',
    '金',
    '土',
];

// Layout order is independent from API data. Preserve the existing map positions.
const TOP_ROOM_NUMBERS = ['113', '112', '111', '110', '108', '107', '106', '105', '103', '102', '101'];
const BOTTOM_ROOM_NUMBERS = ['115', '116', '117', '118', '120', '121', '122'];
const ROOM_NUMBERS = [...TOP_ROOM_NUMBERS, ...BOTTOM_ROOM_NUMBERS, 'VIP'];

function formatCurrentDateTime(
    date: Date,
): string {
    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1,
        ).padStart(2, '0');

    const day =
        String(
            date.getDate(),
        ).padStart(2, '0');

    const weekday =
        WEEKDAYS[
            date.getDay()
        ];

    const hours =
        String(
            date.getHours(),
        ).padStart(2, '0');

    const minutes =
        String(
            date.getMinutes(),
        ).padStart(2, '0');

    return (
        `${year}/${month}/${day}` +
        `(${weekday}) ` +
        `${hours}:${minutes}`
    );
}

function getRoleDisplayName(
    role: string | undefined,
): string {
    switch (role) {
        case '0':
        case 'Administrator':
        case 'Admin':
            return '管理者';

        case '1':
        case 'Staff':
        case 'General':
            return 'スタッフ';

        default:
            return role || '権限未取得';
    }
}

function FirstFloorResidentSelectPage() {
    const navigate =
        useNavigate();

    const {
        user,
    } = useAuth();

    const [
        currentDateTime,
        setCurrentDateTime,
    ] = useState(() =>
        formatCurrentDateTime(
            new Date(),
        ),
    );

    const { rooms, phase, loadError, reloadResidents, selectedResident, dialogRoom, setDialogRoom, selectedText, handleRoomSelect, handleResidentSelect, handleClearSelection, handleProceed } = useResidentSelection(1, ROOM_NUMBERS);
    const topRooms = TOP_ROOM_NUMBERS.map(number => rooms.get(number)!);
    const bottomRooms = BOTTOM_ROOM_NUMBERS.map(number => rooms.get(number)!);

    const staffName =
        user?.employeeName
        ?? '担当者名未取得';

    const staffRole =
        getRoleDisplayName(
            user?.role,
        );

    useEffect(() => {
        const timerId =
            window.setInterval(
                () => {
                    setCurrentDateTime(
                        formatCurrentDateTime(
                            new Date(),
                        ),
                    );
                },
                1000,
            );

        return () => {
            window.clearInterval(
                timerId,
            );
        };
    }, []);

    const handleBackToFloorSelect =
        () => {
            navigate(
                '/residents/floors',
            );
        };

    const handleBackToMenu =
        () => {
            navigate(
                '/menu',
            );
        };

    return (
        <main className="first-floor-page">
            <div className="first-floor-shell">
                <header className="first-floor-header">
                    <div className="first-floor-brand">
                        <img
                            src={kaizuLogo}
                            alt="からふる庭園海津"
                        />
                    </div>

                    <div className="first-floor-title">
                        <span className="first-floor-title__tag">
                            介護活動支援システム
                        </span>

                        <h1>
                            1階 利用者選択
                        </h1>

                        <p>
                            見取り図から記録を入力する利用者を選択してください。
                        </p>
                    </div>

                    <div className="first-floor-account">
                        <time className="first-floor-clock">
                            {currentDateTime}
                        </time>

                        <div className="first-floor-account__row">
                            <div className="first-floor-staff">
                                <div
                                    className="first-floor-staff__avatar"
                                    aria-hidden="true"
                                >
                                    👤
                                </div>

                                <div className="first-floor-staff__text">
                                    <strong>
                                        {staffName} さん
                                    </strong>

                                    <span>
                                        権限：{staffRole}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="first-floor-header-button"
                                onClick={
                                    handleBackToFloorSelect
                                }
                            >
                                階選択へ戻る
                            </button>

                            <button
                                type="button"
                                className="first-floor-header-button"
                                onClick={
                                    handleBackToMenu
                                }
                            >
                                メニューへ戻る
                            </button>
                        </div>
                    </div>
                </header>

                <section className="first-floor-content">
                    <div className="first-floor-toolbar">
                        <div>
                            <h2>
                                1階 見取り図
                            </h2>

                            <p>
                                居室をタップしてください。
                                2名部屋では利用者選択画面が表示されます。
                            </p>
                        </div>

                        <div className="first-floor-toolbar-actions">
                        <button type="button" className="first-floor-header-button" disabled={phase === 'loading'} onClick={reloadResidents}>再取得</button>
                        <div
                            className="first-floor-legend"
                            aria-label="凡例"
                        >
                            <span>
                                <i />
                                選択可能
                            </span>

                            <span>
                                <i className="selected" />
                                選択中
                            </span>

                            <span>
                                <i className="facility" />
                                共有設備
                            </span>
                        </div>
                        </div>
                    </div>

                    {phase === 'loading' && <p className="first-floor-load-status" role="status">入居者情報を取得中…</p>}
                    {phase === 'error' && <p className="first-floor-load-error" role="alert">{loadError}</p>}
                    <div className="first-floor-map-card" aria-busy={phase === 'loading'}>
                        <div className="first-floor-map-heading">
                            <strong>
                                1F
                            </strong>

                            <div>
                                東
                                <span>
                                    ↑
                                </span>
                            </div>
                        </div>

                        <div className="first-floor-map">
                            <div className="first-floor-top-rooms">
                                {topRooms.map(
                                    room => (
                                        <RoomButton prefix="first-floor"
                                            key={
                                                room.roomNumber
                                            }
                                            room={
                                                room
                                            }
                                            selectedResident={selectedResident}
                                            phase={phase}
                                            onSelect={handleResidentSelect}
                                            onClick={
                                                handleRoomSelect
                                            }
                                        />
                                    ),
                                )}
                            </div>

                            <div className="first-floor-top-shared">
                                <div className="first-floor-facility first-floor-kitchen">
                                    厨房
                                </div>

                                <RoomButton prefix="first-floor" room={rooms.get('VIP')!} selectedResident={selectedResident} phase={phase} onClick={handleRoomSelect} onSelect={handleResidentSelect} />
                            </div>

                            <div className="first-floor-dining-hall">
                                食堂ホール
                            </div>

                            <div className="first-floor-corridor">
                                廊下
                            </div>

                            <div className="first-floor-bottom-residential">
                                <div className="first-floor-bottom-rooms">
                                    {bottomRooms.map(
                                        room => (
                                            <RoomButton prefix="first-floor"
                                                key={
                                                    room.roomNumber
                                                }
                                                room={
                                                    room
                                                }
                                                selectedResident={selectedResident}
                                            phase={phase}
                                            onSelect={handleResidentSelect}
                                                onClick={
                                                    handleRoomSelect
                                                }
                                            />
                                        ),
                                    )}
                                </div>

                                <div className="first-floor-bottom-utilities">
                                    <div className="first-floor-facility first-floor-stairs">
                                        階段
                                    </div>

                                    <div className="first-floor-ev-bath">
                                        <div className="first-floor-facility">
                                            EV
                                        </div>

                                        <div className="first-floor-facility">
                                            浴室
                                        </div>
                                    </div>

                                    <div className="first-floor-facility first-floor-laundry">
                                        洗濯
                                        <br />
                                        脱衣室
                                    </div>
                                </div>
                            </div>

                            <div className="first-floor-bottom-shared">
                                <div className="first-floor-bath-zone">
                                    <div className="first-floor-facility">
                                        浴室
                                    </div>

                                    <div className="first-floor-facility">
                                        機械浴室
                                    </div>
                                </div>

                                <div className="first-floor-hall-zone">
                                    <div className="first-floor-facility">
                                        ホール
                                    </div>

                                    <div className="first-floor-facility">
                                        玄関
                                    </div>
                                </div>

                                <div className="first-floor-facility first-floor-office">
                                    事務室
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="first-floor-selection-bar">
                    <div className="first-floor-selection-copy">
                        <span>
                            選択中の利用者
                        </span>

                        <strong>
                            {selectedText}
                        </strong>

                        <small>
                            {
                                selectedResident
                                    ? '内容を確認し、「記録入力へ進む」を押してください。'
                                    : '見取り図の居室をタップしてください。'
                            }
                        </small>
                    </div>

                    <div className="first-floor-selection-actions">
                        <button
                            type="button"
                            className="first-floor-clear-button"
                            disabled={
                                !selectedResident
                            }
                            onClick={
                                handleClearSelection
                            }
                        >
                            選択解除
                        </button>

                        <button
                            type="button"
                            className="first-floor-confirm-button"
                            disabled={
                                !selectedResident
                            }
                            onClick={
                                handleProceed
                            }
                        >
                            記録入力へ進む
                        </button>
                    </div>
                </div>
            </div>

            {dialogRoom && (
                <div
                    className="first-floor-modal"
                    role="presentation"
                    onMouseDown={event => {
                        if (
                            event.target
                            === event.currentTarget
                        ) {
                            setDialogRoom(
                                null,
                            );
                        }
                    }}
                >
                    <div
                        className="first-floor-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="resident-dialog-title"
                    >
                        <h2 id="resident-dialog-title">
                            利用者を選択
                        </h2>

                        <p>
                            {dialogRoom.roomNumber}
                            号室の利用者を選択してください。
                        </p>

                        <div className="first-floor-resident-list">
                            {dialogRoom.residents.map(
                                resident => (
                                    <button
                                        key={
                                            residentSelectionKey(resident)
                                        }
                                        type="button"
                                        onClick={() => {
                                            handleResidentSelect(
                                                dialogRoom,
                                                resident,
                                            );
                                        }}
                                    >
                                        {resident.tenantName} 様
                                    </button>
                                ),
                            )}
                        </div>

                        <div className="first-floor-dialog__footer">
                            <button
                                type="button"
                                onClick={() => {
                                    setDialogRoom(
                                        null,
                                    );
                                }}
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default FirstFloorResidentSelectPage;
