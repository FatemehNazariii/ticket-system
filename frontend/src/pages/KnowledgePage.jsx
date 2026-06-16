import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function KnowledgePage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [pendingArticles, setPendingArticles] = useState([]);
  const [form, setForm] = useState({ title: '', content: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.is_superuser;
  const canSuggestArticle = !isAdmin; 

  // تابع تاریخ
  const formatDateFa = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const fetchArticles = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/knowledge/');
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setArticles(data);

      if (isAdmin) {
        setPendingArticles(data.filter(article => !article.is_published));
      }
    } catch (err) {
      console.error(err);
      setError('خطا در دریافت مقالات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError('عنوان و محتوا الزامی است');
      return;
    }
    try {
      await api.post('/knowledge/', { title: form.title, content: form.content });
      showSuccess('مقاله شما برای تایید مدیر ارسال شد');
      setForm({ title: '', content: '' });
      fetchArticles();
    } catch (err) {
      console.error(err.response?.data);
      setError('خطا در ارسال مقاله');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/knowledge/${id}/approve/`);
      showSuccess('مقاله تایید شد و منتشر شد');
      fetchArticles();
    } catch (err) {
      console.error(err.response?.data);
      setError('خطا در تایید مقاله');
    }
  };

  const handleEdit = async (id, updated) => {
    try {
      await api.patch(`/knowledge/${id}/`, updated);
      showSuccess('مقاله ویرایش شد');
      fetchArticles();
    } catch (err) {
      console.error(err.response?.data);
      setError('خطا در ویرایش مقاله');
    }
  };

  if (loading) return <div>در حال بارگذاری...</div>;

  return (
    <main className="page">
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {canSuggestArticle && (
        <section className="card" style={{ marginTop: '1rem' }}>
          <h2 style={{ marginTop: 0 }}>پیشنهاد مقاله جدید</h2>
          <p style={{ color: '#64748b' }}>
            مقاله شما بعد از تایید مدیر کل منتشر می‌شود.
          </p>
          <form onSubmit={handleCreateArticle}>
            <div className="form-group">
              <label>عنوان مقاله</label>
              <input
                className="form-control"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="مثلاً: مشکل ورود به حساب"
              />
            </div>
            <div className="form-group">
              <label>محتوا</label>
              <textarea
                className="form-control"
                rows="6"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="متن مقاله را بنویسید..."
              />
            </div>
            <button className="btn btn-primary" type="submit">
              ارسال برای تایید
            </button>
          </form>
        </section>
      )}

      {isAdmin && pendingArticles.length > 0 && (
        <section className="card" style={{ marginTop: '1rem' }}>
          <h2>مقالات منتظر تایید</h2>
          <ul>
            {pendingArticles.map((art) => (
              <li key={art.id} style={{ marginBottom: '0.5rem' }}>
                <strong>{art.title}</strong> - 
               {art.created_by_username || art.created_by_detail?.username || 'ناشناس'}
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleApprove(art.id)}
                  style={{ marginLeft: '0.5rem' }}
                >
                  تایید و انتشار
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() =>
                    handleEdit(art.id, { title: art.title, content: art.content })
                  }
                  style={{ marginLeft: '0.5rem' }}
                >
                  ویرایش
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card" style={{ marginTop: '1rem' }}>
        <h2>مقالات منتشر شده</h2>
        {articles.length === 0 ? (
          <div>هنوز مقاله‌ای منتشر نشده است.</div>
        ) : (
          <ul>
            {articles.map((art) => (
              <li key={art.id}>
                <strong>{art.title}</strong> - 
                آخرین بروزرسانی: {formatDateFa(art.updated_at)} - 
               {art.created_by_username || art.created_by_detail?.username || 'ناشناس'}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}