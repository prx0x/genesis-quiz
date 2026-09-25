import Button from '../Button/Button';
import './ErrorState.css';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="error-state" role="alert">
      <div className="error-mark" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{message}</p>
      {actionLabel && onAction ? (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
