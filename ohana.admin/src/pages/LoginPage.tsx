import {
    useState,
} from 'react';

import {
    useNavigate,
} from 'react-router-dom';

import {
    loginAsync,
} from '../auth/authService';

import {
    useAuth,
} from '../auth/useAuth';

import {
    getRoleFromToken,
} from '../auth/jwtUtils';

import {
    isAdminRole,
} from '../auth/adminRole';

export function LoginPage() {
    const navigate =
        useNavigate();

    const {
        login,
    } = useAuth();

    const [
        employeeNumber,
        setEmployeeNumber,
    ] = useState('');

    const [
        password,
        setPassword,
    ] = useState('');

    const [
        errorMessage,
        setErrorMessage,
    ] = useState('');

    const [
        isLoading,
        setIsLoading,
    ] = useState(false);

    const handleSubmit = async (
        event:
            React.FormEvent<HTMLFormElement>,
    ) => {
        event.preventDefault();

        setErrorMessage('');

        if (!employeeNumber.trim()) {
            setErrorMessage(
                '社員番号を入力してください。',
            );

            return;
        }

        if (!password.trim()) {
            setErrorMessage(
                'パスワードを入力してください。',
            );

            return;
        }

        setIsLoading(true);

        try {
            const result =
                await loginAsync({
                    employeeNumber:
                        employeeNumber.trim(),

                    password,
                });

            const role =
                getRoleFromToken(
                    result.token,
                );

            console.log(
                'JWT role:',
                role,
            );

            console.log(
                'isAdminRole:',
                isAdminRole(role),
            );

            console.log(
                'JWT role:',
                role,
            );

            console.log(
                'isAdminRole:',
                isAdminRole(role),
            );

            if (
                !isAdminRole(role)
            ) {
                setErrorMessage(
                    '管理者権限がありません。',
                );

                return;
            }

            login(
                result.token,
            );

            navigate(
                '/dashboard',
                {
                    replace: true,
                },
            );
        }
        catch (error) {
            console.error(error);

            setErrorMessage(
                '社員番号またはパスワードが違います。',
            );
        }
        finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h1>
                Ohana 管理システム
            </h1>

            <h2>
                ログイン
            </h2>

            <form
                onSubmit={
                    handleSubmit
                }
            >
                <div>
                    <label
                        htmlFor="employeeNumber"
                    >
                        社員番号
                    </label>

                    <input
                        id="employeeNumber"
                        type="text"
                        value={
                            employeeNumber
                        }
                        onChange={(
                            event,
                        ) =>
                            setEmployeeNumber(
                                event
                                    .target
                                    .value,
                            )
                        }
                        autoComplete="username"
                    />
                </div>

                <div>
                    <label
                        htmlFor="password"
                    >
                        パスワード
                    </label>

                    <input
                        id="password"
                        type="password"
                        value={
                            password
                        }
                        onChange={(
                            event,
                        ) =>
                            setPassword(
                                event
                                    .target
                                    .value,
                            )
                        }
                        autoComplete="current-password"
                    />
                </div>

                {errorMessage && (
                    <p>
                        {errorMessage}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={
                        isLoading
                    }
                >
                    {isLoading
                        ? 'ログイン中...'
                        : 'ログイン'}
                </button>
            </form>
        </div>
    );
}
