import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const res = await api.post(endpoint, form);
      login(res.data.token, res.data.user);
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 52, height: 52, background: 'var(--accent)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 26 }}>⚡</div>
          <h1 style={{ fontSize: 28 }}>TaskFlow</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>Team task management, simplified</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 8, padding: 4, marginBottom: 24 }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px', borderRadius: 6, textTransform: 'capitalize',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? 'white' : 'var(--text-muted)',
                fontWeight: mode === m ? 600 : 400,
              }}>{m === 'login' ? 'Sign In' : 'Sign Up'}</button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'signup' && (
              <div className="form-group">
                <label>Full Name</label>
                <input placeholder="John Doe" value={form.name} onChange={e => update('name', e.target.value)} required />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => update('password', e.target.value)} required />
            </div>
            {mode === 'signup' && (
              <div className="form-group">
                <label>Account Role</label>
                <select value={form.role} onChange={e => update('role', e.target.value)}>
                  <option value="member">Member — Can view and update tasks</option>
                  <option value="admin">Admin — Can create projects & tasks</option>
                </select>
              </div>
            )}
            <button className="btn-primary w-full" type="submit" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
