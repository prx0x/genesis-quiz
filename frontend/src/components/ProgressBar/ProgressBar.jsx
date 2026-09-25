import './ProgressBar.css';

export default function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div
      className="progress-bar"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`Progress ${current} of ${total}`}
    >
      <div className="progress-fill" style={{ width: `${pct}%` }} />
      <span className="progress-label">{current} / {total}</span>
    </div>
  );
}
