import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

export default function ProfilePage() {
  const { user, refetchUser } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // State for password change
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_new_password: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

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
      await api.patch('/auth/profile/', form);
      await refetchUser();
      setMessage('پروفایل با موفقیت به‌روز شد');
    } catch (err) {
      setMessage(err.response?.data?.detail || 'خطا در به‌روزرسانی');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage('');
    try {
      await api.post('/auth/change-password/', passwordForm);
      setPasswordMessage('رمز عبور با موفقیت تغییر کرد. لطفاً با رمز جدید وارد شوید.');
      setPasswordForm({ old_password: '', new_password: '', confirm_new_password: '' });
      // optionally logout after password change? better to let user re-login manually.
    } catch (err) {
      const data = err.response?.data;
      let errorMsg = 'خطا در تغییر رمز';
      if (data?.old_password) errorMsg = data.old_password[0];
      else if (data?.new_password) errorMsg = data.new_password[0];
      else if (data?.confirm_new_password) errorMsg = data.confirm_new_password[0];
      else if (data?.detail) errorMsg = data.detail;
      setPasswordMessage(errorMsg);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', direction: 'rtl' }}>
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

      <hr style={{ margin: '2rem 0' }} />
      <h3>تغییر رمز عبور</h3>
      {passwordMessage && <div style={{ color: passwordMessage.includes('موفق') ? 'green' : 'red' }}>{passwordMessage}</div>}
      <form onSubmit={handlePasswordSubmit}>
        <div>
          <label>رمز عبور قدیمی</label><br />
          <input type="password" name="old_password" value={passwordForm.old_password} onChange={handlePasswordChange} required />
        </div>
        <div>
          <label>رمز عبور جدید</label><br />
          <input type="password" name="new_password" value={passwordForm.new_password} onChange={handlePasswordChange} required />
        </div>
        <div>
          <label>تکرار رمز عبور جدید</label><br />
          <input type="password" name="confirm_new_password" value={passwordForm.confirm_new_password} onChange={handlePasswordChange} required />
        </div>
        <button type="submit" disabled={passwordLoading} style={{ marginTop: '1rem' }}>
          {passwordLoading ? 'در حال تغییر...' : 'تغییر رمز'}
        </button>
      </form>
    </div>
  );
}