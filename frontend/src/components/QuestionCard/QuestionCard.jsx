import AnswerOption from '../AnswerOption/AnswerOption';
import './QuestionCard.css';

const TYPE_LABELS = {
  single_choice: 'Single Choice',
  multiple_choice: 'Multiple Choice',
  true_false: 'True / False',
};

export default function QuestionCard({
  question,
  index,
  total,
  selectedAnswers = [],
  onChange,
  disabled = false,
}) {
  if (!question) return null;

  const multi = question.type === 'multiple_choice';

  const toggle = (optionId) => {
    if (disabled) return;
    if (multi) {
      const set = new Set(selectedAnswers);
      if (set.has(optionId)) set.delete(optionId);
      else set.add(optionId);
      onChange?.([...set]);
    } else {
      onChange?.([optionId]);
    }
  };

  return (
    <article className="question-card">
      <div className="question-meta">
        <span className="question-number">
          Question {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <span className="badge">{TYPE_LABELS[question.type] || question.type}</span>
      </div>
      <h2 className="question-text">{question.questionText}</h2>
      <div className="question-options" role="group" aria-label="Answer options">
        {(question.options || []).map((opt) => (
          <AnswerOption
            key={opt.id}
            option={opt}
            multi={multi}
            selected={selectedAnswers.includes(opt.id)}
            disabled={disabled}
            onToggle={toggle}
            name={`q-${question.id}`}
          />
        ))}
      </div>
    </article>
  );
}
