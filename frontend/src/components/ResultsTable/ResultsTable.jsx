import './ResultsTable.css';

export default function ResultsTable({ results = [], onSort, sort, order }) {
  if (!results.length) {
    return (
      <div className="empty-state">
        <h2>No quiz attempts have been submitted yet.</h2>
      </div>
    );
  }

  const SortHeader = ({ field, children }) => (
    <th>
      <button
        type="button"
        className="sort-btn"
        onClick={() => onSort?.(field)}
        aria-label={`Sort by ${children}`}
      >
        {children}
        {sort === field ? (order === 'asc' ? ' ↑' : ' ↓') : ''}
      </button>
    </th>
  );

  return (
    <div className="table-wrap">
      <table className="data-table results-table">
        <thead>
          <tr>
            <SortHeader field="name">Participant</SortHeader>
            <SortHeader field="email">Email</SortHeader>
            <SortHeader field="score">Score</SortHeader>
            <SortHeader field="percentage">%</SortHeader>
            <th>Correct</th>
            <th>Incorrect</th>
            <th>Unanswered</th>
            <SortHeader field="time_taken">Time</SortHeader>
            <SortHeader field="submitted_at">Submitted</SortHeader>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id}>
              <td>{r.participant}</td>
              <td>{r.email}</td>
              <td>
                {r.score} / {r.maximumScore}
              </td>
              <td>{r.percentage}%</td>
              <td>{r.correctCount}</td>
              <td>{r.incorrectCount}</td>
              <td>{r.unansweredCount}</td>
              <td>{r.timeTaken}</td>
              <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
