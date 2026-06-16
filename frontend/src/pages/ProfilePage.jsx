import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Avatar from '../components/Avatar';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { user, refetchUser, logout } = useAuth();

  const [form, setForm] = useState({ username: '', email: '', phone: '' , signature: '',});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_new_password: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [recentTickets, setRecentTickets] = useState([]);
  const [stats, setStats] = useState({ tickets: 0, open: 0, closed: 0, articles: 0 });

  useEffect(() => {
    if (user) {
      setForm({ username: user.username || '', email: user.email || '', phone: user.phone || '' ,   signature: user.signature || '', });
      fetchStats();
      fetchRecentTickets();
    }
  }, [user]);
  const fetchRecentTickets = async () => {
  try {
    const res = await api.get('/tickets/');
    const data = Array.isArray(res.data) ? res.data : res.data.results || [];
    setRecentTickets(data.slice(0, 5));
  } catch (err) {
    console.error('Error fetching recent tickets:', err);
  }
};
  const fetchStats = async () => {
    try {
      const res = await api.get('/auth/stats/');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      await api.patch('/auth/profile/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refetchUser();
      setMessage('تصویر پروفایل با موفقیت بروزرسانی شد.');
    } catch (err) {
      console.error('AVATAR UPLOAD ERROR:', err.response?.data);
      setMessage('خطا در آپلود تصویر پروفایل');
    }
  };

  const getRoleText = () => {
    if (user?.is_superuser || user?.role === 'admin') return 'مدیر کل';
    if (user?.is_staff || user?.role === 'agent') return 'اپراتور';
    return 'کاربر عادی';
  };

  const getRoleClass = () => {
    if (user?.is_superuser || user?.role === 'admin') return 'badge badge-revision';
    if (user?.is_staff || user?.role === 'agent') return 'badge badge-pending';
    return 'badge badge-open';
  };

  const getInitial = () => user?.username?.charAt(0)?.toUpperCase() || 'U';
  const isSuccessMessage = (text) => text.includes('موفق');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage('');

    try {
      await api.patch('/auth/profile/', form);
      await refetchUser();
      setMessage('پروفایل با موفقیت به‌روز شد.');
    } catch (err) {
      const data = err.response?.data;
      let msg = data?.detail || 'خطا در به‌روزرسانی پروفایل';
      setMessage(msg);
    } finally { setLoading(false); }
  };

  const handlePasswordChange = (e) => setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

  const handlePasswordSubmit = async (e) => {
    e.preventDefault(); setPasswordLoading(true); setPasswordMessage('');
    if (passwordForm.new_password !== passwordForm.confirm_new_password) {
      setPasswordMessage('رمز عبور جدید و تکرار آن مطابقت ندارند.'); setPasswordLoading(false); return;
    }
    try {
      await api.post('/auth/change-password/', passwordForm);
      setPasswordMessage('رمز عبور با موفقیت تغییر کرد.');
      setPasswordForm({ old_password: '', new_password: '', confirm_new_password: '' });
    } catch (err) {
      const data = err.response?.data;
      setPasswordMessage(data?.detail || 'خطا در تغییر رمز');
    } finally { setPasswordLoading(false); }
  };

  return (
    <main className="page profile-page">
      <div className="toolbar">
        <h1 className="page-title">پروفایل کاربری</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 500 }}>
          مدیریت حساب کاربری و فعالیت‌ها
        </p>
        <button className="btn btn-outline" onClick={logout}>خروج از حساب</button>
      </div>

      {/* کارت پروفایل و آواتار */}
      <section className="profile-hero-card">
        <Avatar
          user={user}
          size="90px"
          onChange={handleAvatarChange}
        />

        <div className="profile-hero-info">
          <h2>{user?.username || '-'}</h2>
          <span className={getRoleClass()}>{getRoleText()}</span>

          <div className="profile-stats-grid">
            <div>🎫 کل تیکت‌ها: {stats.tickets}</div>
            <div>🟢 باز: {stats.open}</div>
            <div>✅ بسته: {stats.closed}</div>
            <div>📚 مقالات ثبت‌شده: {stats.articles}</div>
          </div>
        </div>
      </section>

      {/* فرم‌ها در گرید */}
      <section className="profile-content-grid">
        <div className="card profile-form-card profile-info-card">
          <h2>ویرایش اطلاعات</h2>
          {message && <div className={isSuccessMessage(message) ? 'alert alert-success' : 'alert alert-error'}>{message}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>نام کاربری</label>
              <input className="form-control" name="username" value={form.username} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>ایمیل</label>
              <input className="form-control" name="email" type="email" value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>شماره تلفن</label>
              <input className="form-control" name="phone" value={form.phone} onChange={handleChange} />
            </div>
            {(user?.role === 'agent' || user?.role === 'admin') && (
  <div className="form-group">
    <label>امضای پاسخ‌ها</label>
    <textarea
      className="form-control"
      name="signature"
      rows="4"
      value={form.signature}
      onChange={handleChange}
      placeholder="مثلاً: با احترام، کارشناس پشتیبانی"
    />
  </div>
)}
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
          </form>
        </div>

        <div className="card profile-form-card profile-password-card">
          <h2>تغییر رمز عبور</h2>
          {passwordMessage && <div className={isSuccessMessage(passwordMessage) ? 'alert alert-success' : 'alert alert-error'}>{passwordMessage}</div>}
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label>رمز عبور فعلی</label>
              <input className="form-control" type="password" name="old_password" value={passwordForm.old_password} onChange={handlePasswordChange} required />
            </div>
            <div className="form-group">
              <label>رمز عبور جدید</label>
              <input className="form-control" type="password" name="new_password" value={passwordForm.new_password} onChange={handlePasswordChange} required />
            </div>
            <div className="form-group">
              <label>تکرار رمز عبور جدید</label>
              <input className="form-control" type="password" name="confirm_new_password" value={passwordForm.confirm_new_password} onChange={handlePasswordChange} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={passwordLoading}>
              {passwordLoading ? 'در حال تغییر...' : 'تغییر رمز عبور'}
            </button>
          </form>
        </div>
      </section>

      <section className="card" style={{ marginTop: '1.5rem' }}>
  <div className="toolbar" style={{ marginBottom: '1rem' }}>
    <div>
      <h2 style={{ margin: 0 }}>آخرین تیکت‌های من</h2>
      <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)' }}>
        دسترسی سریع به آخرین درخواست‌های ثبت‌شده.
      </p>
    </div>

    <Link to="/tickets" style={{ textDecoration: 'none' }}>
      <button className="btn btn-outline">مشاهده همه</button>
    </Link>
  </div>

  {recentTickets.length === 0 ? (
    <div className="empty-state">هنوز تیکتی ثبت نکرده‌اید.</div>
  ) : (
    <div className="table-wrap table-responsive">
      <table className="table">
        <thead>
          <tr>
            <th>عنوان</th>
            <th>وضعیت</th>
            <th>تاریخ</th>
            <th>عملیات</th>
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

              <td>
                <span className={`badge badge-${ticket.status}`}>
                  {ticket.status}
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
  )}
</section>

      <footer style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        ⚡ طراحی و توسعه توسط تیم شما
      </footer>
    </main>
  );
}