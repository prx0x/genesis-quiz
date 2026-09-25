import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Button from '../../components/Button/Button';
import LoadingState from '../../components/LoadingState/LoadingState';
import ErrorState from '../../components/ErrorState/ErrorState';
import { useAuth } from '../../context/AuthContext';
import api, { getGoogleLoginUrl } from '../../services/api';
import './Instructions.css';

export default function Instructions() {
  const { isAuthenticated } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/api/quiz/config');
        setConfig(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const startQuiz = async () => {
    if (!isAuthenticated) {
      window.location.href = getGoogleLoginUrl();
      return;
    }
    setStarting(true);
    setError('');
    try {
      const active = await api.get('/api/quiz/active');
      if (active.completed && !config?.allowRetry) {
        navigate('/result');
        return;
      }
      if (active.active && active.attempt) {
        navigate('/quiz', { state: { attempt: active.attempt } });
        return;
      }
      const attempt = await api.post('/api/quiz/start');
      navigate('/quiz', { state: { attempt } });
    } catch (err) {
      if (err.code === 'ALREADY_COMPLETED' || err.status === 403) {
        navigate('/result');
        return;
      }
      setError(err.message || 'Unable to start quiz.');
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Header />
        <LoadingState message="Loading rules…" />
        <Footer />
      </div>
    );
  }

  if (!config && error) {
    return (
      <div className="app-shell">
        <Header />
        <ErrorState title="Unable to load rules" message={error} actionLabel="Retry" onAction={() => window.location.reload()} />
        <Footer />
      </div>
    );
  }

  const rules = [
    'Read each question carefully.',
    `The quiz contains ${config.totalQuestions} questions.`,
    `The quiz duration is ${config.durationMinutes} minutes.`,
    'Answers are submitted when the quiz ends.',
    'The quiz cannot be restarted after submission.',
    'Do not refresh or close the page during the quiz.',
  ];

  return (
    <div className="app-shell">
      <Header />
      <main className="main-content">
        <div className="container-narrow instructions-page">
          <p className="page-subtitle">GENESIS 4.0</p>
          <h1 className="page-title">QUIZ RULES</h1>

          {error ? <div className="alert alert-error">{error}</div> : null}

          <ol className="rules-list">
            {rules.map((rule, i) => (
              <li key={rule}>
                <span className="rule-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="rule-text">{rule}</span>
              </li>
            ))}
          </ol>

          <div className="actions-row">
            <Button variant="secondary" onClick={() => navigate('/')}>
              Back
            </Button>
            <Button variant="accent" size="lg" loading={starting} onClick={startQuiz}>
              I understand — start quiz
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
