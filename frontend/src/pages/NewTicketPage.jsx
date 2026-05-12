import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function NewTicketPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'medium',
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // دریافت لیست دسته‌بندی‌ها از سرور
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories/');
        setCategories(res.data);
      } catch (err) {
        console.error('خطا در دریافت دسته‌بندی‌ها:', err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // داده‌های مورد انتظار بک‌اند (بر اساس مدل Ticket)
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category_id || null,
      priority: form.priority,
      status: 'open',    // پیش‌فرض
    };

    try {
      await api.post('/tickets/', payload);
      navigate('/tickets'); // بعد از ایجاد، به لیست تیکت‌ها برو
    } catch (err) {
      setError('خطا در ایجاد تیکت. لطفاً دوباره تلاش کن.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', direction: 'rtl' }}>
      <h2>تیکت جدید</h2>
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>عنوان</label><br />
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>توضیحات</label><br />
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="4"
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>دسته‌بندی</label><br />
          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="">انتخاب کنید</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>اولویت</label><br />
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="low">پایین</option>
            <option value="medium">متوسط</option>
            <option value="high">بالا</option>
            <option value="urgent">فوری</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#3B6D11',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          {loading ? 'در حال ارسال...' : 'ایجاد تیکت'}
        </button>
      </form>
    </div>
  );
}