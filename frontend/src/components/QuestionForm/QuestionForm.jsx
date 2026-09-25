import { useState } from 'react';
import Button from '../Button/Button';
import './QuestionForm.css';

const EMPTY = {
  questionText: '',
  type: 'single_choice',
  options: [
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' },
  ],
  correctAnswers: [],
  explanation: '',
  marks: 1,
  negativeMarks: 0.25,
  order: 0,
  status: 'draft',
};

function normalizeInitial(initial) {
  if (!initial) return { ...EMPTY, options: EMPTY.options.map((o) => ({ ...o })) };
  const base = {
    ...EMPTY,
    ...initial,
    options: (initial.options || EMPTY.options).map((o) => ({ ...o })),
    correctAnswers: [...(initial.correctAnswers || [])],
  };
  if (base.type === 'true_false') {
    base.options = [
      { id: 'true', text: 'TRUE' },
      { id: 'false', text: 'FALSE' },
    ];
  }
  return base;
}

export default function QuestionForm({ initial, onSubmit, submitting }) {
  const [form, setForm] = useState(() => normalizeInitial(initial));
  const [error, setError] = useState('');

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onTypeChange = (type) => {
    if (type === 'true_false') {
      setForm((f) => ({
        ...f,
        type,
        options: [
          { id: 'true', text: 'TRUE' },
          { id: 'false', text: 'FALSE' },
        ],
        correctAnswers: [],
      }));
    } else {
      setForm((f) => ({
        ...f,
        type,
        options:
          f.type === 'true_false'
            ? [
                { id: 'A', text: '' },
                { id: 'B', text: '' },
                { id: 'C', text: '' },
                { id: 'D', text: '' },
              ]
            : f.options,
        correctAnswers: [],
      }));
    }
  };

  const updateOption = (idx, text) => {
    setForm((f) => {
      const options = f.options.map((o, i) => (i === idx ? { ...o, text } : o));
      return { ...f, options };
    });
  };

  const addOption = () => {
    setForm((f) => {
      const nextId = String.fromCharCode(65 + f.options.length);
      return { ...f, options: [...f.options, { id: nextId, text: '' }] };
    });
  };

  const removeOption = (idx) => {
    setForm((f) => {
      const removed = f.options[idx];
      const options = f.options.filter((_, i) => i !== idx);
      return {
        ...f,
        options,
        correctAnswers: f.correctAnswers.filter((c) => c !== removed.id),
      };
    });
  };

  const toggleCorrect = (id) => {
    setForm((f) => {
      if (f.type === 'multiple_choice') {
        const set = new Set(f.correctAnswers);
        if (set.has(id)) set.delete(id);
        else set.add(id);
        return { ...f, correctAnswers: [...set] };
      }
      return { ...f, correctAnswers: [id] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await onSubmit({
        ...form,
        marks: Number(form.marks),
        negativeMarks: Number(form.negativeMarks),
        order: Number(form.order) || 0,
      });
    } catch (err) {
      setError(err.message || 'Failed to save question.');
    }
  };

  return (
    <form className="question-form" onSubmit={handleSubmit}>
      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="form-group">
        <label htmlFor="questionText">Question text</label>
        <textarea
          id="questionText"
          value={form.questionText}
          onChange={(e) => setField('questionText', e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="type">Question type</label>
          <select
            id="type"
            value={form.type}
            onChange={(e) => onTypeChange(e.target.value)}
          >
            <option value="single_choice">Single Choice</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True / False</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={form.status}
            onChange={(e) => setField('status', e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      <fieldset className="options-fieldset">
        <legend>Options &amp; correct answers</legend>
        {form.options.map((opt, idx) => (
          <div key={opt.id} className="option-row">
            <label className="correct-check">
              <input
                type={form.type === 'multiple_choice' ? 'checkbox' : 'radio'}
                name="correct"
                checked={form.correctAnswers.includes(opt.id)}
                onChange={() => toggleCorrect(opt.id)}
              />
              <span className="sr-only">Mark {opt.id} as correct</span>
              <strong>{String(opt.id).toUpperCase()}</strong>
            </label>
            <input
              type="text"
              value={opt.text}
              onChange={(e) => updateOption(idx, e.target.value)}
              disabled={form.type === 'true_false'}
              required
              aria-label={`Option ${opt.id} text`}
            />
            {form.type !== 'true_false' && form.options.length > 2 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeOption(idx)}>
                Remove
              </Button>
            ) : null}
          </div>
        ))}
        {form.type !== 'true_false' ? (
          <Button type="button" variant="secondary" size="sm" onClick={addOption}>
            + Add option
          </Button>
        ) : null}
      </fieldset>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="marks">Marks</label>
          <input
            id="marks"
            type="number"
            min="0"
            step="0.25"
            value={form.marks}
            onChange={(e) => setField('marks', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="negativeMarks">Negative marks</label>
          <input
            id="negativeMarks"
            type="number"
            min="0"
            step="0.25"
            value={form.negativeMarks}
            onChange={(e) => setField('negativeMarks', e.target.value)}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="order">Order</label>
          <input
            id="order"
            type="number"
            min="0"
            value={form.order}
            onChange={(e) => setField('order', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="explanation">Explanation</label>
          <input
            id="explanation"
            type="text"
            value={form.explanation}
            onChange={(e) => setField('explanation', e.target.value)}
          />
        </div>
      </div>

      <div className="actions-row">
        <Button type="submit" variant="primary" loading={submitting}>
          Save question
        </Button>
      </div>
    </form>
  );
}
