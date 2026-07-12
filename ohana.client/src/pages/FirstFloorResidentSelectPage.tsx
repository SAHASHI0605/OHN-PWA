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

import '../styles/FirstFloorResidentSelectPage.css';

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
        roomNumber: '113',
        residents: [
            {
                id: 11301,
                name: '川上 省蔵',
            },
        ],
    },
    {
        roomNumber: '112',
        residents: [
            {
                id: 11201,
                name: '平野 志義',
            },
            {
                id: 11202,
                name: '松村 俊英',
            },
        ],
    },
    {
        roomNumber: '111',
        residents: [
            {
                id: 11101,
                name: '岩田 五十美',
            },
        ],
    },
    {
        roomNumber: '110',
        residents: [
            {
                id: 11001,
                name: '山村 多恵子',
            },
        ],
    },
    {
        roomNumber: '108',
        residents: [
            {
                id: 10801,
                name: '安田 綾子',
            },
        ],
    },
    {
        roomNumber: '107',
        residents: [
            {
                id: 10701,
                name: '松岡 和子',
            },
        ],
    },
    {
        roomNumber: '106',
        residents: [
            {
                id: 10601,
                name: '中野 靖子',
            },
        ],
    },
    {
        roomNumber: '105',
        residents: [
            {
                id: 10501,
                name: '青井 その',
            },
        ],
    },
    {
        roomNumber: '103',
        residents: [
            {
                id: 10301,
                name: '水谷 ゆき子',
            },
        ],
    },
    {
        roomNumber: '102',
        residents: [
            {
                id: 10201,
                name: '岩田 朋子',
            },
        ],
    },
    {
        roomNumber: '101',
        residents: [
            {
                id: 10101,
                name: '石村 勝正',
            },
        ],
    },
];

const BOTTOM_ROOMS: Room[] = [
    {
        roomNumber: '115',
        residents: [
            {
                id: 11501,
                name: '川上 百合子',
            },
        ],
    },
    {
        roomNumber: '116',
        residents: [
            {
                id: 11601,
                name: '堀田 幸子',
            },
        ],
    },
    {
        roomNumber: '117',
        residents: [
            {
                id: 11701,
                name: '服部 幸子',
            },
        ],
    },
    {
        roomNumber: '118',
        residents: [
            {
                id: 11801,
                name: '小林 芳子',
            },
        ],
    },
    {
        roomNumber: '120',
        residents: [
            {
                id: 12001,
                name: '馬場 政子',
            },
        ],
    },
    {
        roomNumber: '121',
        residents: [
            {
                id: 12101,
                name: '光野 八重子',
            },
        ],
    },
    {
        roomNumber: '122',
        residents: [
            {
                id: 12201,
                name: '丸山 たかを',
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
                `first-floor-room` +
                (
                    isSelected
                        ? ' first-floor-room--selected'
                        : ''
                )
            }
            onClick={() => {
                onClick(room);
            }}
        >
            <span className="first-floor-room__number">
                {room.roomNumber}
            </span>

            <span className="first-floor-room__resident">
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
                `${selectedRoom.roomNumber}号室　` +
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

        window.alert(
            `${selectedRoom.roomNumber}号室 ` +
            `${selectedResident.name} 様の` +
            `記録入力画面へ進みます。`,
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

                    <div className="first-floor-map-card">
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
                            <div className="first-floor-residential-zone">
                                <div className="first-floor-room-row first-floor-room-row--top">
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

                                    <div className="first-floor-facility">
                                        収納
                                    </div>

                                    <div className="first-floor-facility">
                                        予備室
                                    </div>
                                </div>

                                <div className="first-floor-corridor">
                                    廊下
                                </div>

                                <div className="first-floor-room-row first-floor-room-row--bottom">
                                    {BOTTOM_ROOMS.map(
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

                                    <div className="first-floor-utility-stack">
                                        <div className="first-floor-facility">
                                            階段
                                        </div>

                                        <div className="first-floor-facility">
                                            倉庫
                                        </div>

                                        <div className="first-floor-facility">
                                            PS
                                        </div>
                                    </div>

                                    <div className="first-floor-utility-stack">
                                        <div className="first-floor-facility">
                                            更衣室
                                        </div>

                                        <div className="first-floor-facility">
                                            EV
                                        </div>

                                        <div className="first-floor-facility">
                                            浴室
                                        </div>
                                    </div>

                                    <div className="first-floor-utility-stack">
                                        <div className="first-floor-facility">
                                            洗濯
                                            <br />
                                            脱衣室
                                        </div>

                                        <div className="first-floor-facility">
                                            浴室
                                        </div>

                                        <div className="first-floor-facility">
                                            機械浴室
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="first-floor-right-complex">
                                <div className="first-floor-shared-zone">
                                    <div className="first-floor-facility first-floor-kitchen">
                                        厨房
                                    </div>

                                    <div className="first-floor-facility first-floor-wc">
                                        WC
                                    </div>

                                    <div className="first-floor-facility first-floor-bath">
                                        汚損室
                                        <br />
                                        浴室
                                    </div>

                                    <div className="first-floor-facility first-floor-hall">
                                        ホール
                                        <br />
                                        玄関
                                    </div>

                                    <div className="first-floor-facility first-floor-office">
                                        事務室
                                    </div>

                                    <div className="first-floor-facility first-floor-machine-bath">
                                        機械浴室
                                    </div>
                                </div>

                                <div className="first-floor-dining-hall">
                                    食堂ホール
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
