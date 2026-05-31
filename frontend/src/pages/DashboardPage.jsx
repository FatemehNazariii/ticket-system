import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
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
      const tickets = ticketsRes.data.results || ticketsRes.data;
      setRecentTickets(tickets.slice(0, 5));

      const agentStatsRes = await api.get('/tickets/agent-stats/');
      setAgentStats(agentStatsRes.data);
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
  { name: 'باز', value: stats.open },
  { name: 'در انتظار', value: stats.pending },
  { name: 'بسته', value: stats.closed },
  { name: 'نیاز به اصلاح', value: stats.revision },
];

const COLORS = [
  '#16a34a',
  '#d97706',
  '#dc2626',
  '#7c3aed',
];

const agentChartData = agentStats.map((agent) => ({
  name: agent.username,
  total: agent.assigned_tickets_count,
  open: agent.open_tickets_count,
  pending: agent.pending_tickets_count,
  closed: agent.closed_tickets_count,
}));

  if (loading) {
    return <div className="loading">در حال دریافت اطلاعات داشبورد...</div>;
  }

  return (
    <main className="page">
      <div className="toolbar">
        <div>
          <h1 className="page-title">داشبورد مدیریت</h1>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 500 }}>
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
            style={{
              textDecoration: 'none',
              color: 'inherit',
            }}
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

              <h3 style={{ margin: 0, color: '#334155', fontSize: '1rem' }}>
                {card.title}
              </h3>

              <p
                style={{
                  margin: '0.35rem 0',
                  fontSize: '2.2rem',
                  fontWeight: 900,
                  color: '#111827',
                }}
              >
                {card.value}
              </p>

              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
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
                  opacity: 0.45,
                }}
              />
            </div>
          </Link>
        ))}
      </div>
      <div
  style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1.25rem',
  }}
>
  <section className="card">
    <h2 style={{ marginTop: 0 }}>
      وضعیت تیکت‌ها
    </h2>

    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={statusChartData}
          dataKey="value"
          nameKey="name"
          outerRadius={110}
          label
        >
          {statusChartData.map((entry, index) => (
            <Cell
              key={index}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>

        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </section>

  <section className="card">
    <h2 style={{ marginTop: 0 }}>
      عملکرد کارشناسان
    </h2>

    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={agentChartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />

        <Bar dataKey="open" fill="#16a34a" />
        <Bar dataKey="pending" fill="#d97706" />
        <Bar dataKey="closed" fill="#dc2626" />
      </BarChart>
    </ResponsiveContainer>
  </section>
</div>

      <section className="card">
        <div className="toolbar" style={{ marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>آخرین تیکت‌ها</h2>
            <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>
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

      <section className="card" style={{ marginTop: '1.25rem' }}>
        <div className="toolbar" style={{ marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>آمار کارشناسان</h2>
            <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>
              تعداد تیکت‌های ارجاع‌شده به هر کارشناس.
            </p>
          </div>
        </div>

        {agentStats.length === 0 ? (
          <div className="empty-state">هنوز کارشناسی ثبت نشده است.</div>
        ) : (
          <div className="table-wrap table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>کارشناس</th>
                  <th>ایمیل</th>
                  <th>کل تیکت‌ها</th>
                  <th>باز</th>
                  <th>در انتظار</th>
                  <th>بسته</th>
                </tr>
              </thead>

              <tbody>
                {agentStats.map((agent) => (
                  <tr key={agent.id}>
                    <td>
                      <strong>{agent.username}</strong>
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        #{agent.id}
                      </div>
                    </td>

                    <td>{agent.email || '-'}</td>
                    <td>{agent.assigned_tickets_count}</td>
                    <td>{agent.open_tickets_count}</td>
                    <td>{agent.pending_tickets_count}</td>
                    <td>{agent.closed_tickets_count}</td>
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