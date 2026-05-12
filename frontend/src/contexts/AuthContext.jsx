import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('access');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me/');  // مطابق با آدرس endpoint شما
      setUser(res.data);
    } catch (err) {
      console.error('خطا در دریافت اطلاعات کاربر', err);
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

 const logout = () => {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  setUser(null);
};
  return (
    <AuthContext.Provider value={{ user, loading, logout, refetchUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);