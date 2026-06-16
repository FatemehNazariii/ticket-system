import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import Avatar from '../components/Avatar';

export default function AgentsPerformancePage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('completion');

  const fetchAgentsStats = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get('/tickets/agent-stats/');
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setAgents(data);
    } catch (err) {
      console.log('AGENTS PERFORMANCE ERROR:', err.response?.data);
      setError('خطا در دریافت آمار کارشناسان');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentsStats();
  }, []);

  const getProgress = (agent) => {
    const total = agent.assigned_tickets_count || 0;
    const closed = agent.closed_tickets_count || 0;
    if (!total) return 0;
    return Math.round((closed / total) * 100);
  };

  const summary = useMemo(() => {
    const totalAgents = agents.length;
    const totalAssigned = agents.reduce(
      (sum, agent) => sum + (agent.assigned_tickets_count || 0),
      0
    );
    const totalClosed = agents.reduce(
      (sum, agent) => sum + (agent.closed_tickets_count || 0),
      0
    );

    const avgPerformance = totalAgents
      ? Math.round(
          agents.reduce((sum, agent) => sum + getProgress(agent), 0) /
            totalAgents
        )
      : 0;

    return {
      totalAgents,
      totalAssigned,
      totalClosed,
      avgPerformance,
    };
  }, [agents]);

  const filteredAgents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    let list = agents.filter((agent) => {
      const username = agent.username?.toLowerCase() || '';
      const email = agent.email?.toLowerCase() || '';

      return username.includes(keyword) || email.includes(keyword);
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'tickets') {
        return (b.assigned_tickets_count || 0) - (a.assigned_tickets_count || 0);
      }

      if (sortBy === 'closed') {
        return (b.closed_tickets_count || 0) - (a.closed_tickets_count || 0);
      }

      if (sortBy === 'open') {
        return (b.open_tickets_count || 0) - (a.open_tickets_count || 0);
      }

      return getProgress(b) - getProgress(a);
    });

    return list;
  }, [agents, search, sortBy]);

  const summaryCards = [
    {
      title: 'تعداد کارشناسان',
      value: summary.totalAgents,
      icon: '👨‍💼',
      hint: 'کارشناسان فعال در گزارش',
    },
    {
      title: 'کل تیکت‌های ارجاع‌شده',
      value: summary.totalAssigned,
      icon: '🎫',
      hint: 'مجموع تیکت‌های اختصاص‌یافته',
    },
    {
      title: 'تیکت‌های بسته‌شده',
      value: summary.totalClosed,
      icon: '✅',
      hint: 'مجموع تیکت‌های تکمیل‌شده',
    },
    {
      title: 'میانگین عملکرد',
      value: `${summary.avgPerformance}%`,
      icon: '📈',
      hint: 'میانگین نرخ تکمیل کارشناسان',
    },
  ];

  if (loading) {
    return <div className="loading">در حال دریافت آمار کارشناسان...</div>;
  }

  return (
    <main className="page">
      <div className="toolbar">
        <div>
          <h1 className="page-title">عملکرد کارشناسان</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontWeight: 500 }}>
            گزارش کامل تیکت‌های ارجاع‌شده و وضعیت عملکرد هر کارشناس.
          </p>
        </div>

        <button className="btn btn-outline" onClick={fetchAgentsStats}>
          بروزرسانی
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        {summaryCards.map((card) => (
          <section
            key={card.title}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '16px',
                background: '#eff6ff',
                display: 'grid',
                placeItems: 'center',
                fontSize: '1.35rem',
              }}
            >
              {card.icon}
            </div>

            <div>
              <div style={{ color: 'var(--muted)', fontWeight: 700 }}>
                {card.title}
              </div>
              <strong style={{ fontSize: '1.6rem', color: 'var(--text)' }}>
                {card.value}
              </strong>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
                {card.hint}
              </p>
            </div>
          </section>
        ))}
      </div>

      <section className="card" style={{ marginBottom: '1.25rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '1rem',
            alignItems: 'end',
          }}
        >
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>جستجوی کارشناس</label>
            <input
              className="form-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="نام کاربری یا ایمیل..."
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>مرتب‌سازی</label>
            <select
              className="form-control"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="completion">بیشترین نرخ تکمیل</option>
              <option value="tickets">بیشترین تیکت</option>
              <option value="closed">بیشترین تیکت بسته</option>
              <option value="open">بیشترین تیکت باز</option>
            </select>
          </div>
        </div>
      </section>

      <section className="card">
        {filteredAgents.length === 0 ? (
          <div className="empty-state">کارشناسی با این جستجو پیدا نشد.</div>
        ) : (
          <div className="table-wrap table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>کارشناس</th>
                  <th>کل تیکت‌ها</th>
                  <th>باز</th>
                  <th>در انتظار</th>
                  <th>بسته</th>
                  <th>نرخ تکمیل</th>
                </tr>
              </thead>

              <tbody>
                {filteredAgents.map((agent) => {
                  const progress = getProgress(agent);

                  return (
                    <tr key={agent.id}>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                          }}
                        >
                          <Avatar user={agent} size="40px" />
                          <div>
                            <strong>{agent.username}</strong>
                            <div
                              style={{
                                color: '#94a3b8',
                                fontSize: '0.85rem',
                              }}
                            >
                              {agent.email || 'بدون ایمیل'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>{agent.assigned_tickets_count || 0}</td>
                      <td>{agent.open_tickets_count || 0}</td>
                      <td>{agent.pending_tickets_count || 0}</td>
                      <td>{agent.closed_tickets_count || 0}</td>

                      <td>
                        <div style={{ minWidth: '130px' }}>
                          <strong>{progress}%</strong>
                          <div
                            style={{
                              height: '8px',
                              background: '#e5e7eb',
                              borderRadius: '999px',
                              marginTop: '0.4rem',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${progress}%`,
                                height: '100%',
                                background:
                                  progress >= 70
                                    ? '#16a34a'
                                    : progress >= 40
                                    ? '#f59e0b'
                                    : '#ef4444',
                                borderRadius: '999px',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}