import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuthStore } from '../../stores';
import NotificationBell from '../ui/NotificationBell';

const MobileTopBar = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-header/95 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="flex items-center gap-2 px-3 py-2 h-14">
        {/* Logo */}
        <Link 
          to="/" 
          onClick={(e) => {
            if (location.pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex items-center gap-1" 
          aria-label="Prop's Room Inicio"
        >
          <div className="w-7 h-7 bg-brand rounded-[6px] flex items-center justify-center text-white font-bold text-sm">PR</div>
          <span className="text-white font-bold text-sm">PROP'S <span className="text-brand">ROOM</span></span>
        </Link>

        {/* Search bar */}
        <form onSubmit={handleSubmit} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-white/10 border border-white/20 rounded-full py-2 pl-9 pr-3 text-sm text-white placeholder-white/50 focus:outline-none focus:border-brand transition-colors"
            />
          </div>
        </form>

        {/* Notification bell — only for authenticated users */}
        {isAuthenticated && (
          <div className="flex-shrink-0">
            <NotificationBell />
          </div>
        )}
      </div>
    </header>
  );
};

export default MobileTopBar;
