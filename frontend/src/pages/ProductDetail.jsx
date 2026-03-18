import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productsApi, wishlistApi } from '../api';
import { useCartStore, useAuthStore } from '../stores';
import AnimatedCartButton from '../components/ui/AnimatedCartButton';
import toast from 'react-hot-toast';
import { ReviewSection } from '../components/reviews/ReviewSection';

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await productsApi.getBySlug(slug);
        setProduct(response.data);
        if (response.data.materials?.length > 0) {
          setSelectedVariant(response.data.materials[0]);
        }
        if (isAuthenticated && response.data?.id) {
          try {
            const wishlistRes = await wishlistApi.get();
            const items = wishlistRes.data?.items || [];
            setIsInWishlist(items.some(item => item.productId === response.data.id));
          } catch (err) {
            console.error('Error checking wishlist:', err);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug, isAuthenticated]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Inicia sesión para agregar al carrito');
      navigate('/login');
      throw new Error('No authenticated');
    }
    if (selectedVariant) {
      try {
        await addItem(selectedVariant.id, quantity);
        toast.success('Agregado al carrito');
      } catch (error) {
        toast.error('Error al agregar al carrito');
        throw error;
      }
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Inicia sesión para guardar favoritos');
      navigate('/login');
      return;
    }
    if (wishlistLoading || !product) return;
    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await wishlistApi.remove(product.id);
        setIsInWishlist(false);
        toast.success('Eliminado de favoritos');
      } else {
        await wishlistApi.add(product.id);
        setIsInWishlist(true);
        toast.success('Agregado a favoritos', { icon: '❤️' });
      }
    } catch (error) {
      toast.error('Error al actualizar favoritos');
    } finally {
      setWishlistLoading(false);
    }
  };

  const uniqueColors = product?.materials
    ? [...new Map(product.materials.map(v => [v.color, v])).values()]
    : [];

  const uniqueMaterials = product?.materials
    ? [...new Set(product.materials.map(v => v.material))]
    : [];

  const getMaterialVariant = (material) =>
    product?.materials?.find(v => v.material === material);

  /* ─── Loading skeleton ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="h-4 bg-[#2C1F0E]/10 rounded w-56 mb-8 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="aspect-square bg-[#2C1F0E]/10 rounded-lg animate-pulse" />
              <div className="flex gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-20 h-20 bg-[#2C1F0E]/10 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-5 pt-4">
              <div className="h-4 bg-[#2C1F0E]/10 rounded w-24 animate-pulse" />
              <div className="h-10 bg-[#2C1F0E]/10 rounded w-3/4 animate-pulse" />
              <div className="h-8 bg-[#2C1F0E]/10 rounded w-1/3 animate-pulse" />
              <div className="h-24 bg-[#2C1F0E]/10 rounded animate-pulse" />
              <div className="h-12 bg-[#2C1F0E]/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Not found ─── */
  if (!product) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-[#2C1F0E]">Producto no encontrado</h1>
          <Link
            to="/catalogo"
            className="inline-block bg-[#C9A84C] text-[#1B2A5E] px-6 py-3 font-bold uppercase tracking-wider hover:bg-[#b8943e] transition-colors rounded"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice;
  const basePrice = hasDiscount ? product.salePrice : product.basePrice;
  const priceAdjustment = selectedVariant?.priceAdjustment ? Number(selectedVariant.priceAdjustment) : 0;
  const currentPrice = basePrice ? (basePrice + priceAdjustment) : null;
  const discountPct = hasDiscount
    ? Math.round((1 - product.salePrice / product.basePrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#2C1F0E] font-sans">

      {/* ── Breadcrumb bar ── */}
      <nav className="bg-[#1B2A5E] py-3 px-4 sm:px-6">
        <ol className="max-w-6xl mx-auto flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-[#E8DCC8]/70">
          <li><Link to="/" className="hover:text-[#C9A84C] transition-colors">Inicio</Link></li>
          <li className="opacity-40">/</li>
          <li><Link to="/catalogo" className="hover:text-[#C9A84C] transition-colors">Catálogo</Link></li>
          {product.category && (
            <>
              <li className="opacity-40">/</li>
              <li>
                <Link
                  to={`/categoria/${product.category.slug}`}
                  className="hover:text-[#C9A84C] transition-colors"
                >
                  {product.category.name}
                </Link>
              </li>
            </>
          )}
          <li className="opacity-40">/</li>
          <li className="text-[#C9A84C] font-medium truncate max-w-[200px]">{product.name}</li>
        </ol>
      </nav>

      {/* ── Product layout ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/*
           * ══════════════════════════════════
           *  LEFT: Gallery (image + thumbnails)
           * ══════════════════════════════════
           */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Main image */}
            <div className="relative aspect-square bg-white border border-[#2C1F0E]/10 rounded-xl overflow-hidden shadow-sm">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]?.url}
                  alt={images[selectedImage]?.altText || product.name}
                  loading="eager"
                  className="w-full h-full object-cover"
                />
              ) : product.mainImageUrl ? (
                <img
                  src={product.mainImageUrl}
                  alt={product.name}
                  loading="eager"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#2C1F0E]/20 text-7xl">
                  🎭
                </div>
              )}

              {/* Arrow navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(i => i === 0 ? images.length - 1 : i - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-[#1B2A5E]/80 hover:bg-[#1B2A5E] text-[#C9A84C] rounded-full transition-colors shadow-md"
                    aria-label="Imagen anterior"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  <button
                    onClick={() => setSelectedImage(i => i === images.length - 1 ? 0 : i + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-[#1B2A5E]/80 hover:bg-[#1B2A5E] text-[#C9A84C] rounded-full transition-colors shadow-md"
                    aria-label="Imagen siguiente"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {product.isNew && (
                  <span className="px-3 py-1 bg-[#1B2A5E] text-[#C9A84C] text-xs font-bold rounded-full border border-[#C9A84C]/60">
                    Nuevo
                  </span>
                )}
                {hasDiscount && (
                  <span className="px-3 py-1 bg-[#C9A84C] text-[#1B2A5E] text-xs font-bold rounded-full shadow">
                    -{discountPct}%
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails row */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === i
                        ? 'border-[#C9A84C] shadow-[0_0_0_3px_rgba(201,168,76,0.25)]'
                        : 'border-transparent hover:border-[#C9A84C]/50 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/*
           * ══════════════════════════════════════════════════════════
           *  RIGHT: All product info — name, price, desc, variants, CTA
           * ══════════════════════════════════════════════════════════
           */}
          <motion.div
            className="flex flex-col gap-5"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Category label */}
            {product.category && (
              <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-[3px]">
                {product.category.name}
              </p>
            )}

            {/* Product name */}
            <h1 className="text-3xl lg:text-4xl font-bold text-[#1B2A5E] leading-tight">
              {product.name}
            </h1>

            {/* Price + stock */}
            <div className="flex items-center flex-wrap gap-3">
              <span className="text-3xl font-bold text-[#C9A84C]">
                ${currentPrice?.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-lg text-[#2C1F0E]/40 line-through">
                  ${product.basePrice?.toFixed(2)}
                </span>
              )}
              {selectedVariant && (
                selectedVariant.stock > 0 ? (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    {selectedVariant.stock > 10 ? 'En Stock' : `Solo ${selectedVariant.stock} disponibles`}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                    Agotado
                  </span>
                )
              )}
            </div>

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-[#2C1F0E]/70 text-sm leading-relaxed border-b border-[#2C1F0E]/10 pb-5">
                {product.shortDescription}
              </p>
            )}

            {/* Full description */}
            {product.description && (
              <p className="text-[#2C1F0E]/70 text-sm leading-relaxed border-b border-[#2C1F0E]/10 pb-5">
                {product.description}
              </p>
            )}

            {/* ── Color Selection ── */}
                  {uniqueColors.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-[#2C1F0E] uppercase tracking-widest mb-3">
                  Color: <span className="font-normal normal-case tracking-normal text-[#2C1F0E]/60">{selectedVariant?.color}</span>
                </h3>
                <div className="flex flex-wrap gap-3">
                  {uniqueColors.map((variant) => (
                    <button
                      key={variant.color}
                      onClick={() => {
                        const newVariant = product.materials.find(v => v.color === variant.color && v.material === selectedVariant?.material);
                        if (newVariant) setSelectedVariant(newVariant);
                      }}
                      title={variant.color}
                      className={`w-9 h-9 rounded-full border-2 transition-all ${
                        selectedVariant?.color === variant.color
                          ? 'border-[#C9A84C] ring-2 ring-[#C9A84C]/40 ring-offset-1'
                          : 'border-[#2C1F0E]/20 hover:border-[#C9A84C]/50'
                      }`}
                      style={{ backgroundColor: variant.colorHex || '#ccc' }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Material Selection ── */}
            {uniqueMaterials.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-[#2C1F0E] uppercase tracking-widest mb-3">
                  Material: <span className="font-normal normal-case tracking-normal text-[#2C1F0E]/60">{selectedVariant?.material}</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {uniqueMaterials.map((material) => {
                    const variant = getMaterialVariant(material);
                    const exists = !!variant;
                    const inStock = exists && variant.stock > 0;
                    const priceAdj = variant?.priceAdjustment;
                    return (
                      <button
                        key={material}
                        onClick={() => variant && setSelectedVariant(variant)}
                        disabled={!inStock}
                        className={`px-4 py-2 rounded-md border text-sm font-semibold transition-all ${
                          selectedVariant?.material === material
                            ? 'bg-[#1B2A5E] text-[#C9A84C] border-[#1B2A5E]'
                            : !exists
                              ? 'border-[#2C1F0E]/10 text-[#2C1F0E]/25 cursor-not-allowed'
                              : inStock
                                ? 'border-[#2C1F0E]/25 text-[#2C1F0E] hover:border-[#1B2A5E] hover:text-[#1B2A5E]'
                                : 'border-[#2C1F0E]/10 text-[#2C1F0E]/25 cursor-not-allowed line-through'
                        }`}
                      >
                        {material}{priceAdj > 0 ? ` (+$${Number(priceAdj).toFixed(2)})` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Quantity + Add to cart ── */}
            <div className="flex items-center gap-4 pt-1">
              {/* Quantity stepper */}
              <div className="flex items-center border border-[#2C1F0E]/25 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-12 flex items-center justify-center hover:bg-[#F5F0E8] text-[#2C1F0E] transition-colors"
                  aria-label="Decrementar"
                >
                  <span className="material-symbols-outlined text-base">remove</span>
                </button>
                <span className="w-12 h-12 flex items-center justify-center text-center font-bold text-[#2C1F0E] border-x border-[#2C1F0E]/15 text-sm">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-12 flex items-center justify-center hover:bg-[#F5F0E8] text-[#2C1F0E] transition-colors"
                  aria-label="Incrementar"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                </button>
              </div>

              {/* Add to cart */}
              <div className="flex-1">
                <AnimatedCartButton
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || selectedVariant.stock === 0}
                  text={!selectedVariant || selectedVariant.stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
                  className="w-full font-bold tracking-wide"
                />
              </div>
            </div>

            {/* Wishlist button */}
            <button
              onClick={handleWishlist}
              disabled={wishlistLoading}
              className={`w-full py-3 rounded-lg border-2 flex items-center justify-center gap-2 font-semibold text-sm transition-all ${
                isInWishlist
                  ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#7a5f1a]'
                  : 'border-[#2C1F0E]/20 text-[#2C1F0E] hover:border-[#C9A84C] hover:text-[#7a5f1a] hover:bg-[#C9A84C]/5'
              }`}
            >
              <span className={`material-symbols-outlined text-lg ${isInWishlist ? 'fill-current' : ''}`}>
                favorite
              </span>
              {isInWishlist ? 'Guardado en Favoritos' : 'Agregar a Favoritos'}
            </button>

            {/* Trust badges */}
            <div className="flex items-center justify-around pt-3 border-t border-[#2C1F0E]/10 text-center">
              {[
                { icon: '🚚', label: 'Envío Seguro' },
                { icon: '✅', label: 'Autenticidad Garantizada' },
                { icon: '🏆', label: 'Artesanía Certificada' },
              ].map(badge => (
                <div key={badge.label} className="flex flex-col items-center gap-1">
                  <span className="text-xl">{badge.icon}</span>
                  <span className="text-[10px] font-semibold text-[#2C1F0E]/50 uppercase tracking-wide leading-tight max-w-[80px]">
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* ── Reviews ── */}
        {product && (
          <div className="mt-16 pt-10 border-t border-[#C9A84C]/20">
            <ReviewSection productId={product.id} />
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductDetail;
