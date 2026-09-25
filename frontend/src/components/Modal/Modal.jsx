import { useEffect } from 'react';
import Button from '../Button/Button';
import './Modal.css';

export default function Modal({
  open,
  title,
  children,
  onClose,
  primaryLabel,
  onPrimary,
  secondaryLabel = 'Cancel',
  primaryVariant = 'primary',
  primaryLoading = false,
  danger = false,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`modal ${danger ? 'modal-danger' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title">{title}</h2>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            {secondaryLabel}
          </Button>
          {primaryLabel ? (
            <Button
              variant={primaryVariant}
              onClick={onPrimary}
              loading={primaryLoading}
            >
              {primaryLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
