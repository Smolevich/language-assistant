import { useAuth } from './useAuth';

export function AuthGate() {
  const { user, login, logout, loading } = useAuth();

  if (loading) return <div className="text-sm text-gray-500">Загрузка...</div>;

  if (!user)
    return (
      <div className="flex items-center gap-2">
        <button className="text-sm border rounded px-2 py-1" onClick={() => login('google')}>Google</button>
        <button className="text-sm border rounded px-2 py-1" onClick={() => login('github')}>GitHub</button>
        <button className="text-sm border rounded px-2 py-1" onClick={() => login('facebook')}>Facebook</button>
      </div>
    );

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{user.displayName || user.email}</span>
      <button className="text-sm border rounded px-2 py-1" onClick={logout}>Выйти</button>
    </div>
  );
}


