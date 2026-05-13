import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

const fetchTickets = async () => {
  setLoading(true);
  try {
    const params = {
      page: page,
      ...(statusFilter && { status: statusFilter })
    };
    const response = await api.get('/tickets/', { params });
    setTickets(response.data.results);
    setTotalPages(Math.ceil(response.data.count / 10)); // PAGE_SIZE=10
  } catch (err) {
    setError('خطا در دریافت تیکت‌ها');
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchTickets();
  }, [statusFilter, page]);

  const getStatusText = (status) => {
    switch (status) {
      case 'open': return 'باز';
      case 'pending': return 'در انتظار';
      case 'closed': return 'بسته';
      default: return status;
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'low': return 'پایین';
      case 'medium': return 'متوسط';
      case 'high': return 'بالا';
      case 'urgent': return 'فوری';
      default: return priority;
    }
  };


  if (loading) return <div style={{ textAlign: 'center', marginTop: '2rem' }}>در حال بارگذاری...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>;

  return (
    <div style={{ padding: '2rem', direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>تیکت‌های من</h2>
        <Link to="/tickets/new">
          <button style={{ background: '#3B6D11', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            + تیکت جدید
          </button>
        </Link>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>فیلتر وضعیت: </label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '6px', borderRadius: '4px' }}>
          <option value="">همه</option>
          <option value="open">باز</option>
          <option value="pending">در انتظار</option>
          <option value="closed">بسته</option>
        </select>
      </div>

      {tickets.length === 0 ? (
        <p>هیچ تیکتی یافت نشد.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f2f2f2' }}>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>عنوان</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>دسته‌بندی</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>وضعیت</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>اولویت</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>تاریخ ایجاد</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr key={ticket.id}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{ticket.title}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{ticket.category ? ticket.category.name : '-'}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{getStatusText(ticket.status)}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{getPriorityText(ticket.priority)}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{new Date(ticket.created_at).toLocaleDateString('fa-IR')}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <Link to={`/tickets/${ticket.id}`}>مشاهده</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>
    قبلی
  </button>
  <span>صفحه {page} از {totalPages}</span>
  <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>
    بعدی
  </button>
</div>
    </div>
  );
}