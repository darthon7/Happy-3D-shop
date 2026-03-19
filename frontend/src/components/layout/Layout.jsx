import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useEffect, useState, createContext, useContext } from 'react';

export const AccessibilityContext = createContext({
  announce: () => {},
});

export const useAccessibility = () => useContext(AccessibilityContext);

const Layout = () => {
  const [announcement, setAnnouncement] = useState('');

  const announce = (message) => {
    setAnnouncement(message);
    setTimeout(() => setAnnouncement(''), 1000);
  };

  useEffect(() => {
    document.body.classList.add('grain-overlay');
    return () => document.body.classList.remove('grain-overlay');
  }, []);

  return (
    <AccessibilityContext.Provider value={{ announce }}>
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:bg-primary focus:text-dark-900 focus:px-4 focus:py-2 focus:rounded focus:font-bold"
      >
        Saltar al contenido principal
      </a>

      <div className="min-h-screen flex flex-col bg-background-light">
        <Navbar />

        <main id="main-content" className="flex-1 flex flex-col w-full" tabIndex={-1}>
          <div className="flex-1 flex flex-col w-full">
            <Outlet />
          </div>
        </main>

        <Footer />
      </div>

      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {announcement}
      </div>
    </AccessibilityContext.Provider>
  );
};

export default Layout;
