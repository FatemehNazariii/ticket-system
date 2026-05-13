import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function UserListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', phone: '', password: '', password2: '', role: 'user' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); 

  const fetchUsers = async () => {
    setLoading(true);
    try {
        const res = await api.get('/auth/users/', { params: { page } });
        setUsers(res.data.results);
        const total = Math.ceil(res.data.count / 10); // PAGE_SIZE=10
        setTotalPages(total);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
    };

useEffect(() => {
  fetchUsers();
}, [page]);

  const handleDelete = async (id) => {
    if (window.confirm('آیا از حذف این کاربر مطمئن هستید؟')) {
      await api.delete(`/auth/users/${id}/`);
      fetchUsers();
    }
  };

  const handleRoleChange = async (id, newRole) => {
    await api.patch(`/auth/users/${id}/update_role/`, { role: newRole });
    fetchUsers();
  };

  const handleToggleActive = async (id, isActive) => {
    await api.patch(`/auth/users/${id}/update_role/`, { is_active: !isActive });
    fetchUsers();
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/users/', newUser);
      setShowAddModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'خطا در ایجاد کاربر');
    }
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div>بارگذاری...</div>;

  return (
    <div style={{ padding: '2rem', direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2>مدیریت کاربران</h2>
        <button onClick={() => setShowAddModal(true)}>+ کاربر جدید</button>
      </div>
      <input
        type="text"
        placeholder="جستجو..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: '1rem', padding: '6px', width: '300px' }}
      />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f2f2f2' }}>
            <th>نام کاربری</th><th>ایمیل</th><th>تلفن</th><th>نقش</th><th>فعال</th><th>عملیات</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.email || '-'}</td>
              <td>{user.phone || '-'}</td>
              <td>
                <select value={user.role} onChange={e => handleRoleChange(user.id, e.target.value)}>
                  <option value="user">کاربر عادی</option>
                  <option value="agent">اپراتور</option>
                  <option value="admin">مدیر</option>
                </select>
              </td>
              <td>
                <button onClick={() => handleToggleActive(user.id, user.is_active)}>
                  {user.is_active ? 'غیرفعال' : 'فعال'}
                </button>
              </td>
              <td>
                <button onClick={() => handleDelete(user.id)} style={{ color: 'red' }}>حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* مودال ساده افزودن کاربر */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: '20%', left: '30%', background: 'white', padding: '2rem', border: '1px solid #ccc', zIndex: 1000 }}>
          <h3>کاربر جدید</h3>
          <form onSubmit={handleAddUser}>
            <input placeholder="نام کاربری" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} required /><br/>
            <input placeholder="ایمیل" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} /><br/>
            <input placeholder="تلفن" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} /><br/>
            <input type="password" placeholder="رمز" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required /><br/>
            <input type="password" placeholder="تکرار رمز" value={newUser.password2} onChange={e => setNewUser({...newUser, password2: e.target.value})} required /><br/>
            <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
              <option value="user">کاربر عادی</option>
              <option value="agent">اپراتور</option>
              <option value="admin">مدیر</option>
            </select><br/>
            <button type="submit">ایجاد</button>
            <button type="button" onClick={() => setShowAddModal(false)}>انصراف</button>
          </form>
        </div>
      )}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>
    قبلی
  </button>
  <span>صفحه {page} از {totalPages}</span>
  <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}>
    بعدی
  </button>
</div>
    </div>
  );
}