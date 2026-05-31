import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function UserListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    password2: '',
    role: 'user',
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get('/auth/users/', {
        params: { page },
      });

      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      const count = Array.isArray(res.data) ? data.length : res.data.count || data.length;

      setUsers(data);
      setTotalPages(Math.ceil(count / 10) || 1);
    } catch (err) {
      console.error(err);
      setError('خطا در دریافت کاربران');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin':
        return 'مدیر';
      case 'agent':
        return 'اپراتور';
      case 'user':
        return 'کاربر عادی';
      default:
        return role;
    }
  };

  const getRoleClass = (role) => {
    switch (role) {
      case 'admin':
        return 'badge badge-revision';
      case 'agent':
        return 'badge badge-pending';
      case 'user':
        return 'badge badge-open';
      default:
        return 'badge';
    }
  };

  const resetNewUser = () => {
    setNewUser({
      username: '',
      email: '',
      phone: '',
      password: '',
      password2: '',
      role: 'user',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('آیا از حذف این کاربر مطمئن هستید؟')) return;

    try {
      await api.delete(`/auth/users/${id}/`);
      showSuccess('کاربر با موفقیت حذف شد.');
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError('خطا در حذف کاربر');
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.patch(`/auth/users/${id}/update_role/`, {
        role: newRole,
      });

      showSuccess('نقش کاربر با موفقیت تغییر کرد.');
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError('خطا در تغییر نقش کاربر');
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await api.patch(`/auth/users/${id}/update_role/`, {
        is_active: !isActive,
      });

      showSuccess(isActive ? 'کاربر غیرفعال شد.' : 'کاربر فعال شد.');
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError('خطا در تغییر وضعیت کاربر');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');

    if (newUser.password !== newUser.password2) {
      setError('رمز عبور و تکرار آن مطابقت ندارند');
      return;
    }

    try {
      await api.post('/auth/users/', newUser);

      setShowAddModal(false);
      resetNewUser();
      showSuccess('کاربر جدید با موفقیت ایجاد شد.');
      fetchUsers();
    } catch (err) {
      console.log('ADD USER ERROR:', err.response?.data);

      const data = err.response?.data;
      let msg = 'خطا در ایجاد کاربر';

      if (data) {
        if (data.username) msg = data.username[0];
        else if (data.email) msg = data.email[0];
        else if (data.phone) msg = data.phone[0];
        else if (data.password) msg = data.password[0];
        else if (data.password2) msg = data.password2[0];
        else if (data.role) msg = data.role[0];
        else if (data.detail) msg = data.detail;
        else msg = JSON.stringify(data);
      }

      setError(msg);
    }
  };

  const filteredUsers = users.filter((user) => {
    const keyword = search.toLowerCase();

    return (
      user.username?.toLowerCase().includes(keyword) ||
      user.email?.toLowerCase().includes(keyword) ||
      user.phone?.toLowerCase().includes(keyword)
    );
  });

  if (loading) {
    return <div className="loading">در حال دریافت کاربران...</div>;
  }

  return (
    <main className="page">
      <div className="toolbar">
        <div>
          <h1 className="page-title">مدیریت کاربران</h1>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 500 }}>
            کاربران سامانه را مشاهده، اضافه، حذف یا سطح دسترسی آن‌ها را مدیریت کنید.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + کاربر جدید
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>جستجو</label>
            <input
              className="form-control"
              type="text"
              placeholder="نام کاربری، ایمیل یا شماره تلفن..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <span
            className="badge"
            style={{
              background: '#dbeafe',
              color: '#1d4ed8',
              alignSelf: 'end',
              marginBottom: '0.25rem',
            }}
          >
            {filteredUsers.length} کاربر
          </span>
        </div>
      </div>

      <section className="card">
        <div className="toolbar" style={{ marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>لیست کاربران</h2>
            <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>
              همه کاربران ثبت‌شده در سامانه.
            </p>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-state">کاربری با این جستجو پیدا نشد.</div>
        ) : (
          <div className="table-wrap table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>کاربر</th>
                  <th>ایمیل</th>
                  <th>تلفن</th>
                  <th>نقش</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                        <span
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: '#dbeafe',
                            color: '#1d4ed8',
                            display: 'grid',
                            placeItems: 'center',
                            fontWeight: 900,
                          }}
                        >
                          {user.username?.charAt(0)?.toUpperCase() || 'U'}
                        </span>

                        <div>
                          <strong>{user.username}</strong>
                          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                            #{user.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>{user.email || '-'}</td>
                    <td>{user.phone || '-'}</td>

                    <td>
                      <select
                        className="form-control"
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        style={{ minWidth: '135px' }}
                      >
                        <option value="user">کاربر عادی</option>
                        <option value="agent">اپراتور</option>
                        <option value="admin">مدیر</option>
                      </select>

                      <div style={{ marginTop: '0.45rem' }}>
                        <span className={getRoleClass(user.role)}>{getRoleText(user.role)}</span>
                      </div>
                    </td>

                    <td>
                      <span
                        className="badge"
                        style={{
                          background: user.is_active ? '#dcfce7' : '#fee2e2',
                          color: user.is_active ? '#166534' : '#991b1b',
                        }}
                      >
                        {user.is_active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-outline"
                          onClick={() => handleToggleActive(user.id, user.is_active)}
                        >
                          {user.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                        </button>

                        <button className="btn btn-danger" onClick={() => handleDelete(user.id)}>
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div
          style={{
            marginTop: '1.25rem',
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <button
            className="btn btn-outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            قبلی
          </button>

          <span style={{ fontWeight: 800, color: '#475569' }}>
            صفحه {page} از {totalPages}
          </span>

          <button
            className="btn btn-outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            بعدی
          </button>
        </div>
      </section>

      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="card"
            style={{
              width: 'min(520px, 100%)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="toolbar">
              <div>
                <h2 style={{ margin: 0 }}>افزودن کاربر جدید</h2>
                <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>
                  اطلاعات کاربر را وارد کنید.
                </p>
              </div>

              <button className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                بستن
              </button>
            </div>

            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label>نام کاربری</label>
                <input
                  className="form-control"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>ایمیل</label>
                <input
                  className="form-control"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>تلفن</label>
                <input
                  className="form-control"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                />
              </div>

              <div className="responsive-form-grid">
                <div className="form-group">
                  <label>رمز عبور</label>
                  <input
                    className="form-control"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>تکرار رمز عبور</label>
                  <input
                    className="form-control"
                    type="password"
                    value={newUser.password2}
                    onChange={(e) => setNewUser({ ...newUser, password2: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>نقش</label>
                <select
                  className="form-control"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="user">کاربر عادی</option>
                  <option value="agent">اپراتور</option>
                  <option value="admin">مدیر</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button className="btn btn-primary" type="submit">
                  ایجاد کاربر
                </button>

                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => setShowAddModal(false)}
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}