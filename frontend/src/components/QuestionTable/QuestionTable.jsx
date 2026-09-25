import Button from '../Button/Button';
import './QuestionTable.css';

const TYPE_SHORT = {
  single_choice: 'Single',
  multiple_choice: 'Multi',
  true_false: 'T/F',
};

export default function QuestionTable({
  questions = [],
  onEdit,
  onDuplicate,
  onPreview,
  onToggleStatus,
  onDelete,
  onMove,
}) {
  if (!questions.length) {
    return (
      <div className="empty-state">
        <h2>No questions yet.</h2>
        <p>Add your first question to build the GENESIS 4.0 quiz.</p>
        <Button variant="accent" href="/admin/questions/new">
          Add first question
        </Button>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Question</th>
            <th>Type</th>
            <th>Marks</th>
            <th>Status</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q, idx) => (
            <tr key={q.id}>
              <td>
                <div className="order-controls">
                  <button type="button" aria-label="Move up" onClick={() => onMove?.(idx, -1)} disabled={idx === 0}>
                    ↑
                  </button>
                  <span>{q.order || idx + 1}</span>
                  <button
                    type="button"
                    aria-label="Move down"
                    onClick={() => onMove?.(idx, 1)}
                    disabled={idx === questions.length - 1}
                  >
                    ↓
                  </button>
                </div>
              </td>
              <td className="q-text">{q.questionText}</td>
              <td>{TYPE_SHORT[q.type] || q.type}</td>
              <td>{q.marks}</td>
              <td>
                <span className={`badge ${q.status === 'published' ? 'badge-blue' : ''}`}>
                  {q.status}
                </span>
              </td>
              <td>{q.updatedAt ? new Date(q.updatedAt).toLocaleDateString() : '—'}</td>
              <td>
                <div className="row-actions">
                  <Button size="sm" variant="secondary" onClick={() => onEdit?.(q)}>Edit</Button>
                  <Button size="sm" variant="secondary" onClick={() => onDuplicate?.(q)}>Duplicate</Button>
                  <Button size="sm" variant="secondary" onClick={() => onPreview?.(q)}>Preview</Button>
                  <Button size="sm" variant="accent" onClick={() => onToggleStatus?.(q)}>
                    {q.status === 'published' ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => onDelete?.(q)}>Delete</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
