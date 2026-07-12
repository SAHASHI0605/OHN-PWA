import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAsync } from '../auth/authService';
import { useAuth } from '../auth/useAuth';
import {
    getLoginStaffOptionsAsync,
    type StaffOption,
} from '../services/staffService';
import kaizuLogo from '../assets/kaizu-logo.png';

const weekdays = [
    '日',
    '月',
    '火',
    '水',
    '木',
    '金',
    '土',
];

const formatDateTime = (
    date: Date
): string => {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
        date.getDate()
    ).padStart(2, '0');

    const weekday =
        weekdays[date.getDay()];

    const hour = String(
        date.getHours()
    ).padStart(2, '0');

    const minute = String(
        date.getMinutes()
    ).padStart(2, '0');

    return `${year}/${month}/${day}(${weekday}) ${hour}:${minute}`;
};

export const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [staffOptions, setStaffOptions] =
        useState<StaffOption[]>([]);

    const [employeeNumber, setEmployeeNumber] =
        useState('');

    const [isStaffLoading, setIsStaffLoading] =
        useState(true);

    const [staffLoadError, setStaffLoadError] =
        useState('');

    const [
        logoutMessage,
        setLogoutMessage,
    ] = useState('');

    const [password, setPassword] = useState('');
    const [rememberStaff, setRememberStaff] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState(new Date());

    useEffect(() => {
        const loadStaffOptions = async () => {
            setIsStaffLoading(true);
            setStaffLoadError('');

            try {
                const options =
                    await getLoginStaffOptionsAsync();

                setStaffOptions(options);

                if (options.length === 0) {
                    setEmployeeNumber('');
                    setStaffLoadError(
                        'ログイン可能な担当者が登録されていません。'
                    );
                    return;
                }

                const lastEmployeeNumber =
                    localStorage.getItem(
                        'last_employee_number'
                    );

                const rememberedStaffExists =
                    options.some(
                        (staff) =>
                            staff.employeeNumber ===
                            lastEmployeeNumber
                    );

                if (
                    lastEmployeeNumber &&
                    rememberedStaffExists
                ) {
                    setEmployeeNumber(
                        lastEmployeeNumber
                    );
                } else {
                    setEmployeeNumber(
                        options[0].employeeNumber
                    );
                }
            } catch {
                setStaffOptions([]);
                setEmployeeNumber('');
                setStaffLoadError(
                    '担当者一覧を取得できませんでした。'
                );
            } finally {
                setIsStaffLoading(false);
            }
        };

        void loadStaffOptions();
    }, []);

    useEffect(() => {
        const timerId = window.setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);

        return () => {
            window.clearInterval(timerId);
        };
    }, []);

    useEffect(() => {
        const message =
            sessionStorage.getItem(
                'logout_message'
            );

        if (!message) {
            return;
        }

        setLogoutMessage(message);

        sessionStorage.removeItem(
            'logout_message'
        );
    }, []);

    const handleLogin = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setErrorMessage('');

        if (!employeeNumber) {
            setErrorMessage(
                '担当者を選択してください。'
            );
            return;
        }

        if (!password.trim()) {
            setErrorMessage(
                'パスワードを入力してください。'
            );
            return;
        }

        setIsLoading(true);

        try {
            const result = await loginAsync({
                employeeNumber,
                password,
            });

            login(
                result.token,
                {
                    employeeName:
                        result.employeeName,

                    role:
                        result.role,
                }
            );

            if (rememberStaff) {
                localStorage.setItem(
                    'last_employee_number',
                    employeeNumber
                );
            } else {
                localStorage.removeItem(
                    'last_employee_number'
                );
            }

            navigate('/menu', {
                replace: true,
            });
        } catch {
            setErrorMessage(
                '担当者またはパスワードが違います。'
            );
        } finally {
            setIsLoading(false);
        }

    };

    return (
        <div className="login-page">
            <div className="login-shell">
                <div className="login-clock">
                    {formatDateTime(currentDateTime)}
                </div>

                <section className="login-hero">
                    <div>
                        <div className="login-logo-box">
                            <img src={kaizuLogo} alt="からふる庭園海津 ロゴ" />
                        </div>

                        <div className="login-headline">
                            <span className="login-tag">介護活動支援システム</span>
                            <h1>
                                からふる庭園海津
                                <br />
                                ログインポータル
                            </h1>
                            <p>
                                記録、定期巡回、デイリー、データ分析、チャットをひとつの入口に集約した、
                                施設スタッフ向けの業務画面です。
                            </p>
                        </div>

                        <div className="login-feature-grid">
                            <div className="login-feature">
                                <div className="login-feature-icon">📝</div>
                                <h3>記録業務を集約</h3>
                                <p>バイタル、食事、入浴、共有メモを同じ流れで入力。</p>
                            </div>

                            <div className="login-feature">
                                <div className="login-feature-icon">📊</div>
                                <h3>状況を見える化</h3>
                                <p>日々の情報を一覧化し、確認漏れを減らします。</p>
                            </div>

                            <div className="login-feature">
                                <div className="login-feature-icon">💬</div>
                                <h3>共有を滑らかに</h3>
                                <p>スタッフ間の連携を、紙の引き継ぎから画面中心へ。</p>
                            </div>
                        </div>
                    </div>

                    <div className="login-sub-footer">
                        Colorful Garden Kaizu Care Support System
                    </div>
                </section>

                <section className="login-pane">
                    <form className="login-card" onSubmit={handleLogin}>
                        <div className="login-card-header">
                            <div className="login-mini">SIGN IN</div>
                            <h2>ログイン</h2>
                            <p>担当者を選択し、パスワードを入力してください。</p>
                        </div>

                        <div className="login-form-group">
                            <label htmlFor="staff">
                                担当者
                            </label>

                            <select
                                id="staff"
                                className="login-select"
                                value={employeeNumber}
                                onChange={(event) =>
                                    setEmployeeNumber(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    isStaffLoading ||
                                    staffOptions.length === 0
                                }
                            >
                                {isStaffLoading && (
                                    <option value="">
                                        担当者を読み込み中...
                                    </option>
                                )}

                                {!isStaffLoading &&
                                    staffOptions.length === 0 && (
                                        <option value="">
                                            担当者が登録されていません
                                        </option>
                                    )}

                                {!isStaffLoading &&
                                    staffOptions.map((staff) => (
                                        <option
                                            key={staff.employeeNumber}
                                            value={staff.employeeNumber}
                                        >
                                            {staff.name}
                                        </option>
                                    ))}
                            </select>

                            {staffLoadError && (
                                <div className="login-error">
                                    {staffLoadError}
                                </div>
                            )}
                        </div>

                        <div className="login-form-group">
                            <label htmlFor="password">パスワード</label>
                            <input
                                id="password"
                                className="login-input"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="login-row">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={rememberStaff}
                                    onChange={(e) => setRememberStaff(e.target.checked)}
                                />
                                次回から担当者を記憶
                            </label>
                            <span>Caps Lock に注意</span>
                        </div>

                        {logoutMessage && (
                            <div
                                className="login-logout-message"
                                role="status"
                            >
                                {logoutMessage}
                            </div>
                        )}

                        {errorMessage && (
                            <div className="login-error">
                                {errorMessage}
                            </div>
                        )}

                        <button
                            className="login-button"
                            type="submit"
                            disabled={
                                isLoading ||
                                isStaffLoading ||
                                !employeeNumber
                            }
                        >
                            {isLoading ? 'ログイン中...' : 'ログイン'}
                        </button>

                        <div className="login-button-sub">
                            <button type="button" className="login-ghost">
                                パスワード再確認
                            </button>
                            <button type="button" className="login-ghost">
                                お知らせ
                            </button>
                        </div>

                        <div className="login-system-note">
                            ログイン後は、記録、定期巡回、デイリー、データ分析、チャットの各メニューへ移動します。
                            <br />
                            共用端末では、利用後に必ずログアウトしてください。
                        </div>
                    </form>
                </section>
            </div>
        </div>
    );
};
