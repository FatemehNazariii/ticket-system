import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import Avatar from '../components/Avatar';

export default function TicketsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [search, setSearch] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTickets = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        page,
        ...(statusFilter && { status: statusFilter }),
        ...(search && { search }),
      };

      const response = await api.get('/tickets/', { params });

      if (Array.isArray(response.data)) {
        setTickets(response.data);
        setTotalPages(1);
      } else {
        setTickets(response.data.results || []);
        setTotalPages(Math.ceil(response.data.count / 10) || 1);
      }
    } catch (err) {
      console.log('TICKETS ERROR:', err.response?.data);
      setError('خطا در دریافت تیکت‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, page]);

  useEffect(() => {
    const urlStatus = searchParams.get('status') || '';
    setStatusFilter(urlStatus);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    if (search === '') {
      setPage(1);
      fetchTickets();
    }
  }, [search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
  };

  const handleStatusChange = (e) => {
    const value = e.target.value;

    setStatusFilter(value);
    setPage(1);

    if (value) {
      setSearchParams({ status: value });
    } else {
      setSearchParams({});
    }
  };

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

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'low':
        return 'پایین';
      case 'medium':
        return 'متوسط';
      case 'high':
        return 'بالا';
      case 'urgent':
        return 'فوری';
      default:
        return priority;
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'low':
        return { color: '#166534', background: '#dcfce7' };
      case 'medium':
        return { color: '#1d4ed8', background: '#dbeafe' };
      case 'high':
        return { color: '#92400e', background: '#fef3c7' };
      case 'urgent':
        return { color: '#991b1b', background: '#fee2e2' };
      default:
        return {};
    }
  };

  return (
    <main className="page">
      <div className="toolbar">
        <div>
          <h1 className="page-title">تیکت‌ها</h1>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 500 }}>
            درخواست‌های پشتیبانی خود را مشاهده، جستجو و پیگیری کنید.
          </p>
        </div>

        <Link to="/tickets/new" style={{ textDecoration: 'none' }}>
          <button className="btn btn-primary">+ تیکت جدید</button>
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} className="responsive-search-grid">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>جستجو</label>
            <input
              className="form-control"
              type="text"
              placeholder="عنوان یا توضیحات تیکت..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>وضعیت</label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={handleStatusChange}
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="open">باز</option>
              <option value="pending">در انتظار</option>
              <option value="closed">بسته</option>
              <option value="revision">نیاز به اصلاح</option>
            </select>
          </div>

<button
  className="btn btn-primary"
  type="submit"
  style={{
    marginTop: '20px',
    marginLeft: '12px',
  }}
>
  جستجو
</button>

          {search ? (
<button
  className="btn btn-outline"
  type="button"
  onClick={handleClearSearch}
  style={{ marginTop: '28px' }}
>
  پاک کردن
</button>
          ) : (
<button
  className="btn btn-outline"
  type="button"
  disabled
  style={{ marginTop: '28px' }}
>
  پاک کردن
</button>
          )}
        </form>
      </div>

      {loading ? (
        <div className="loading">در حال دریافت تیکت‌ها...</div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <h3 style={{ marginTop: 0 }}>تیکتی پیدا نشد</h3>
          <p>هنوز تیکتی ثبت نشده یا نتیجه‌ای با فیلتر فعلی وجود ندارد.</p>

          <Link to="/tickets/new" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary">ثبت اولین تیکت</button>
          </Link>
        </div>
      ) : (
        <>
          <div className="table-wrap table-responsive">
            <table className="table">
              <thead>
              <tr>
  <th>عنوان</th>
  <th>ثبت‌کننده</th>
  <th>کارشناس</th>
  <th>دسته‌بندی</th>
  <th>وضعیت</th>
  <th>اولویت</th>
  <th>تاریخ ایجاد</th>
  <th>عملیات</th>
</tr>
              </thead>

              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <strong>{ticket.title}</strong>
                      <div
                        style={{
                          color: '#94a3b8',
                          fontSize: '0.85rem',
                          marginTop: '0.25rem',
                        }}
                      >
                        #{ticket.id}
                      </div>
                    </td>
                    <td>
  {ticket.user ? (
<div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
  <Avatar user={ticket.user} size="28px" />
  <span style={{ fontSize: '0.85rem' }}>{ticket.user.username}</span>
</div>
  ) : (
    '-'
  )}
</td>

<td>
  {ticket.assigned_to_detail ? (
   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
  <Avatar user={ticket.assigned_to_detail} size="28px" />
  <span style={{ fontSize: '0.85rem' }}>
    {ticket.assigned_to_detail.username}
  </span>
</div>
  ) : (
    <span style={{ color: '#94a3b8' }}>تعیین نشده</span>
  )}
</td>

                    <td>{ticket.category_name || '-'}</td>

                    <td>
                      <span className={getStatusClass(ticket.status)}>
                        {getStatusText(ticket.status)}
                      </span>
                    </td>

                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          padding: '0.25rem 0.7rem',
                          borderRadius: '999px',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          ...getPriorityStyle(ticket.priority),
                        }}
                      >
                        {getPriorityText(ticket.priority)}
                      </span>
                    </td>

                    <td>{new Date(ticket.created_at).toLocaleDateString('fa-IR')}</td>

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

          <div
            style={{
              marginTop: '1.25rem',
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <button
              className="btn btn-outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              قبلی
            </button>

            <span style={{ fontWeight: 800, color: '#475569' }}>
              صفحه {page} از {totalPages}
            </span>

            <button
              className="btn btn-outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              بعدی
            </button>
          </div>
        </>
      )}
    </main>
  );
}