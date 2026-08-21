import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('Ram');
  const [password, setPassword] = useState('1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      // Let the protected route handle redirecting to dashboard vs assessment
      navigate('/student/dashboard');
    } catch (err: any) {
      setError(err.message || "Failed to login");
      setLoading(false);
    }
  };

  return (
    <div className="container flex-center" style={{ minHeight: '80vh' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '3rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: '64px', height: '64px', 
            borderRadius: '16px', 
            background: 'var(--primary)',
            boxShadow: '0 0 20px var(--primary-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <Sparkles size={32} color="white" />
          </div>
          <h2 style={{ margin: 0 }}>Student Login</h2>
          <p className="text-muted" style={{ margin: '0.5rem 0 0' }}>Welcome back to AI Teacher</p>
        </div>

        {error && (
          <div style={{ marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-panel"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-main)', fontSize: '1rem' }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-panel"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-main)', fontSize: '1rem' }}
              required
            />
          </div>

          <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--primary)', marginTop: '0.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              <strong>Demo Credentials:</strong><br />Username: Ram<br />Password: 1234
            </p>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '0.875rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
