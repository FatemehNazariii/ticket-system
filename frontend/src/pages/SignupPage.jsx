import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function SignupPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    password2: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    setSuccess('');

    if (form.password !== form.password2) {
      setError('رمز عبور و تکرار آن مطابقت ندارند.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/register/', {
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
        password2: form.password2,
      });

      setSuccess('ثبت‌نام با موفقیت انجام شد. در حال انتقال به صفحه ورود...');

      setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (err) {
      console.log('REGISTER ERROR:', err.response?.data);

      const data = err.response?.data;
      let msg = 'خطا در ثبت‌نام. لطفاً اطلاعات را بررسی کنید.';

      if (data) {
        if (data.username) msg = data.username[0];
        else if (data.email) msg = data.email[0];
        else if (data.phone) msg = data.phone[0];
        else if (data.password) msg = data.password[0];
        else if (data.password2) msg = data.password2[0];
        else if (data.non_field_errors) msg = data.non_field_errors[0];
        else if (data.detail) msg = data.detail;
        else msg = JSON.stringify(data);
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

          <h1 className="auth-title">ثبت‌نام در سامانه</h1>

          <p className="auth-subtitle">
            حساب کاربری بسازید و درخواست‌های پشتیبانی خود را ثبت و پیگیری کنید.
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>نام کاربری</label>
            <input
              className="form-control"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="مثلاً: ali123"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label>ایمیل</label>
            <input
              className="form-control"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@email.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>شماره تلفن</label>
            <input
              className="form-control"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="مثلاً: 09123456789"
              autoComplete="tel"
            />
          </div>

          <div className="password-row">
            <div className="form-group">
              <label>رمز عبور</label>
              <input
                className="form-control"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="رمز عبور"
                required
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label>تکرار رمز عبور</label>
              <input
                className="form-control"
                name="password2"
                type="password"
                value={form.password2}
                onChange={handleChange}
                placeholder="تکرار رمز عبور"
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="auth-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
            </button>

            <button
              className="btn btn-outline"
              type="button"
              onClick={() => navigate('/login')}
            >
              ورود
            </button>
          </div>
        </form>

        <div className="auth-footer">
          قبلاً حساب ساخته‌اید؟ <Link to="/login">وارد شوید</Link>
        </div>
      </section>
    </main>
  );
}