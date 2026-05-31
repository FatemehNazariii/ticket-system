import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function ProfilePage() {
  const { user, refetchUser, logout } = useAuth();

  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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

  const getInitial = () => {
    return user?.username?.charAt(0)?.toUpperCase() || 'U';
  };

  const isSuccessMessage = (text) => text.includes('موفق');

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await api.patch('/auth/profile/', form);
      await refetchUser();
      setMessage('پروفایل با موفقیت به‌روز شد.');
    } catch (err) {
      const data = err.response?.data;
      let msg = 'خطا در به‌روزرسانی پروفایل';

      if (data) {
        if (data.username) msg = data.username[0];
        else if (data.email) msg = data.email[0];
        else if (data.phone) msg = data.phone[0];
        else if (data.detail) msg = data.detail;
        else msg = JSON.stringify(data);
      }

      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage('');

    if (passwordForm.new_password !== passwordForm.confirm_new_password) {
      setPasswordMessage('رمز عبور جدید و تکرار آن مطابقت ندارند.');
      setPasswordLoading(false);
      return;
    }

    try {
      await api.post('/auth/change-password/', passwordForm);

      setPasswordMessage('رمز عبور با موفقیت تغییر کرد.');
      setPasswordForm({
        old_password: '',
        new_password: '',
        confirm_new_password: '',
      });
    } catch (err) {
      const data = err.response?.data;
      let errorMsg = 'خطا در تغییر رمز';

      if (data) {
        if (data.old_password) errorMsg = data.old_password[0];
        else if (data.new_password) errorMsg = data.new_password[0];
        else if (data.confirm_new_password) errorMsg = data.confirm_new_password[0];
        else if (data.detail) errorMsg = data.detail;
        else errorMsg = JSON.stringify(data);
      }

      setPasswordMessage(errorMsg);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <main className="page profile-page">
      <div className="toolbar">
        <div>
          <h1 className="page-title">پروفایل کاربری</h1>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 500 }}>
            اطلاعات حساب خود را مدیریت و بروزرسانی کنید.
          </p>
        </div>

        <button className="btn btn-outline" onClick={logout}>
          خروج از حساب
        </button>
      </div>

      <section className="profile-hero-card">
        <div className="profile-avatar-large">
          {getInitial()}
        </div>

        <div className="profile-hero-info">
          <div>
            <h2>{user?.username || '-'}</h2>
            <span className={getRoleClass()}>{getRoleText()}</span>
          </div>

          <div className="profile-mini-grid">
            <div className="profile-mini-item">
              <span>ایمیل</span>
              <strong>{user?.email || '-'}</strong>
            </div>

            <div className="profile-mini-item">
              <span>شماره تلفن</span>
              <strong>{user?.phone || '-'}</strong>
            </div>

            <div className="profile-mini-item">
              <span>شناسه</span>
              <strong>#{user?.id || '-'}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="profile-content-grid">
        <div className="card profile-form-card">
          <div className="profile-card-header">
            <h2>ویرایش اطلاعات</h2>
            <p>نام کاربری، ایمیل و شماره تلفن خود را بروزرسانی کنید.</p>
          </div>

          {message && (
            <div className={isSuccessMessage(message) ? 'alert alert-success' : 'alert alert-error'}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>نام کاربری</label>
              <input
                className="form-control"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
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
              />
            </div>

            <div className="form-group">
              <label>شماره تلفن</label>
              <input
                className="form-control"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="مثلاً 09123456789"
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
          </form>
        </div>

        <div className="card profile-form-card">
          <div className="profile-card-header">
            <h2>تغییر رمز عبور</h2>
            <p>برای امنیت بیشتر، رمز عبور قوی انتخاب کنید.</p>
          </div>

          {passwordMessage && (
            <div
              className={
                isSuccessMessage(passwordMessage) ? 'alert alert-success' : 'alert alert-error'
              }
            >
              {passwordMessage}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label>رمز عبور فعلی</label>
              <input
                className="form-control"
                type="password"
                name="old_password"
                value={passwordForm.old_password}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div className="form-group">
              <label>رمز عبور جدید</label>
              <input
                className="form-control"
                type="password"
                name="new_password"
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div className="form-group">
              <label>تکرار رمز عبور جدید</label>
              <input
                className="form-control"
                type="password"
                name="confirm_new_password"
                value={passwordForm.confirm_new_password}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={passwordLoading}>
              {passwordLoading ? 'در حال تغییر...' : 'تغییر رمز عبور'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}