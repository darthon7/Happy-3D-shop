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
  
  const { addItem, isLoading: cartLoading } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await productsApi.getBySlug(slug);
        setProduct(response.data);
        if (response.data.variants?.length > 0) {
          setSelectedVariant(response.data.variants[0]);
        }
        
        // Check if in wishlist if user is authenticated
        if (isAuthenticated && response.data?.id) {
          try {
            // Note: We need to implement this check in wishlistApi or check manually
             const wishlistRes = await wishlistApi.get();
             const items = wishlistRes.data?.items || [];
             const exists = items.some(item => item.productId === response.data.id);
             setIsInWishlist(exists);
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
      console.error('Error updating wishlist:', error);
      toast.error('Error al actualizar favoritos');
    } finally {
      setWishlistLoading(false);
    }
  };
  
  const uniqueColors = product?.variants
    ? [...new Map(product.variants.map(v => [v.color, v])).values()]
    : [];
  
  const uniqueSizes = product?.variants
    ? [...new Set(product.variants.map(v => v.size))]
    : [];
  
  const getVariantByColorAndSize = (color, size) => {
    return product?.variants?.find(v => v.color === color && v.size === size);
  };
  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-gray-800 rounded-xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-800 rounded w-3/4 animate-pulse" />
            <div className="h-6 bg-gray-800 rounded w-1/4 animate-pulse" />
            <div className="h-24 bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4 text-white">Producto no encontrado</h1>
        <Link to="/catalogo" className="btn btn-primary">
          Ver catálogo
        </Link>
      </div>
    );
  }
  
  const images = product.images || [];
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice;
  const currentPrice = hasDiscount ? product.salePrice : product.basePrice;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm">
        <ol className="flex items-center gap-2 text-gray-400">
          <li><Link to="/" className="hover:text-primary">Inicio</Link></li>
          <li>/</li>
          <li><Link to="/catalogo" className="hover:text-primary">Catálogo</Link></li>
          {product.category && (
            <>
              <li>/</li>
              <li>
                <Link to={`/categoria/${product.category.slug}`} className="hover:text-primary">
                  {product.category.name}
                </Link>
              </li>
            </>
          )}
          <li>/</li>
          <li className="text-white">{product.name}</li>
        </ol>
      </nav>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="space-y-4"
        >
          {/* Main Image */}
          <div className="relative aspect-square bg-gray-800 rounded-xl overflow-hidden">
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
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                Sin imagen
              </div>
            )}
            
            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage(i => i === 0 ? images.length - 1 : i - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 text-white"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button
                  onClick={() => setSelectedImage(i => i === images.length - 1 ? 0 : i + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 text-white"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </>
            )}
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isNew && <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full uppercase">Nuevo</span>}
              {hasDiscount && (
                <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  -{Math.round((1 - product.salePrice / product.basePrice) * 100)}%
                </span>
              )}
            </div>
          </div>
          
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === i ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img src={img.url} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
        
        {/* Product Info */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {product.category && (
            <p className="text-sm text-primary uppercase tracking-widest mb-2">
              {product.category.name}
            </p>
          )}
          
          <h1 className="text-3xl lg:text-4xl font-display tracking-wide mb-4 text-white">{product.name}</h1>
          
          {/* Price */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl font-bold text-primary">${currentPrice?.toFixed(2)}</span>
            {hasDiscount && (
              <span className="text-lg text-gray-500 line-through">
                ${product.basePrice?.toFixed(2)}
              </span>
            )}
          </div>
          
          {/* Short description */}
          {product.shortDescription && (
            <p className="text-gray-400 mb-6">{product.shortDescription}</p>
          )}
          
          {/* Color Selection */}
          {uniqueColors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3 text-white">
                Color: <span className="text-gray-400">{selectedVariant?.color}</span>
              </h3>
              <div className="flex gap-3">
                {uniqueColors.map((variant) => (
                  <button
                    key={variant.color}
                    onClick={() => {
                      // Get available sizes for this color that have stock
                      const availableSizes = product.variants
                        .filter(v => v.color === variant.color && v.stock > 0)
                        .map(v => v.size);
                      
                      // Use current size if available, otherwise use first available
                      let newSize = selectedVariant?.size;
                      if (!availableSizes.includes(newSize) && availableSizes.length > 0) {
                        newSize = availableSizes[0];
                      }
                      
                      const newVariant = getVariantByColorAndSize(variant.color, newSize);
                      if (newVariant) setSelectedVariant(newVariant);
                    }}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      selectedVariant?.color === variant.color
                        ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background-dark'
                        : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: variant.colorHex || '#ccc' }}
                    title={variant.color}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Size Selection */}
          {uniqueSizes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3 text-white">Talla</h3>
              <div className="flex flex-wrap gap-2">
                {uniqueSizes.map((size) => {
                  const variant = getVariantByColorAndSize(selectedVariant?.color, size);
                  const exists = !!variant;
                  const inStock = exists && variant.stock > 0;
                  return (
                    <button
                      key={size}
                      onClick={() => variant && setSelectedVariant(variant)}
                      disabled={!inStock}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        selectedVariant?.size === size
                          ? 'bg-primary text-white border-primary'
                          : !exists
                            ? 'border-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                            : inStock
                              ? 'border-gray-600 text-white hover:border-primary'
                              : 'border-gray-800 text-gray-600 cursor-not-allowed line-through'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Stock info */}
          {selectedVariant && (
            <p className="text-sm mb-6">
              {selectedVariant.stock > 0 ? (
                <span className="text-green-400">
                  {selectedVariant.stock > 10 ? 'En stock' : `Solo ${selectedVariant.stock} disponibles`}
                </span>
              ) : (
                <span className="text-red-400">Agotado</span>
              )}
            </p>
          )}
          
          {/* Quantity & Add to Cart */}
          <div className="flex gap-4 mb-8">
            <div className="flex items-center border border-gray-600 rounded-lg">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="p-3 hover:bg-white/10 transition-colors text-white"
              >
                <span className="material-symbols-outlined">remove</span>
              </button>
              <span className="w-12 text-center font-medium text-white">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="p-3 hover:bg-white/10 transition-colors text-white"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
            
            <AnimatedCartButton
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stock === 0}
              text={!selectedVariant || selectedVariant.stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
              className="flex-1 text-white shadow-[0_0_20px_rgba(198,42,185,0.4)]"
            />
            
            <button 
              onClick={handleWishlist}
              disabled={wishlistLoading}
              className={`p-3 border rounded-lg transition-colors ${
                isInWishlist 
                  ? 'bg-primary border-primary text-white' 
                  : 'border-gray-600 text-white hover:bg-white/10'
              }`}
              title={isInWishlist ? "Eliminar de favoritos" : "Agregar a favoritos"}
            >
              <span className={`material-symbols-outlined ${isInWishlist ? 'fill-current' : ''}`}>favorite</span>
            </button>
          </div>
          
          {/* Description */}
          {product.description && (
            <div className="border-t border-gray-700 pt-6">
              <h3 className="font-semibold mb-3 text-white">Descripción</h3>
              <p className="text-gray-400 whitespace-pre-line">{product.description}</p>
            </div>
          )}
        </motion.div>
      </div>
      
      {product && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-16 border-t border-gray-800">
          <ReviewSection productId={product.id} />
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
