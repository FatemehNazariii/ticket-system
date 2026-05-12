import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

export default function ProfilePage() {
  const { user, refetchUser } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await api.patch('/auth/profile/', form);
      await refetchUser();
      setMessage('پروفایل با موفقیت به‌روز شد');
    } catch (err) {
      setMessage(err.response?.data?.detail || 'خطا در به‌روزرسانی');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', direction: 'rtl' }}>
      <h2>پروفایل کاربری</h2>
      {message && <div style={{ color: message.includes('موفق') ? 'green' : 'red' }}>{message}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>نام کاربری</label><br />
          <input name="username" value={form.username} onChange={handleChange} required />
        </div>
        <div>
          <label>ایمیل</label><br />
          <input name="email" type="email" value={form.email} onChange={handleChange} />
        </div>
        <div>
          <label>شماره تلفن</label><br />
          <input name="phone" value={form.phone} onChange={handleChange} />
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
        </button>
      </form>
    </div>
  );
}