import './AnswerOption.css';

export default function AnswerOption({
  option,
  selected = false,
  multi = false,
  disabled = false,
  onToggle,
  name = 'answer',
}) {
  const inputType = multi ? 'checkbox' : 'radio';
  const id = `opt-${name}-${option.id}`;

  return (
    <label
      htmlFor={id}
      className={`answer-option ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
    >
      <input
        id={id}
        type={inputType}
        name={name}
        value={option.id}
        checked={selected}
        disabled={disabled}
        onChange={() => onToggle?.(option.id)}
      />
      <span className="answer-marker" aria-hidden="true">
        {multi ? (selected ? '☑' : '☐') : selected ? '●' : '○'}
      </span>
      <span className="answer-id">{String(option.id).toUpperCase()}</span>
      <span className="answer-text">{option.text}</span>
    </label>
  );
}
