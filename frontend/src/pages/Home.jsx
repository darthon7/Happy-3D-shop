import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useNewArrivals, useFeaturedProducts } from '../hooks/useQueries';
import { ChevronLeft, ChevronRight } from 'lucide-react';


const heroImg = "https://res.cloudinary.com/dpeepkwas/image/upload/v1773684179/FondoH3DS_xglgzb.jpg";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};

const Home = () => {
  const { data: arrivalsData, isLoading: loadingArrivals } = useNewArrivals(4);
  const { data: featuredData, isLoading: loadingFeatured } = useFeaturedProducts();
  
  const newArrivals = useMemo(() => 
    arrivalsData?.content || arrivalsData || [], 
    [arrivalsData]
  );
  const bestSellers = useMemo(() => {
    const list = featuredData?.content || featuredData || [];
    return list.slice(0, 8);
  }, [featuredData]);

  const [heroHover, setHeroHover] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const visibleProducts = useMemo(() => {
    if (newArrivals.length <= 4) return newArrivals;
    return newArrivals.slice(carouselIndex, carouselIndex + 4);
  }, [newArrivals, carouselIndex]);

  const nextCarousel = () => {
    if (newArrivals.length > 4) {
      setCarouselIndex((prev) => (prev + 1) % (newArrivals.length - 3));
    }
  };

  const prevCarousel = () => {
    if (newArrivals.length > 4) {
      setCarouselIndex((prev) => (prev === 0 ? newArrivals.length - 4 : prev - 1));
    }
  };


  return (
    <div className="bg-[#F5F0E8] text-[#2C1F0E] font-sans">
{/* Hero Section */}
      <section 
        className="relative h-[420px] bg-cover bg-center flex items-center justify-center flex-col text-center px-6"
        style={{ 
          background: `linear-gradient(rgba(15,20,60,0.72), rgba(15,20,60,0.72)), url(${heroImg}) center/cover no-repeat`
        }}
      >
        <div className="absolute inset-4 border border-[#C9A84C]/55 pointer-events-none rounded-sm" />
        
        {[...Array(4)].map((_, i) => {
          const positions = [
            { top: 5, left: 5, borderWidth: '2px 0 0 2px' },
            { top: 5, right: 5, borderWidth: '2px 2px 0 0' },
            { bottom: 5, left: 5, borderWidth: '0 0 2px 2px' },
            { bottom: 5, right: 5, borderWidth: '0 2px 2px 0' },
          ];
          return (
            <div 
              key={i}
              className="absolute w-5 h-5 border-[#C9A84C] border-solid opacity-80"
              style={positions[i]}
            />
          );
        })}

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[#C9A84C] text-4xl md:text-5xl font-bold mb-3 text-shadow-[0_2px_12px_rgba(0,0,0,0.7)] tracking-wide relative z-10"
        >
          Forja tu Propia Leyenda
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[#E8DCC8] text-base max-w-md leading-relaxed mb-7 relative z-10"
        >
          Réplicas artesanales impresas en 3D para el aventurero exigente.
        </motion.p>
        
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onMouseEnter={() => setHeroHover(true)}
          onMouseLeave={() => setHeroHover(false)}
          className="bg-[#C9A84C] text-[#1B2A5E] border-none px-9 py-3.5 text-sm font-bold tracking-[2px] uppercase cursor-pointer transition-all relative z-10"
          style={{
            background: heroHover ? '#b8943e' : '#C9A84C',
            transform: heroHover ? 'scale(1.03)' : 'scale(1)',
          }}
        >
          <Link to="/catalogo">
            Explorar Catálogo
          </Link>
        </motion.button>
      </section>

      {/* Best Sellers Section */}
      <section className="py-14 px-10 bg-[#F5F0E8]">
        <p className="text-center text-[#C9A84C] text-sm tracking-[2px] uppercase mb-1">
          Favoritos de la Comunidad
        </p>
        <h2 className="text-2xl font-bold text-center text-[#2C1F0E] mb-2 tracking-wide">
          Productos Más Vendidos
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8">
          {loadingFeatured ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="border border-[#C9A84C]/20 rounded-sm overflow-hidden bg-white animate-pulse">
                <div className="aspect-square bg-gray-100" />
                <div className="p-4 bg-[#F5F0E8] space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                </div>
              </div>
            ))
          ) : bestSellers.length > 0 ? (
            bestSellers.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="group border border-[#C9A84C]/20 rounded-sm overflow-hidden bg-white shadow-sm hover:shadow-md transition-all"
              >
                <Link to={`/producto/${product.slug}`}>
                  <div className="aspect-square relative overflow-hidden bg-[#F5F0E8]">
                    {product.mainImageUrl ? (
                      <img 
                        src={product.mainImageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl uppercase font-bold text-[#C9A84C]/30 italic">
                        No Image
                      </div>
                    )}
                    {product.isOnSale && (
                      <div className="absolute top-2 right-2 bg-[#C9A84C] text-[#1B2A5E] text-[10px] font-bold px-2 py-1 rounded-sm">
                        -{product.discountPercentage}%
                      </div>
                    )}
                  </div>
                  <div className="p-3 text-center bg-[#F5F0E8] border-t border-[#C9A84C]/10">
                    <div className="text-[10px] text-[#C9A84C] font-bold uppercase tracking-wider mb-1 truncate">
                      {product.categoryName || 'Coleccionable'}
                    </div>
                    <h3 className="text-xs font-bold text-[#2C1F0E] mb-1 line-clamp-1">
                      {product.name}
                    </h3>
                    <div className="text-sm font-bold text-[#2C1F0E]">
                      {formatCurrency(product.salePrice || product.basePrice)}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          ) : (
            [
              { name: "Casco de Caballero", price: 1299, image: "https://res.cloudinary.com/dpeepkwas/image/upload/v1773684179/Categories/Casco.jpg" },
              { name: "Espada Maestra", price: 850, image: "https://res.cloudinary.com/dpeepkwas/image/upload/v1773684179/Categories/Espada.jpg" },
              { name: "Escudo Hyliano", price: 950, image: "https://res.cloudinary.com/dpeepkwas/image/upload/v1773684179/Categories/Escudo.jpg" },
              { name: "Daga de Cristal", price: 450, image: "https://res.cloudinary.com/dpeepkwas/image/upload/v1773684179/Categories/Daga.jpg" },
            ].map((prod, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border border-[#C9A84C]/20 rounded-sm overflow-hidden bg-white grayscale hover:grayscale-0 transition-all"
              >
                <div className="aspect-square bg-[#F5F0E8] flex items-center justify-center text-5xl">
                   🏺
                </div>
                <div className="p-3 text-center bg-[#F5F0E8]">
                  <h3 className="text-xs font-bold text-[#2C1F0E] mb-1">{prod.name}</h3>
                  <div className="text-sm font-bold text-[#C9A84C]">{formatCurrency(prod.price)}</div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-14 px-10 bg-[#1B2A5E]">
        <p className="text-center text-[#C9A84C] text-sm tracking-[2px] uppercase mb-1">
          Lo Más Nuevo
        </p>
        <h2 className="text-2xl font-bold text-center text-[#E8DCC8] mb-8 tracking-wide">
          Recién Llegados
        </h2>

        <div className="relative max-w-4xl mx-auto">
          <button 
            onClick={prevCarousel}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 bg-[#C9A84C] border-none rounded-full w-9 h-9 text-[#1B2A5E] text-lg font-bold cursor-pointer flex items-center justify-center hover:bg-[#b8943e] transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loadingArrivals ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#F5F0E8] rounded p-4 text-center border border-[#C9A84C]/30">
                  <div className="h-32 bg-gray-200 rounded mb-3 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                </div>
              ))
            ) : newArrivals.length > 0 ? (
              visibleProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#F5F0E8] rounded p-4 text-center border border-[#C9A84C]/30"
                >
                  <Link to={`/producto/${product.slug}`}>
                    <div className="aspect-square flex items-center justify-center text-6xl mb-3 overflow-hidden rounded">
                      {product.mainImageUrl || product.images?.[0]?.url ? (
                        <img 
                          src={product.mainImageUrl || product.images[0].url} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>🎭</span>
                      )}
                    </div>
                    <div className="text-[#C9A84C] font-bold text-base mb-1">
                      {formatCurrency(product.salePrice || product.basePrice)}
                    </div>
                    <div className="text-[#2C1F0E] text-sm mb-3 line-clamp-2 font-medium">
                      {product.name}
                    </div>
                    <button className="bg-[#C9A84C] text-[#1B2A5E] border-none rounded-full px-5 py-2 text-xs font-bold cursor-pointer hover:bg-[#b8943e] transition-colors">
                      Ver Detalle
                    </button>
                  </Link>
                </motion.div>
              ))
            ) : (
              [
                { name: "Katana Neón", price: 349, emoji: "🗡️" },
                { name: "Placa de Pecho Mando", price: 189, emoji: "🛡️" },
                { name: "Núcleo de Célula de Fusión", price: 95, emoji: "⚡" },
                { name: "Espada Láser's", price: 249, emoji: "⚔️" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#F5F0E8] rounded p-4 text-center border border-[#C9A84C]/30"
                >
                  <div className="aspect-square flex items-center justify-center text-6xl mb-3">
                    {item.emoji}
                  </div>
                  <div className="text-[#C9A84C] font-bold text-base mb-1">
                    {formatCurrency(item.price)}
                  </div>
                  <div className="text-[#2C1F0E] text-sm mb-3 font-medium">
                    {item.name}
                  </div>
                  <Link to="/catalogo">
                    <button className="bg-[#C9A84C] text-[#1B2A5E] border-none rounded-full px-5 py-2 text-xs font-bold cursor-pointer hover:bg-[#b8943e] transition-colors">
                      Ver Detalle
                    </button>
                  </Link>
                </motion.div>
              ))
            )}
          </div>

          <button 
            onClick={nextCarousel}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 bg-[#C9A84C] border-none rounded-full w-9 h-9 text-[#1B2A5E] text-lg font-bold cursor-pointer flex items-center justify-center hover:bg-[#b8943e] transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* Features/Benefits Section */}
      <section className="py-14 px-10 bg-[#F5F0E8]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#2C1F0E] mb-8 tracking-wide">
            ¿Por Qué Elegirnos?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center p-6"
            >
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="text-lg font-bold text-[#2C1F0E] mb-2">Diseño Personalizado</h3>
              <p className="text-[#2C1F0E]/70 text-sm">
                Creamos props únicos diseñados específicamente para tus necesidades.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center p-6"
            >
              <div className="text-4xl mb-3">✨</div>
              <h3 className="text-lg font-bold text-[#2C1F0E] mb-2">Acabado Profesional</h3>
              <p className="text-[#2C1F0E]/70 text-sm">
                Cada pieza recibe un acabado artesanal de alta calidad.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center p-6"
            >
              <div className="text-4xl mb-3">📦</div>
              <h3 className="text-lg font-bold text-[#2C1F0E] mb-2">Envío Seguro</h3>
              <p className="text-[#2C1F0E]/70 text-sm">
                Embalaje profesional para que tu pedido llegue intacto.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-14 px-10 bg-[#1B2A5E] text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-[#E8DCC8] mb-4 tracking-wide">
            ¿Listo para Comenzar?
          </h2>
          <p className="text-[#E8DCC8]/80 mb-6 max-w-md mx-auto">
            Explora nuestro catálogo y encuentra el props perfecto para tu próximo proyecto.
          </p>
          <Link 
            to="/catalogo"
            className="inline-block bg-[#C9A84C] text-[#1B2A5E] px-8 py-3 font-bold tracking-[2px] uppercase hover:bg-[#b8943e] transition-colors"
          >
            Ver Catálogo
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
