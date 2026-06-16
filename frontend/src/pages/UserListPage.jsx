import { useState, useEffect } from 'react';
import api from '../api/axios';
import Avatar from '../components/Avatar';

export default function UserListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    role: 'user',
    password: '',
    avatar: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
    avatar: null,
  });

  const handleRoleChange = async (userId, newRole) => {
  setError('');
  setSuccess('');

  try {
    await api.patch(`/auth/users/${userId}/update_role/`, {
      role: newRole,
    });

    setSuccess('نقش کاربر با موفقیت تغییر کرد.');
    fetchUsers();
  } catch (err) {
    console.log('ROLE UPDATE ERROR:', err.response?.data);
    setError('خطا در تغییر نقش کاربر');
  }
};
const handleToggleActive = async (userId, isActive) => {
  setError('');
  setSuccess('');

  try {
    if (isActive) {
      await api.patch(`/auth/users/${userId}/deactivate/`);
      setSuccess('کاربر با موفقیت غیرفعال شد.');
    } else {
      await api.patch(`/auth/users/${userId}/activate/`);
      setSuccess('کاربر با موفقیت فعال شد.');
    }

    fetchUsers();
  } catch (err) {
    console.log('ACTIVE UPDATE ERROR:', err.response?.data);
    setError(err.response?.data?.error || 'خطا در تغییر وضعیت کاربر');
  }
};

const handleDeleteUser = async (userId) => {
  const confirmed = window.confirm('آیا از حذف این کاربر مطمئن هستید؟');

  if (!confirmed) return;

  setError('');
  setSuccess('');

  try {
    await api.delete(`/auth/users/${userId}/`);
    setSuccess('کاربر با موفقیت حذف شد.');
    fetchUsers();
  } catch (err) {
    console.log('DELETE USER ERROR:', err.response?.data);
    setError('خطا در حذف کاربر');
  }
};

const openEditUser = (u) => {
  setEditingUser(u);
 setEditForm({
  username: u.username || '',
  email: u.email || '',
  phone: u.phone || '',
  password: '',
  avatar: null,
});
};

const handleUpdateUser = async (e) => {
  e.preventDefault();

  if (!editingUser) return;

  const formData = new FormData();
  formData.append('username', editForm.username);
  formData.append('email', editForm.email);
  formData.append('phone', editForm.phone);

  if (editForm.password) {
  formData.append('password', editForm.password);
}

  if (editForm.avatar) {
    formData.append('avatar', editForm.avatar);
  }

  try {
    await api.patch(`/auth/users/${editingUser.id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    setSuccess('اطلاعات کاربر با موفقیت ویرایش شد.');
    setEditingUser(null);
    fetchUsers();
  } catch (err) {
    console.log('UPDATE USER ERROR:', err.response?.data);
    setError('خطا در ویرایش کاربر');
  }
};
const fetchUsers = async () => {
  setLoading(true);
  setError('');

  try {
    const res = await api.get('/auth/users/')

    const data = Array.isArray(res.data)
      ? res.data
      : res.data.results || [];

    setUsers(data);
  } catch (err) {
    console.log('USERS LIST ERROR:', err.response?.data);
    setError('خطا در دریافت کاربران');
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('username', newUser.username);
    formData.append('email', newUser.email);
    formData.append('role', newUser.role);
    formData.append('password', newUser.password);
    if (newUser.avatar) formData.append('avatar', newUser.avatar);

    try {
      await api.post('/auth/users/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('کاربر با موفقیت ایجاد شد.');
      setNewUser({ username: '', email: '', role: 'user', password: '', avatar: null });
      fetchUsers();
    } catch (err) {
      console.error(err.response?.data);
      setError('خطا در ایجاد کاربر');
    }
  };

  return (
    <main className="page">
      <h1>مدیریت کاربران</h1>

      <section className="card">
        <h2>افزودن کاربر جدید</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

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
            <label>نقش</label>
            <select
              className="form-control"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <option value="user">کاربر عادی</option>
              <option value="agent">اپراتور</option>
              <option value="admin">مدیر کل</option>
            </select>
          </div>

          <div className="form-group">
            <label>آواتار (اختیاری)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewUser({ ...newUser, avatar: e.target.files[0] || null })}
            />
          </div>

          <button className="btn btn-primary" type="submit">افزودن کاربر</button>
        </form>
      </section>
      {editingUser && (
  <section className="card" style={{ marginTop: '2rem' }}>
    <h2>ویرایش کاربر: {editingUser.username}</h2>

    <form onSubmit={handleUpdateUser}>
      <div className="form-group">
        <label>نام کاربری</label>
        <input
          className="form-control"
          value={editForm.username}
          onChange={(e) =>
            setEditForm({ ...editForm, username: e.target.value })
          }
          required
        />
      </div>

      <div className="form-group">
        <label>ایمیل</label>
        <input
          className="form-control"
          type="email"
          value={editForm.email}
          onChange={(e) =>
            setEditForm({ ...editForm, email: e.target.value })
          }
        />
      </div>

      <div className="form-group">
        <label>تلفن</label>
        <input
          className="form-control"
          value={editForm.phone}
          onChange={(e) =>
            setEditForm({ ...editForm, phone: e.target.value })
          }
        />
      </div>
      <div className="form-group">
  <label>رمز عبور جدید</label>
  <input
    className="form-control"
    type="password"
    value={editForm.password}
    onChange={(e) =>
      setEditForm({
        ...editForm,
        password: e.target.value,
      })
    }
    placeholder="برای عدم تغییر خالی بگذارید"
  />
</div>

      <div className="form-group">
        <label>آواتار جدید</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setEditForm({
              ...editForm,
              avatar: e.target.files[0] || null,
            })
          }
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-primary" type="submit">
          ذخیره تغییرات
        </button>

        <button
          className="btn btn-outline"
          type="button"
          onClick={() => setEditingUser(null)}
        >
          انصراف
        </button>
      </div>
    </form>
  </section>
)}
<section className="card" style={{ marginTop: '2rem' }}>
  <h2>لیست کاربران</h2>

  {loading ? (
    <div>در حال بارگذاری...</div>
  ) : (
    <table className="table">
      <thead>
        <tr>
  <th>کاربر</th>
  <th>ایمیل</th>
  <th>نقش</th>
  <th>وضعیت</th>
  <th>عملیات</th>
</tr>
      </thead>

<tbody>
  {users.map((u) => (
    <tr key={u.id}>
      <td>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Avatar user={u} size="40px" />
          <strong>{u.username}</strong>
        </div>
      </td>

      <td>{u.email || '-'}</td>

      <td>
        <select
          className="form-control"
          value={u.role}
          onChange={(e) => handleRoleChange(u.id, e.target.value)}
          style={{ minWidth: '150px' }}
        >
          <option value="user">کاربر عادی</option>
          <option value="agent">کارشناس</option>
          <option value="admin">مدیر کل</option>
        </select>
      </td>
      <td>
  {u.is_active ? (
    <span
      className="badge"
      style={{ background: '#dcfce7', color: '#166534' }}
    >
      فعال
    </span>
  ) : (
    <span
      className="badge"
      style={{ background: '#fee2e2', color: '#991b1b' }}
    >
      غیرفعال
    </span>
  )}
</td>

<td>
<div
  style={{
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'nowrap',
  }}
>    
<button
  className="btn btn-outline"
  type="button"
  onClick={() => openEditUser(u)}
  style={{ minWidth: '80px' }}
>
  ویرایش
</button>

<button
  className="btn btn-outline"
  type="button"
  onClick={() => handleToggleActive(u.id, u.is_active)}
  style={{ minWidth: '90px' }}
>
  {u.is_active ? 'غیرفعال' : 'فعال'}
</button>
<button
  className="btn btn-outline"
  type="button"
  onClick={() => handleDeleteUser(u.id)}
  style={{
    minWidth: '80px',
    color: '#991b1b',
    borderColor: '#fecaca',
  }}
>
  حذف
</button>
  </div>
</td>
    </tr>
  ))}
</tbody>
    </table>
  )}
</section>
    </main>
  );
}