import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refetchUser } = useAuth();   // اضافه شد

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // تغییر آدرس به '/auth/login/' (هماهنگ با بک‌اند)
      const res = await api.post('/auth/login/', { username: form.username, password: form.password });
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);
      await refetchUser();   // به‌روزرسانی اطلاعات کاربر (نقش و ...)
      navigate('/tickets');
    } catch (err) {
      console.error(err);
      setError('نام کاربری یا رمز عبور اشتباه است');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f5f5'}}>
      <div style={{background:'white',padding:'2rem',borderRadius:'12px',width:'360px',boxShadow:'0 2px 16px #0001'}}>
        <h2 style={{textAlign:'center',marginBottom:'1.5rem',direction:'rtl'}}>ورود به سیستم</h2>
        {error && <div style={{background:'#fee',color:'#c00',padding:'8px',borderRadius:'6px',marginBottom:'1rem',direction:'rtl'}}>{error}</div>}
        <div style={{display:'flex',flexDirection:'column',gap:'1rem',direction:'rtl'}}>
          <input placeholder="نام کاربری" value={form.username}
            onChange={e => setForm({...form, username: e.target.value})}
            style={{padding:'10px',borderRadius:'6px',border:'1px solid #ddd',fontSize:'14px',direction:'rtl'}} />
          <input type="password" placeholder="رمز عبور" value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            style={{padding:'10px',borderRadius:'6px',border:'1px solid #ddd',fontSize:'14px',direction:'rtl'}} />
          <button onClick={handleSubmit} disabled={loading}
            style={{padding:'10px',background:'#3B6D11',color:'white',border:'none',borderRadius:'6px',fontSize:'14px',cursor:'pointer'}}>
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
        </div>
      </div>
    </div>
  );
}