import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Button from '../../components/Button/Button';
import { useAuth } from '../../context/AuthContext';
import './Profile.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <Header />
      <main className="main-content">
        <div className="container-narrow profile-page">
          <p className="page-subtitle">GENESIS 4.0</p>
          <h1 className="page-title">PROFILE</h1>

          <div className="profile-card">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt="" className="profile-avatar" width={80} height={80} />
            ) : (
              <div className="profile-avatar fallback" aria-hidden="true">
                {(user.name || '?')[0].toUpperCase()}
              </div>
            )}
            <div>
              <h2>{user.name}</h2>
              <p>{user.email}</p>
            </div>
          </div>

          <div className="actions-row">
            <Button variant="accent" onClick={() => navigate('/instructions')}>
              Quiz
            </Button>
            <Button variant="secondary" onClick={() => navigate('/result')}>
              My result
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                await logout();
                navigate('/');
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
