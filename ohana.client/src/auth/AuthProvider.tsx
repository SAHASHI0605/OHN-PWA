import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    AuthContext,
    type AuthUser,
} from './AuthContext';

import {
    AUTH_EXPIRED_EVENT,
} from './authEvents';

type Props = {
    children: React.ReactNode;
};

/*
 * 自動ログアウトまでの時間
 *
 * 15分 × 60秒 × 1000ミリ秒
 */
const AUTO_LOGOUT_TIME =
    15 * 60 * 1000;

/*
 * 最終操作日時を保存するキー
 */
const LAST_ACTIVITY_KEY =
    'last_activity_time';

/*
 * 保存されているログインユーザーを取得します。
 */
const getStoredUser = (): AuthUser | null => {
    const storedUser =
        localStorage.getItem('auth_user');

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(
            storedUser
        ) as AuthUser;
    } catch {
        localStorage.removeItem(
            'auth_user'
        );

        return null;
    }
};

export const AuthProvider = ({
    children,
}: Props) => {
    const [token, setToken] =
        useState<string | null>(() => {
            return localStorage.getItem(
                'access_token'
            );
        });

    const [user, setUser] =
        useState<AuthUser | null>(() => {
            return getStoredUser();
        });

    /*
     * 自動ログアウト用タイマーを保持します。
     */
    const logoutTimerRef =
        useRef<number | null>(null);

    /*
     * ログアウト処理
     */
    const logout = useCallback(() => {
        localStorage.removeItem(
            'access_token'
        );

        localStorage.removeItem(
            'auth_user'
        );

        localStorage.removeItem(
            LAST_ACTIVITY_KEY
        );

        setToken(null);
        setUser(null);
    }, []);

    /*
     * ログイン処理
     */
    const login = useCallback(
        (
            newToken: string,
            newUser: AuthUser
        ) => {
            localStorage.setItem(
                'access_token',
                newToken
            );

            localStorage.setItem(
                'auth_user',
                JSON.stringify(newUser)
            );

            localStorage.setItem(
                LAST_ACTIVITY_KEY,
                Date.now().toString()
            );

            setToken(newToken);
            setUser(newUser);
        },
        []
    );

    /*
 * JWT期限切れイベントを監視します。
 */
    useEffect(() => {
        const handleAuthExpired = () => {
            logout();
        };

        window.addEventListener(
            AUTH_EXPIRED_EVENT,
            handleAuthExpired
        );

        return () => {
            window.removeEventListener(
                AUTH_EXPIRED_EVENT,
                handleAuthExpired
            );
        };
    }, [logout]);

    useEffect(() => {
        /*
         * 未ログインの場合は、
         * 操作監視を開始しません。
         */
        if (!token) {
            if (
                logoutTimerRef.current !==
                null
            ) {
                window.clearTimeout(
                    logoutTimerRef.current
                );

                logoutTimerRef.current =
                    null;
            }

            return;
        }

        /*
         * ログアウトタイマーを開始します。
         */
        const startLogoutTimer = (
            remainingTime:
                number = AUTO_LOGOUT_TIME
        ) => {
            if (
                logoutTimerRef.current !==
                null
            ) {
                window.clearTimeout(
                    logoutTimerRef.current
                );
            }

            logoutTimerRef.current =
                window.setTimeout(() => {
                    /*
                     * 自動ログアウトであることを
                     * ログイン画面へ伝えます。
                     */
                    sessionStorage.setItem(
                        'logout_message',
                        '一定時間操作がなかったため、自動的にログアウトしました。'
                    );

                    logout();
                }, remainingTime);
        };

        /*
         * ユーザー操作を検知したときの処理です。
         */
        const handleActivity = () => {
            const now = Date.now();

            localStorage.setItem(
                LAST_ACTIVITY_KEY,
                now.toString()
            );

            startLogoutTimer();
        };

        /*
         * 画面を再読み込みした場合でも、
         * 最後の操作時刻から経過時間を計算します。
         */
        const storedLastActivity =
            localStorage.getItem(
                LAST_ACTIVITY_KEY
            );

        if (storedLastActivity) {
            const lastActivity =
                Number(storedLastActivity);

            const elapsedTime =
                Date.now() - lastActivity;

            const remainingTime =
                AUTO_LOGOUT_TIME -
                elapsedTime;

            if (remainingTime <= 0) {
                startLogoutTimer(0);
                return;
            }

            startLogoutTimer(
                remainingTime
            );
        } else {
            handleActivity();
        }

        /*
         * 監視するユーザー操作
         */
        const activityEvents = [
            'pointerdown',
            'keydown',
            'touchstart',
            'scroll',
        ] as const;

        activityEvents.forEach(
            (eventName) => {
                window.addEventListener(
                    eventName,
                    handleActivity,
                    {
                        passive: true,
                    }
                );
            }
        );

        /*
         * コンポーネント破棄時に、
         * イベントとタイマーを解除します。
         */
        return () => {
            activityEvents.forEach(
                (eventName) => {
                    window.removeEventListener(
                        eventName,
                        handleActivity
                    );
                }
            );

            if (
                logoutTimerRef.current !==
                null
            ) {
                window.clearTimeout(
                    logoutTimerRef.current
                );

                logoutTimerRef.current =
                    null;
            }
        };
    }, [token, logout]);

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                isAuthenticated:
                    Boolean(token),
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
