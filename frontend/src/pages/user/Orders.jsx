import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, AlertCircle, RefreshCw, ShoppingBag, ChevronRight, ChevronDown, 
  Calendar, MapPin, Truck, Copy, Check, CreditCard, Clock, X, Trash2
} from 'lucide-react';
import { ordersApi } from '../../api';

const Orders = ({ embedded = false }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [copiedOrderId, setCopiedOrderId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ordersApi.getAll();
      const ordersData = Array.isArray(response.data) ? response.data : [];
      const sortedOrders = [...ordersData].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrders(sortedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('No pudimos cargar tus pedidos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleOrderDetails = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const copyOrderNumber = async (orderNumber, orderId) => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopiedOrderId(orderId);
      setTimeout(() => setCopiedOrderId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      CONFIRMED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      PROCESSING: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      SHIPPED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      DELIVERED: 'bg-green-500/10 text-green-400 border-green-500/20',
      RETURN_IN_PROGRESS: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmado',
      PROCESSING: 'En Proceso',
      SHIPPED: 'Enviado',
      DELIVERED: 'Entregado',
      RETURN_IN_PROGRESS: 'Devolución en proceso',
      CANCELLED: 'Cancelado',
    };
    return labels[status] || status;
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      STRIPE: 'Tarjeta de crédito/débito',
      PAYPAL: 'PayPal',
      CASH_ON_DELIVERY: 'Pago contra entrega',
    };
    return labels[method] || method;
  };

  const getCarrierLabel = (carrier) => {
    const labels = {
      'estafeta': 'Estafeta',
      'dhl': 'DHL Express',
      'fedex': 'FedEx',
      'ups': 'UPS',
    };
    return labels[carrier?.toLowerCase()] || carrier || 'Paquetería';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const canDeleteOrder = (status) => {
    return status === 'DELIVERED' || status === 'CANCELLED';
  };

  if (loading) {
    return (
      <div className={embedded ? "w-full" : "max-w-4xl mx-auto px-4 py-8"}>
        {!embedded && <h1 className="text-3xl font-bold mb-8 text-white">Mis Pedidos</h1>}
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-surface rounded-xl p-6 animate-pulse border border-border">
              <div className="h-6 bg-white/10 rounded w-1/4 mb-4"></div>
              <div className="h-20 bg-white/5 rounded mb-4"></div>
              <div className="h-4 bg-white/10 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={embedded ? "w-full py-8 text-center" : "max-w-4xl mx-auto px-4 py-16 text-center"}>
        <div className="bg-red-500/10 text-red-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">Ops, algo salió mal</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <button 
          onClick={fetchOrders}
          className="btn btn-primary flex items-center gap-2 mx-auto"
        >
          <RefreshCw size={18} />
          Intentar de nuevo
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={embedded ? "w-full py-8 text-center" : "max-w-4xl mx-auto px-4 py-16 text-center"}>
        <div className="bg-surface rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 border border-border">
          <ShoppingBag size={40} className="text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">No tienes pedidos</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Aún no has realizado ninguna compra. ¡Explora nuestro catálogo y encuentra algo que te encante!
        </p>
        <Link to="/catalogo" className="btn btn-primary">
          Explorar Catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className={embedded ? "w-full" : "max-w-4xl mx-auto px-4 sm:px-6 py-8"}>
      {!embedded && (
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3 text-white">
          <Package className="text-primary-500" />
          Mis Pedidos
        </h1>
      )}

      <div className="space-y-6">
        {orders.map((order) => {
          const isExpanded = expandedOrders[order.id];
          const showDelete = canDeleteOrder(order.status);

          return (
            <div key={order.id} className="bg-surface rounded-xl overflow-hidden border border-border shadow-lg">
              
              {/* Order Header */}
              <div className="p-4 sm:p-5 border-b border-border bg-black/20">
                <div className="flex flex-wrap gap-4 justify-between items-start">
                  {/* Left: Status */}
                  <div className="flex flex-col gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border w-fit ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  
                  {/* Right: Date, Order Number & Details Link */}
                  <div className="flex flex-col items-end gap-1 text-sm">
                    <span className="text-gray-400">
                      Pedido efectuado el: <span className="text-white">{formatDate(order.createdAt)}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Nº de pedido:</span>
                      <span className="font-mono text-white">{order.orderNumber}</span>
                      <button 
                        onClick={() => copyOrderNumber(order.orderNumber, order.id)}
                        className="text-primary-400 hover:text-primary-300 transition-colors"
                        title="Copiar"
                      >
                        {copiedOrderId === order.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Preview */}
              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap lg:flex-nowrap gap-4 items-start">
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    {order.items?.slice(0, isExpanded ? order.items.length : 1).map((item) => (
                      <div key={item.id} className="flex gap-4 items-center mb-4 last:mb-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-dark-900 rounded-lg border border-border overflow-hidden flex-shrink-0">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.productName} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null; 
                                e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-dark-900 text-gray-600">
                              <Package size={24} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white truncate">{item.productName}</h4>
                          <p className="text-sm text-gray-400">
                            {item.size && <span className="mr-3">Talla: {item.size}</span>}
                            {item.color && <span>Color: {item.color}</span>}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-gray-500">Cant: {item.quantity}</span>
                            <span className="text-sm font-medium text-gray-300">{formatCurrency(item.unitPrice)}</span>
                          </div>
                          
                          {/* Boton para reseñar si el pedido ya se entrego y existe el slug */}
                          {order.status === 'DELIVERED' && item.productSlug && (
                            <div className="mt-3">
                              <Link
                                to={`/producto/${item.productSlug}`}
                                className="inline-flex items-center gap-1.5 bg-gradient-to-br from-primary-500 to-pink-500 text-white font-medium py-1.5 px-3 rounded-lg hover:brightness-110 hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(168,85,247,0.3)] transition-all text-xs"
                              >
                                <span className="material-symbols-outlined text-[14px] text-yellow-300">star</span>
                                Calificar producto
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {!isExpanded && order.items?.length > 1 && (
                      <p className="text-sm text-gray-500 mt-2">
                        +{order.items.length - 1} artículo(s) más
                      </p>
                    )}
                  </div>

                  {/* Right Side: Total & Actions */}
                  <div className="flex flex-col items-end gap-3 ml-auto">
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Total</div>
                      <div className="text-2xl font-bold text-primary-400">{formatCurrency(order.total)}</div>
                    </div>
                    
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      {showDelete ? (
                        <button className="px-4 py-2 rounded-lg border border-border text-gray-400 hover:text-red-400 hover:border-red-500/50 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                          <Trash2 size={16} />
                          Borrar
                        </button>
                      ) : (
                        <Link 
                          to={`/pedido/${order.orderNumber}`}
                          className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-all flex items-center justify-center gap-2 text-sm font-semibold"
                        >
                          <Truck size={16} />
                          Seguir Pedido
                          <ChevronRight size={16} />
                        </Link>
                      )}
                      <Link 
                        to={`/pedido/${order.orderNumber}`}
                        className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center justify-center gap-1"
                      >
                        Detalles del pedido
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-border bg-black/10">
                  <div className="p-4 sm:p-6 space-y-6">
                    
                    {/* Shipping Info */}
                    {order.carrier && (
                      <div className="bg-surface-elevated rounded-xl p-4 border border-border">
                        <div className="flex items-center gap-2 mb-3">
                          <Truck className="text-primary-400" size={18} />
                          <h3 className="font-semibold text-white">{getCarrierLabel(order.carrier)}</h3>
                          {order.serviceCode && (
                            <span className="px-2 py-0.5 bg-primary-500/10 text-primary-400 text-xs rounded-full border border-primary-500/20">
                              {order.serviceCode === 'ground' ? 'Terrestre' : order.serviceCode === 'express' ? 'Express' : order.serviceCode}
                            </span>
                          )}
                        </div>
                        {order.trackingNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">Número de rastreo:</span>
                            <span className="font-mono text-white bg-white/5 px-2 py-1 rounded">{order.trackingNumber}</span>
                            <button 
                              onClick={() => copyOrderNumber(order.trackingNumber, `track-${order.id}`)}
                              className="text-primary-400 hover:text-primary-300"
                            >
                              {copiedOrderId === `track-${order.id}` ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Delivery Address & Order Timeline Grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Delivery Address */}
                      <div className="bg-surface-elevated rounded-xl p-4 border border-border">
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="text-primary-400" size={18} />
                          <h3 className="font-semibold text-white">Dirección de entrega</h3>
                        </div>
                        {order.shippingAddress ? (
                          <div className="text-sm text-gray-300 space-y-1">
                            <p className="font-medium text-white">{order.shippingAddress.recipientName || 'Cliente'}</p>
                            {order.guestPhone && <p>{order.guestPhone}</p>}
                            <p>{order.shippingAddress.street}</p>
                            <p>{order.shippingAddress.city}, {order.shippingAddress.state}, {order.shippingAddress.postalCode}</p>
                            <p>{order.shippingAddress.country}</p>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Dirección no disponible</p>
                        )}
                      </div>

                      {/* Order Timeline */}
                      <div className="bg-surface-elevated rounded-xl p-4 border border-border">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="text-primary-400" size={18} />
                          <h3 className="font-semibold text-white">Detalles del pedido</h3>
                        </div>
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Nº de pedido:</span>
                            <span className="font-mono text-white">{order.orderNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Pedido efectuado el:</span>
                            <span className="text-white">{formatDate(order.createdAt)}</span>
                          </div>
                          {order.paidAt && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Pago completado en:</span>
                              <span className="text-white">{formatDate(order.paidAt)}</span>
                            </div>
                          )}
                          {order.status === 'SHIPPED' && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Envío completado en:</span>
                              <span className="text-white">{formatDate(order.updatedAt)}</span>
                            </div>
                          )}
                          {order.status === 'DELIVERED' && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Pedido completado en:</span>
                              <span className="text-green-400">{formatDate(order.updatedAt)}</span>
                            </div>
                          )}
                          <div className="pt-2 border-t border-border mt-2">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Método de pago:</span>
                              <div className="flex items-center gap-2">
                                <CreditCard size={14} className="text-gray-400" />
                                <span className="text-white">{getPaymentMethodLabel(order.paymentMethod)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Products Summary */}
                    <div className="bg-surface-elevated rounded-xl p-4 border border-border">
                      <h3 className="font-semibold text-white mb-4">Productos</h3>
                      <div className="space-y-4">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex gap-4 items-center pb-4 border-b border-border last:border-0 last:pb-0">
                            <div className="w-16 h-16 bg-dark-900 rounded-lg border border-border overflow-hidden flex-shrink-0">
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.productName} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                  <Package size={20} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white">{item.productName}</h4>
                              <p className="text-xs text-gray-400">
                                {item.size && <span className="mr-3">Talla: {item.size}</span>}
                                {item.color && <span>Color: {item.color}</span>}
                              </p>
                              
                              {/* Boton para reseñar si el pedido ya se entrego y existe el slug */}
                              {order.status === 'DELIVERED' && item.productSlug && (
                                <div className="mt-2">
                                  <Link
                                    to={`/producto/${item.productSlug}`}
                                    className="inline-flex items-center gap-1 bg-gradient-to-br from-primary-500 to-pink-500 text-white font-medium py-1 px-3 rounded-lg hover:brightness-110 hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(168,85,247,0.3)] transition-all text-xs"
                                  >
                                    <span className="material-symbols-outlined text-[12px] text-yellow-300">star</span>
                                    Calificar
                                  </Link>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-400">x{item.quantity}</div>
                              <div className="font-medium text-white">{formatCurrency(item.unitPrice * item.quantity)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Order Totals */}
                      <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
                        <div className="flex justify-between text-gray-400">
                          <span>Subtotal</span>
                          <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        {order.shippingCost > 0 && (
                          <div className="flex justify-between text-gray-400">
                            <span>Envío</span>
                            <span>{formatCurrency(order.shippingCost)}</span>
                          </div>
                        )}
                        {order.discount > 0 && (
                          <div className="flex justify-between text-green-400">
                            <span>Descuento</span>
                            <span>-{formatCurrency(order.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-border">
                          <span>Total</span>
                          <span className="text-primary-400">{formatCurrency(order.total)}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
