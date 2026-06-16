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
  justifyContent: 'flex-start',
  gap: '10px',
  padding: '0.75rem 1rem',
  minHeight: '46px',
  borderRadius: '14px',
  textDecoration: 'none',
  fontWeight: 800,
  color: isActive ? '#2563eb' : '#334155',
  background: isActive ? '#dbeafe' : 'transparent',
  border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
});
  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div>
            <strong> سامانه تیکتینگ</strong>
          </div>
        </div>

<nav
  className="sidebar-nav"
  style={{
    marginTop: '1rem',
    display: 'grid',
    gap: '6px',
  }}
>
  <NavLink to="/tickets" style={linkStyle} onClick={onClose}>
    🎫 تیکت‌ها
  </NavLink>

  <NavLink to="/tickets/new" style={linkStyle} onClick={onClose}>
    ➕ تیکت جدید
  </NavLink>

  <NavLink to="/profile" style={linkStyle} onClick={onClose}>
    👤 پروفایل
  </NavLink>

  {isAgent && (
    <NavLink to="/agent/dashboard" style={linkStyle} onClick={onClose}>
      👨‍💼 پنل کارشناس
    </NavLink>
  )}

  <NavLink to="/knowledge" style={linkStyle} onClick={onClose}>
    📚 مرکز راهنما
  </NavLink>

  {isAdmin && (
    <>
      <div className="sidebar-section">مدیریت</div>

      <NavLink to="/admin/dashboard" style={linkStyle} onClick={onClose}>
        📊 داشبورد
      </NavLink>

      <NavLink to="/agents-performance" style={linkStyle} onClick={onClose}>
  🏆 عملکرد کارشناسان
</NavLink>

      <NavLink to="/admin/tickets" style={linkStyle} onClick={onClose}>
        🛠 مدیریت تیکت‌ها
      </NavLink>

      <NavLink to="/admin/users" style={linkStyle} onClick={onClose}>
        👥 کاربران
      </NavLink>

      <NavLink to="/admin/categories" style={linkStyle} onClick={onClose}>
        📂 دسته‌بندی‌ها
      </NavLink>

      <NavLink to="/admin/knowledge" style={linkStyle} onClick={onClose}>
        📚 مدیریت مقالات
      </NavLink>

      
    </>
  )}
</nav>
      </aside>
    </>
  );
}

