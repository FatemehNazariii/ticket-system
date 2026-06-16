import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Label,
} from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    pending: 0,
    closed: 0,
    revision: 0,
  });

  const [recentTickets, setRecentTickets] = useState([]);
  const [agentStats, setAgentStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const statsRes = await api.get('/tickets/stats/');
      setStats(statsRes.data);

      const ticketsRes = await api.get('/tickets/');
      const tickets = Array.isArray(ticketsRes.data)
        ? ticketsRes.data
        : ticketsRes.data.results || [];
      setRecentTickets(tickets.slice(0, 5));

      const agentStatsRes = await api.get('/tickets/agent-stats/');
      const agents = Array.isArray(agentStatsRes.data)
        ? agentStatsRes.data
        : agentStatsRes.data.results || [];
      setAgentStats(agents);
    } catch (err) {
      console.log('DASHBOARD ERROR:', err.response?.data);
      setError('خطا در دریافت اطلاعات داشبورد');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusText = (status) => {
    switch (status) {
      case 'open':
        return 'باز';
      case 'pending':
        return 'در انتظار';
      case 'closed':
        return 'بسته';
      case 'revision':
        return 'نیاز به اصلاح';
      default:
        return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'open':
        return 'badge badge-open';
      case 'pending':
        return 'badge badge-pending';
      case 'closed':
        return 'badge badge-closed';
      case 'revision':
        return 'badge badge-revision';
      default:
        return 'badge';
    }
  };

  const cards = [
    {
      title: 'کل تیکت‌ها',
      value: stats.total,
      icon: '🎫',
      hint: 'تمام درخواست‌های ثبت‌شده',
      color: '#2563eb',
      bg: '#dbeafe',
      to: '/tickets',
    },
    {
      title: 'باز',
      value: stats.open,
      icon: '🟢',
      hint: 'در انتظار بررسی اولیه',
      color: '#16a34a',
      bg: '#dcfce7',
      to: '/tickets?status=open',
    },
    {
      title: 'در انتظار',
      value: stats.pending,
      icon: '🟡',
      hint: 'در حال پیگیری',
      color: '#d97706',
      bg: '#fef3c7',
      to: '/tickets?status=pending',
    },
    {
      title: 'بسته',
      value: stats.closed,
      icon: '🔴',
      hint: 'رسیدگی‌شده و بسته‌شده',
      color: '#dc2626',
      bg: '#fee2e2',
      to: '/tickets?status=closed',
    },
    {
      title: 'نیاز به اصلاح',
      value: stats.revision,
      icon: '🟣',
      hint: 'نیازمند پاسخ یا اصلاح کاربر',
      color: '#7c3aed',
      bg: '#ede9fe',
      to: '/tickets?status=revision',
    },
  ];

  const statusChartData = [
    { name: 'باز', value: stats.open, color: '#22c55e' },
    { name: 'در انتظار', value: stats.pending, color: '#f59e0b' },
    { name: 'بسته', value: stats.closed, color: '#ef4444' },
    { name: 'نیاز به اصلاح', value: stats.revision, color: '#8b5cf6' },
  ].filter((item) => item.value > 0);

  const totalStatus = statusChartData.reduce((sum, item) => sum + item.value, 0);

  const tooltipStyle = {
    borderRadius: '14px',
    border: '1px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--text)',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.18)',
    direction: 'rtl',
  };

  const getAgentProgress = (agent) => {
    const total = agent.assigned_tickets_count || 0;
    const closed = agent.closed_tickets_count || 0;

    if (!total) return 0;

    return Math.round((closed / total) * 100);
  };

  const topAgents = [...agentStats]
    .sort(
      (a, b) =>
        (b.closed_tickets_count || 0) -
        (a.closed_tickets_count || 0)
    )
    .slice(0, 3);

  if (loading) {
    return <div className="loading">در حال دریافت اطلاعات داشبورد...</div>;
  }

  return (
    <main className="page">
      <div className="toolbar">
        <div>
          <h1 className="page-title">داشبورد مدیریت</h1>
          <p style={{ margin: 0, color: 'var(--muted)', fontWeight: 500 }}>
            نمای کلی وضعیت تیکت‌ها و فعالیت‌های اخیر سامانه.
          </p>
        </div>

        <button className="btn btn-outline" onClick={fetchDashboardData}>
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
        {cards.map((card) => (
          <Link
            key={card.title}
            to={card.to}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              className="card dashboard-card"
              style={{
                padding: '1.2rem',
                position: 'relative',
                overflow: 'hidden',
                height: '100%',
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '16px',
                  background: card.bg,
                  color: card.color,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '1.4rem',
                  marginBottom: '1rem',
                }}
              >
                {card.icon}
              </div>

              <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1rem' }}>
                {card.title}
              </h3>

              <p
                style={{
                  margin: '0.35rem 0',
                  fontSize: '2.2rem',
                  fontWeight: 900,
                  color: 'var(--text)',
                }}
              >
                {card.value}
              </p>

              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
                {card.hint}
              </p>

              <div
                style={{
                  position: 'absolute',
                  left: '-20px',
                  bottom: '-20px',
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: card.bg,
                  opacity: 0.35,
                }}
              />
            </div>
          </Link>
        ))}
      </div>

      <div className="dashboard-smart-grid">
       <section className="card chart-card">
  <div className="chart-header">
    <div>
      <h2>📊 وضعیت تیکت‌ها</h2>
      <p>نمای خلاصه از وضعیت فعلی تیکت‌ها.</p>
    </div>

    <span className="chart-total-badge">
      {stats.total} تیکت
    </span>
  </div>

  {statusChartData.length === 0 ? (
    <div className="empty-state">هنوز داده‌ای برای نمایش نمودار وجود ندارد.</div>
  ) : (
    <>
      <div
        className="donut-wrap"
        style={{
          filter: 'drop-shadow(0 14px 28px rgba(37, 99, 235, 0.14))',
        }}
      >
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie
              data={statusChartData}
              dataKey="value"
              nameKey="name"
              innerRadius={42}
              outerRadius={78}
              paddingAngle={6}
              cornerRadius={12}
              startAngle={90}
              endAngle={-270}
              stroke="var(--card)"
              strokeWidth={5}
              isAnimationActive={true}
              animationDuration={1200}
            >
              {statusChartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}

              <Label
                content={({ viewBox }) => {
                  const { cx, cy } = viewBox;

                  return (
                    <g>
                      <text
                        x={cx}
                        y={cy - 6}
                        textAnchor="middle"
                        fontSize="34"
                        fontWeight="900"
                        fill="var(--text)"
                      >
                        {stats.total}
                      </text>

                      <text
                        x={cx}
                        y={cy + 22}
                        textAnchor="middle"
                        fontSize="13"
                        fontWeight="700"
                        fill="#94a3b8"
                      >
                        کل تیکت‌ها
                      </text>
                    </g>
                  );
                }}
              />
            </Pie>

            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
          marginTop: '1rem',
        }}
      >
        {statusChartData.map((item) => (
          <div
            key={item.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              padding: '0.75rem 0.9rem',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              background: 'var(--bg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: item.color,
                }}
              />
              <span style={{ color: 'var(--muted)', fontWeight: 700 }}>
                {item.name}
              </span>
            </div>

            <strong style={{ color: 'var(--text)' }}>
              {item.value}
            </strong>
          </div>
        ))}
      </div>
    </>
  )}
</section>

        <section className="card chart-card">
          <div className="chart-header">
            <div>
              <h2>🏆 کارشناسان برتر</h2>
              <p>نمایش سه کارشناس برتر بر اساس تعداد تیکت‌های بسته‌شده.</p>
            </div>

            <span className="chart-total-badge">Top 3</span>
          </div>

          {topAgents.length === 0 ? (
            <div className="empty-state">هنوز کارشناسی برای نمایش وجود ندارد.</div>
          ) : (
            <>
             <div style={{ display: 'grid', gap: '0.75rem' }}>
  {topAgents.map((agent, index) => {
    const progress = getAgentProgress(agent);
    const rankIcon =
      index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';

    return (
      <div
        key={agent.id}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '0.75rem',
          alignItems: 'center',
          padding: '0.65rem 0.85rem',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          background: 'var(--bg)',
        }}
      >
        <div>
          <strong>
            {rankIcon} {agent.username}
          </strong>
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            {agent.assigned_tickets_count || 0} تیکت •{' '}
            {agent.closed_tickets_count || 0} بسته • عملکرد {progress}٪
          </div>
        </div>

        <div
          style={{
minWidth: '44px',
height: '44px',
            borderRadius: '16px',
            background: '#eef2ff',
            color: '#2563eb',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 900,
          }}
        >
          {progress}%
        </div>
      </div>
    );
  })}
</div>

              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <Link to="/agents-performance" style={{ textDecoration: 'none' }}>
                  <button className="btn btn-outline">
                    مشاهده همه کارشناسان
                  </button>
                </Link>
              </div>
            </>
          )}
        </section>
      </div>

      <section className="card">
        <div className="toolbar" style={{ marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>آخرین تیکت‌ها</h2>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)' }}>
              چند تیکت اخیر ثبت‌شده در سامانه.
            </p>
          </div>
        </div>

        {recentTickets.length === 0 ? (
          <div className="empty-state">هنوز تیکتی ثبت نشده است.</div>
        ) : (
          <div className="table-wrap table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>عنوان</th>
                  <th>دسته‌بندی</th>
                  <th>وضعیت</th>
                  <th>ثبت‌کننده</th>
                  <th>تاریخ</th>
                </tr>
              </thead>

              <tbody>
                {recentTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <strong>{ticket.title}</strong>
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        #{ticket.id}
                      </div>
                    </td>

                    <td>{ticket.category_name || '-'}</td>

                    <td>
                      <span className={getStatusClass(ticket.status)}>
                        {getStatusText(ticket.status)}
                      </span>
                    </td>

                    <td>{ticket.user?.username || '-'}</td>

                    <td>{new Date(ticket.created_at).toLocaleDateString('fa-IR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}