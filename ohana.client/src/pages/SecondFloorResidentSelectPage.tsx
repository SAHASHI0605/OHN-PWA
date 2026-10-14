import { RoomButton } from '../components/ResidentRoomCard';
import { useResidentSelection } from '../hooks/useResidentSelection';
import { residentSelectionKey } from '../types/residentSelection';
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

import '../styles/SecondFloorResidentSelectPage.css';

const WEEKDAYS = [
    '日',
    '月',
    '火',
    '水',
    '木',
    '金',
    '土',
];

const TOP_ROOM_NUMBERS = ['216','215','213','212','211','210','208','207','206','205','203','202','201'];
const BOTTOM_LEFT_ROOM_NUMBERS = ['217','218','220','221','222','223','225'];
const BOTTOM_RIGHT_ROOM_NUMBERS = ['226','227','228'];
const ROOM_NUMBERS = [...TOP_ROOM_NUMBERS, ...BOTTOM_LEFT_ROOM_NUMBERS, ...BOTTOM_RIGHT_ROOM_NUMBERS];

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

function SecondFloorResidentSelectPage() {
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

    const { rooms, phase, loadError, reloadResidents, selectedResident, dialogRoom, setDialogRoom, selectedText, handleRoomSelect, handleResidentSelect, handleClearSelection, handleProceed } = useResidentSelection(2, ROOM_NUMBERS);
    const topRooms = TOP_ROOM_NUMBERS.map(number => rooms.get(number)!);
    const bottomLeftRooms = BOTTOM_LEFT_ROOM_NUMBERS.map(number => rooms.get(number)!);
    const bottomRightRooms = BOTTOM_RIGHT_ROOM_NUMBERS.map(number => rooms.get(number)!);

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
        <main className="second-floor-page">
            <div className="second-floor-shell">
                <header className="second-floor-header">
                    <div className="second-floor-brand">
                        <img
                            src={kaizuLogo}
                            alt="からふる庭園海津"
                        />
                    </div>

                    <div className="second-floor-title">
                        <span className="second-floor-title__tag">
                            介護活動支援システム
                        </span>

                        <h1>
                            2階 利用者選択
                        </h1>

                        <p>
                            見取り図から記録を入力する利用者を選択してください。
                        </p>
                    </div>

                    <div className="second-floor-account">
                        <time className="second-floor-clock">
                            {currentDateTime}
                        </time>

                        <div className="second-floor-account__row">
                            <div className="second-floor-staff">
                                <div
                                    className="second-floor-staff__avatar"
                                    aria-hidden="true"
                                >
                                    👤
                                </div>

                                <div className="second-floor-staff__text">
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
                                className="second-floor-header-button"
                                onClick={
                                    handleBackToFloorSelect
                                }
                            >
                                階選択へ戻る
                            </button>

                            <button
                                type="button"
                                className="second-floor-header-button"
                                onClick={
                                    handleBackToMenu
                                }
                            >
                                メニューへ戻る
                            </button>
                        </div>
                    </div>
                </header>

                <section className="second-floor-content">
                    <div className="second-floor-toolbar">
                        <div>
                            <h2>
                                2階 見取り図
                            </h2>

                            <p>
                                居室をタップしてください。
                                2名部屋では利用者選択画面が表示されます。
                            </p>
                        </div>

                        <div className="second-floor-toolbar-actions">
                        <button type="button" className="second-floor-header-button" disabled={phase === 'loading'} onClick={reloadResidents}>再取得</button>
                        <div
                            className="second-floor-legend"
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

                    {phase === 'loading' && <p className="second-floor-load-status" role="status">入居者情報を取得中…</p>}
                    {phase === 'error' && <p className="second-floor-load-error" role="alert">{loadError}</p>}
                    <div className="second-floor-map-card" aria-busy={phase === 'loading'}>
                        <div className="second-floor-map">
                            <div className="second-floor-residential-zone">
                                <div className="second-floor-room-row second-floor-room-row--top">
                                    {topRooms.map(
                                        room => (
                                            <RoomButton prefix="second-floor"
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

                                    <div className="second-floor-utility-stack second-floor-utility-stack--top">
                                        <div className="second-floor-facility">
                                            倉庫
                                        </div>

                                        <div className="second-floor-facility">
                                            WC
                                        </div>
                                    </div>
                                </div>

                                <div className="second-floor-corridor">
                                    廊下
                                </div>

                                <div className="second-floor-bottom-layout">
                                    <div className="second-floor-room-row second-floor-room-row--bottom-left">
                                        {bottomLeftRooms.map(
                                            room => (
                                                <RoomButton prefix="second-floor"
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

                                    <div className="second-floor-center-facilities">
                                        <div className="second-floor-utility-stack">
                                            <div className="second-floor-facility">
                                                更衣室
                                            </div>

                                            <div className="second-floor-facility">
                                                階段室
                                            </div>
                                        </div>

                                        <div className="second-floor-utility-stack">
                                            <div className="second-floor-facility">
                                                EV
                                            </div>

                                            <div className="second-floor-facility">
                                                浴室
                                            </div>
                                        </div>

                                        <div className="second-floor-facility">
                                            洗濯
                                            <br />
                                            脱衣室
                                        </div>

                                        <div className="second-floor-facility">
                                            休憩室
                                        </div>
                                    </div>

                                    <div className="second-floor-room-row second-floor-room-row--bottom-right">
                                        {bottomRightRooms.map(
                                            room => (
                                                <RoomButton prefix="second-floor"
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
                                </div>
                            </div>

                            <div className="second-floor-right-complex">
                                <div className="second-floor-shared-zone">
                                    <div className="second-floor-facility second-floor-kitchen">
                                        食堂
                                        <br />
                                        キッチン
                                    </div>
                                </div>

                                <div className="second-floor-dining-hall">
                                    食堂ホール
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="second-floor-selection-bar">
                    <div className="second-floor-selection-copy">
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

                    <div className="second-floor-selection-actions">
                        <button
                            type="button"
                            className="second-floor-clear-button"
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
                            className="second-floor-confirm-button"
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
                    className="second-floor-modal"
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
                        className="second-floor-dialog"
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

                        <div className="second-floor-resident-list">
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

                        <div className="second-floor-dialog__footer">
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

export default SecondFloorResidentSelectPage;
