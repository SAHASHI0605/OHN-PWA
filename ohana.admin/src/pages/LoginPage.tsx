import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAsync } from '../auth/authService';
import { useAuth } from '../auth/useAuth';
import { getRoleFromToken } from '../auth/jwtUtils';
import { isAdminRole } from '../auth/adminRole';
import kaizuLogo from '../assets/kaizu-logo.png';
import '../styles/AdminLoginPage.css';

export function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [employeeNumber, setEmployeeNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isLoading) return;
        setErrorMessage('');
        if (!employeeNumber.trim()) {
            setErrorMessage('社員番号を入力してください。');
            return;
        }
        if (!password.trim()) {
            setErrorMessage('パスワードを入力してください。');
            return;
        }
        setIsLoading(true);
        try {
            const result = await loginAsync({ employeeNumber: employeeNumber.trim(), password });
            if (!isAdminRole(getRoleFromToken(result.token))) {
                setErrorMessage('管理者権限がありません。');
                return;
            }
            login(result.token);
            navigate('/dashboard', { replace: true });
        } catch (error) {
            console.error(error);
            setErrorMessage('ログインできませんでした。社員番号・パスワードと通信状況をご確認ください。');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="admin-login-page">
            <div className="admin-login-shell">
                <section className="admin-login-brand" aria-labelledby="admin-brand-title">
                    <div className="admin-login-logo"><img src={kaizuLogo} alt="からふる庭園海津" /></div>
                    <div className="admin-login-intro">
                        <span className="admin-login-tag">介護活動支援システム</span>
                        <h1 id="admin-brand-title">日々のケアを支える、<br />施設運営の入口。</h1>
                        <p>からふる庭園海津の管理者向けポータルです。<br />管理者アカウントでログインしてください。</p>
                    </div>
                    <div className="admin-login-brand-note"><span aria-hidden="true" className="admin-login-mark">O</span><div><strong>Ohana 管理システム</strong><span>Colorful Garden Kaizu</span></div></div>
                    <div className="admin-login-brand-footer">Care Support System · Administrator Portal</div>
                </section>
                <section className="admin-login-pane" aria-labelledby="admin-login-title">
                    <form className="admin-login-card" onSubmit={handleSubmit} noValidate aria-busy={isLoading}>
                        <header className="admin-login-card-header">
                            <span className="admin-login-eyebrow">ADMINISTRATOR</span>
                            <h2 id="admin-login-title">管理者ログイン</h2>
                            <p>社員番号とパスワードを入力してください。</p>
                        </header>
                        <div className="admin-login-field">
                            <label htmlFor="employeeNumber">社員番号</label>
                            <input id="employeeNumber" name="username" type="text" value={employeeNumber} onChange={event => setEmployeeNumber(event.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="社員番号を入力" required disabled={isLoading} aria-describedby={errorMessage ? 'admin-login-error' : undefined} />
                        </div>
                        <div className="admin-login-field">
                            <label htmlFor="password">パスワード</label>
                            <div className="admin-login-password">
                                <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" placeholder="パスワードを入力" required disabled={isLoading} aria-describedby={errorMessage ? 'admin-login-error' : undefined} />
                                <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'} aria-pressed={showPassword} disabled={isLoading}>{showPassword ? '隠す' : '表示'}</button>
                            </div>
                        </div>
                        {errorMessage && <p id="admin-login-error" className="admin-login-error" role="alert">{errorMessage}</p>}
                        <button className="admin-login-submit" type="submit" disabled={isLoading}>{isLoading ? 'ログイン中…' : 'ログイン'}<span aria-hidden="true">→</span></button>
                        <div className="admin-login-note"><strong>管理者権限をお持ちの方のみご利用いただけます。</strong><p>共用端末では、利用後に必ずログアウトしてください。<br />ログイン情報が不明な場合は、システム担当者へご確認ください。</p></div>
                    </form>
                    <footer className="admin-login-pane-footer">Ohana · からふる庭園海津</footer>
                </section>
            </div>
        </main>
    );
}
