import { useCallback, useEffect, useState } from 'react';
import AdminHeader from '../../components/AdminHeader/AdminHeader';
import ResultsTable from '../../components/ResultsTable/ResultsTable';
import LoadingState from '../../components/LoadingState/LoadingState';
import api from '../../services/api';

export default function Results() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('submitted_at');
  const [order, setOrder] = useState('desc');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, order });
      if (search) params.set('search', search);
      const data = await api.get(`/api/results?${params.toString()}`);
      setResults(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, sort, order]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const onSort = (field) => {
    if (sort === field) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field);
      setOrder('desc');
    }
  };

  return (
    <div>
      <AdminHeader title="RESULTS" />
      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="form-group" style={{ maxWidth: 360, marginBottom: '1.25rem' }}>
        <label htmlFor="search">Search</label>
        <input
          id="search"
          type="search"
          placeholder="Name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingState message="Loading results…" />
      ) : (
        <ResultsTable results={results} onSort={onSort} sort={sort} order={order} />
      )}
    </div>
  );
}
