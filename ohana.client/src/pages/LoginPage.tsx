import { useNavigate } from 'react-router-dom';
import { loginAsync } from '../auth/authService';
import { useAuth } from '../auth/useAuth';

export const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const result = await loginAsync({
                userId: 'test',
                password: 'password',
            });

            login(result.token);

            navigate('/');
        } catch {
            alert('ログインに失敗しました');
        }
    };

    return (
        <div style={{ padding: '30px' }}>
            <h2>ログイン</h2>

            <button onClick={handleLogin}>
                テストログイン
            </button>
        </div>
    );
};
