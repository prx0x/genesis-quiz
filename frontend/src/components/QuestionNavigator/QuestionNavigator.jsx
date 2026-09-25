import './QuestionNavigator.css';

export default function QuestionNavigator({
  questions = [],
  answers = {},
  currentIndex = 0,
  onSelect,
  allowNavigation = true,
}) {
  return (
    <nav className="question-navigator" aria-label="Question navigation">
      <p className="nav-legend">
        <span><span aria-hidden="true">●</span> Answered</span>
        <span><span aria-hidden="true">○</span> Unanswered</span>
        <span><span aria-hidden="true">→</span> Current</span>
      </p>
      <ul className="nav-list">
        {questions.map((q, i) => {
          const answered = Array.isArray(answers[q.id]) && answers[q.id].length > 0;
          const current = i === currentIndex;
          let symbol = answered ? '●' : '○';
          let statusLabel = answered ? 'answered' : 'unanswered';
          if (current) {
            symbol = '→';
            statusLabel = 'current';
          }

          return (
            <li key={q.id}>
              <button
                type="button"
                className={`nav-item ${current ? 'current' : ''} ${answered ? 'answered' : ''}`}
                onClick={() => allowNavigation && onSelect?.(i)}
                disabled={!allowNavigation}
                aria-current={current ? 'true' : undefined}
                aria-label={`Question ${i + 1}, ${statusLabel}`}
              >
                <span className="nav-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="nav-symbol" aria-hidden="true">{symbol}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
