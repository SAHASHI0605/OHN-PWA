import { useState } from 'react';
import { getHealthAsync, type HealthResponse } from '../services/healthService';

export const HomePage = () => {
    const [health, setHealth] = useState<HealthResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const handleCheckApi = async () => {
        try {
            setLoading(true);

            const result = await getHealthAsync();
            setHealth(result);
        } catch (error) {
            console.error(error);
            alert('APIとの通信に失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>ホーム</h1>

            <button onClick={handleCheckApi} disabled={loading}>
                {loading ? '確認中...' : 'API確認'}
            </button>

            {health && (
                <div style={{ marginTop: '20px' }}>
                    <p>
                        <strong>状態：</strong>
                        {health.status}
                    </p>
                    <p>
                        <strong>メッセージ：</strong>
                        {health.message}
                    </p>
                </div>
            )}
        </div>
    );
};
