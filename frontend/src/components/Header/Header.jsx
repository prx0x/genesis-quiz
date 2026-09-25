import { Link } from 'react-router-dom';
import Logo from '../Logo/Logo';
import Button from '../Button/Button';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

export default function Header({ variant = 'public' }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className={`site-header site-header-${variant}`}>
      <div className="container header-inner">
        <div className="header-brand">
          <Link to="/" className="header-logo-link" aria-label="Home">
            <Logo size="sm" />
          </Link>
          <div className="header-title-block" aria-hidden="true">
            <span className="header-event">GENESIS</span>
            <span className="header-version">4.0</span>
          </div>
        </div>

        <nav className="header-nav" aria-label="Primary">
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="header-user">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt="" className="header-avatar" width={32} height={32} />
                ) : (
                  <span className="header-avatar-fallback" aria-hidden="true">
                    {(user.name || user.email || '?')[0].toUpperCase()}
                  </span>
                )}
                <span className="header-username">{user.name}</span>
              </Link>
              <Button variant="secondary" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <Link to="/" className="header-link">
              Home
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
