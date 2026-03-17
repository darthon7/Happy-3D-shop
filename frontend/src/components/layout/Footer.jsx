import { Link } from 'react-router-dom';
import { Facebook, Instagram } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { label: 'Términos y Condiciones', to: '/terminos' },
    { label: 'Aviso de Privacidad', to: '/privacidad' },
    { label: 'Preguntas Frecuentes', to: '/faq' },
  ];

  const shopLinks = [
    { label: 'Catálogo', to: '/catalogo' },
    { label: 'Galería', to: '/galeria' },
    { label: 'Contacto', to: '/contacto' },
  ];

  return (
    <footer className="bg-[#3E2A0E] text-[#E8DCC8]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <span className="text-xl font-bold text-[#C9A84C] tracking-wider uppercase">
                Happy 3D Shop
              </span>
            </Link>
            <p className="text-sm text-[#E8DCC8]/80 leading-relaxed mb-6">
              Creamos props y réplicas personalizadas impresos en 3D para cosplayers, 
              coleccionistas y entusiastas del entretenimiento.
            </p>
            <div className="flex gap-4">
              <a 
                href="https://facebook.com/propsroom3d" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#E8DCC8] hover:text-[#C9A84C] transition-all hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://instagram.com/propsroom3d" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#E8DCC8] hover:text-[#C9A84C] transition-all hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://tiktok.com/@propsroom3d" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#E8DCC8] hover:text-[#C9A84C] transition-all hover:scale-110"
                aria-label="TikTok"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  width="20" 
                  height="20" 
                  fill="currentColor"
                  className="lucide lucide-tiktok"
                >
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h4 className="font-bold mb-5 text-[#C9A84C] uppercase text-xs tracking-[2px]">
              Tienda
            </h4>
            <ul className="space-y-3 text-sm">
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.to} 
                    className="text-[#E8DCC8] hover:text-[#C9A84C] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="font-bold mb-5 text-[#C9A84C] uppercase text-xs tracking-[2px]">
              Soporte
            </h4>
            <ul className="space-y-3 text-sm">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.to} 
                    className="text-[#E8DCC8] hover:text-[#C9A84C] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="font-bold mb-5 text-[#C9A84C] uppercase text-xs tracking-[2px]">
              Contacto
            </h4>
            <ul className="space-y-3 text-sm text-[#E8DCC8]/80">
              <li>
                <a 
                  href="mailto:contacto@propsroom.com" 
                  className="hover:text-[#C9A84C] transition-colors"
                >
                  contacto@propsroom.com
                </a>
              </li>
              <li>
                <a 
                  href="https://wa.me/528711038861" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-[#C9A84C] transition-colors"
                >
                  +52 871 103 8861
                </a>
              </li>
              <li className="pt-2">
                <span className="text-[#E8DCC8]/60 text-xs">
                  Ciudad de México, México
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-[#E8DCC8]/15 text-center">
          <p className="text-xs text-[#E8DCC8]/55 uppercase tracking-wider">
            © {currentYear} Happy 3D Shop. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
