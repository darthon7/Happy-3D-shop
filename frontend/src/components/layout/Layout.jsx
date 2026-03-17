import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0E8]">
      <Navbar />

      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
