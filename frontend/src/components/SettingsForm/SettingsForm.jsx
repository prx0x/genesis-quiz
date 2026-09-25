import { useState } from 'react';
import Button from '../Button/Button';
import './SettingsForm.css';

function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
    </label>
  );
}

export default function SettingsForm({ initial, onSubmit, submitting }) {
  const [form, setForm] = useState(() => ({ ...initial }));
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setOk(false);
    try {
      await onSubmit({
        ...form,
        durationMinutes: Number(form.durationMinutes),
        totalQuestions: Number(form.totalQuestions),
        defaultMarks: Number(form.defaultMarks),
        defaultNegativeMarks: Number(form.defaultNegativeMarks),
      });
      setOk(true);
    } catch (err) {
      setError(err.message || 'Failed to save settings.');
    }
  };

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      {error ? <div className="alert alert-error">{error}</div> : null}
      {ok ? <div className="alert alert-info">Settings saved.</div> : null}

      <div className="form-group">
        <label htmlFor="title">Quiz title</label>
        <input id="title" value={form.title || ''} onChange={(e) => set('title', e.target.value)} required />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={form.description || ''}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="duration">Duration (minutes)</label>
          <input
            id="duration"
            type="number"
            min="1"
            value={form.durationMinutes ?? 30}
            onChange={(e) => set('durationMinutes', e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="totalQ">Total questions (synced from published)</label>
          <input
            id="totalQ"
            type="number"
            min="0"
            value={form.totalQuestions ?? 0}
            onChange={(e) => set('totalQuestions', e.target.value)}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="marks">Default marks</label>
          <input
            id="marks"
            type="number"
            min="0"
            step="0.25"
            value={form.defaultMarks ?? 1}
            onChange={(e) => set('defaultMarks', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="neg">Default negative marking</label>
          <input
            id="neg"
            type="number"
            min="0"
            step="0.25"
            value={form.defaultNegativeMarks ?? 0}
            onChange={(e) => set('defaultNegativeMarks', e.target.value)}
          />
        </div>
      </div>

      <Toggle label="Allow navigation" checked={!!form.allowNavigation} onChange={(v) => set('allowNavigation', v)} />
      <Toggle label="Randomize questions" checked={!!form.randomizeQuestions} onChange={(v) => set('randomizeQuestions', v)} />
      <Toggle label="Randomize options" checked={!!form.randomizeOptions} onChange={(v) => set('randomizeOptions', v)} />
      <Toggle label="Show results" checked={!!form.showResults} onChange={(v) => set('showResults', v)} />
      <Toggle label="Show correct answers" checked={!!form.showCorrectAnswers} onChange={(v) => set('showCorrectAnswers', v)} />
      <Toggle label="Allow retry" checked={!!form.allowRetry} onChange={(v) => set('allowRetry', v)} />
      <Toggle label="Quiz active" checked={form.isActive !== false} onChange={(v) => set('isActive', v)} />

      <div className="actions-row" style={{ marginTop: '1.25rem' }}>
        <Button type="submit" variant="primary" loading={submitting}>
          Save settings
        </Button>
      </div>
    </form>
  );
}
