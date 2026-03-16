import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-brand rounded-[8px] flex items-center justify-center text-white font-bold text-xl">PR</div>
              <h3 className="text-xl font-bold text-header tracking-tight">
                PROP'S <span className="text-brand">ROOM</span>
              </h3>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Crafting high-end fantasy and sci-fi replicas for serious cosplayers and collectors. Every piece is hand-finished in our studio.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-brand transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/dazehaze.st" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-brand transition-colors" aria-label="Etsy">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.559 4.373c0-.653.326-1.137.922-1.137.6 0 .93.492.93 1.137 0 .645-.33 1.17-.93 1.17-.596 0-.922-.525-.922-1.17zm6.477 1.167h-1.192c-.19 0-.357.027-.502.054v1.877c.145.027.312.054.502.054h1.192c.598 0 1.083-.264 1.083-.856v-.493c0-.592-.485-.636-1.083-.636zm2.574 3.913h-1.3c-.122 0-.245.018-.367.054v2.743c.122.036.245.054.367.054h1.3c.653 0 1.192-.378 1.192-1.085v-.717c0-.707-.539-1.049-1.192-1.049zm-2.574-2.36c.653 0 1.192.378 1.192 1.085v.716c0 .708-.539 1.05-1.192 1.05h-1.3c-.122 0-.245-.018-.367-.055v-2.742c.122-.037.245-.054.367-.054h1.3zm-3.24-1.553h-2.43v5.336h2.43v-1.085h-1.446v-1.263h1.446v-.96h-1.446v-1.266h1.446v-.762z"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-brand transition-colors" aria-label="Discord">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h4 className="font-bold mb-6 text-header uppercase text-xs tracking-widest">Tienda</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/catalogo" className="hover:text-brand transition-colors">Catálogo</Link></li>
              <li><Link to="/galeria" className="hover:text-brand transition-colors">Galería</Link></li>
              <li><Link to="/about" className="hover:text-brand transition-colors">Nosotros</Link></li>
              <li><Link to="/contacto" className="hover:text-brand transition-colors">Contacto</Link></li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="font-bold mb-6 text-header uppercase text-xs tracking-widest">Soporte</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/faq" className="hover:text-brand transition-colors">Preguntas Frecuentes</Link></li>
              <li><Link to="/envios" className="hover:text-brand transition-colors">Envíos</Link></li>
              <li><Link to="/devoluciones" className="hover:text-brand transition-colors">Devoluciones</Link></li>
              <li><Link to="/privacidad" className="hover:text-brand transition-colors">Política de Privacidad</Link></li>
              <li><Link to="/terminos" className="hover:text-brand transition-colors">Términos y Condiciones</Link></li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h4 className="font-bold mb-6 text-header uppercase text-xs tracking-widest">Newsletter</h4>
            <p className="text-sm text-gray-500 mb-4">
              Recibe noticias sobre nuevos productos y ofertas especiales.
            </p>
            <div className="flex">
              <input 
                className="bg-gray-50 border border-gray-200 text-header text-sm rounded-l-[8px] focus:outline-none focus:border-brand px-4 py-2.5 flex-1" 
                placeholder="Tu email" 
                type="email"
              />
              <button className="bg-brand hover:bg-brand-dark text-white px-4 py-2.5 rounded-r-[8px] text-sm font-bold transition-colors">
                Unirse
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-widest">
            © 2024 Prop's Room. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
