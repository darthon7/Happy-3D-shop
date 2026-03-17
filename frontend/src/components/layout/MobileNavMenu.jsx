import { Link, useLocation } from 'react-router-dom';
import { useCatalogRoute } from '../../hooks/useCatalogRoute';

const navItems = [
  { path: '/catalogo', label: 'Catálogo' },
  { path: '/galeria', label: 'Galería' },
];

/**
 * Mobile-only horizontal nav menu strip below the top bar.
 * Shows Catálogo · Galería · Nosotros as scrollable pills.
 * Auto-hides on catalog / category routes.
 */
const MobileNavMenu = () => {
  const isCatalog = useCatalogRoute();
  const { pathname } = useLocation();

  if (isCatalog) return null;

  return (
    <nav
      aria-label="Navegación mobile"
      className="md:hidden fixed top-14 left-0 right-0 z-40 bg-[#1B2A5E]/95 backdrop-blur-xl border-b border-white/[0.06]"
    >
      <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={(e) => {
                if (item.path === pathname || (item.path !== '/' && pathname.startsWith(item.path))) {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30'
                  : 'text-[#E8DCC8] hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNavMenu;
