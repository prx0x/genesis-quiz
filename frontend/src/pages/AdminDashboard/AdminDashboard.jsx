import { useEffect, useState } from 'react';
import AdminHeader from '../../components/AdminHeader/AdminHeader';
import LoadingState from '../../components/LoadingState/LoadingState';
import Button from '../../components/Button/Button';
import api from '../../services/api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/api/dashboard');
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState message="Loading dashboard…" />;

  return (
    <div>
      <AdminHeader title="ADMIN PANEL" subtitle="GENESIS 4.0" />
      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="dash-stats">
        <div className="stat-block">
          <div className="label">Total questions</div>
          <div className="value">{stats?.totalQuestions ?? 0}</div>
        </div>
        <div className="stat-block">
          <div className="label">Published</div>
          <div className="value">{stats?.publishedQuestions ?? 0}</div>
        </div>
        <div className="stat-block">
          <div className="label">Draft</div>
          <div className="value">{stats?.draftQuestions ?? 0}</div>
        </div>
        <div className="stat-block">
          <div className="label">Total attempts</div>
          <div className="value">{stats?.totalAttempts ?? 0}</div>
        </div>
      </div>

      <div className="actions-row">
        <Button variant="accent" href="/admin/questions/new">
          + Add question
        </Button>
        <Button variant="secondary" href="/admin/settings">
          Quiz settings
        </Button>
        <Button variant="secondary" href="/admin/results">
          View results
        </Button>
      </div>
    </div>
  );
}
