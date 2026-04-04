import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './RegisterPage.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '', role: 'viewer', organisation: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role, form.organisation || 'default');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
        <h2 className="auth-title">VaultScreen</h2>
        <p className="auth-sub">Create your account</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={submit} className="auth-form">
          <div className="form-field">
            <label>Full Name</label>
            <input name="name" type="text" placeholder="Jane Smith"
              value={form.name} onChange={handle} required />
          </div>

          <div className="form-field">
            <label>Email</label>
            <input name="email" type="email" placeholder="jane@example.com"
              value={form.email} onChange={handle} required />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Password</label>
              <input name="password" type="password" placeholder="min. 6 chars"
                value={form.password} onChange={handle} required />
            </div>
            <div className="form-field">
              <label>Confirm Password</label>
              <input name="confirm" type="password" placeholder="repeat"
                value={form.confirm} onChange={handle} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Organisation</label>
              <input name="organisation" type="text" placeholder="my-org"
                value={form.organisation} onChange={handle} />
            </div>
            <div className="form-field">
              <label>Role</label>
              <select name="role" value={form.role} onChange={handle}>
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}