import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../../components/AdminHeader/AdminHeader';
import Button from '../../components/Button/Button';
import QuestionTable from '../../components/QuestionTable/QuestionTable';
import QuestionPreview from '../../components/QuestionPreview/QuestionPreview';
import Modal from '../../components/Modal/Modal';
import LoadingState from '../../components/LoadingState/LoadingState';
import api from '../../services/api';

export default function Questions() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/questions');
      setQuestions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onDuplicate = async (q) => {
    setBusy(true);
    try {
      await api.post(`/api/questions/${q.id}/duplicate`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onToggleStatus = async (q) => {
    setBusy(true);
    try {
      await api.patch(`/api/questions/${q.id}/status`, {
        status: q.status === 'published' ? 'draft' : 'published',
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await api.delete(`/api/questions/${deleteTarget.id}`);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onMove = async (index, direction) => {
    const next = [...questions];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setQuestions(next);
    try {
      await api.patch('/api/questions/reorder', {
        orderedIds: next.map((q) => q.id),
      });
    } catch (err) {
      setError(err.message);
      load();
    }
  };

  if (loading) return <LoadingState message="Loading questions…" />;

  return (
    <div>
      <AdminHeader title="QUESTIONS" />
      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="actions-row" style={{ marginBottom: '1.25rem' }}>
        <Button variant="accent" onClick={() => navigate('/admin/questions/new')}>
          + Add question
        </Button>
      </div>

      <QuestionTable
        questions={questions}
        onEdit={(q) => navigate(`/admin/questions/${q.id}/edit`)}
        onDuplicate={onDuplicate}
        onPreview={setPreview}
        onToggleStatus={onToggleStatus}
        onDelete={setDeleteTarget}
        onMove={onMove}
      />

      {preview ? (
        <QuestionPreview question={preview} onClose={() => setPreview(null)} />
      ) : null}

      <Modal
        open={Boolean(deleteTarget)}
        title="Delete question?"
        onClose={() => setDeleteTarget(null)}
        primaryLabel="Delete"
        primaryVariant="danger"
        primaryLoading={busy}
        onPrimary={onDelete}
        danger
      >
        <p>This action cannot be undone.</p>
        <p>
          <em>{deleteTarget?.questionText}</em>
        </p>
      </Modal>
    </div>
  );
}
