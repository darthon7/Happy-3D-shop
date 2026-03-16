import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import { wishlistApi } from '../../api';
import { useCartStore } from '../../stores';
import toast from 'react-hot-toast';

const Wishlist = ({ embedded = false }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await wishlistApi.get();
        // Backend returns { items: [...], totalItems: n }
        setItems(response.data?.items || []);
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await wishlistApi.remove(productId);
      setItems(items.filter(item => item.productId !== productId));
      toast.success('Eliminado de favoritos');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Error al eliminar');
    }
  };

  const handleAddToCart = async (item) => {
    try {
      // Note: We don't have variant info in wishlist items, redirect to product page
      toast('Visita la página del producto para agregar al carrito', { icon: '🛒' });
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  if (loading) {
    return (
      <div className={embedded ? "w-full" : "min-h-screen bg-background-dark"}>
        <div className={embedded ? "" : "max-w-7xl mx-auto px-4 sm:px-6 py-8"}>
          {!embedded && <h1 className="text-3xl font-bold text-white mb-8">Favoritos</h1>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-surface rounded-xl overflow-hidden border border-border">
                <div className="aspect-square bg-surface-elevated animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-surface-elevated rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-surface-elevated rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "w-full" : "min-h-screen bg-background-dark"}>
      <div className={embedded ? "" : "max-w-7xl mx-auto px-4 sm:px-6 py-8"}>
        {!embedded && (
          <h1 className="text-3xl font-bold text-white mb-8">
            Favoritos
            {items.length > 0 && (
              <span className="text-lg font-normal text-text-secondary ml-2">
                ({items.length})
              </span>
            )}
          </h1>
        )}
        
        {items.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 mx-auto text-text-muted mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Tu lista está vacía</h2>
            <p className="text-text-secondary mb-6">Guarda tus productos favoritos para después</p>
            <Link 
              to="/catalogo" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all"
            >
              Explorar Catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map(item => {
              const hasDiscount = item.salePrice && item.salePrice < item.price;
              
              return (
                <div key={item.productId} className="bg-surface rounded-xl overflow-hidden border border-border group hover:border-primary/50 transition-all">
                  {/* Image */}
                  <Link to={`/producto/${item.productSlug}`} className="block aspect-square overflow-hidden bg-surface-elevated relative">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted">
                        Sin imagen
                      </div>
                    )}
                    
                    {/* Sale Badge */}
                    {hasDiscount && (
                      <span className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2 py-1 rounded">
                        Oferta
                      </span>
                    )}
                    
                    {/* Out of Stock Badge */}
                    {!item.inStock && (
                      <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        Agotado
                      </span>
                    )}
                    
                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemove(item.productId);
                      }}
                      className="absolute top-3 right-3 p-2 bg-surface/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Link>
                  
                  {/* Info */}
                  <div className="p-4">
                    <Link to={`/producto/${item.productSlug}`}>
                      <h3 className="font-medium text-white hover:text-primary transition-colors line-clamp-2">
                        {item.productName}
                      </h3>
                    </Link>
                    
                    {/* Price */}
                    <div className="mt-2 flex items-center gap-2">
                      {hasDiscount ? (
                        <>
                          <span className="font-bold text-primary">${item.salePrice?.toFixed(2)}</span>
                          <span className="text-sm text-text-muted line-through">
                            ${item.price?.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-primary">${item.price?.toFixed(2)}</span>
                      )}
                    </div>
                    
                    {/* View Product button */}
                    <Link
                      to={`/producto/${item.productSlug}`}
                      className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg transition-all text-sm"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Ver Producto
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
