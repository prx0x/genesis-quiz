import './Timer.css';

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export default function Timer({ remainingSeconds, warningThreshold = 60 }) {
  const warning = remainingSeconds <= warningThreshold;
  const critical = remainingSeconds <= 30;

  return (
    <div
      className={`timer ${warning ? 'timer-warning' : ''} ${critical ? 'timer-critical' : ''}`}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Time remaining ${formatTime(remainingSeconds)}`}
    >
      <span className="timer-label">Time</span>
      <span className="timer-value">{formatTime(remainingSeconds)}</span>
    </div>
  );
}
