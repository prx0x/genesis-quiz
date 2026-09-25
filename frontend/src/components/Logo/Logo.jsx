import './Logo.css';

export default function Logo({ size = 'md', showText = true }) {
  return (
    <div className={`gdg-logo gdg-logo-${size}`} aria-label="Google Developer Groups IIIT Kota">
      <img
        src="/gdg-logo.svg"
        alt="Google Developer Groups IIIT Kota"
        className="gdg-logo-img"
        width={size === 'sm' ? 160 : size === 'lg' ? 280 : 220}
        height={size === 'sm' ? 36 : size === 'lg' ? 64 : 50}
      />
      {showText ? null : null}
    </div>
  );
}
