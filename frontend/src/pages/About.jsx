import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Heart, Flame, Target, TrendingUp, Users, Handshake, ArrowRight, Facebook, Instagram } from 'lucide-react';
import { FadeInUp, SlideInLeft, SlideInRight } from '../components/common/Animations';
import { useRef } from 'react';

const About = () => {
  const logoUrl = 'https://res.cloudinary.com/dpeepkwas/image/upload/v1769100257/DAZEHAZE_IS_4x_csehup.png';

  const values = [
    { icon: Flame, title: 'Pasión', description: 'El motor que impulsa cada diseño y colección que creamos.' },
    { icon: Target, title: 'Determinación', description: 'Perseverancia para alcanzar nuestros objetivos sin importar los obstáculos.' },
    { icon: TrendingUp, title: 'Superación', description: 'Mejora continua en cada aspecto de nuestra marca y productos.' },
    { icon: Heart, title: 'Honestidad', description: 'Transparencia y autenticidad en todo lo que hacemos.' },
    { icon: Handshake, title: 'Empatía', description: 'Entendemos las necesidades de nuestra comunidad.' },
    { icon: Users, title: 'Trabajo en Equipo', description: 'Unidos como DazeHaze Loyalty para lograr lo extraordinario.' },
  ];

  return (
    <div className="w-full flex-1">
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block"
            >
              <img 
                src={logoUrl} 
                alt="DazeHaze"
                className="h-20 sm:h-36 mx-auto mb-6 drop-shadow-2xl hover:scale-[1.03] transition-transform duration-300 ease-out"
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="text-white/60 text-xs sm:text-lg font-medium tracking-wide mb-4"
            >
              Donde la realidad se encuentra con la creatividad
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              className="text-2xl sm:text-6xl font-display tracking-wide text-white mb-6 uppercase"
            >
              NUESTRA <span className="text-primary">HISTORIA</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
              className="text-sm sm:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed px-4"
            >
              DAZEHAZE es una cadena de indumentaria ideada, creada y manejada por 
              <span className="text-white font-semibold"> Michelle Romero desde 2021</span>. 
              El público de DAZEHAZE se compone por jóvenes en busca de tendencias poco comunes de la moda.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Nuestro Estilo Section */}
      <section className="relative py-10 lg:py-24 border-t border-white/5 bg-surface/30 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 lg:gap-16 items-center">
            <SlideInLeft>
              <span className="text-primary font-bold uppercase tracking-widest text-[8px] sm:text-sm">Lo que nos define</span>
              <h2 className="text-base sm:text-4xl font-display tracking-wide text-white mt-1 sm:mt-2 mb-3 sm:mb-6 uppercase">
                ESTILO
              </h2>
              <div className="space-y-2 sm:space-y-4 text-text-secondary leading-relaxed text-[9px] sm:text-base">
                <p>
                  DAZEHAZE es distinguida por mezclar el <strong className="text-white">streetstyle</strong>, las subculturas 
                  que dejaron huella en la moda con el pasar de los años y las referencias al 
                  <strong className="text-white"> anime y manga</strong> como poderoso complemento. De esta forma, 
                  obtenemos una fusión única y distinguida.
                </p>
                <p>
                  Dividida en <strong className="text-white">dos líneas</strong>: 
                  <span className="text-primary font-semibold ml-1">DAZE</span> & 
                  <span className="text-primary font-semibold ml-1">HAZE</span>.
                </p>
              </div>
            </SlideInLeft>
            <SlideInRight className="relative">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-xl sm:rounded-3xl opacity-0 group-hover:opacity-70 blur transition-all duration-500" />
                <div className="relative aspect-square bg-gradient-to-br from-surface to-surface-elevated rounded-xl sm:rounded-3xl overflow-hidden border border-white/10">
                  <img 
                    src="https://res.cloudinary.com/dpeepkwas/image/upload/v1770579372/DZH-1_utzbn9.jpg" 
                    alt="DazeHaze Brand" 
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                  />
                </div>
              </div>
            </SlideInRight>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="relative py-16 lg:py-24 bg-surface/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeInUp>
            <span className="text-primary font-bold uppercase tracking-widest text-sm">Conéctate con Nosotros</span>
            <h2 className="text-3xl md:text-4xl font-display tracking-wide text-white mt-2 mb-12">SÍGUENOS EN REDES</h2>
          </FadeInUp>
          
          <div className="grid grid-cols-3 gap-2 sm:gap-8">
            {/* Facebook */}
            <a 
              href="https://www.facebook.com/profile.php?id=61558318361732" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block relative bg-surface-elevated/50 backdrop-blur-xl border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-8 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all duration-200 ease-out hover:-translate-y-2 group"
            >
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out" />
              <div className="relative w-8 h-8 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-6 group-hover:scale-[1.05] group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-200 ease-out">
                <Facebook className="w-4 h-4 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-[10px] sm:text-xl font-bold text-white mb-1">Facebook</h3>
              <p className="text-text-secondary text-[8px] sm:text-sm hidden sm:block">Comunidad</p>
            </a>

            {/* Instagram */}
            <a 
              href="https://www.instagram.com/dazehaze.st" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block relative bg-surface-elevated/50 backdrop-blur-xl border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-8 hover:border-pink-500/50 hover:bg-pink-500/10 transition-all duration-200 ease-out hover:-translate-y-2 group"
            >
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out" />
              <div className="relative w-8 h-8 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 rounded-lg sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-6 group-hover:scale-[1.05] group-hover:shadow-lg group-hover:shadow-pink-500/30 transition-all duration-200 ease-out">
                <Instagram className="w-4 h-4 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-[10px] sm:text-xl font-bold text-white mb-1">Instagram</h3>
              <p className="text-text-secondary text-[8px] sm:text-sm hidden sm:block">Looks</p>
            </a>

            {/* TikTok */}
            <a 
              href="https://www.tiktok.com/@dazehazest" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block relative bg-surface-elevated/50 backdrop-blur-xl border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-8 hover:border-white/50 hover:bg-white/5 transition-all duration-200 ease-out hover:-translate-y-2 group"
            >
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out" />
              <div className="relative w-8 h-8 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-800 to-black rounded-lg sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-6 group-hover:scale-[1.05] group-hover:shadow-lg group-hover:shadow-white/20 transition-all duration-200 ease-out border border-white/10">
                <svg className="w-4 h-4 sm:w-8 sm:h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
                </svg>
              </div>
              <h3 className="text-[10px] sm:text-xl font-bold text-white mb-1">TikTok</h3>
              <p className="text-text-secondary text-[8px] sm:text-sm hidden sm:block">Contenido</p>
            </a>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="relative py-16 lg:py-24 border-t border-white/5 bg-surface/20 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-primary font-bold uppercase tracking-widest text-sm">DazeHaze Loyalty</span>
            <h2 className="text-3xl md:text-4xl font-display tracking-wide text-white mt-2">NUESTROS VALORES</h2>
            <p className="text-text-secondary mt-4 max-w-2xl mx-auto">
              Los valores de DAZEHAZE Loyalty (nuestro equipo de trabajo) son un pilar para el desarrollo 
              de la empresa, y por lo tanto son indispensables e inquebrantables.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {values.map((value, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
                className="relative bg-surface border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-primary/50 transition-all duration-200 hover:-translate-y-2 hover:scale-[1.02] ease-out group overflow-hidden"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out" />
                
                <div>
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-primary to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-200 ease-out">
                    <value.icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h3 className="text-[11px] sm:text-lg font-bold text-white mb-1">{value.title}</h3>
                  <p className="text-[9px] sm:text-sm text-text-secondary leading-relaxed line-clamp-2">{value.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 lg:py-24 overflow-hidden border-t border-white/5">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-surface/40 to-surface/40 backdrop-blur-md" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5 animate-pulse" />
        
        {/* Floating elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-xl sm:text-4xl font-display tracking-wide text-white mb-4 uppercase">
              EXPERIENCIA DAZEHAZE
            </h2>
            <p className="text-text-secondary text-xs sm:text-lg mb-8 max-w-2xl mx-auto">
              Diseño alternativo para quienes se atreven a ser diferentes.
            </p>
            <Link 
              to="/catalogo"
              className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary-hover hover:to-purple-700 text-white font-bold rounded-lg sm:rounded-xl transition-all duration-200 ease-out shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.03] hover:-translate-y-1 group border border-white/10 text-xs sm:text-base"
            >
              Explorar Colección
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
