import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { refetchUser } = useAuth();

  const [form, setForm] = useState({
    username: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login/', {
        username: form.username,
        password: form.password,
      });

      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);

      await refetchUser();
      navigate('/tickets');
    } catch (err) {
      console.log('LOGIN ERROR:', err.response?.data);

      const data = err.response?.data;
      let msg = 'نام کاربری یا رمز عبور اشتباه است.';

      if (data) {
        if (data.detail) msg = data.detail;
        else if (data.non_field_errors) msg = data.non_field_errors[0];
        else if (data.username) msg = data.username[0];
        else if (data.password) msg = data.password[0];
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">T</div>

          <h1 className="auth-title">ورود به سامانه</h1>

          <p className="auth-subtitle">
            برای مشاهده و مدیریت تیکت‌های پشتیبانی وارد حساب کاربری خود شوید.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>نام کاربری</label>
            <input
              className="form-control"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="نام کاربری خود را وارد کنید"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label>رمز عبور</label>
            <input
              className="form-control"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="رمز عبور خود را وارد کنید"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="auth-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'در حال ورود...' : 'ورود'}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          حساب کاربری ندارید؟ <Link to="/signup">ثبت‌نام کنید</Link>
        </div>
      </section>
    </main>
  );
}