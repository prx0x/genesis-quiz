import { useState } from 'react';
import QuestionCard from '../QuestionCard/QuestionCard';
import Button from '../Button/Button';
import './QuestionPreview.css';

export default function QuestionPreview({ question, onClose }) {
  const [selected, setSelected] = useState([]);

  if (!question) return null;

  const publicQuestion = {
    id: question.id,
    questionText: question.questionText,
    type: question.type,
    options: question.options,
    marks: question.marks,
  };

  return (
    <div className="question-preview">
      <div className="preview-header">
        <h2>Participant preview</h2>
        <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
      </div>
      <p className="preview-note">
        This uses the same UI participants see. Preview does not submit an attempt.
        Correct answers are not shown here.
      </p>
      <QuestionCard
        question={publicQuestion}
        index={0}
        total={1}
        selectedAnswers={selected}
        onChange={setSelected}
      />
    </div>
  );
}
