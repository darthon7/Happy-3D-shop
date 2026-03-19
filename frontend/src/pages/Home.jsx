import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useNewArrivals, useFeaturedProducts } from '../hooks/useQueries';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FadeInUp, StaggerContainer, StaggerItem } from '../components/common/Animations';
import { Tilt3DCard } from '../components/common/Effects3D';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const heroImg = "https://res.cloudinary.com/dpeepkwas/image/upload/v1773684179/FondoH3DS_xglgzb.jpg";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};

const Home = () => {
  const shouldReduceMotion = useReducedMotion();
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

  const features = [
    { emoji: "🎨", title: "Diseño Personalizado", desc: "Creamos props únicos diseñados específicamente para tus necesidades." },
    { emoji: "✨", title: "Acabado Profesional", desc: "Cada pieza recibe un acabado artesanal de alta calidad." },
    { emoji: "📦", title: "Envío Seguro", desc: "Embalaje profesional para que tu pedido llegue intacto." },
  ];

  return (
    <div className="bg-background-light text-text-primary font-sans w-full">
      {/* Hero Section */}
      <section 
        className="relative h-[420px] bg-cover bg-center flex items-center justify-center flex-col text-center px-6 overflow-hidden w-full"
        style={{ 
          background: `linear-gradient(rgba(15,20,60,0.72), rgba(15,20,60,0.72)), url(${heroImg}) center/cover no-repeat`
        }}
      >
        <div className="absolute inset-4 border border-primary/55 pointer-events-none rounded-sm" />
        
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
              className="absolute w-5 h-5 border-primary border-solid opacity-80"
              style={positions[i]}
            />
          );
        })}

        <motion.h1 
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-primary text-4xl md:text-5xl font-bold mb-3 tracking-wide relative z-10"
        >
          Forja tu Propia Leyenda
        </motion.h1>
        
        <motion.p 
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-text-inverse-secondary text-base max-w-md leading-relaxed mb-7 relative z-10"
        >
          Réplicas artesanales impresas en 3D para el aventurero exigente.
        </motion.p>
        
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10"
        >
          <Link to="/catalogo">
            <Button variant="primary-glow" size="lg">
              Explorar Catálogo
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Best Sellers Section */}
      <section className="py-14 px-10 bg-background-light">
        <FadeInUp>
          <p className="text-center text-primary text-sm tracking-[2px] uppercase mb-1">
            Favoritos de la Comunidad
          </p>
          <h2 className="text-2xl font-bold text-center text-text-primary mb-2 tracking-wide">
            Productos Más Vendidos
          </h2>
        </FadeInUp>
        
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8">
          {loadingFeatured ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="border border-primary/20 rounded overflow-hidden bg-white animate-shimmer">
                <div className="aspect-square bg-gray-100" />
                <div className="p-4 bg-background-cream space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                </div>
              </div>
            ))
          ) : bestSellers.length > 0 ? (
            bestSellers.map((product) => (
              <StaggerItem key={product.id}>
                <Tilt3DCard scale={1.02} maxTilt={8} glareOpacity={0.08}>
                  <Link to={`/producto/${product.slug}`} className="block">
                    <div className="border border-primary/20 rounded overflow-hidden bg-white hover-lift">
                      <div className="aspect-square relative overflow-hidden bg-background-cream">
                        {product.mainImageUrl ? (
                          <img 
                            src={product.mainImageUrl} 
                            alt={product.name} 
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl uppercase font-bold text-primary/30 italic">
                            No Image
                          </div>
                        )}
                        {product.isOnSale && (
                          <Badge variant="gold" className="absolute top-2 right-2">
                            -{product.discountPercentage}%
                          </Badge>
                        )}
                      </div>
                      <div className="p-3 text-center bg-background-cream border-t border-primary/10">
                        <div className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1 truncate">
                          {product.categoryName || 'Coleccionable'}
                        </div>
                        <h3 className="text-xs font-bold text-text-primary mb-1 line-clamp-1">
                          {product.name}
                        </h3>
                        <div className="text-sm font-bold text-text-primary">
                          {formatCurrency(product.salePrice || product.basePrice)}
                        </div>
                      </div>
                    </div>
                  </Link>
                </Tilt3DCard>
              </StaggerItem>
            ))
          ) : (
            [
              { name: "Casco de Caballero", price: 1299, image: "https://res.cloudinary.com/dpeepkwas/image/upload/v1773684179/Categories/Casco.jpg" },
              { name: "Espada Maestra", price: 850, image: "https://res.cloudinary.com/dpeepkwas/image/upload/v1773684179/Categories/Espada.jpg" },
              { name: "Escudo Hyliano", price: 950, image: "https://res.cloudinary.com/dpeepkwas/image/upload/v1773684179/Categories/Escudo.jpg" },
              { name: "Daga de Cristal", price: 450, image: "https://res.cloudinary.com/dpeepkwas/image/upload/v1773684179/Categories/Daga.jpg" },
            ].map((prod, i) => (
              <StaggerItem key={i}>
                <Tilt3DCard scale={1.02} maxTilt={8} glareOpacity={0.08}>
                  <div className="border border-primary/20 rounded overflow-hidden bg-white hover-lift">
                    <div className="aspect-square bg-background-cream flex items-center justify-center text-5xl grayscale hover:grayscale-0 transition-all">
                       🏺
                    </div>
                    <div className="p-3 text-center bg-background-cream">
                      <h3 className="text-xs font-bold text-text-primary mb-1">{prod.name}</h3>
                      <div className="text-sm font-bold text-primary">{formatCurrency(prod.price)}</div>
                    </div>
                  </div>
                </Tilt3DCard>
              </StaggerItem>
            ))
          )}
        </StaggerContainer>
      </section>

      {/* New Arrivals Section */}
      <section className="py-14 px-10 bg-dark-900">
        <FadeInUp>
          <p className="text-center text-primary text-sm tracking-[2px] uppercase mb-1">
            Lo Más Nuevo
          </p>
          <h2 className="text-2xl font-bold text-center text-text-inverse-secondary mb-8 tracking-wide">
            Recién Llegados
          </h2>
        </FadeInUp>

        <div className="relative max-w-4xl mx-auto">
          <button 
            onClick={prevCarousel}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 bg-primary text-dark-900 border-none rounded-full w-9 h-9 text-lg font-bold cursor-pointer flex items-center justify-center hover:bg-primary-dark transition-all hover-lift"
          >
            <ChevronLeft size={20} />
          </button>

          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loadingArrivals ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-background-cream rounded-lg p-4 text-center border border-primary/30 animate-shimmer">
                  <div className="h-32 bg-gray-200 rounded mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                </div>
              ))
            ) : newArrivals.length > 0 ? (
              visibleProducts.map((product) => (
                <StaggerItem key={product.id}>
                  <div className="bg-background-cream rounded-lg p-4 text-center border border-primary/30 hover-lift hover:border-primary transition-all">
                    <Link to={`/producto/${product.slug}`}>
                      <div className="aspect-square flex items-center justify-center text-6xl mb-3 overflow-hidden rounded">
                        {product.mainImageUrl || product.images?.[0]?.url ? (
                          <img 
                            src={product.mainImageUrl || product.images[0].url} 
                            alt={product.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <span>🎭</span>
                        )}
                      </div>
                      <div className="text-primary font-bold text-base mb-1">
                        {formatCurrency(product.salePrice || product.basePrice)}
                      </div>
                      <div className="text-text-primary text-sm mb-3 line-clamp-2 font-medium">
                        {product.name}
                      </div>
                      <Button variant="secondary" size="sm">
                        Ver Detalle
                      </Button>
                    </Link>
                  </div>
                </StaggerItem>
              ))
            ) : (
              [
                { name: "Katana Neón", price: 349, emoji: "🗡️" },
                { name: "Placa de Pecho Mando", price: 189, emoji: "🛡️" },
                { name: "Núcleo de Célula de Fusión", price: 95, emoji: "⚡" },
                { name: "Espada Láser's", price: 249, emoji: "⚔️" },
              ].map((item, i) => (
                <StaggerItem key={i}>
                  <div className="bg-background-cream rounded-lg p-4 text-center border border-primary/30 hover-lift hover:border-primary transition-all">
                    <div className="aspect-square flex items-center justify-center text-6xl mb-3">
                      {item.emoji}
                    </div>
                    <div className="text-primary font-bold text-base mb-1">
                      {formatCurrency(item.price)}
                    </div>
                    <div className="text-text-primary text-sm mb-3 font-medium">
                      {item.name}
                    </div>
                    <Link to="/catalogo">
                      <Button variant="secondary" size="sm">
                        Ver Detalle
                      </Button>
                    </Link>
                  </div>
                </StaggerItem>
              ))
            )}
          </StaggerContainer>

          <button 
            onClick={nextCarousel}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 bg-primary text-dark-900 border-none rounded-full w-9 h-9 text-lg font-bold cursor-pointer flex items-center justify-center hover:bg-primary-dark transition-all hover-lift"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* Features/Benefits Section */}
      <section className="py-14 px-10 bg-background-light">
        <div className="max-w-4xl mx-auto">
          <FadeInUp>
            <h2 className="text-2xl font-bold text-center text-text-primary mb-8 tracking-wide">
              ¿Por Qué Elegirnos?
            </h2>
          </FadeInUp>
          
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <StaggerItem key={feature.title}>
                <div className="text-center p-6 border border-primary/30 rounded-xl bg-white/40 hover:shadow-lg hover:border-primary hover-lift transition-all">
                  <div className="text-4xl mb-3">{feature.emoji}</div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">{feature.title}</h3>
                  <p className="text-text-primary/70 text-sm">
                    {feature.desc}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 px-10 bg-dark-900 text-center">
        <FadeInUp>
          <h2 className="text-2xl md:text-3xl font-bold text-text-inverse-secondary mb-4 tracking-wide">
            ¿Listo para Comenzar?
          </h2>
          <p className="text-text-inverse-secondary/80 mb-6 max-w-md mx-auto">
            Explora nuestro catálogo y encuentra el props perfecto para tu próximo proyecto.
          </p>
          <Link to="/catalogo">
            <Button variant="primary-glow" size="lg">
              Ver Catálogo
            </Button>
          </Link>
        </FadeInUp>
      </section>
    </div>
  );
};

export default Home;
