import Logo from '../Logo/Logo';
import './AdminHeader.css';

export default function AdminHeader({ title, subtitle }) {
  return (
    <div className="admin-header">
      <div>
        <p className="page-subtitle">{subtitle || 'GENESIS 4.0 · Admin Panel'}</p>
        <h1 className="page-title">{title}</h1>
      </div>
      <Logo size="sm" />
    </div>
  );
}
