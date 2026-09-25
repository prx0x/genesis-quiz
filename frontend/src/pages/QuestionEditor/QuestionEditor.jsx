import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminHeader from '../../components/AdminHeader/AdminHeader';
import QuestionForm from '../../components/QuestionForm/QuestionForm';
import LoadingState from '../../components/LoadingState/LoadingState';
import api from '../../services/api';

export default function QuestionEditor() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isNew) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get(`/api/questions/${id}`);
        if (!cancelled) setInitial(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  const onSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (isNew) {
        await api.post('/api/questions', payload);
      } else {
        await api.put(`/api/questions/${id}`, payload);
      }
      navigate('/admin/questions');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading question…" />;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <AdminHeader title={isNew ? 'ADD QUESTION' : 'EDIT QUESTION'} />
      <QuestionForm initial={initial} onSubmit={onSubmit} submitting={submitting} />
    </div>
  );
}
