import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Button from '../../components/Button/Button';
import LoadingState from '../../components/LoadingState/LoadingState';
import ErrorState from '../../components/ErrorState/ErrorState';
import GeometricDecoration from '../../components/GeometricDecoration/GeometricDecoration';
import api from '../../services/api';
import './Result.css';

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(location.state?.result || null);
  const [loading, setLoading] = useState(!location.state?.result);
  const [error, setError] = useState('');

  useEffect(() => {
    if (result) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/api/quiz/result');
        if (!cancelled) {
          if (data.status === 'in_progress') {
            navigate('/quiz', { replace: true });
            return;
          }
          setResult(data);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'No result found.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [result, navigate]);

  if (loading) {
    return (
      <div className="app-shell">
        <Header />
        <LoadingState message="Loading results…" />
        <Footer />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="app-shell">
        <Header />
        <ErrorState
          title="No result yet"
          message={error || 'You have not completed the quiz.'}
          actionLabel="Go home"
          onAction={() => navigate('/')}
        />
        <Footer />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="main-content result-page">
        <GeometricDecoration variant="corner" />
        <div className="container-narrow page">
          <p className="page-subtitle">GENESIS 4.0</p>
          <h1 className="page-title">YOUR SCORE</h1>

          {location.state?.auto ? (
            <div className="alert alert-info">Time expired — your quiz was submitted automatically.</div>
          ) : null}

          {!result.showResults ? (
            <div className="result-card">
              <p>{result.message || 'Your quiz has been submitted. Results will be announced later.'}</p>
            </div>
          ) : (
            <>
              <div className="result-hero">
                <div className="result-score">
                  {result.score} <span>/ {result.maximumScore}</span>
                </div>
                <div className="result-pct">{result.percentage}%</div>
              </div>

              <div className="result-grid">
                <div className="stat-block">
                  <div className="label">Correct</div>
                  <div className="value">{result.correctCount}</div>
                </div>
                <div className="stat-block">
                  <div className="label">Incorrect</div>
                  <div className="value">{result.incorrectCount}</div>
                </div>
                <div className="stat-block">
                  <div className="label">Unanswered</div>
                  <div className="value">{result.unansweredCount}</div>
                </div>
                <div className="stat-block">
                  <div className="label">Time taken</div>
                  <div className="value small">{result.timeTaken}</div>
                </div>
              </div>

              {result.showCorrectAnswers && result.review?.length ? (
                <section className="result-review">
                  <h2>Review</h2>
                  {result.review.map((item) => (
                    <article key={item.questionId} className="review-item">
                      <p className="review-q">{item.questionText}</p>
                      <p>
                        Your answer:{' '}
                        <strong>{(item.selectedAnswers || []).join(', ') || '—'}</strong>
                      </p>
                      <p>
                        Correct:{' '}
                        <strong>{(item.correctAnswers || []).join(', ')}</strong>
                      </p>
                      {item.explanation ? <p className="review-exp">{item.explanation}</p> : null}
                      <span className={`badge ${item.isCorrect ? 'badge-blue' : 'badge-red'}`}>
                        {item.isCorrect ? 'Correct' : item.selectedAnswers?.length ? 'Incorrect' : 'Unanswered'}
                      </span>
                    </article>
                  ))}
                </section>
              ) : null}
            </>
          )}

          <div className="actions-row" style={{ marginTop: '2rem' }}>
            <Button variant="primary" onClick={() => navigate('/')}>
              Back home
            </Button>
            <Button variant="secondary" onClick={() => navigate('/profile')}>
              Profile
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
