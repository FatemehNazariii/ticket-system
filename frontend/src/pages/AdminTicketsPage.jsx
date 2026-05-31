import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkAssignedTo, setBulkAssignedTo] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
       const params = {
            ...(search && { search }),
            ...(statusFilter && { status: statusFilter }),
            ...(priorityFilter && { priority: priorityFilter }),
            ...(dateFrom && { date_from: dateFrom }),
            ...(dateTo && { date_to: dateTo }),
            };

      const ticketsRes = await api.get('/tickets/', { params });
      const ticketList = ticketsRes.data.results || ticketsRes.data;

      const agentsRes = await api.get('/auth/users/agents/');
      const agentList = Array.isArray(agentsRes.data)
        ? agentsRes.data
        : agentsRes.data.results || [];

      setTickets(ticketList);
      setAgents(agentList);
    } catch (err) {
      console.log('ADMIN TICKETS ERROR:', err.response?.data);
      setError('خطا در دریافت اطلاعات تیکت‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, priorityFilter]);


  const handleExportExcel = async () => {
  try {
    const response = await api.get('/tickets/export-excel/', {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(
      new Blob([response.data])
    );

    const link = document.createElement('a');
    link.href = url;
    link.download = 'tickets.xlsx';

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.log(err);
   toast.error('خطا در دریافت فایل اکسل');
  }
};

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const toggleTicket = (ticketId) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const toggleAllTickets = () => {
    if (selectedTickets.length === tickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(tickets.map((ticket) => ticket.id));
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedTickets.length === 0) {
      toast.error('حداقل یک تیکت انتخاب کن');
      return;
    }

    if (!bulkStatus && !bulkAssignedTo) {
      toast.error('حداقل یک عملیات انتخاب کن');
      return;
    }

    setBulkLoading(true);

    try {
      await api.patch('/tickets/bulk-update/', {
        ticket_ids: selectedTickets,
        ...(bulkStatus && { status: bulkStatus }),
        ...(bulkAssignedTo && { assigned_to: bulkAssignedTo }),
      });

      setSelectedTickets([]);
      setBulkStatus('');
      setBulkAssignedTo('');
      await fetchData();

      toast.error('عملیات گروهی با موفقیت انجام شد');
    } catch (err) {
      console.log('BULK UPDATE ERROR:', err.response?.data);
      toast.error('خطا در انجام عملیات گروهی');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, status) => {
    try {
      await api.patch(`/tickets/${ticketId}/change_status/`, { status });

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, status } : ticket
        )
      );
    } catch (err) {
      toast.error('خطا در تغییر وضعیت');
    }
  };

  const handleAssignChange = async (ticketId, assignedTo) => {
    if (!assignedTo) return;

    try {
      const res = await api.patch(`/tickets/${ticketId}/assign/`, {
        assigned_to: assignedTo,
      });

      setTickets((prev) =>
        prev.map((ticket) => (ticket.id === ticketId ? res.data : ticket))
      );
    } catch (err) {
      toast.error('خطا در ارجاع تیکت');
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

  return (
    <main className="page">
      <div className="toolbar">
        <div>
          <h1 className="page-title">مدیریت تیکت‌ها</h1>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 500 }}>
            مشاهده، فیلتر، ارجاع و تغییر وضعیت تیکت‌ها.
          </p>
        </div>
<div style={{ display: 'flex', gap: '0.5rem' }}>
  <button
    className="btn btn-primary"
    onClick={handleExportExcel}
  >
    📊 خروجی اکسل
  </button>

  <button
    className="btn btn-outline"
    onClick={fetchData}
  >
    بروزرسانی
  </button>
</div>
      </div>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} className="responsive-search-grid">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>جستجو</label>
            <input
              className="form-control"
              type="text"
              placeholder="عنوان یا توضیحات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>وضعیت</label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">همه</option>
              <option value="open">باز</option>
              <option value="pending">در انتظار</option>
              <option value="closed">بسته</option>
              <option value="revision">نیاز به اصلاح</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>اولویت</label>
            <select
              className="form-control"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">همه</option>
              <option value="low">پایین</option>
              <option value="medium">متوسط</option>
              <option value="high">بالا</option>
              <option value="urgent">فوری</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
  <label>از تاریخ</label>

  <input
    type="date"
    className="form-control"
    value={dateFrom}
    onChange={(e) => setDateFrom(e.target.value)}
  />
</div>

<div className="form-group" style={{ marginBottom: 0 }}>
  <label>تا تاریخ</label>

  <input
    type="date"
    className="form-control"
    value={dateTo}
    onChange={(e) => setDateTo(e.target.value)}
  />
</div>

          <button className="btn btn-primary" type="submit">
            جستجو
          </button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ marginTop: 0 }}>عملیات گروهی</h3>

        <div className="responsive-search-grid">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>وضعیت جدید</label>
            <select
              className="form-control"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
            >
              <option value="">بدون تغییر</option>
              <option value="open">باز</option>
              <option value="pending">در انتظار</option>
              <option value="closed">بسته</option>
              <option value="revision">نیاز به اصلاح</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>ارجاع به کارشناس</label>
            <select
              className="form-control"
              value={bulkAssignedTo}
              onChange={(e) => setBulkAssignedTo(e.target.value)}
            >
              <option value="">بدون تغییر</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.username}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary"
            type="button"
            onClick={handleBulkUpdate}
            disabled={bulkLoading || selectedTickets.length === 0}
          >
            {bulkLoading
              ? 'در حال انجام...'
              : `اعمال روی ${selectedTickets.length} تیکت`}
          </button>

          <button
            className="btn btn-outline"
            type="button"
            onClick={() => setSelectedTickets([])}
            disabled={selectedTickets.length === 0}
          >
            لغو انتخاب
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">در حال دریافت تیکت‌ها...</div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">تیکتی پیدا نشد.</div>
      ) : (
        <div className="table-wrap table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={
                      tickets.length > 0 &&
                      selectedTickets.length === tickets.length
                    }
                    onChange={toggleAllTickets}
                  />
                </th>
                <th>تیکت</th>
                <th>ثبت‌کننده</th>
                <th>دسته‌بندی</th>
                <th>اولویت</th>
                <th>وضعیت</th>
                <th>کارشناس</th>
                <th>پیام‌ها</th>
                <th>عملیات</th>
              </tr>
            </thead>

            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedTickets.includes(ticket.id)}
                      onChange={() => toggleTicket(ticket.id)}
                    />
                  </td>

                  <td>
                    <strong>{ticket.title}</strong>
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                      #{ticket.id}
                    </div>
                  </td>

                  <td>{ticket.user?.username || '-'}</td>
                  <td>{ticket.category_name || '-'}</td>
                  <td>{getPriorityText(ticket.priority)}</td>

                  <td>
                    <select
                      className="form-control"
                      value={ticket.status}
                      onChange={(e) =>
                        handleStatusChange(ticket.id, e.target.value)
                      }
                    >
                      <option value="open">باز</option>
                      <option value="pending">در انتظار</option>
                      <option value="closed">بسته</option>
                      <option value="revision">نیاز به اصلاح</option>
                    </select>
                  </td>

                  <td>
                    <select
                      className="form-control"
                      value={ticket.assigned_to || ''}
                      onChange={(e) =>
                        handleAssignChange(ticket.id, e.target.value)
                      }
                    >
                      <option value="">بدون کارشناس</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.username}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>{ticket.messages_count || 0}</td>

                  <td>
                    <Link
                      to={`/tickets/${ticket.id}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <button className="btn btn-outline">جزئیات</button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}