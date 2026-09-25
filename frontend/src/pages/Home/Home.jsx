import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Logo from '../../components/Logo/Logo';
import Button from '../../components/Button/Button';
import GeometricDecoration from '../../components/GeometricDecoration/GeometricDecoration';
import LoadingState from '../../components/LoadingState/LoadingState';
import { useAuth } from '../../context/AuthContext';
import api, { getGoogleLoginUrl } from '../../services/api';
import './Home.css';

export default function Home() {
  const { isAuthenticated, user, authError, clearAuthError, logout } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/api/quiz/config');
        if (!cancelled) setConfig(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load quiz configuration.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app-shell">
      <Header />
      <main className="main-content home-page">
        <GeometricDecoration variant="hero" />
        <div className="container home-hero page">
          <div className="hero-logo">
            <Logo size="lg" />
          </div>

          <p className="hero-eyebrow">GDG · IIIT Kota</p>
          <h1 className="hero-title">
            <span className="hero-genesis">GENESIS</span>
            <span className="hero-version">4.0</span>
          </h1>
          <h2 className="hero-quiz">QUIZ</h2>
          <p className="hero-desc">
            {config?.description || 'An event quiz for GENESIS 4.0.'}
          </p>

          {authError ? (
            <div className="alert alert-error" role="alert">
              {authError}
              <button type="button" className="alert-dismiss" onClick={clearAuthError} aria-label="Dismiss">
                ×
              </button>
            </div>
          ) : null}

          {error ? <div className="alert alert-error">{error}</div> : null}

          {loading ? (
            <LoadingState message="Loading event info…" />
          ) : (
            <div className="hero-stats">
              <div className="stat-block">
                <div className="label">Event</div>
                <div className="value small">{config?.title || 'GENESIS 4.0'}</div>
              </div>
              <div className="stat-block">
                <div className="label">Questions</div>
                <div className="value">{config?.totalQuestions ?? '—'}</div>
              </div>
              <div className="stat-block">
                <div className="label">Duration</div>
                <div className="value">{config?.durationMinutes ?? '—'}<span className="unit">min</span></div>
              </div>
            </div>
          )}

          <div className="hero-actions">
            <Button variant="secondary" size="lg" onClick={() => navigate('/instructions')}>
              View rules
            </Button>

            {isAuthenticated ? (
              <>
                <div className="hero-user">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt="" width={48} height={48} />
                  ) : null}
                  <div>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                </div>
                <Button variant="accent" size="lg" onClick={() => navigate('/instructions')}>
                  Start quiz
                </Button>
                <Button variant="secondary" size="lg" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="primary" size="lg" href={getGoogleLoginUrl()}>
                Login with Google
              </Button>
            )}
          </div>

          <p className="hero-domain-note">
            Only <strong>@{/* */}iiitkota.ac.in</strong> Google accounts may participate.
          </p>

          <p className="hero-admin-link">
            <Link to="/admin/login">Admin login</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
