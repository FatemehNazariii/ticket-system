import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute() {
  const { user, loading } = useAuth();

  console.log('USER IN ADMIN ROUTE:', user);

  if (loading) {
    return <p style={{ direction: 'rtl', padding: '2rem' }}>در حال بررسی دسترسی...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.is_superuser) {
    return <Navigate to="/tickets" replace />;
  }

  return <Outlet />;
}