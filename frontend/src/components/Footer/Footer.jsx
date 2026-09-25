import Logo from '../Logo/Logo';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <Logo size="sm" />
        <div className="footer-text">
          <strong>GENESIS 4.0</strong>
          <span>Organized by GDG IIIT Kota</span>
        </div>
        <div className="footer-geo" aria-hidden="true">
          <span className="geo-sq red" />
          <span className="geo-circ yellow" />
          <span className="geo-sq blue" />
        </div>
      </div>
    </footer>
  );
}
