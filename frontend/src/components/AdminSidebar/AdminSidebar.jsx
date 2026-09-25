import { NavLink } from 'react-router-dom';
import Logo from '../Logo/Logo';
import { useAuth } from '../../context/AuthContext';
import Button from '../Button/Button';
import './AdminSidebar.css';

const LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/questions', label: 'Questions' },
  { to: '/admin/settings', label: 'Quiz Settings' },
  { to: '/admin/results', label: 'Results' },
];

export default function AdminSidebar() {
  const { logout } = useAuth();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <Logo size="sm" />
        <div className="admin-sidebar-title">
          <span>GENESIS 4.0</span>
          <strong>ADMIN</strong>
        </div>
      </div>
      <nav aria-label="Admin">
        <ul>
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="admin-sidebar-footer">
        <Button variant="secondary" size="sm" onClick={logout} className="btn-block">
          Logout
        </Button>
      </div>
    </aside>
  );
}
