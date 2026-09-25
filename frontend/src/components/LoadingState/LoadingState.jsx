import './LoadingState.css';

export default function LoadingState({ message = 'Loading…' }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-geo" aria-hidden="true">
        <span className="loading-sq red" />
        <span className="loading-circ blue" />
        <span className="loading-sq yellow" />
      </div>
      <p>{message}</p>
    </div>
  );
}
