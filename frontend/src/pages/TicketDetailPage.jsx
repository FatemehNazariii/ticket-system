import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function TicketDetailPage() {
  const { user } = useAuth();
  const canChangeStatus = user?.is_staff === true;
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
const [editContent, setEditContent] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [categories, setCategories] = useState([]);
  useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories/');
      const cats = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setCategories(cats);
    } catch (err) {
      console.error('خطا در دریافت دسته‌بندی‌ها:', err);
    }
  };
  fetchCategories();
}, []);
    const handlePriorityChange = async (newPriority) => {
    try {
        await api.patch(`/tickets/${id}/`, { priority: newPriority });
        setTicket(prev => ({ ...prev, priority: newPriority }));
        alert('اولویت با موفقیت تغییر کرد');
    } catch (err) {
        alert('خطا در تغییر اولویت');
    }
    };

    const handleCategoryChange = async (newCategoryId) => {
    try {
        await api.patch(`/tickets/${id}/`, { category: newCategoryId });
        // برای به‌روزرسانی نام دسته‌بندی در UI، باید دوباره تیکت را دریافت کنیم یا آپدیت دستی
        const updatedTicket = { ...ticket, category: categories.find(c => c.id == newCategoryId) };
        setTicket(updatedTicket);
        alert('دسته‌بندی با موفقیت تغییر کرد');
    } catch (err) {
        alert('خطا در تغییر دسته‌بندی');
    }
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

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/tickets/${id}/reply/`, { content: newMessage });
      setTicket(prev => ({
        ...prev,
        messages: [res.data, ...(prev.messages || [])]
      }));
      setNewMessage('');
      // اگر وضعیت revision بود، می‌توانید frontend آن را به pending تغییر دهید (یا به backend واگذار کنید)
      if (ticket.status === 'revision') {
        // می‌توانید در backend این کار را انجام دهید. فعلاً فقط پیام می‌دهیم.
      }
    } catch (err) {
      alert('خطا در ارسال پیام');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      await api.patch(`/tickets/${id}/change_status/`, { status: newStatus });
      setTicket(prev => ({ ...prev, status: newStatus }));
      alert('وضعیت تیکت با موفقیت تغییر کرد');
    } catch (err) {
      console.error(err);
      alert('خطا در تغییر وضعیت. ممکن است شما مجوز این کار را نداشته باشید.');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>در حال بارگذاری...</div>;
  if (!ticket) return <div style={{ padding: '2rem', textAlign: 'center' }}>تیکت یافت نشد</div>;

  // ----- اضافه شده: محاسبه آخرین پاسخ ادمین -----
  const lastAdminReply = ticket.messages?.filter(msg => 
    msg.author?.role === 'agent' || msg.author?.role === 'admin'
  ).slice(-1)[0];
  const lastAdminReplyTime = lastAdminReply ? new Date(lastAdminReply.created_at).toLocaleString('fa-IR') : null;

  const getStatusText = (status) => {
    switch (status) {
      case 'open': return 'باز';
      case 'pending': return 'در انتظار';
      case 'closed': return 'بسته';
      case 'revision': return 'نیاز به اصلاح';
      default: return status;
    }
  };
  const handleEditMessage = async (messageId, newContent) => {
  try {
    const res = await api.patch(`/tickets/${id}/messages/${messageId}/`, { content: newContent });
    // به‌روزرسانی پیام در state
    setTicket(prev => ({
      ...prev,
      messages: prev.messages.map(msg => 
        msg.id === messageId ? { ...msg, content: res.data.content } : msg
      )
    }));
    setEditingMessageId(null);
    setEditContent('');
  } catch (err) {
    alert('خطا در ویرایش پیام');
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

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', direction: 'rtl' }}>
      <button onClick={() => navigate('/tickets')} style={{ marginBottom: '1rem', cursor: 'pointer' }}>← بازگشت</button>

      {/* هشدار نیاز به اصلاح برای کاربر عادی */}
      {ticket.status === 'revision' && !user?.is_staff && (
        <div style={{ background: '#fff3cd', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', borderRight: '4px solid #ffc107' }}>
          <strong>⚠️ این تیکت نیاز به اصلاح دارد.</strong> لطفاً پیام اصلاحی خود را ارسال کنید.
        </div>
      )}

      <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
        <h2>{ticket.title}</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <p><strong>وضعیت:</strong> {getStatusText(ticket.status)}</p>
          {canChangeStatus && (
            <div>
              <label>تغییر وضعیت: </label>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={statusUpdating}
                style={{ marginRight: '8px', padding: '4px', borderRadius: '4px' }}
              >
                <option value="open">باز</option>
                <option value="pending">در انتظار</option>
                <option value="closed">بسته</option>
                <option value="revision">نیاز به اصلاح</option>   {/* اضافه شد */}
              </select>
              {statusUpdating && <span> در حال تغییر...</span>}
            </div>
          )}
        </div>
        <p>
  <strong>اولویت:</strong>
  {canChangeStatus ? (
    <select value={ticket.priority} onChange={e => handlePriorityChange(e.target.value)} style={{ marginRight: '8px' }}>
      <option value="low">پایین</option>
      <option value="medium">متوسط</option>
      <option value="high">بالا</option>
      <option value="urgent">فوری</option>
    </select>
  ) : (
    ` ${getPriorityText(ticket.priority)}`
  )}
</p>

<p>
  <strong>دسته‌بندی:</strong>
  {canChangeStatus ? (
    <select value={ticket.category?.id || ''} onChange={e => handleCategoryChange(e.target.value)} style={{ marginRight: '8px' }}>
      <option value="">بدون دسته‌بندی</option>
      {categories.map(cat => (
        <option key={cat.id} value={cat.id}>{cat.name}</option>
      ))}
    </select>
  ) : (
    ` ${ticket.category?.name || '-'}`
  )}
</p>
       
      </div>

      <h3>پیام‌ها</h3>
     {ticket.messages && ticket.messages.length > 0 ? (
  [...ticket.messages].reverse().map(msg => (
    <div key={msg.id} style={{ borderBottom: '1px solid #eee', marginBottom: '0.5rem', paddingBottom: '0.5rem' }}>
      <strong>{msg.author?.username || 'کاربر'}</strong> <small>({new Date(msg.created_at).toLocaleString('fa-IR')})</small>
      {editingMessageId === msg.id ? (
        <div>
          <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows="2" style={{ width: '100%' }} />
          <button onClick={() => handleEditMessage(msg.id, editContent)}>ذخیره</button>
          <button onClick={() => setEditingMessageId(null)}>انصراف</button>
        </div>
      ) : (
        <>
          <p style={{ margin: '0.5rem 0 0 0' }}>{msg.content}</p>
          {canChangeStatus && (
            <button onClick={() => { setEditingMessageId(msg.id); setEditContent(msg.content); }} style={{ fontSize: '12px' }}>ویرایش</button>
          )}
        </>
      )}
    </div>
  ))
) : (
  <p>هیچ پیامی وجود ندارد.</p>
)}

      <form onSubmit={handleSendMessage}>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="پیام خود را بنویسید..."
          rows="3"
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
          required
        />
        <button
          type="submit"
          disabled={sending}
          style={{ marginTop: '8px', background: '#3B6D11', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
        >
          {sending ? 'در حال ارسال...' : 'ارسال پیام'}
        </button>
      </form>
    </div>
  );
}