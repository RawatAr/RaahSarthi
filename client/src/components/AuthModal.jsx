import { useState } from 'react';
import { X, User, Mail, Lock, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';

const API = 'http://localhost:5000/api/auth';

export default function AuthModal({ onClose, onAuth }) {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const endpoint = mode === 'login' ? '/login' : '/register';
            const body = mode === 'login' ? { email, password } : { name, email, password };
            const res = await fetch(`${API}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Something went wrong');
            localStorage.setItem('raahsarthi_token', data.token);
            localStorage.setItem('raahsarthi_user', JSON.stringify(data.user));
            onAuth(data.user);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-overlay" onClick={onClose}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <button className="auth-close" onClick={onClose}><X size={16} strokeWidth={2} /></button>

                <div className="auth-brand">
                    <div className="auth-brand-icon" />
                    <div>
                        <div className="auth-title">
                            {mode === 'login' ? 'Welcome back' : 'Create account'}
                        </div>
                        <div className="auth-subtitle">
                            {mode === 'login' ? 'Sign in to sync your saved routes' : 'Save routes across devices'}
                        </div>
                    </div>
                </div>

                <div className="auth-tabs">
                    <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); }}>
                        <LogIn size={13} strokeWidth={2} /> Sign In
                    </button>
                    <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(''); }}>
                        <UserPlus size={13} strokeWidth={2} /> Sign Up
                    </button>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <div className="auth-field">
                            <User size={14} strokeWidth={2} className="auth-field-icon" />
                            <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
                        </div>
                    )}
                    <div className="auth-field">
                        <Mail size={14} strokeWidth={2} className="auth-field-icon" />
                        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                    </div>
                    <div className="auth-field">
                        <Lock size={14} strokeWidth={2} className="auth-field-icon" />
                        <input
                            type={showPass ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        />
                        <button type="button" className="auth-eye" onClick={() => setShowPass(!showPass)}>
                            {showPass ? <EyeOff size={13} strokeWidth={2} /> : <Eye size={13} strokeWidth={2} />}
                        </button>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                        {loading ? (
                            <span className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} />
                        ) : mode === 'login' ? (
                            <><LogIn size={14} strokeWidth={2} /> Sign In</>
                        ) : (
                            <><UserPlus size={14} strokeWidth={2} /> Create Account</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
