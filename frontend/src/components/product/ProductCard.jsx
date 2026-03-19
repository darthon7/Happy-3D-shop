import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import useCartStore from '../../stores/cartStore';
import useAuthStore from '../../stores/authStore';
import { wishlistApi } from '../../api';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const addItem = useCartStore(s => s.addItem);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const navigate = useNavigate();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  
  const imageUrl = product.mainImageUrl || 
    product.images?.find(img => img.isMain)?.url || 
    product.images?.[0]?.url;
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice;
  const discountPercentage = hasDiscount ? Math.round((1 - product.salePrice / product.basePrice) * 100) : 0;
  const currentPrice = hasDiscount ? product.salePrice : product.basePrice;
  
  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Inicia sesión para agregar al carrito');
      return;
    }
    
    const mats = product.materials || product.variants || [];
    const variant = mats.find(v => v.stock > 0) || mats[0];
    if (!variant) {
      toast.error('Producto sin stock');
      return;
    }
    
    setAddingToCart(true);
    try {
      await addItem(variant.id, 1);
      toast.success('Agregado al carrito');
    } catch (error) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        toast.error('Tu sesión ha expirado');
      } else {
        toast.error('Error al agregar al carrito');
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Inicia sesión para guardar favoritos');
      navigate('/login');
      return;
    }
    
    if (wishlistLoading) return;
    
    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await wishlistApi.remove(product.id);
        setIsInWishlist(false);
        toast.success('Eliminado de favoritos');
      } else {
        await wishlistApi.add(product.id);
        setIsInWishlist(true);
        toast.success('Agregado a favoritos');
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <Link 
      to={`/producto/${product.slug}`} 
      className="group block bg-white border border-[#C9A84C]/20 rounded-[8px] overflow-hidden flex flex-col transition-all duration-200 hover:translate-y-[-4px] hover:shadow-lg"
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400">
            Sin imagen
          </div>
        )}
        
        {/* Badges */}
        {product.isNew && (
          <span className="absolute top-3 left-3 bg-header text-white text-[10px] px-2 py-1 uppercase tracking-widest font-bold rounded">
            Nuevo
          </span>
        )}
        
        {hasDiscount && (
          <span className="absolute top-3 right-3 bg-[#C9A84C] text-white text-[10px] px-2 py-1 uppercase tracking-widest font-bold rounded">
            -{discountPercentage}%
          </span>
        )}
      </div>
      
      {/* Product Info */}
      <div className="p-5 flex flex-col flex-grow">
        <p className="text-[10px] text-[#C9A84C] font-bold uppercase tracking-widest mb-1">
          {product.category?.name || 'Prop\'s Room'}
        </p>
        <h3 className="text-lg font-bold text-header mb-2 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {product.description || 'Descripción del producto'}
        </p>
        
        <div className="mt-auto flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                ${product.basePrice?.toFixed(2)}
              </span>
            )}
            <span className="text-xl font-bold text-header">
              ${currentPrice?.toFixed(2)}
            </span>
          </div>
          <button 
            onClick={handleAddToCart}
            disabled={addingToCart || !(product.materials || product.variants || []).some(v => v.stock > 0)}
            className="w-full bg-[#C9A84C] hover:bg-[#b8943e] text-[#1B2A5E] px-4 py-2.5 rounded-[8px] text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addingToCart ? 'Agregando...' : 'Agregar al Carrito'}
          </button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
