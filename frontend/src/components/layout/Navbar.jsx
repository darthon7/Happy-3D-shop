import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, ShoppingCart, Heart, Search, Menu, X, ChevronDown } from 'lucide-react';
import { useAuthStore, useCartStore, useCategoryStore } from '../../stores';
import NotificationBell from '../ui/NotificationBell';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  const itemCount = useCartStore(s => s.itemCount);
  const categories = useCategoryStore(s => s.categories);
  const fetchCategories = useCategoryStore(s => s.fetchCategories);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { path: '/', label: 'Inicio' },
  ];

  const isActiveLink = (path) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-50 bg-header/95 backdrop-blur-md text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-brand rounded-[8px] flex items-center justify-center text-white font-bold text-xl">PR</div>
              <h1 className="text-2xl font-bold tracking-tight">PROP'S <span className="text-brand">ROOM</span></h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium uppercase tracking-widest transition-colors hover:text-brand ${
                    isActiveLink(link.path) ? 'text-brand' : 'text-white/80'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Categories Dropdown */}
              <div className="relative group">
                <button className="flex items-center text-sm font-medium uppercase tracking-widest text-white/80 hover:text-brand transition-colors">
                  Categorías
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="w-56 bg-white rounded-[8px] shadow-xl border border-gray-100 overflow-hidden">
                    <div className="flex flex-col py-2">
                      <Link 
                        to="/catalogo"
                        className="px-4 py-2.5 text-sm text-header hover:bg-gray-50 transition-colors font-medium"
                      >
                        Ver Todo
                      </Link>
                      {categories.map((cat) => (
                        <Link 
                          key={cat.id}
                          to={`/categoria/${cat.slug}`}
                          className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-header transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </nav>

            {/* Search & Actions */}
            <div className="flex items-center gap-4">
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="hidden lg:block">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar..."
                    className="w-40 xl:w-48 bg-white/10 border border-white/20 rounded-[8px] py-1.5 pl-3 pr-8 text-sm text-white placeholder-white/50 focus:outline-none focus:border-brand transition-colors"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Mobile Search */}
              <button 
                onClick={() => navigate('/catalogo')}
                className="lg:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                aria-label="Buscar"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Cart */}
              <Link 
                to="/carrito" 
                className="relative p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                aria-label={`Carrito (${itemCount})`}
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <NotificationBell />
                  <div className="relative group">
                    <button className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 transition-colors">
                      <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center text-xs font-bold text-white">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </div>
                    </button>
                    
                    <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="w-64 bg-white rounded-[8px] shadow-xl border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                          <p className="font-medium text-header text-sm">{user?.firstName} {user?.lastName}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                        <div className="flex flex-col py-2">
                          <Link to="/perfil" className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-header transition-colors">
                            Mi Perfil
                          </Link>
                          <Link to="/perfil?tab=orders" className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-header transition-colors">
                            Mis Pedidos
                          </Link>
                          <Link to="/perfil?tab=wishlist" className="px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-header transition-colors">
                            Favoritos
                          </Link>
                          <button 
                            onClick={handleLogout}
                            className="px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                          >
                            Cerrar Sesión
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-[8px] text-sm font-semibold transition-colors"
                >
                  <User className="w-4 h-4" />
                  Iniciar Sesión
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
        isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      }`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsMenuOpen(false)} />
        
        <nav className={`absolute top-0 right-0 w-72 h-full bg-white shadow-xl transition-transform duration-300 ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-header">Menú</h2>
              <button onClick={() => setIsMenuOpen(false)} className="p-2">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="p-4 border-b border-gray-100">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full border border-gray-200 rounded-[8px] py-2.5 px-4 text-sm focus:outline-none focus:border-brand"
            />
          </form>

          {/* Mobile Nav Links */}
          <div className="py-4">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                to={link.path}
                className={`block px-4 py-3 text-base font-medium transition-colors ${
                  isActiveLink(link.path) ? 'text-brand bg-brand/5' : 'text-gray-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Categories */}
          <div className="border-t border-gray-100 pt-4">
            <button 
              onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
              className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-gray-700"
            >
              Categorías
              <ChevronDown className={`w-5 h-5 transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`} />
            </button>
            {isCategoriesOpen && (
              <div className="px-4 pb-4">
                <Link to="/catalogo" className="block py-2 text-sm text-gray-600">Ver Todo</Link>
                {categories.map((cat) => (
                  <Link 
                    key={cat.id}
                    to={`/categoria/${cat.slug}`}
                    className="block py-2 text-sm text-gray-600"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Login */}
          {!isAuthenticated && (
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
              <Link 
                to="/login" 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-brand text-white rounded-[8px] font-semibold"
              >
                <User className="w-4 h-4" />
                Iniciar Sesión
              </Link>
            </div>
          )}
        </nav>
      </div>
    </>
  );
};

export default Navbar;
