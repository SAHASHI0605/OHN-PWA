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

import {
    healthService,
    type HealthResponse,
} from '../services/healthService';

function DashboardPage() {
    const navigate =
        useNavigate();

    const {
        user,
        logout,
    } = useAuth();

    const [
        apiStatus,
        setApiStatus,
    ] =
        useState<HealthResponse | null>(
            null,
        );

    const [
        errorMessage,
        setErrorMessage,
    ] = useState('');

    useEffect(() => {
        healthService
            .getStatus()
            .then((status) => {
                setApiStatus(
                    status,
                );
            })
            .catch((error) => {
                console.error(
                    error,
                );

                setErrorMessage(
                    'API接続エラー',
                );
            });
    }, []);

    const handleLogout = () => {
        logout();

        navigate(
            '/login',
            {
                replace: true,
            },
        );
    };

    return (
        <div>
            <h1>
                ダッシュボード
            </h1>

            <p>
                Ohana 管理システム
            </p>

            {user && (
                <div>
                    <p>
                        ログイン：
                        {user.name}
                    </p>

                    <p>
                        社員番号：
                        {
                            user.employeeNumber
                        }
                    </p>

                    <p>
                        権限：
                        {user.role}
                    </p>
                </div>
            )}

            {apiStatus && (
                <>
                    <p>
                        API Status:
                        {' '}
                        {
                            apiStatus.status
                        }
                    </p>

                    <p>
                        Message:
                        {' '}
                        {
                            apiStatus.message
                        }
                    </p>
                </>
            )}

            {errorMessage && (
                <p>
                    {errorMessage}
                </p>
            )}

            <button
                type="button"
                onClick={
                    handleLogout
                }
            >
                ログアウト
            </button>
        </div>
    );
}

export default DashboardPage;
