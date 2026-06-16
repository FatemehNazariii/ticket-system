export default function Avatar({ user, size = '50px', onChange }) {
  const initial = user?.username?.charAt(0)?.toUpperCase() || 'U';

  return (
    <label style={{ display: 'inline-block', position: 'relative', cursor: onChange ? 'pointer' : 'default' }}>
      {user?.avatar_url ? (
        <img src={user.avatar_url} alt="Avatar" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: size, height: size, borderRadius: '50%', background: '#2563eb', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
          {initial}
        </div>
      )}
      {onChange && (
        <>
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onChange} />
          <span style={{ position: 'absolute', bottom: 0, right: 0, background: '#fff', borderRadius: '50%', padding: '0.2rem', fontSize: '0.8rem' }}>📷</span>
        </>
      )}
    </label>
  );
}