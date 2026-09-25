import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo/Logo';
import Button from '../../components/Button/Button';
import Timer from '../../components/Timer/Timer';
import QuestionCard from '../../components/QuestionCard/QuestionCard';
import QuestionNavigator from '../../components/QuestionNavigator/QuestionNavigator';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import Modal from '../../components/Modal/Modal';
import LoadingState from '../../components/LoadingState/LoadingState';
import ErrorState from '../../components/ErrorState/ErrorState';
import api from '../../services/api';
import './Quiz.css';

export default function Quiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(location.state?.attempt || null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(!location.state?.attempt);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [expired, setExpired] = useState(false);
  const saveTimer = useRef(null);
  const submittedRef = useRef(false);

  const questions = attempt?.questions || [];
  const allowNavigation = attempt?.allowNavigation !== false;

  const loadAttempt = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const active = await api.get('/api/quiz/active');
      if (active.completed) {
        navigate('/result', { replace: true });
        return;
      }
      if (!active.active) {
        navigate('/instructions', { replace: true });
        return;
      }
      setAttempt(active.attempt);
      setAnswers(active.attempt.answers || {});
      setRemaining(active.attempt.remainingSeconds || 0);
    } catch (err) {
      setError(err.message || 'Failed to load quiz.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (attempt) {
      setAnswers(attempt.answers || {});
      setRemaining(attempt.remainingSeconds || 0);
      setLoading(false);
    } else {
      loadAttempt();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const persistAnswers = useCallback(
    async (nextAnswers) => {
      if (!attempt?.attemptId || submittedRef.current) return;
      const payload = Object.entries(nextAnswers).map(([questionId, selectedAnswers]) => ({
        questionId,
        selectedAnswers,
      }));
      try {
        await api.put(`/api/quiz/attempt/${attempt.attemptId}/answers`, { answers: payload });
      } catch {
        // Best-effort persistence; server remains authoritative on submit
      }
    },
    [attempt]
  );

  const scheduleSave = useCallback(
    (nextAnswers) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persistAnswers(nextAnswers), 400);
    },
    [persistAnswers]
  );

  const doSubmit = useCallback(
    async (auto = false) => {
      if (!attempt?.attemptId || submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      setConfirmOpen(false);
      try {
        const payload = Object.entries(answers).map(([questionId, selectedAnswers]) => ({
          questionId,
          selectedAnswers,
        }));
        const result = await api.post(`/api/quiz/attempt/${attempt.attemptId}/submit`, {
          attemptId: attempt.attemptId,
          answers: payload,
        });
        navigate('/result', { replace: true, state: { result, auto } });
      } catch (err) {
        submittedRef.current = false;
        setSubmitting(false);
        if (err.code === 'ALREADY_SUBMITTED') {
          navigate('/result', { replace: true });
          return;
        }
        setError(err.message || 'Submission failed.');
      }
    },
    [attempt, answers, navigate]
  );

  useEffect(() => {
    if (!attempt || attempt.status !== 'in_progress' || expired) return undefined;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [attempt, expired]);

  useEffect(() => {
    if (expired && !submittedRef.current) {
      doSubmit(true);
    }
  }, [expired, doSubmit]);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (!submittedRef.current && attempt?.status === 'in_progress') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [attempt]);

  const answeredCount = useMemo(
    () => questions.filter((q) => Array.isArray(answers[q.id]) && answers[q.id].length > 0).length,
    [questions, answers]
  );

  const unansweredIndexes = useMemo(
    () =>
      questions
        .map((q, i) => ({ q, i }))
        .filter(({ q }) => !answers[q.id]?.length)
        .map(({ i }) => i + 1),
    [questions, answers]
  );

  const onAnswerChange = (selected) => {
    if (expired || submitting) return;
    const q = questions[currentIndex];
    if (!q) return;
    const next = { ...answers, [q.id]: selected };
    setAnswers(next);
    scheduleSave(next);
  };

  if (loading) {
    return <LoadingState message="Loading quiz…" />;
  }

  if (error && !attempt) {
    return (
      <ErrorState
        title="Quiz unavailable"
        message={error}
        actionLabel="Back to instructions"
        onAction={() => navigate('/instructions')}
      />
    );
  }

  if (!questions.length) {
    return (
      <ErrorState
        title="No published questions"
        message="The quiz has no published questions yet."
        actionLabel="Go home"
        onAction={() => navigate('/')}
      />
    );
  }

  const current = questions[currentIndex];

  return (
    <div className="quiz-page">
      <header className="quiz-header">
        <div className="container quiz-header-inner">
          <div className="quiz-brand">
            <Logo size="sm" />
            <div className="quiz-brand-text">
              <span>GENESIS</span>
              <strong>4.0</strong>
            </div>
          </div>
          <Timer remainingSeconds={remaining} />
        </div>
      </header>

      <main className="container quiz-main">
        {error ? <div className="alert alert-error">{error}</div> : null}

        <ProgressBar current={answeredCount} total={questions.length} />

        <div className="quiz-layout">
          <div className="quiz-content">
            <QuestionCard
              question={current}
              index={currentIndex}
              total={questions.length}
              selectedAnswers={answers[current.id] || []}
              onChange={onAnswerChange}
              disabled={expired || submitting}
            />

            <div className="quiz-footer-actions">
              <Button
                variant="secondary"
                disabled={!allowNavigation || currentIndex === 0 || expired}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={!allowNavigation || currentIndex >= questions.length - 1 || expired}
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              >
                Next
              </Button>
              <Button
                variant="accent"
                disabled={submitting || expired}
                onClick={() => setConfirmOpen(true)}
              >
                Submit
              </Button>
            </div>
          </div>

          <aside className="quiz-side">
            <QuestionNavigator
              questions={questions}
              answers={answers}
              currentIndex={currentIndex}
              allowNavigation={allowNavigation && !expired}
              onSelect={setCurrentIndex}
            />
          </aside>
        </div>
      </main>

      <Modal
        open={confirmOpen}
        title="Submit quiz?"
        onClose={() => setConfirmOpen(false)}
        primaryLabel="Submit quiz"
        primaryVariant="accent"
        primaryLoading={submitting}
        onPrimary={() => doSubmit(false)}
        secondaryLabel="Go back"
      >
        <p>
          Answered: <strong>{answeredCount} / {questions.length}</strong>
        </p>
        <p>
          Unanswered: <strong>{questions.length - answeredCount}</strong>
        </p>
        {unansweredIndexes.length > 0 ? (
          <p className="unanswered-list">
            Unanswered questions: {unansweredIndexes.join(', ')}
          </p>
        ) : null}
      </Modal>
    </div>
  );
}
