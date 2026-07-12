import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/FloorSelectPage.css';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function formatCurrentDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekday = WEEKDAYS[date.getDay()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}/${month}/${day}(${weekday}) ${hours}:${minutes}`;
}

function FloorSelectPage() {
    const navigate = useNavigate();

    const [currentDateTime, setCurrentDateTime] = useState(() =>
        formatCurrentDateTime(new Date()),
    );

    useEffect(() => {
        const timerId = window.setInterval(() => {
            setCurrentDateTime(formatCurrentDateTime(new Date()));
        }, 1000);

        return () => {
            window.clearInterval(timerId);
        };
    }, []);

    const handleFloorSelect = (floorNumber: 1 | 2) => {
        if (floorNumber === 2) {
            window.alert('2階の見取り図は現在準備中です。');
            return;
        }

        navigate('/residents/floors/1');
    };

    const handleBackToMenu = () => {
        navigate('/menu');
    };

    return (
        <main className="floor-select-page">
            <div className="floor-select-shell">
                <header className="floor-select-header">
                    <div className="floor-select-brand">
                        <div
                            className="floor-select-brand__mark"
                            aria-hidden="true"
                        >
                            🌿
                        </div>

                        <div className="floor-select-brand__name">
                            <strong>からふる庭園海津</strong>
                            <span>Care Support System</span>
                        </div>
                    </div>

                    <div className="floor-select-title">
                        <span className="floor-select-title__tag">
                            介護活動支援システム
                        </span>

                        <h1>利用者選択</h1>

                        <p>利用者がいる階を選択してください。</p>
                    </div>

                    <div className="floor-select-account">
                        <time className="floor-select-clock">
                            {currentDateTime}
                        </time>

                        <div className="floor-select-account__row">
                            <div className="floor-select-staff">
                                <div
                                    className="floor-select-staff__avatar"
                                    aria-hidden="true"
                                >
                                    👤
                                </div>

                                <div className="floor-select-staff__text">
                                    <strong>佐橋 輝彦 さん</strong>
                                    <span>権限：管理者</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="floor-select-menu-button"
                                onClick={handleBackToMenu}
                            >
                                メニューへ戻る
                            </button>
                        </div>
                    </div>
                </header>

                <section className="floor-select-content">
                    <div className="floor-select-guide">
                        <div>
                            <h2>記録する利用者の階を選択</h2>

                            <p>
                                階を選ぶと、その階の見取り図を表示します。
                                見取り図から居室と利用者を選択できます。
                            </p>
                        </div>

                        <div className="floor-select-step">
                            <span>STEP 1</span>
                            <strong>階を選択</strong>
                        </div>
                    </div>

                    <div className="floor-select-section-heading">
                        <h2>フロア</h2>

                        <p>利用者がいる階をタップしてください</p>
                    </div>

                    <div className="floor-select-grid">
                        <button
                            type="button"
                            className="floor-card"
                            onClick={() => handleFloorSelect(1)}
                        >
                            <div className="floor-card__copy">
                                <div className="floor-card__number">
                                    <strong>1F</strong>
                                    <span>1階</span>
                                </div>

                                <h3>1階の利用者を選択</h3>

                                <p>
                                    1階の見取り図を表示し、居室から利用者を選択します。
                                </p>

                                <div className="floor-card__action">
                                    <span>1階の見取り図へ</span>
                                    <span className="floor-card__arrow">›</span>
                                </div>
                            </div>

                            <div
                                className="floor-card__visual"
                                aria-hidden="true"
                            >
                                <div className="floor-building">
                                    <span className="floor-building__window floor-building__window--left" />
                                    <span className="floor-building__window floor-building__window--right" />
                                </div>
                            </div>
                        </button>

                        <button
                            type="button"
                            className="floor-card floor-card--second"
                            onClick={() => handleFloorSelect(2)}
                        >
                            <div className="floor-card__copy">
                                <div className="floor-card__number">
                                    <strong>2F</strong>
                                    <span>2階</span>
                                </div>

                                <h3>2階の利用者を選択</h3>

                                <p>
                                    2階の見取り図を表示し、居室から利用者を選択します。
                                </p>

                                <div className="floor-card__action">
                                    <span>2階の見取り図へ</span>
                                    <span className="floor-card__arrow">›</span>
                                </div>
                            </div>

                            <div
                                className="floor-card__visual"
                                aria-hidden="true"
                            >
                                <div className="floor-building">
                                    <span className="floor-building__window floor-building__window--left" />
                                    <span className="floor-building__window floor-building__window--right" />
                                </div>
                            </div>
                        </button>
                    </div>
                </section>

                <footer className="floor-select-footer">
                    <span>Colorful Garden Kaizu Care Support System</span>
                    <span>
                        階を選択した後、見取り図から利用者を選びます。
                    </span>
                </footer>
            </div>
        </main>
    );
}

export default FloorSelectPage;
