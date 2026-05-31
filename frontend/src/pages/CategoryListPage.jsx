import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function CategoryListPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get('/categories/');
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setCategories(data);
    } catch (err) {
      console.log('CATEGORY LIST ERROR:', err.response?.data);
      setError('خطا در دریافت دسته‌بندی‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
    });
    setEditingId(null);
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError('نام دسته‌بندی الزامی است');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingId) {
        await api.patch(`/categories/${editingId}/`, {
          name: form.name,
          description: form.description,
        });

        showSuccess('دسته‌بندی با موفقیت ویرایش شد.');
      } else {
        await api.post('/categories/', {
          name: form.name,
          description: form.description,
        });

        showSuccess('دسته‌بندی جدید با موفقیت اضافه شد.');
      }

      resetForm();
      fetchCategories();
    } catch (err) {
      console.log('CATEGORY SAVE ERROR:', err.response?.data);

      const data = err.response?.data;
      let msg = 'خطا در ذخیره دسته‌بندی';

      if (data) {
        if (data.name) msg = data.name[0];
        else if (data.description) msg = data.description[0];
        else if (data.detail) msg = data.detail;
        else msg = JSON.stringify(data);
      }

      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setForm({
      name: category.name || '',
      description: category.description || '',
    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('آیا از حذف این دسته‌بندی مطمئن هستید؟');

    if (!confirmed) return;

    try {
      await api.delete(`/categories/${id}/`);
      showSuccess('دسته‌بندی با موفقیت حذف شد.');
      fetchCategories();
    } catch (err) {
      console.log('CATEGORY DELETE ERROR:', err.response?.data);
      setError('خطا در حذف دسته‌بندی. ممکن است تیکتی به این دسته‌بندی متصل باشد.');
    }
  };

  if (loading) {
    return <div className="loading">در حال دریافت دسته‌بندی‌ها...</div>;
  }

  return (
    <main className="page">
      <div className="toolbar">
        <div>
          <h1 className="page-title">مدیریت دسته‌بندی‌ها</h1>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 500 }}>
            دسته‌بندی‌های تیکت‌ها را ایجاد، ویرایش یا حذف کنید.
          </p>
        </div>

        <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
          {categories.length} دسته‌بندی
        </span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="responsive-grid">
        <section className="card">
          <h2 style={{ marginTop: 0 }}>
            {editingId ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
          </h2>

          <p style={{ color: '#64748b', marginTop: '-0.5rem' }}>
            برای مرتب‌سازی تیکت‌ها، دسته‌بندی‌های مشخص تعریف کنید.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>نام دسته‌بندی</label>
              <input
                className="form-control"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="مثلاً: مشکلات فنی"
                required
              />
            </div>

            <div className="form-group">
              <label>توضیحات</label>
              <textarea
                className="form-control"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows="5"
                placeholder="توضیح کوتاهی درباره کاربرد این دسته‌بندی بنویسید..."
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'در حال ذخیره...' : editingId ? 'ذخیره تغییرات' : 'افزودن دسته‌بندی'}
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
          <h3 style={{ marginTop: 0 }}>راهنمای دسته‌بندی</h3>

          <div style={{ display: 'grid', gap: '1rem', color: '#475569' }}>
            <div>
              <strong>نام کوتاه انتخاب کنید</strong>
              <p style={{ margin: '0.35rem 0 0' }}>
                نام دسته‌بندی بهتر است ساده و قابل فهم باشد.
              </p>
            </div>

            <div>
              <strong>تعداد دسته‌ها را زیاد نکنید</strong>
              <p style={{ margin: '0.35rem 0 0' }}>
                دسته‌بندی‌های زیاد باعث سخت‌شدن انتخاب برای کاربران می‌شود.
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
              💡 دسته‌بندی‌ها در فرم ثبت تیکت و صفحه جزئیات تیکت استفاده می‌شوند.
            </div>
          </div>
        </aside>
      </div>

      <section className="card" style={{ marginTop: '1.25rem' }}>
        <div className="toolbar" style={{ marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>لیست دسته‌بندی‌ها</h2>
            <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>
              همه دسته‌بندی‌های ثبت‌شده در سامانه.
            </p>
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="empty-state">هنوز دسته‌بندی‌ای ثبت نشده است.</div>
        ) : (
          <div className="table-wrap table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>نام دسته‌بندی</th>
                  <th>توضیحات</th>
                  <th>عملیات</th>
                </tr>
              </thead>

              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <strong>{category.name}</strong>
                      <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                        #{category.id}
                      </div>
                    </td>

                    <td>{category.description || '-'}</td>

                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className="btn btn-outline" onClick={() => handleEdit(category)}>
                          ویرایش
                        </button>

                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(category.id)}
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