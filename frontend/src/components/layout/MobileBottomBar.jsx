import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, User, LogIn, Image as ImageIcon } from 'lucide-react';
import { useAuthStore, useCartStore } from '../../stores';

const MobileBottomBar = () => {
  const { pathname } = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const { itemCount } = useCartStore();

  const tabs = [
    {
      path: '/catalogo',
      label: 'Catálogo',
      icon: ShoppingBag,
      isActive: pathname === '/catalogo' || pathname.startsWith('/catalogo/') || pathname.startsWith('/categoria'),
    },
    {
      path: '/galeria',
      label: 'Galería',
      icon: ImageIcon,
      isActive: pathname === '/galeria',
    },
    {
      path: '/carrito',
      label: 'Carrito',
      icon: ShoppingCart,
      badge: itemCount > 0 ? (itemCount > 99 ? '99+' : itemCount) : null,
      isActive: pathname === '/carrito',
    },
  ];

  return (
    <nav
      aria-label="Tab bar mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#C9A84C]/30 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch h-14">
        {/* Catálogo & Carrito tabs */}
        {tabs.map(({ path, label, icon: Icon, badge, isActive }) => (
          <Link
            key={path}
            to={path}
            className="relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
            aria-label={label}
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#C9A84C]" />
            )}
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#C9A84C]' : 'text-gray-500'}`} />
              {badge && (
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#C9A84C] text-[9px] font-bold text-white">
                  {badge}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-medium ${isActive ? 'text-[#C9A84C]' : 'text-gray-500'}`}>
              {label}
            </span>
          </Link>
        ))}

        {/* Profile / Login tab */}
        {isAuthenticated ? (
          <Link
            to="/perfil"
            className="relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
            aria-label="Mi Perfil"
          >
            {pathname === '/perfil' && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#C9A84C]" />
            )}
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white ${pathname === '/perfil' ? 'bg-[#C9A84C]' : 'bg-gray-400'}`}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <span className={`text-[10px] font-medium ${pathname === '/perfil' ? 'text-[#C9A84C]' : 'text-gray-500'}`}>
              Perfil
            </span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
            aria-label="Iniciar Sesión"
          >
            {pathname === '/login' && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#C9A84C]" />
            )}
            <LogIn className={`w-5 h-5 ${pathname === '/login' ? 'text-[#C9A84C]' : 'text-gray-500'}`} />
            <span className={`text-[10px] font-medium leading-tight text-center ${pathname === '/login' ? 'text-[#C9A84C]' : 'text-gray-500'}`}>
              Iniciar{'\n'}Sesión
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default MobileBottomBar;
