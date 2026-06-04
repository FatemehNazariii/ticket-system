import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  if (!user) return null;

  const isAdmin = user?.is_superuser;
  const isAgent = user?.role === 'agent' || user?.role === 'admin' || user?.is_staff;

  const linkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.7rem',
    padding: '0.8rem 1rem',
    borderRadius: '14px',
    textDecoration: 'none',
    fontWeight: 800,
    color: isActive ? '#2563eb' : '#334155',
    background: isActive ? '#dbeafe' : 'transparent',
  });

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <span>T</span>
          <div>
            <strong>سامانه تیکتینگ</strong>
            <small>پنل مدیریت</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/tickets" style={linkStyle} onClick={onClose}>🎫 تیکت‌ها</NavLink>
          <NavLink to="/tickets/new" style={linkStyle} onClick={onClose}>➕ تیکت جدید</NavLink>
          <NavLink to="/profile" style={linkStyle} onClick={onClose}>👤 پروفایل</NavLink>

          {isAgent && (
            <NavLink to="/agent/dashboard" style={linkStyle} onClick={onClose}>
              👨‍💼 پنل کارشناس
            </NavLink>
          )}

          {isAdmin && (
            <>
              <div className="sidebar-section">مدیریت</div>
              <NavLink to="/admin/dashboard" style={linkStyle} onClick={onClose}>📊 داشبورد</NavLink>
              <NavLink to="/admin/tickets" style={linkStyle} onClick={onClose}>🛠 مدیریت تیکت‌ها</NavLink>
              <NavLink to="/admin/users" style={linkStyle} onClick={onClose}>👥 کاربران</NavLink>
              <NavLink to="/admin/categories" style={linkStyle} onClick={onClose}>📂 دسته‌بندی‌ها</NavLink>
              <NavLink to="/admin/knowledge" style={linkStyle} onClick={onClose}>
  📚 مقالات راهنما
</NavLink>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}

