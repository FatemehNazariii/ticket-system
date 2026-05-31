import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import socket from '../socket';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

const fetchUnreadNotifications = async () => {
  try {
    const res = await api.get('/notifications/');
    const list = res.data.results || res.data;

    const unread = list.filter((item) => !item.is_read);

    setNotifications(
      unread.map((item) => ({
        id: item.id,
        message: item.message,
        title: item.title,
        type: item.notification_type,
        ticket_id: item.ticket_id,
        created_at: new Date(item.created_at).toLocaleTimeString('fa-IR'),
      }))
    );

    setUnreadCount(unread.length);
  } catch (err) {
    console.error('UNREAD NOTIFICATIONS ERROR:', err.response?.data || err.message);
  }
};

  const getRoleText = () => {
    if (user?.is_superuser) return 'مدیر کل';
    if (user?.is_staff || user?.role === 'agent') return 'اپراتور';
    if (user?.role === 'admin') return 'مدیر';
    return 'کاربر عادی';
  };

  const navLinkStyle = ({ isActive }) => ({
    textDecoration: 'none',
    color: isActive ? '#2563eb' : '#334155',
    background: isActive ? '#dbeafe' : 'transparent',
    padding: '0.55rem 0.85rem',
    borderRadius: '12px',
    fontWeight: 800,
    transition: '0.2s ease',
  });

  useEffect(() => {
    if (!user?.id) return;

    fetchUnreadNotifications();

    const interval = setInterval(() => {
      fetchUnreadNotifications();
    }, 30000);

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join_user', user.id);

    if (
      user.is_staff ||
      user.is_superuser ||
      user.role === 'agent' ||
      user.role === 'admin'
    ) {
      socket.emit('join_staff');
    }

    const handleGlobalNotification = (data) => {
      setNotifications((prev) => [
        {
          id: Date.now(),
          message: data.message,
          type: data.type,
          ticket_id: data.ticket_id,
          created_at: new Date().toLocaleTimeString('fa-IR'),
        },
        ...prev,
      ]);

      setUnreadCount((prev) => prev + 1);
    };

    socket.on('global_notification', handleGlobalNotification);

    return () => {
      clearInterval(interval);
      socket.off('global_notification', handleGlobalNotification);
    };
  }, [user]);

  const handleNotificationClick = (notification) => {
    setShowNotifications(false);

    if (notification.ticket_id) {
      navigate(`/tickets/${notification.ticket_id}`);
    }
  };

  const clearNotifications = async () => {
    try {
      await api.post('/notifications/mark_all_read/');
      setNotifications([]);
      setUnreadCount(0);
      setShowNotifications(false);
    } catch (err) {
      console.error('CLEAR NOTIFICATIONS ERROR:', err.response?.data || err.message);
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        direction: 'rtl',
        background: 'rgba(255, 255, 255, 0.86)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 6px 20px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div
        style={{
          width: 'min(1200px, calc(100% - 32px))',
          margin: '0 auto',
          minHeight: '72px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link
            to="/tickets"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem',
              color: '#111827',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: 'white',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 900,
                boxShadow: '0 10px 20px rgba(37, 99, 235, 0.25)',
              }}
            >
              T
            </div>

            <div>
              <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>
                سامانه تیکتینگ
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                مدیریت پشتیبانی
              </div>
            </div>
          </Link>

          <nav style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {user ? (
              <>
                <NavLink to="/tickets" style={navLinkStyle}>
                  تیکت‌ها
                </NavLink>

                <NavLink to="/tickets/new" style={navLinkStyle}>
                  تیکت جدید
                </NavLink>

                <NavLink to="/profile" style={navLinkStyle}>
                  پروفایل
                </NavLink>
                {(user?.role === 'agent' || user?.role === 'admin' || user?.is_staff) && (
  <NavLink to="/agent/dashboard" style={navLinkStyle}>
    پنل کارشناس
  </NavLink>
)}

               {user?.is_superuser && (
  <div style={{ position: 'relative' }}>
    <button
      type="button"
      className="btn btn-outline"
      onClick={() => setShowAdminMenu((prev) => !prev)}
    >
      مدیریت ▼
    </button>

    {showAdminMenu && (
      <div
        style={{
          position: 'absolute',
          top: '110%',
          right: 0,
          minWidth: '220px',
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          zIndex: 999,
        }}
      >
        <NavLink
          to="/admin/dashboard"
          style={{
            display: 'block',
            padding: '12px 16px',
            textDecoration: 'none',
            color: '#334155',
          }}
        >
          📊 داشبورد
        </NavLink>

        <NavLink
          to="/admin/tickets"
          style={{
            display: 'block',
            padding: '12px 16px',
            textDecoration: 'none',
            color: '#334155',
          }}
        >
          🎫 مدیریت تیکت‌ها
        </NavLink>

        <NavLink
          to="/admin/users"
          style={{
            display: 'block',
            padding: '12px 16px',
            textDecoration: 'none',
            color: '#334155',
          }}
        >
          👥 کاربران
        </NavLink>

        <NavLink
          to="/admin/categories"
          style={{
            display: 'block',
            padding: '12px 16px',
            textDecoration: 'none',
            color: '#334155',
          }}
        >
          📂 دسته‌بندی‌ها
        </NavLink>
      </div>
    )}
  </div>
)}
              </>
            ) : (
              <>
                <NavLink to="/login" style={navLinkStyle}>
                  ورود
                </NavLink>

                <NavLink to="/signup" style={navLinkStyle}>
                  ثبت‌نام
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-outline notification-button"
                onClick={() => setShowNotifications((prev) => !prev)}
                type="button"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <strong>اعلان‌ها</strong>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="notification-clear"
                        onClick={clearNotifications}
                      >
                        خواندن همه
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="notification-empty">
                      تعداد اعلان‌های خوانده‌نشده: {unreadCount}
                    </div>
                  ) : (
                    <div className="notification-list">
                      {notifications.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="notification-item"
                          onClick={() => handleNotificationClick(item)}
                        >
                          <span>{item.message}</span>
                          <small>{item.created_at}</small>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e5e7eb',
                padding: '0.45rem 0.75rem',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#dbeafe',
                  color: '#1d4ed8',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 900,
                }}
              >
                {user.username?.charAt(0)?.toUpperCase()}
              </span>

              <span style={{ fontWeight: 800, color: '#334155' }}>
                {user.username}
              </span>

              <span style={{ color: '#94a3b8' }}>•</span>

              <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                {getRoleText()}
              </span>
            </div>

            <button className="btn btn-outline" onClick={logout}>
              خروج
            </button>
          </div>
        )}
      </div>
    </header>
  );
}