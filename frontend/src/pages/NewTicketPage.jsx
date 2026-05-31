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
        const categoriesData = Array.isArray(res.data)
          ? res.data
          : res.data.results || [];

        setCategories(categoriesData);
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
      setForm({
        ...form,
        attachment: files[0] || null,
      });
      return;
    }

    setForm({
      ...form,
      [name]: value,
    });
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

      if (form.category_id) {
        formData.append('category', form.category_id);
      }

      if (form.attachment) {
        formData.append('attachment', form.attachment);
      }

      await api.post('/tickets/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      navigate('/tickets');
    } catch (err) {
      console.log('CREATE TICKET ERROR:', err.response?.data);

      const data = err.response?.data;
      let msg = 'خطا در ایجاد تیکت. لطفاً دوباره تلاش کن.';

      if (data) {
        if (data.title) msg = data.title[0];
        else if (data.description) msg = data.description[0];
        else if (data.category) msg = data.category[0];
        else if (data.priority) msg = data.priority[0];
        else if (data.attachment) msg = data.attachment[0];
        else if (data.detail) msg = data.detail;
        else msg = JSON.stringify(data);
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <div className="toolbar">
        <div>
          <h1 className="page-title">ثبت تیکت جدید</h1>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 500 }}>
            مشکل، درخواست یا سؤال خود را ثبت کنید تا تیم پشتیبانی بررسی کند.
          </p>
        </div>

        <button className="btn btn-outline" onClick={() => navigate('/tickets')}>
          بازگشت به تیکت‌ها
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 0.8fr',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        <section className="card">
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
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
                rows="7"
                placeholder="جزئیات مشکل یا درخواست خود را کامل توضیح دهید..."
                required
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
              }}
            >
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

                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
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

            <div className="form-group">
              <label>فایل ضمیمه اختیاری</label>

              <label
                style={{
                  display: 'block',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  transition: '0.2s ease',
                }}
              >
                <input
                  type="file"
                  name="attachment"
                  onChange={handleChange}
                  style={{ display: 'none' }}
                />

                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📎</div>

                <strong style={{ color: '#334155' }}>
                  {form.attachment ? form.attachment.name : 'برای انتخاب فایل کلیک کنید'}
                </strong>

                <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                  تصویر، PDF، فایل متنی یا مستندات مرتبط را ضمیمه کنید.
                </p>
              </label>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-start',
                marginTop: '1.25rem',
              }}
            >
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? 'در حال ایجاد...' : 'ایجاد تیکت'}
              </button>

              <button
                className="btn btn-outline"
                type="button"
                onClick={() => navigate('/tickets')}
              >
                انصراف
              </button>
            </div>
          </form>
        </section>

        <aside className="card">
          <h3 style={{ marginTop: 0 }}>راهنمای ثبت تیکت</h3>

          <div style={{ display: 'grid', gap: '1rem', color: '#475569' }}>
            <div>
              <strong>عنوان واضح بنویسید</strong>
              <p style={{ margin: '0.35rem 0 0' }}>
                عنوان کوتاه و مشخص کمک می‌کند تیکت سریع‌تر بررسی شود.
              </p>
            </div>

            <div>
              <strong>جزئیات کامل بدهید</strong>
              <p style={{ margin: '0.35rem 0 0' }}>
                زمان وقوع مشکل، پیام خطا و مراحل تکرار مشکل را بنویسید.
              </p>
            </div>

            <div>
              <strong>فایل ضمیمه کنید</strong>
              <p style={{ margin: '0.35rem 0 0' }}>
                اگر اسکرین‌شات یا فایل مرتبط دارید، ضمیمه کردن آن بررسی را سریع‌تر می‌کند.
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: '1.5rem',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '14px',
              padding: '1rem',
              color: '#1e40af',
              fontWeight: 700,
            }}
          >
            💡 تیکت‌های فوری را فقط زمانی انتخاب کنید که مشکل واقعاً بحرانی باشد.
          </div>
        </aside>
      </div>
    </main>
  );
}