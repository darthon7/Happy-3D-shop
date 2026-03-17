import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import ScrollToTop from './components/common/ScrollToTop';
import InactivityModal from './components/InactivityModal';
import useInactivityTimeout from './hooks/useInactivityTimeout';
import { useAuthStore } from './stores';

const Home = lazy(() => import('./pages/Home'));
const Catalog = lazy(() => import('./pages/Catalog'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));

const Gallery = lazy(() => import('./pages/Gallery'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const Cart = lazy(() => import('./pages/Cart'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Payment = lazy(() => import('./pages/Payment'));
const Profile = lazy(() => import('./pages/user/Profile'));
const Orders = lazy(() => import('./pages/user/Orders'));
const OrderDetails = lazy(() => import('./pages/user/OrderDetails'));
const Wishlist = lazy(() => import('./pages/user/Wishlist'));
const Notifications = lazy(() => import('./pages/Notifications'));
const ProtectedRoute = lazy(() => import('./components/common/ProtectedRoute'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminCoupons = lazy(() => import('./pages/admin/Coupons'));
const AdminGallery = lazy(() => import('./pages/admin/Gallery'));

const PageSkeleton = () => (
  <div className="min-h-screen bg-background-dark flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400">Cargando...</p>
    </div>
  </div>
);

function App() {
  const { showWarning, remainingTime, extendSession, logout } = useInactivityTimeout();
  const syncProfile = useAuthStore((s) => s.syncProfile);

  // Sync the full user profile (including phone) on app start so persisted
  // sessions always have up-to-date data.
  useEffect(() => {
    syncProfile();
  }, [syncProfile]);

  return (
    <>
      <Toaster 
        position="top-center" 
        containerStyle={{
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 99999,
        }}
        toastOptions={{
          duration: 2500,
          style: {
            background: 'rgba(32, 18, 31, 0.95)',
            color: '#fff',
            border: '1px solid rgba(250, 28, 117, 0.2)',
            backdropFilter: 'blur(12px)',
            borderRadius: '20px',
            padding: '16px 28px',
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(250, 28, 117, 0.1)',
            minWidth: '280px',
            textAlign: 'center',
          },
          success: {
            iconTheme: {
              primary: '#fa1c75',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }
          }
        }}
      />
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
          {/* Public Layout */}
          <Route path="/" element={<Layout />}>
            {/* Home */}
            <Route index element={<Home />} />

            {/* Public routes */}
            <Route path="catalogo" element={<Catalog />} />
            <Route path="categoria/:slug" element={<Catalog />} />
            <Route path="producto/:slug" element={<ProductDetail />} />
            <Route path="buscar" element={<Catalog />} />

            <Route path="galeria" element={<Gallery />} />
            <Route path="terminos" element={<TermsAndConditions />} />
            <Route path="privacidad" element={<PrivacyPolicy />} />
            
            {/* Auth routes */}
            <Route path="login" element={<Login />} />
            <Route path="registro" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="recuperar-contrasena" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            
            {/* Cart */}
            <Route path="carrito" element={<Cart />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="checkout" element={<Checkout />} />
              <Route path="pago" element={<Payment />} />
              <Route path="perfil" element={<Profile />} />
              <Route path="pedidos" element={<Orders />} />
              <Route path="pedido/:orderNumber" element={<OrderDetails />} />
              <Route path="favoritos" element={<Wishlist />} />
              <Route path="notificaciones" element={<Notifications />} />
            </Route>
          </Route>
          
          {/* Admin Layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="productos" element={<AdminProducts />} />
            <Route path="categorias" element={<AdminCategories />} />
            <Route path="pedidos" element={<AdminOrders />} />
            <Route path="cupones" element={<AdminCoupons />} />
            <Route path="galeria" element={<AdminGallery />} />
          </Route>
        </Routes>
        </Suspense>
      </BrowserRouter>
      
      <InactivityModal
        show={showWarning}
        remainingTime={remainingTime}
        onExtend={extendSession}
        onLogout={logout}
      />
    </>  
  );
}

export default App;
