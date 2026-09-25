import { useEffect, useState } from 'react';
import AdminHeader from '../../components/AdminHeader/AdminHeader';
import SettingsForm from '../../components/SettingsForm/SettingsForm';
import LoadingState from '../../components/LoadingState/LoadingState';
import api from '../../services/api';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/api/settings');
        setSettings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSubmit = async (payload) => {
    setSubmitting(true);
    try {
      const updated = await api.put('/api/settings', payload);
      setSettings(updated);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Loading settings…" />;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <AdminHeader title="QUIZ SETTINGS" />
      <SettingsForm initial={settings} onSubmit={onSubmit} submitting={submitting} />
    </div>
  );
}
