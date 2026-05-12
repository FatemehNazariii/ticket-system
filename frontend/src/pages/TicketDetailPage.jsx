import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function TicketDetailPage() {
    const { user } = useAuth();
    const canChangeStatus = user?.role === 'agent' || user?.role === 'admin';
    const { id } = useParams();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [userRole, setUserRole] = useState(null); // 'user', 'agent', 'admin'

  // دریافت نقش کاربر (از یک endpoint ساده، مثلاً /api/auth/me/)
const fetchUserRole = async () => {
    try {
      // اگر endpoint مخصوص نقش دارید، از آن استفاده کنید، در غیر این می‌توانید موقتاً از localStorage یا فرض کنید admin است.
      // برای این مثال، فرض می‌کنیم یک endpoint به نام /api/auth/me/ وجود دارد.
      const res = await api.get('/auth/me/');
      setUserRole(res.data.role);
    } catch (err) {
      console.error('نقش کاربر دریافت نشد', err);
      // اگر endpoint ندارید، می‌توانید از این خط صرف نظر کنید و همه بتوانند تغییر وضعیت بدهند.
      // فقط backend مجوزها را چک می‌کند.
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
    fetchUserRole(); // اختیاری
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
      // به روز رسانی وضعیت در state محلی
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

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', direction: 'rtl' }}>
      <button onClick={() => navigate('/tickets')} style={{ marginBottom: '1rem', cursor: 'pointer' }}>← بازگشت</button>
      
      <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
        <h2>{ticket.title}</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <p><strong>وضعیت:</strong> {getStatusText(ticket.status)}</p>
          {/* دراپ‌داون تغییر وضعیت - فقط برای agent/admin */}
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
              </select>
              {statusUpdating && <span> در حال تغییر...</span>}
            </div>
          )}
        </div>
        <p><strong>اولویت:</strong> {getPriorityText(ticket.priority)}</p>
        <p><strong>دسته‌بندی:</strong> {ticket.category?.name || '-'}</p>
        <p><strong>توضیحات:</strong> {ticket.description}</p>
        <p><small>ایجاد شده: {new Date(ticket.created_at).toLocaleString('fa-IR')}</small></p>
      </div>

      <h3>پیام‌ها</h3>
      <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', maxHeight: '400px', overflowY: 'auto', marginBottom: '1rem' }}>
        {ticket.messages && ticket.messages.length > 0 ? (
          [...ticket.messages].reverse().map(msg => (
            <div key={msg.id} style={{ borderBottom: '1px solid #eee', marginBottom: '0.5rem', paddingBottom: '0.5rem' }}>
              <strong>{msg.author?.username || 'کاربر'}</strong> <small>({new Date(msg.created_at).toLocaleString('fa-IR')})</small>
              <p style={{ margin: '0.5rem 0 0 0' }}>{msg.content}</p>
            </div>
          ))
        ) : (
          <p>هیچ پیامی وجود ندارد.</p>
        )}
      </div>

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