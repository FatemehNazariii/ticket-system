import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function KnowledgeListPage() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    title: '',
    content: '',
    category: '',
    is_published: true,
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchArticles = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get('/knowledge/');
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setArticles(data);
    } catch (err) {
      console.log('KNOWLEDGE LIST ERROR:', err.response?.data);
      setError('خطا در دریافت مقاله‌ها');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories/');
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setCategories(data);
    } catch (err) {
      console.log('CATEGORY LIST ERROR:', err.response?.data);
    }
  };

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  const resetForm = () => {
    setForm({
      title: '',
      content: '',
      category: '',
      is_published: true,
    });
    setEditingId(null);
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      setError('عنوان مقاله الزامی است');
      return;
    }

    if (!form.content.trim()) {
      setError('محتوای مقاله الزامی است');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      title: form.title,
      content: form.content,
      category: form.category || null,
      is_published: form.is_published,
    };

    try {
      if (editingId) {
        await api.patch(`/knowledge/${editingId}/`, payload);
        showSuccess('مقاله با موفقیت ویرایش شد.');
      } else {
        await api.post('/knowledge/', payload);
        showSuccess('مقاله جدید با موفقیت اضافه شد.');
      }

      resetForm();
      fetchArticles();
    } catch (err) {
      console.log('KNOWLEDGE SAVE ERROR:', err.response?.data);

      const data = err.response?.data;
      let msg = 'خطا در ذخیره مقاله';

      if (data) {
        if (data.title) msg = data.title[0];
        else if (data.content) msg = data.content[0];
        else if (data.category) msg = data.category[0];
        else if (data.detail) msg = data.detail;
        else msg = JSON.stringify(data);
      }

      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (article) => {
    setEditingId(article.id);

    setForm({
      title: article.title || '',
      content: article.content || '',
      category: article.category || '',
      is_published: Boolean(article.is_published),
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('آیا از حذف این مقاله مطمئن هستید؟');

    if (!confirmed) return;

    try {
      await api.delete(`/knowledge/${id}/`);
      showSuccess('مقاله با موفقیت حذف شد.');
      fetchArticles();
    } catch (err) {
      console.log('KNOWLEDGE DELETE ERROR:', err.response?.data);
      setError('خطا در حذف مقاله');
    }
  };

  if (loading) {
    return <div className="loading">در حال دریافت مقاله‌ها...</div>;
  }

  return (
    <main className="page">
      <div className="toolbar">
        <div>
          <h1 className="page-title">مدیریت مقالات راهنما</h1>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 500 }}>
            مقاله‌های مرکز راهنما را ایجاد، ویرایش یا حذف کنید.
          </p>
        </div>

        <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
          {articles.length} مقاله
        </span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="responsive-grid">
        <section className="card">
          <h2 style={{ marginTop: 0 }}>
            {editingId ? 'ویرایش مقاله' : 'افزودن مقاله جدید'}
          </h2>

          <p style={{ color: '#64748b', marginTop: '-0.5rem' }}>
            مقاله‌های راهنما باعث کاهش تیکت‌های تکراری می‌شوند.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>عنوان مقاله</label>
              <input
                className="form-control"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="مثلاً: مشکل در ورود به حساب"
                required
              />
            </div>

            <div className="form-group">
              <label>دسته‌بندی</label>
              <select
                className="form-control"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">بدون دسته‌بندی</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>محتوا</label>
              <textarea
                className="form-control"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows="9"
                placeholder="متن کامل مقاله را بنویسید..."
                required
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) =>
                    setForm({ ...form, is_published: e.target.checked })
                  }
                />
                منتشر شده
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'در حال ذخیره...' : editingId ? 'ذخیره تغییرات' : 'افزودن مقاله'}
              </button>

              {editingId && (
                <button className="btn btn-outline" type="button" onClick={resetForm}>
                  انصراف از ویرایش
                </button>
              )}
            </div>
          </form>
        </section>

        <aside className="card">
          <h3 style={{ marginTop: 0 }}>راهنمای مرکز دانش</h3>

          <div style={{ display: 'grid', gap: '1rem', color: '#475569' }}>
            <div>
              <strong>موضوع‌های پرتکرار را مقاله کنید</strong>
              <p style={{ margin: '0.35rem 0 0' }}>
                هر سوالی که زیاد تکرار می‌شود، بهتر است به مقاله تبدیل شود.
              </p>
            </div>

            <div>
              <strong>مقاله را ساده بنویسید</strong>
              <p style={{ margin: '0.35rem 0 0' }}>
                متن باید مرحله‌به‌مرحله و قابل فهم برای کاربر عادی باشد.
              </p>
            </div>

            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '14px',
                padding: '1rem',
                color: '#1e40af',
                fontWeight: 700,
              }}
            >
              💡 مقاله‌های منتشرشده برای کاربران در مرکز راهنما نمایش داده می‌شوند.
            </div>
          </div>
        </aside>
      </div>

      <section className="card" style={{ marginTop: '1.25rem' }}>
        <div className="toolbar" style={{ marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>لیست مقاله‌ها</h2>
            <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>
              همه مقاله‌های ثبت‌شده در مرکز راهنما.
            </p>
          </div>
        </div>

        {articles.length === 0 ? (
          <div className="empty-state">هنوز مقاله‌ای ثبت نشده است.</div>
        ) : (
          <div className="table-wrap table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>عنوان</th>
                  <th>دسته‌بندی</th>
                  <th>وضعیت انتشار</th>
                  <th>آخرین بروزرسانی</th>
                  <th>عملیات</th>
                </tr>
              </thead>

              <tbody>
                {articles.map((article) => (
                  <tr key={article.id}>
                    <td>
                      <strong>{article.title}</strong>
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        #{article.id}
                      </div>
                    </td>

                    <td>{article.category_name || '-'}</td>

                    <td>
                      {article.is_published ? (
                        <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>
                          منتشر شده
                        </span>
                      ) : (
                        <span className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}>
                          پیش‌نویس
                        </span>
                      )}
                    </td>

                    <td>
                      {article.updated_at
                        ? new Date(article.updated_at).toLocaleString('fa-IR')
                        : '-'}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-outline" onClick={() => handleEdit(article)}>
                          ویرایش
                        </button>

                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(article.id)}
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}