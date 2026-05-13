import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // تعیین متن نقش بر اساس is_staff
 const getRoleText = () => {
  if (user?.is_superuser) return 'مدیر کل';
  if (user?.is_staff) return 'اپراتور';
  return 'کاربر عادی';
};

  return (
    <header style={{
      background: '#3B6D11',
      color: 'white',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      direction: 'rtl'
    }}>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <Link to="/tickets" style={{ color: 'white', textDecoration: 'none' }}>تیکت‌ها</Link>
        <Link to="/tickets/new" style={{ color: 'white', textDecoration: 'none' }}>تیکت جدید</Link>
        <Link to="/profile" style={{ color: 'white', textDecoration: 'none' }}>پروفایل</Link>
        {user?.is_staff && (
          <Link to="/admin/users" style={{ color: 'white', textDecoration: 'none' }}>مدیریت کاربران</Link>
        )}
      </div>
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>{user.username} ({getRoleText()})</span>
          <button onClick={handleLogout} style={{
            background: 'transparent',
            border: '1px solid white',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>خروج</button>
        </div>
      )}
    </header>
  );
}