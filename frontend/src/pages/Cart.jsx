import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, ArrowRight, Lock, Minus, Plus, Trash2, ArrowLeft, CreditCard, Tag, X, AlertTriangle } from 'lucide-react';
import { useCartStore, useAuthStore } from '../stores';
import toast from 'react-hot-toast';

const Cart = () => {
  const { 
    items, 
    subtotal, 
    discount, 
    total, 
    coupon,
    isLoading,
    fetchCart,
    updateItem,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCartStore();
  
  const { isAuthenticated } = useAuthStore();

  const taxEstimate = useCartStore((state) => state.tax) ?? (subtotal * 0.16);
  const displayTotal = total > 0 ? total : (subtotal + taxEstimate);
  const hasOutOfStockItems = items.some((item) => item.availableStock === 0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);
  
  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    await updateItem(itemId, newQuantity);
  };
  
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    const code = e.target.couponCode.value;
    if (code) {
      const result = await applyCoupon(code);
      if (!result.success) {
        toast.error(result.error || 'Cupón inválido');
      } else {
        toast.success('¡Cupón aplicado con éxito!');
      }
      e.target.reset();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-brand" />
            </div>
            <h1 className="text-3xl font-bold text-header mb-4">Carrito Bloqueado</h1>
            <p className="text-gray-500 mb-8 text-lg">Por favor, inicia sesión para ver tu carrito.</p>
            <Link to="/login" className="inline-flex items-center justify-center w-full px-8 py-4 text-base font-bold text-white bg-brand rounded-[8px] hover:bg-brand-dark transition-colors">
              Iniciar Sesión
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <main className="flex-grow flex flex-col items-center justify-center p-4">
            <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingCart className="w-10 h-10 text-brand" />
                </div>
                <h1 className="text-3xl font-bold text-header mb-4">Tu Carrito está Vacío</h1>
                <p className="text-gray-500 mb-8 text-lg">Explora nuestro catálogo para encontrar props increíbles.</p>
                <Link to="/catalogo" className="inline-flex items-center justify-center w-full px-8 py-4 text-base font-bold text-white bg-brand rounded-[8px] hover:bg-brand-dark transition-colors">
                  Ver Catálogo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
            </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans">
      <main className="flex-grow max-w-6xl mx-auto px-4 py-8 md:py-12 w-full">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-header mb-2">TU CARRITO</h1>
          <p className="text-gray-500">Tienes <span className="text-brand font-bold">{items.length} artículo{items.length !== 1 ? 's' : ''}</span> en tu carrito</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Cart Items */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row gap-6 p-5 rounded-[8px] border border-gray-100 hover:border-brand/30 transition-all shadow-sm"
              >
                {/* Image */}
                <div className="shrink-0">
                  <div className="rounded-[8px] aspect-[3/4] w-full sm:w-32 overflow-hidden bg-gray-100">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.productName}
                        className={`w-full h-full object-cover ${item.availableStock === 0 ? 'opacity-40' : ''}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingCart className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  {item.availableStock === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-red-500 text-white text-[10px] font-bold uppercase px-2 py-1 rounded">
                        Sin Stock
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <Link to={`/producto/${item.productSlug}`}>
                        <h3 className="text-header text-lg font-bold mb-2 hover:text-brand transition-colors">{item.productName}</h3>
                      </Link>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                        {item.color && (
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            Color: <span className="font-medium">{item.color}</span>
                          </span>
                        )}
                        {item.size && (
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            Talla: <span className="font-medium">{item.size}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      disabled={isLoading}
                      className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-all" 
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-end mt-4 sm:mt-0">
                    {/* Quantity */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-gray-200 rounded-[8px] p-1">
                        <button 
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={isLoading || item.quantity <= 1}
                          className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input 
                          className="w-10 bg-transparent text-center text-header text-sm font-bold border-none" 
                          readOnly 
                          type="text" 
                          value={item.quantity}
                        />
                        <button 
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          disabled={isLoading}
                          className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Price */}
                    <div className="text-right">
                      <p className="text-xl font-bold text-brand">${item.totalPrice?.toFixed(2) || (item.unitPrice * item.quantity).toFixed(2)}</p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-gray-400 mt-1">${item.unitPrice?.toFixed(2)} c/u</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-gray-100 rounded-[8px] p-6 lg:p-8 sticky top-8 shadow-lg">
              <h2 className="text-xl font-bold text-header mb-6 flex items-center gap-2">
                Resumen del Pedido
              </h2>
              
              {/* Subtotals */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>

                {/* Coupon Applied */}
                {coupon && (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-[8px] border border-green-200 bg-green-50">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">{coupon.code}</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      disabled={isLoading}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {discount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>Descuento</span>
                    <span className="font-semibold">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-gray-600">
                  <span>IVA (16%)</span>
                  <span className="font-medium">${taxEstimate.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Divider */}
              <div className="border-t border-gray-100 my-6"></div>
              
              {/* Total */}
              <div className="flex justify-between items-end mb-8">
                <span className="font-bold text-lg text-header">Total</span>
                <div className="text-right">
                  <span className="text-3xl font-bold text-brand">${displayTotal.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex flex-col gap-4">
                {/* Out-of-stock warning */}
                {hasOutOfStockItems && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-[8px]">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-red-500 font-bold text-sm">Productos sin stock</p>
                      <p className="text-red-400 text-xs">Algunos artículos serán eliminados al proceder.</p>
                    </div>
                  </div>
                )}

                {hasOutOfStockItems ? (
                  <button
                    disabled
                    className="w-full bg-gray-100 text-gray-400 font-bold py-4 px-6 rounded-[8px] flex justify-center items-center gap-2 cursor-not-allowed"
                  >
                    Proceder al Pago
                  </button>
                ) : (
                  <Link to="/checkout" className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-4 px-6 rounded-[8px] transition-colors flex justify-center items-center gap-2">
                    Proceder al Pago
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                )}
                
                {/* Coupon Input */}
                <div className="mt-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Código Promocional</p>
                  {!coupon && (
                    <form onSubmit={handleApplyCoupon} className="relative">
                      <input
                        name="couponCode"
                        className="w-full border border-gray-200 rounded-[8px] py-3 pl-4 pr-20 text-sm text-header focus:outline-none focus:border-brand"
                        placeholder="ej. VERANO20"
                        type="text"
                      />
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 text-xs font-bold text-brand hover:bg-brand/10 rounded-[4px] transition-colors"
                      >
                        APLICAR
                      </button>
                    </form>
                  )}
                </div>
              </div>
              
              {/* Back to Shopping */}
              <div className="mt-6 text-center">
                <Link to="/catalogo" className="text-sm text-gray-500 hover:text-brand transition-colors flex items-center justify-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  Seguir Comprando
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cart;
