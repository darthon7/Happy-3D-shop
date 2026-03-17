import { useState } from 'react';
import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Package, FolderTree, ShoppingCart, Ticket, ArrowLeft, Menu, X, Image } from 'lucide-react';
import { useAuthStore } from '../../stores';

const AdminLayout = () => {
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Check if user is admin
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/productos', icon: Package, label: 'Productos' },
    { to: '/admin/categorias', icon: FolderTree, label: 'Categorías' },
    { to: '/admin/pedidos', icon: ShoppingCart, label: 'Pedidos' },
    { to: '/admin/cupones', icon: Ticket, label: 'Cupones' },
    { to: '/admin/galeria', icon: Image, label: 'Galería' },
  ];

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#1B2A5E]/95 backdrop-blur-md flex items-center justify-between px-4 z-30 lg:hidden border-b border-[#C9A84C]/30">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-white font-bold">Prop's Room Admin</span>
        </div>
        <NavLink to="/" className="text-[#E8DCC8] hover:text-white text-sm flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Tienda
        </NavLink>
      </div>
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-72 lg:w-64 
        bg-gradient-to-b from-[#1B2A5E] via-[#1B2A5E] to-[#0f1a36]
        text-white flex-shrink-0
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        border-r border-[#C9A84C]/20
        shadow-2xl shadow-black/20
      `}>
        {/* Close button for mobile */}
        <button 
          onClick={closeSidebar}
          className="absolute top-4 right-4 p-2 text-[#E8DCC8] hover:text-white lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6">
          <NavLink to="/" className="flex items-center gap-2 text-[#E8DCC8] hover:text-[#C9A84C] mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Volver a la tienda</span>
          </NavLink>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-[#C9A84C] rounded-[8px] flex items-center justify-center text-white font-bold text-lg">PR</div>
          </div>
          <p className="text-sm text-[#C9A84C]/70">Panel de Administración</p>
        </div>
        
        <nav className="px-4 pb-6 space-y-1">
          {navItems.map((item, index) => (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <NavLink
                to={item.to}
                end={item.end}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#C9A84C] to-[#b8943e] text-white shadow-lg shadow-[#C9A84C]/30'
                      : 'text-[#E8DCC8] hover:bg-white/5 hover:text-white hover:pl-5'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            </motion.div>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#C9A84C]/20 bg-[#0f1a36]/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#C9A84C] to-[#b8943e] rounded-full flex items-center justify-center text-white font-semibold shadow-lg shadow-[#C9A84C]/30">
              {user?.firstName?.[0]}
            </div>
            <div className="text-sm">
              <p className="font-medium text-white">{user?.firstName}</p>
              <p className="text-[#C9A84C] text-xs">Administrador</p>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
