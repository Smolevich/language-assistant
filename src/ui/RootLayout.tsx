import { Outlet, NavLink } from 'react-router-dom';
import { AuthGate } from '../auth/AuthGate';

export function RootLayout() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b">
        <nav className="container mx-auto px-4 h-14 flex items-center gap-4">
          <NavLink to="/" className="font-semibold">Language Assistant</NavLink>
          <div className="ml-auto flex items-center gap-3">
            <NavLink to="/game" className={({ isActive }) => isActive ? 'text-blue-600' : ''}>Игра</NavLink>
            <NavLink to="/dictionary" className={({ isActive }) => isActive ? 'text-blue-600' : ''}>Словарь</NavLink>
            <NavLink to="/profile" className={({ isActive }) => isActive ? 'text-blue-600' : ''}>Профиль</NavLink>
            <AuthGate />
          </div>
        </nav>
      </header>
      <main className="container mx-auto px-4 py-6 flex-1">
        <Outlet />
      </main>
    </div>
  );
}

