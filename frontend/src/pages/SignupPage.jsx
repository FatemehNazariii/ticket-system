import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function SignupPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    password2: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refetchUser } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (form.password !== form.password2) {
      setError('رمز عبور و تکرار آن مطابقت ندارند');
      setLoading(false);
      return;
    }
    try {
      const response = await api.post('/auth/register/', {
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
        password2: form.password2,
      });
      localStorage.setItem('access', response.data.access);
      localStorage.setItem('refresh', response.data.refresh);
      await refetchUser();
      navigate('/tickets');
    } catch (err) {
      const data = err.response?.data;
      let msg = 'خطا در ثبت‌نام';
      if (data) {
        if (data.username) msg = data.username[0];
        else if (data.email) msg = data.email[0];
        else if (data.phone) msg = data.phone[0];
        else if (data.password) msg = data.password[0];
        else if (data.non_field_errors) msg = data.non_field_errors[0];
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', direction: 'rtl' }}>
      <h2>ثبت‌نام</h2>
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>نام کاربری</label><br />
          <input name="username" value={form.username} onChange={handleChange} required />
        </div>
        <div>
          <label>ایمیل (اختیاری)</label><br />
          <input name="email" type="email" value={form.email} onChange={handleChange} />
        </div>
        <div>
          <label>شماره تلفن (اختیاری)</label><br />
          <input name="phone" value={form.phone} onChange={handleChange} />
        </div>
        <div>
          <label>رمز عبور</label><br />
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </div>
        <div>
          <label>تکرار رمز عبور</label><br />
          <input name="password2" type="password" value={form.password2} onChange={handleChange} required />
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: '1rem', padding: '8px 16px' }}>
          {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
        </button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        قبلاً حساب دارید؟ <Link to="/login">ورود</Link>
      </p>
    </div>
  );
}