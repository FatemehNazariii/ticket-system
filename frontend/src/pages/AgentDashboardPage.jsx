import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function AgentDashboardPage() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    pending: 0,
    closed: 0,
    revision: 0,
    breached: 0,
    waiting: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAgentData = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get('/tickets/');
      const list = res.data.results || res.data;

      setTickets(list);

      setStats({
        total: list.length,
        open: list.filter((t) => t.status === 'open').length,
        pending: list.filter((t) => t.status === 'pending').length,
        closed: list.filter((t) => t.status === 'closed').length,
        revision: list.filter((t) => t.status === 'revision').length,
        breached: list.filter((t) => t.sla_status === 'breached').length,
        waiting: list.filter((t) => t.sla_status === 'waiting').length,
      });
    } catch (err) {
      console.log('AGENT DASHBOARD ERROR:', err.response?.data);
      setError('خطا در دریافت اطلاعات پنل کارشناس');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentData();
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

  const getSlaText = (sla) => {
    switch (sla) {
      case 'ok':
        return 'رعایت شده ✅';
      case 'breached':
        return 'نقض شده ❌';
      case 'waiting':
        return 'در انتظار پاسخ';
      default:
        return '-';
    }
  };

  if (loading) {
    return <div className="loading">در حال دریافت پنل کارشناس...</div>;
  }

  return (
    <main className="page">
      <div className="toolbar">
        <div>
          <h1 className="page-title">پنل کارشناس</h1>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 500 }}>
            تیکت‌های ارجاع‌شده به شما و وضعیت پاسخگویی.
          </p>
        </div>

        <button className="btn btn-outline" onClick={fetchAgentData}>
          بروزرسانی
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div className="card">
          <h3>کل تیکت‌های من</h3>
          <p style={{ fontSize: '2rem', fontWeight: 900 }}>{stats.total}</p>
        </div>

        <div className="card">
          <h3>باز</h3>
          <p style={{ fontSize: '2rem', fontWeight: 900 }}>{stats.open}</p>
        </div>

        <div className="card">
          <h3>در انتظار</h3>
          <p style={{ fontSize: '2rem', fontWeight: 900 }}>{stats.pending}</p>
        </div>

        <div className="card">
          <h3>SLA نقض‌شده</h3>
          <p style={{ fontSize: '2rem', fontWeight: 900 }}>{stats.breached}</p>
        </div>

        <div className="card">
          <h3>در انتظار اولین پاسخ</h3>
          <p style={{ fontSize: '2rem', fontWeight: 900 }}>{stats.waiting}</p>
        </div>
      </div>

      <section className="card">
        <div className="toolbar" style={{ marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>تیکت‌های ارجاع‌شده به من</h2>
            <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>
              فقط تیکت‌هایی که به حساب شما assign شده‌اند نمایش داده می‌شوند.
            </p>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="empty-state">هنوز تیکتی به شما ارجاع نشده است.</div>
        ) : (
          <div className="table-wrap table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>تیکت</th>
                  <th>ثبت‌کننده</th>
                  <th>وضعیت</th>
                  <th>اولویت</th>
                  <th>SLA</th>
                  <th>اولین پاسخ</th>
                  <th>عملیات</th>
                </tr>
              </thead>

              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <strong>{ticket.title}</strong>
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        #{ticket.id}
                      </div>
                    </td>

                    <td>{ticket.user?.username || '-'}</td>
                    <td>{getStatusText(ticket.status)}</td>
                    <td>{ticket.priority}</td>
                    <td>{getSlaText(ticket.sla_status)}</td>
                    <td>
                      {ticket.first_response_minutes === null
                        ? '-'
                        : `${ticket.first_response_minutes} دقیقه`}
                    </td>

                    <td>
                      <Link to={`/tickets/${ticket.id}`} style={{ textDecoration: 'none' }}>
                        <button className="btn btn-outline">مشاهده</button>
                      </Link>
                    </td>
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