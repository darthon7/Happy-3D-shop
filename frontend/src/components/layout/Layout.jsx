import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileBottomBar from './MobileBottomBar';
import MobileTopBar from './MobileTopBar';

const Layout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main
        className="flex-1 flex flex-col"
      >
        <div className="flex-1 flex flex-col">
          <Outlet />
        </div>
      </main>

      <Footer />

      <MobileBottomBar />
    </div>
  );
};

export default Layout;
