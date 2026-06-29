import { useEffect, useState } from 'react';
import './App.css';
import { healthService } from './services/healthService';

function App() {
  const [apiStatus, setApiStatus] = useState<string>('確認中...');

  useEffect(() => {
    healthService
      .getStatus()
      .then((status) => setApiStatus(status))
      .catch(() => setApiStatus('API接続エラー'));
  }, []);

  return (
    <>
      <h1>Ohana</h1>
      <p>API Status: {apiStatus}</p>
    </>
  );
}

export default App;
