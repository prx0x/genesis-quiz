import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo/Logo';
import Button from '../../components/Button/Button';
import GeometricDecoration from '../../components/GeometricDecoration/GeometricDecoration';
import { useAuth } from '../../context/AuthContext';
import './AdminLogin.css';

export default function AdminLogin() {
  const { adminLogin, isAdmin, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authLoading && isAuthenticated && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(username, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <GeometricDecoration variant="corner" />
      <div className="admin-login-card page">
        <Logo size="md" />
        <p className="page-subtitle">GENESIS 4.0</p>
        <h1 className="page-title">ADMIN LOGIN</h1>
        <p className="login-note">
          Admin access is separate from participant Google login and must be explicitly authorized.
        </p>

        {error ? <div className="alert alert-error">{error}</div> : null}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="primary" className="btn-block" loading={loading}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
