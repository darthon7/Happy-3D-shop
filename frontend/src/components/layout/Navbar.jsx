import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, ShoppingBag, Search, Menu, X, ChevronDown } from 'lucide-react';
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
    { label: 'Catálogo', to: '/catalogo' },
    { label: 'Categorías', to: '/catalogo' },
    { label: 'Contacto', to: '/contacto' },
  ];

  return (
    <>
      <header className="bg-[#1B2A5E] sticky top-0 z-50 px-4 md:px-8 h-[60px] flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-[#C9A84C] text-xl font-bold tracking-wider flex-shrink-0">
          Happy 3D Shop
        </Link>
        
        {/* Desktop Navigation */}
        <ul className="hidden md:flex gap-7 list-none m-0 p-0 items-center">
          {navLinks.map((link) => (
            link.label === 'Categorías' ? (
              <li key={link.label} className="relative group">
                <button className="flex items-center text-text-inverse-secondary text-sm cursor-pointer hover:text-primary transition-colors font-sans link-underline">
                  {link.label}
                  <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="w-56 bg-white rounded-lg shadow-xl border border-border-light overflow-hidden">
                    <div className="flex flex-col py-2">
                       <Link 
                         to="/catalogo"
                         className="px-4 py-2.5 text-sm text-text-primary hover:bg-background-light hover:text-primary transition-colors font-medium"
                       >
                         Ver Todo
                       </Link>
                       {categories.map((cat) => (
                         <Link 
                           key={cat.id}
                           to={`/categoria/${cat.slug}`}
                           className="px-4 py-2.5 text-sm text-text-secondary hover:bg-background-light hover:text-primary transition-colors"
                         >
                           {cat.name}
                         </Link>
                       ))}
                    </div>
                  </div>
                </div>
              </li>
            ) : (
              <li key={link.label}>
                <Link 
                  to={link.to}
                  className="text-text-inverse-secondary text-sm cursor-pointer hover:text-primary transition-colors font-sans link-underline"
                >
                  {link.label}
                </Link>
              </li>
            )
          ))}
        </ul>
        
        {/* Desktop Search & Actions */}
        <div className="hidden md:flex gap-5 text-[#C9A84C] items-center">
           <form onSubmit={handleSearchSubmit} className="relative">
             <input
               type="text"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Buscar..."
               className="w-32 lg:w-48 bg-white/10 border border-[#C9A84C]/30 rounded-[8px] py-1 pl-3 pr-8 text-sm text-[#E8DCC8] placeholder-[#E8DCC8]/50 focus:outline-none focus:border-[#C9A84C] transition-colors"
             />
             <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-[#C9A84C] hover:text-[#E8DCC8]">
               <Search size={16} />
             </button>
           </form>

           <Link to="/carrito" className="relative hover:text-[#E8DCC8] transition-colors flex items-center">
             <ShoppingBag size={20} />
             {itemCount > 0 && (
               <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C9A84C] text-[10px] font-bold text-[#1B2A5E]">
                 {itemCount > 99 ? '99+' : itemCount}
               </span>
             )}
           </Link>

           {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <NotificationBell />
                <div className="relative group flex items-center">
                  <button className="flex items-center gap-2 hover:text-[#E8DCC8] transition-colors">
                    <User size={20} />
                  </button>
                  
                  <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="w-64 bg-white rounded-[8px] shadow-xl border border-[#C9A84C]/20 overflow-hidden">
                      <div className="p-4 border-b border-gray-100 bg-[#F5F0E8]">
                        <p className="font-bold text-[#1B2A5E] text-sm">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <div className="flex flex-col py-2">
                        {user?.role === 'ADMIN' && (
                          <Link to="/admin" className="px-4 py-2.5 text-sm text-[#2C1F0E] hover:bg-[#F5F0E8] hover:text-[#C9A84C] font-semibold transition-colors">
                            Panel de Admin
                          </Link>
                        )}
                        <Link to="/perfil" className="px-4 py-2.5 text-sm text-[#2C1F0E] hover:bg-[#F5F0E8] hover:text-[#C9A84C] font-semibold transition-colors">
                          Mi Perfil
                        </Link>
                        <Link to="/perfil?tab=orders" className="px-4 py-2.5 text-sm text-[#2C1F0E] hover:bg-[#F5F0E8] hover:text-[#C9A84C] font-semibold transition-colors">
                          Mis Pedidos
                        </Link>
                        <Link to="/perfil?tab=wishlist" className="px-4 py-2.5 text-sm text-[#2C1F0E] hover:bg-[#F5F0E8] hover:text-[#C9A84C] font-semibold transition-colors">
                          Favoritos
                        </Link>
                        <button 
                          onClick={handleLogout}
                          className="px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-semibold transition-colors text-left"
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
               className="bg-primary hover:bg-primary-dark text-dark-900 px-5 py-2 rounded-full font-bold text-sm tracking-wide transition-colors flex items-center shadow-sm"
             >
               Iniciar Sesión
             </Link>
           )}
        </div>

        {/* Mobile Actions */}
        <div className="flex md:hidden items-center gap-4 text-[#C9A84C]">
           <Link to="/carrito" className="relative hover:text-[#E8DCC8] transition-colors">
             <ShoppingBag size={20} />
             {itemCount > 0 && (
               <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C9A84C] text-[10px] font-bold text-[#1B2A5E]">
                 {itemCount > 99 ? '99+' : itemCount}
               </span>
             )}
           </Link>
           <button 
             onClick={() => setIsMenuOpen(!isMenuOpen)}
             className="hover:text-[#E8DCC8] transition-colors flex items-center justify-center"
           >
             {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
           </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
        isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      }`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setIsMenuOpen(false)} />
        
        <nav className={`absolute top-0 right-0 w-72 h-full bg-[#1B2A5E] shadow-xl transition-transform duration-300 ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="p-4 border-b border-[#C9A84C]/20 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#C9A84C] tracking-wider">Happy 3D Shop</h2>
            <button onClick={() => setIsMenuOpen(false)} className="text-[#C9A84C] hover:text-[#E8DCC8]">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="p-4 border-b border-[#C9A84C]/20">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full bg-white/10 border border-[#C9A84C]/30 rounded-[8px] py-2 pl-4 pr-10 text-sm text-[#E8DCC8] placeholder-[#E8DCC8]/50 focus:outline-none focus:border-[#C9A84C]"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C9A84C]">
                <Search size={18} />
              </button>
           </div>
          </form>

          <div className="py-4 font-sans">
            {navLinks.map((link) => (
              link.label === 'Categorías' ? (
                <div key={link.label} className="border-b border-[#C9A84C]/10 pb-2 mb-2">
                   <button 
                     onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                     className="flex items-center justify-between w-full px-5 py-3 text-[#E8DCC8] font-medium"
                   >
                     Categorías
                     <ChevronDown className={`w-5 h-5 transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`} />
                   </button>
                   {isCategoriesOpen && (
                     <div className="px-5 pb-2 bg-black/10">
                       <Link to="/catalogo" className="block py-2.5 text-sm text-[#C9A84C]">Ver Todo</Link>
                       {categories.map((cat) => (
                         <Link 
                           key={cat.id}
                           to={`/categoria/${cat.slug}`}
                           className="block py-2.5 text-sm text-[#E8DCC8]/80 hover:text-[#E8DCC8]"
                         >
                           {cat.name}
                         </Link>
                       ))}
                     </div>
                   )}
                </div>
              ) : (
                <Link 
                  key={link.label}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-5 py-3 text-[#E8DCC8] font-medium hover:text-[#C9A84C] hover:bg-white/5"
                >
                  {link.label}
                </Link>
              )
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#C9A84C]/20">
            {isAuthenticated ? (
               <div className="flex flex-col gap-2">
                 <div className="flex items-center gap-3 mb-2 px-2">
                   <User className="text-[#C9A84C]" size={20} />
                   <div>
                     <p className="text-sm font-bold text-[#E8DCC8]">{user?.firstName}</p>
                     <p className="text-xs text-[#E8DCC8]/60">{user?.email}</p>
                   </div>
                 </div>
                 {user?.role === 'ADMIN' && (
                   <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="text-sm text-[#E8DCC8] hover:text-[#C9A84C] py-2 px-2">Panel de Admin</Link>
                 )}
                 <Link to="/perfil" onClick={() => setIsMenuOpen(false)} className="text-sm text-[#E8DCC8] hover:text-[#C9A84C] py-2 px-2">Mi Perfil</Link>
                 <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 py-2 px-2 text-left">
                   Cerrar Sesión
                 </button>
               </div>
            ) : (
               <Link 
                 to="/login" 
                 onClick={() => setIsMenuOpen(false)}
                 className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#C9A84C] text-[#1B2A5E] rounded-[8px] font-bold tracking-[1px] uppercase"
               >
                 <User size={18} />
                 Iniciar Sesión
               </Link>
            )}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Navbar;
