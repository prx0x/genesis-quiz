import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  href,
  ...rest
}) {
  const classes = `btn btn-${variant} btn-${size} ${className}`.trim();
  const content = loading ? 'Loading…' : children;

  if (href && !disabled && !loading) {
    return (
      <a className={classes} href={href} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
}
