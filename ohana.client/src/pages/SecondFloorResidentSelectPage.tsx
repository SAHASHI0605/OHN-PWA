import {
    useEffect,
    useMemo,
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

type Resident = {
    id: number;
    name: string;
};

type Room = {
    roomNumber: string;
    residents: Resident[];
};

type RoomButtonProps = {
    room: Room;
    selectedRoomNumber: string | null;
    onClick: (room: Room) => void;
};

const WEEKDAYS = [
    '日',
    '月',
    '火',
    '水',
    '木',
    '金',
    '土',
];

const TOP_ROOMS: Room[] = [
    {
        roomNumber: '216',
        residents: [
            {
                id: 21601,
                name: '大橋 純子',
            },
        ],
    },
    {
        roomNumber: '215',
        residents: [
            {
                id: 21501,
                name: '伊藤 満',
            },
        ],
    },
    {
        roomNumber: '213',
        residents: [
            {
                id: 21301,
                name: '三輪 茂安',
            },
        ],
    },
    {
        roomNumber: '212',
        residents: [
            {
                id: 21201,
                name: '森 正子',
            },
        ],
    },
    {
        roomNumber: '211',
        residents: [
            {
                id: 21101,
                name: '石神 照美',
            },
        ],
    },
    {
        roomNumber: '210',
        residents: [
            {
                id: 21001,
                name: '山下 富美子',
            },
        ],
    },
    {
        roomNumber: '208',
        residents: [
            {
                id: 20801,
                name: '前川 幸子',
            },
        ],
    },
    {
        roomNumber: '207',
        residents: [
            {
                id: 20701,
                name: '田中 清征',
            },
        ],
    },
    {
        roomNumber: '206',
        residents: [
            {
                id: 20601,
                name: '勅使川原',
            },
        ],
    },
    {
        roomNumber: '205',
        residents: [
            {
                id: 20501,
                name: '伊藤 ふみ子',
            },
        ],
    },
    {
        roomNumber: '203',
        residents: [
            {
                id: 20301,
                name: '神田 昌幸',
            },
        ],
    },
    {
        roomNumber: '202',
        residents: [
            {
                id: 20201,
                name: '中島 静',
            },
        ],
    },
    {
        roomNumber: '201',
        residents: [
            {
                id: 20101,
                name: '水谷 昭子',
            },
        ],
    },
];

const BOTTOM_LEFT_ROOMS: Room[] = [
    {
        roomNumber: '217',
        residents: [
            {
                id: 21701,
                name: '川面 勇作',
            },
        ],
    },
    {
        roomNumber: '218',
        residents: [
            {
                id: 21801,
                name: '藤原 臨子',
            },
        ],
    },
    {
        roomNumber: '220',
        residents: [
            {
                id: 22001,
                name: '伊藤 富士男',
            },
        ],
    },
    {
        roomNumber: '221',
        residents: [
            {
                id: 22101,
                name: '門山 早苗',
            },
        ],
    },
    {
        roomNumber: '222',
        residents: [
            {
                id: 22201,
                name: '上田 香代子',
            },
        ],
    },
    {
        roomNumber: '223',
        residents: [
            {
                id: 22301,
                name: '石村 玲子',
            },
        ],
    },
    {
        roomNumber: '225',
        residents: [
            {
                id: 22501,
                name: '伊藤 道子',
            },
        ],
    },
];

const BOTTOM_RIGHT_ROOMS: Room[] = [
    {
        roomNumber: '226',
        residents: [
            {
                id: 22601,
                name: '高木 勤',
            },
        ],
    },
    {
        roomNumber: '227',
        residents: [
            {
                id: 22701,
                name: '箕浦 和子',
            },
        ],
    },
    {
        roomNumber: '228',
        residents: [
            {
                id: 22801,
                name: '西塚 卯子',
            },
        ],
    },
];

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

function RoomButton({
    room,
    selectedRoomNumber,
    onClick,
}: RoomButtonProps) {
    const isSelected =
        room.roomNumber
        === selectedRoomNumber;

    return (
        <button
            type="button"
            className={
                `second-floor-room` +
                (
                    isSelected
                        ? ' second-floor-room--selected'
                        : ''
                )
            }
            onClick={() => {
                onClick(room);
            }}
        >
            <span className="second-floor-room__number">
                {room.roomNumber}
            </span>

            <span className="second-floor-room__resident">
                <strong>
                    {room.residents.map(
                        resident => (
                            <span
                                key={resident.id}
                            >
                                {resident.name} 様
                            </span>
                        ),
                    )}
                </strong>

                <small>
                    入居者 {room.residents.length}名
                </small>
            </span>
        </button>
    );
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
                `${selectedResident.name} 様`
            );
        }, [
            selectedRoom,
            selectedResident,
        ]);

    const handleRoomSelect = (
        room: Room,
    ) => {
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

    const handleProceed = () => {
        if (
            !selectedRoom
            || !selectedResident
        ) {
            return;
        }

        navigate(
            `/records/${selectedResident.id}`,
            {
                state: {
                    residentId:
                        selectedResident.id,

                    residentName:
                        selectedResident.name,

                    roomNumber:
                        selectedRoom.roomNumber,
                },
            },
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

                    <div className="second-floor-map-card">
                        <div className="second-floor-map-heading">
                            <strong>
                                2F
                            </strong>

                            <div>
                                東
                                <span>
                                    ↑
                                </span>
                            </div>
                        </div>

                        <div className="second-floor-map">
                            <div className="second-floor-residential-zone">
                                <div className="second-floor-room-row second-floor-room-row--top">
                                    {TOP_ROOMS.map(
                                        room => (
                                            <RoomButton
                                                key={
                                                    room.roomNumber
                                                }
                                                room={
                                                    room
                                                }
                                                selectedRoomNumber={
                                                    selectedRoom
                                                        ?.roomNumber
                                                    ?? null
                                                }
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
                                        {BOTTOM_LEFT_ROOMS.map(
                                            room => (
                                                <RoomButton
                                                    key={
                                                        room.roomNumber
                                                    }
                                                    room={
                                                        room
                                                    }
                                                    selectedRoomNumber={
                                                        selectedRoom
                                                            ?.roomNumber
                                                        ?? null
                                                    }
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
                                        {BOTTOM_RIGHT_ROOMS.map(
                                            room => (
                                                <RoomButton
                                                    key={
                                                        room.roomNumber
                                                    }
                                                    room={
                                                        room
                                                    }
                                                    selectedRoomNumber={
                                                        selectedRoom
                                                            ?.roomNumber
                                                        ?? null
                                                    }
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
                                            resident.id
                                        }
                                        type="button"
                                        onClick={() => {
                                            handleResidentSelect(
                                                dialogRoom,
                                                resident,
                                            );
                                        }}
                                    >
                                        {resident.name} 様
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
