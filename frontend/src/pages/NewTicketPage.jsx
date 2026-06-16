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
    attachment: null,
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories/');
        setCategories(Array.isArray(res.data) ? res.data : res.data.results || []);
      } catch (err) {
        console.error('خطا در دریافت دسته‌بندی‌ها:', err);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'attachment') {
      setForm({ ...form, attachment: files[0] || null });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('priority', form.priority);
      if (form.category_id) formData.append('category', form.category_id);
      if (form.attachment) formData.append('attachment', form.attachment);

      await api.post('/tickets/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/tickets');
    } catch (err) {
      console.error(err.response?.data);
      setError('خطا در ایجاد تیکت. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <div className="toolbar">
        <h1>ثبت تیکت جدید</h1>
        <p>مشکل، درخواست یا سؤال خود را ثبت کنید تا تیم پشتیبانی بررسی کند.</p>
        <button className="btn btn-outline" onClick={() => navigate('/tickets')}>بازگشت به تیکت‌ها</button>
      </div>

      <div className="ticket-page-grid">
        
        {/* ستون سمت چپ - راهنما */}
        <aside className="ticket-guide">
          <h3>راهنمای ثبت تیکت</h3>
          <div>
            <strong>عنوان واضح بنویسید:</strong>
            <p>عنوان کوتاه و مشخص کمک می‌کند تیکت سریع‌تر بررسی شود.</p>
            <strong>جزئیات کامل بدهید:</strong>
            <p>زمان وقوع مشکل، پیام خطا و مراحل تکرار مشکل را بنویسید.</p>
            <strong>فایل ضمیمه کنید:</strong>
            <p>اگر اسکرین‌شات یا فایل مرتبط دارید، ضمیمه کردن آن بررسی را سریع‌تر می‌کند.</p>
          </div>
          <div className="tip">
            💡 تیکت‌های فوری را فقط زمانی انتخاب کنید که مشکل واقعاً بحرانی باشد.
          </div>
        </aside>
        <section className="ticket-form-card">
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="ticket-form-grid">
            <div className="form-group">
              <label>عنوان تیکت</label>
              <input
                className="form-control"
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="مثلاً: مشکل در ورود به حساب کاربری"
                required
              />
            </div>

            <div className="form-group">
              <label>توضیحات</label>
              <textarea
                className="form-control"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="5"
                placeholder="جزئیات مشکل یا درخواست خود را کامل توضیح دهید..."
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>دسته‌بندی</label>
                <select
                  className="form-control"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  disabled={categoriesLoading}
                >
                  <option value="">
                    {categoriesLoading ? 'در حال دریافت...' : 'انتخاب دسته‌بندی'}
                  </option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>اولویت</label>
                <select
                  className="form-control"
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                >
                  <option value="low">پایین</option>
                  <option value="medium">متوسط</option>
                  <option value="high">بالا</option>
                  <option value="urgent">فوری</option>
                </select>
              </div>
            </div>

            <div className="form-group attachment-upload">
              <label className="upload-box">
  <input
    type="file"
    name="attachment"
    onChange={handleChange}
  />

  <div className="upload-icon">📎</div>

  <strong>
    {form.attachment ? form.attachment.name : 'برای انتخاب فایل کلیک کنید'}
  </strong>

  <p>تصویر، PDF، فایل متنی یا مستندات مرتبط</p>
</label>
            </div>

            <div className="ticket-actions">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? 'در حال ایجاد...' : 'ایجاد تیکت'}
              </button>
              <button className="btn btn-outline" type="button" onClick={() => navigate('/tickets')}>انصراف</button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}