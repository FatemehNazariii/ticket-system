import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import socket from '../socket';
import Avatar from '../components/Avatar';

export default function TicketDetailPage() {
  const { user } = useAuth();
  const canChangeStatus = user?.is_staff === true || user?.is_superuser === true;

  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [categories, setCategories] = useState([]);
  const [agents, setAgents] = useState([]);

  const [newMessage, setNewMessage] = useState('');
  const [messageAttachment, setMessageAttachment] = useState(null);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const [notification, setNotification] = useState('');

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fileUrl = (url) => {
    if (!url) return '#';
    return url.startsWith('http') ? url : `http://127.0.0.1:8000${url}`;
  };

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/tickets/${id}/`);
      setTicket(res.data);
    } catch (err) {
      console.error('خطا در دریافت تیکت:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories/');
      const cats = Array.isArray(res.data) ? res.data : res.data.results || [];
      setCategories(cats);
    } catch (err) {
      console.error('خطا در دریافت دسته‌بندی‌ها:', err);
    }
  };
  const fetchAgents = async () => {
    try {
      const res = await api.get('/auth/users/agents/');

      const list = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];

      setAgents(list);
    } catch (err) {
      console.error('خطا در دریافت کارشناسان:', err);
    }
  };

useEffect(() => {
  fetchTicket();
  fetchCategories();
  fetchAgents();
}, [id]);

  useEffect(() => {
    if (!id) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join_ticket', id);

    const handleTicketNotification = (data) => {
      if (String(data.ticket_id) === String(id)) {
        setNotification(data.message);
        fetchTicket();

        setTimeout(() => {
          setNotification('');
        }, 4000);
      }
    };

    socket.on('ticket_notification', handleTicketNotification);

    return () => {
      socket.emit('leave_ticket', id);
      socket.off('ticket_notification', handleTicketNotification);
    };
  }, [id]);

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

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);

    try {
      await api.patch(`/tickets/${id}/change_status/`, {
        status: newStatus,
      });

      setTicket((prev) => ({
        ...prev,
        status: newStatus,
      }));

      setNotification('وضعیت تیکت با موفقیت تغییر کرد.');
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      toast.error('خطا در تغییر وضعیت. ممکن است مجوز این کار را نداشته باشید.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      await api.patch(`/tickets/${id}/`, {
        priority: newPriority,
      });

      setTicket((prev) => ({
        ...prev,
        priority: newPriority,
      }));

      setNotification('اولویت تیکت با موفقیت تغییر کرد.');
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      toast.error('خطا در تغییر اولویت. ممکن است مجوز این کار را نداشته باشید.');
    }
  };

  const handleCategoryChange = async (newCategoryId) => {
    try {
      await api.patch(`/tickets/${id}/`, {
        category: newCategoryId || null,
      });

      const selectedCategory = categories.find((cat) => String(cat.id) === String(newCategoryId));

      setTicket((prev) => ({
        ...prev,
        category: newCategoryId || null,
        category_name: selectedCategory?.name || '',
      }));

      setNotification('دسته‌بندی تیکت با موفقیت تغییر کرد.');
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      toast.error('خطا در تغییر دسته‌بندی');
    }
  };

  const handleAssignChange = async (agentId) => {
  if (!agentId) return;

  try {
    const res = await api.patch(`/tickets/${id}/assign/`, {
      assigned_to: agentId,
    });

    setTicket(res.data);

    setNotification('کارشناس مسئول با موفقیت تغییر کرد.');
    setTimeout(() => setNotification(''), 4000);
  } catch (err) {
    console.log('ASSIGN ERROR:', err.response?.data);
    toast.error('خطا در ارجاع تیکت');
  }
};

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() && !messageAttachment) return;

    setSending(true);

    try {
      const formData = new FormData();
      formData.append('content', newMessage);

      if (messageAttachment) {
        formData.append('attachment', messageAttachment);
      }

      const res = await api.post(`/tickets/${id}/reply/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setTicket((prev) => ({
        ...prev,
        messages: [res.data, ...(prev.messages || [])],
      }));

      setNewMessage('');
      setMessageAttachment(null);

      const fileInput = document.getElementById('message-attachment-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.log('SEND MESSAGE ERROR:', err.response?.data);
      toast.error('خطا در ارسال پیام');
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async (messageId, newContent) => {
    try {
      const res = await api.patch(`/tickets/${id}/messages/${messageId}/`, {
        content: newContent,
      });

      setTicket((prev) => ({
        ...prev,
        messages: prev.messages.map((msg) =>
          msg.id === messageId ? { ...msg, content: res.data.content } : msg
        ),
      }));

      setEditingMessageId(null);
      setEditContent('');

      setNotification('پیام با موفقیت ویرایش شد.');
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      toast.error('خطا در ویرایش پیام');
    }
  };

  if (loading) {
    return <div className="loading">در حال دریافت اطلاعات تیکت...</div>;
  }

  if (!ticket) {
    return (
      <main className="page">
        <div className="empty-state">
          <h3>تیکت یافت نشد</h3>
          <button className="btn btn-primary" onClick={() => navigate('/tickets')}>
            بازگشت به تیکت‌ها
          </button>
        </div>
      </main>
    );
  }

  const messages = ticket.messages || [];

  return (
    <main className="page">
      <div className="toolbar">
        <div>
          <h1 className="page-title">جزئیات تیکت</h1>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 500 }}>
            مشاهده پیام‌ها، وضعیت و اطلاعات کامل تیکت.
          </p>
        </div>

        <button className="btn btn-outline" onClick={() => navigate('/tickets')}>
          بازگشت به تیکت‌ها
        </button>
      </div>

      {notification && <div className="alert alert-success">{notification}</div>}

      {ticket.status === 'revision' && !user?.is_staff && (
        <div
          className="alert"
          style={{
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #fde68a',
          }}
        >
          ⚠️ این تیکت نیاز به اصلاح دارد. لطفاً پیام اصلاحی خود را ارسال کنید.
        </div>
      )}

<div className="ticket-detail-layout">
  <section className="card ticket-main-card">
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '1rem',
        alignItems: 'flex-start',
        marginBottom: '1.5rem',
      }}
    >
      <div>
        <div style={{ color: '#94a3b8', fontWeight: 800, marginBottom: '0.4rem' }}>
          #{ticket.id}
        </div>

        <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#111827' }}>
          {ticket.title}
        </h2>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginTop: '1rem',
          }}
        >
          <span className={getStatusClass(ticket.status)}>
            {getStatusText(ticket.status)}
          </span>

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

          <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
            {ticket.category_name || 'بدون دسته‌بندی'}
          </span>
        </div>
      </div>
    </div>

    <div className="ticket-description-box">
      {ticket.description}
    </div>

    {ticket.attachment && (
      <a
        href={fileUrl(ticket.attachment)}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: '1rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          textDecoration: 'none',
          background: '#eff6ff',
          color: '#1d4ed8',
          padding: '0.75rem 1rem',
          borderRadius: '14px',
          fontWeight: 800,
          border: '1px solid #bfdbfe',
        }}
      >
        📎 مشاهده / دانلود فایل تیکت
      </a>
    )}
  </section>

<aside className="card ticket-side-card">
  <h3>اطلاعات تیکت</h3>

  <div className="ticket-side-info">
    <div className="ticket-side-item">
      <span>کارشناس مسئول</span>

      {canChangeStatus ? (
        <select
          className="form-control"
          value={ticket.assigned_to || ''}
          onChange={(e) => handleAssignChange(e.target.value)}
        >
          <option value="">بدون کارشناس</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.username} - {agent.role}
            </option>
          ))}
        </select>
      ) : (
        <strong>{ticket.assigned_to_detail?.username || 'ارجاع نشده'}</strong>
      )}
    </div>

    <div className="ticket-side-item">
      <span>ثبت‌کننده</span>
      <strong>{ticket.user?.username || '-'}</strong>
    </div>

    <div className="ticket-side-item">
      <span>تاریخ ایجاد</span>
      <strong>{new Date(ticket.created_at).toLocaleString('fa-IR')}</strong>
    </div>

    <div className="ticket-side-item">
      <span>SLA پاسخگویی</span>

      {ticket.sla_status === 'waiting' ? (
        <strong style={{ color: '#92400e' }}>در انتظار اولین پاسخ</strong>
      ) : ticket.sla_status === 'ok' ? (
        <strong style={{ color: '#166534' }}>رعایت شده ✅</strong>
      ) : (
        <strong style={{ color: '#991b1b' }}>نقض شده ❌</strong>
      )}

      <strong style={{ marginTop: '0.35rem', color: '#64748b' }}>
        {ticket.first_response_minutes === null
          ? 'هنوز پاسخی ثبت نشده'
          : `اولین پاسخ: ${ticket.first_response_minutes} دقیقه بعد`}
      </strong>
    </div>
  </div>
</aside>
</div>
      

      <section className="card ticket-messages-card">
        <div className="toolbar" style={{ marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>پیام‌ها</h2>
            <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>
              گفتگو و پیگیری‌های مربوط به این تیکت.
            </p>
          </div>

          <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
            {messages.length} پیام
          </span>
        </div>

        {messages.length === 0 ? (
          <div className="empty-state">هنوز پیامی برای این تیکت ثبت نشده است.</div>
        ) : (
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            {[...messages].reverse().map((msg) => {
              const isStaffMessage = msg.author?.is_staff || msg.author?.is_superuser;

              return (
               <div
  key={msg.id}
  className={`message-box ${isStaffMessage ? 'staff' : ''}`}
>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
<Avatar
  user={msg.author}
  size="40px"
/>

                      <div>
                        <strong style={{ color: '#111827' }}>
                          {msg.author?.username || 'کاربر'}
                        </strong>

                        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                          {new Date(msg.created_at).toLocaleString('fa-IR')}
                        </div>
                      </div>
                    </div>

                    {isStaffMessage && (
                      <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                        پشتیبانی
                      </span>
                    )}
                  </div>

                  {editingMessageId === msg.id ? (
                    <div>
                      <textarea
                        className="form-control"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows="3"
                      />

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleEditMessage(msg.id, editContent)}
                        >
                          ذخیره
                        </button>

                        <button
                          className="btn btn-outline"
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditContent('');
                          }}
                        >
                          انصراف
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="message-content">
  {msg.content}
</p>
                      {msg.attachment && (
                        <a
                          href={fileUrl(msg.attachment)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            marginTop: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            textDecoration: 'none',
                            background: '#f8fafc',
                            color: '#2563eb',
                            padding: '0.55rem 0.85rem',
                            borderRadius: '12px',
                            fontWeight: 800,
                            border: '1px solid #dbeafe',
                          }}
                        >
                          📎 مشاهده / دانلود فایل پیام
                        </a>
                      )}

                      {canChangeStatus && (
                        <div style={{ marginTop: '0.8rem' }}>
                          <button
                            className="btn btn-outline"
                            onClick={() => {
                              setEditingMessageId(msg.id);
                              setEditContent(msg.content);
                            }}
                          >
                            ویرایش پیام
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
   {canChangeStatus && (
  <section
    className="card"
    style={{
      marginTop: '1.25rem',
      background: 'linear-gradient(180deg, #ffffff, #f8fafc)',
    }}
  >
    <div className="toolbar" style={{ marginBottom: '1.25rem' }}>
      <div>
        <h2 style={{ margin: 0 }}>🕓 تاریخچه فعالیت‌ها</h2>
        <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>
          تغییرات مهم ثبت‌شده برای این تیکت.
        </p>
      </div>

      <span className="badge" style={{ background: '#eef2ff', color: '#3730a3' }}>
        {ticket.activity_logs?.length || 0} رویداد
      </span>
    </div>

    {!ticket.activity_logs || ticket.activity_logs.length === 0 ? (
      <div className="empty-state">هنوز فعالیتی ثبت نشده است.</div>
    ) : (
      <div style={{ display: 'grid', gap: '0.85rem' }}>
        {ticket.activity_logs.map((log) => (
          <div
            key={log.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '42px 1fr',
              gap: '0.85rem',
              padding: '0.9rem 1rem',
              border: '1px solid #e2e8f0',
              borderRadius: '18px',
              background: '#ffffff',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'grid',
                placeItems: 'center',
                fontSize: '1.15rem',
              }}
            >
              📝
            </div>

            <div>
              <strong style={{ color: '#0f172a' }}>{log.description}</strong>

              <div style={{ marginTop: '0.3rem', color: '#64748b', fontSize: '0.9rem' }}>
                توسط {log.user?.username || 'سیستم'} •{' '}
                {new Date(log.created_at).toLocaleString('fa-IR')}
              </div>

              {(log.old_value || log.new_value) && (
                <div
                  style={{
                    marginTop: '0.65rem',
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '999px',
                      background: '#f1f5f9',
                      color: '#475569',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    از: {log.old_value || '-'}
                  </span>

                  <span style={{ color: '#94a3b8', fontWeight: 900 }}>←</span>

                  <span
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '999px',
                      background: '#dcfce7',
                      color: '#166534',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    به: {log.new_value || '-'}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
)}


<section className="card ticket-reply-card">        {ticket.status === 'closed' ? (
          <div className="alert alert-error" style={{ marginBottom: 0 }}>
            این تیکت بسته شده و امکان ارسال پیام جدید وجود ندارد.
          </div>
        ) : (
          <form onSubmit={handleSendMessage}>
            <h3 style={{ marginTop: 0 }}>ارسال پاسخ</h3>

            <div className="form-group">
              <textarea
                className="form-control"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="پیام خود را بنویسید..."
                rows="4"
              />
            </div>

            <div className="form-group">
              <label
                style={{
                  display: 'block',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '16px',
                  padding: '1rem',
                  textAlign: 'center',
                  background: '#f8fafc',
                  cursor: 'pointer',
                }}
              >
                <input
                  id="message-attachment-input"
                  type="file"
                  onChange={(e) => setMessageAttachment(e.target.files[0] || null)}
                  style={{ display: 'none' }}
                />

                <strong style={{ color: '#334155' }}>
                  {messageAttachment ? messageAttachment.name : '📎 فایل ضمیمه اختیاری'}
                </strong>
              </label>
            </div>

            <button className="btn btn-primary" type="submit" disabled={sending}>
              {sending ? 'در حال ارسال...' : 'ارسال پیام'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
