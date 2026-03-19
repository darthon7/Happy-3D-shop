import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Package, ArrowLeft, Truck, MapPin, Clock, CreditCard, Copy, Check, 
  AlertCircle, RefreshCw, ShoppingBag, Star, XCircle, AlertTriangle, MessageCircle
} from 'lucide-react';
import { ordersApi } from '../../api';
import { ADMIN_CONTACTS } from '../../data/constants';
import OrderTrackingBar from '../../components/order/OrderTrackingBar';

const OrderDetails = () => {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelDetails, setCancelDetails] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const CANCEL_REASONS = [
    { value: 'CHANGED_MIND',       label: 'Cambié de opinión' },
    { value: 'FOUND_CHEAPER',      label: 'Encontré un precio más bajo' },
    { value: 'ORDERED_BY_MISTAKE', label: 'Lo pedí por error' },
    { value: 'TAKING_TOO_LONG',    label: 'Está tardando mucho' },
    { value: 'OTHER',              label: 'Otro motivo' },
  ];

  const canCancel = (status) => ['PENDING', 'CONFIRMED'].includes(status);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await ordersApi.getByNumber(orderNumber);
        setOrder(response.data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('No pudimos cargar los detalles del pedido. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason) {
      setCancelError('Por favor selecciona un motivo de cancelación.');
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await ordersApi.cancel(order.orderNumber, {
        reason: cancelReason,
        details: cancelDetails || null,
      });
      setOrder(res.data);
      setShowCancelModal(false);
      setCancelReason('');
      setCancelDetails('');
    } catch (err) {
      console.error('Error cancelling order:', err);
      setCancelError(
        err?.response?.data?.message ||
        'No se pudo cancelar el pedido. Inténtalo de nuevo.'
      );
    } finally {
      setCancelling(false);
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
      month: 'long',
      year: 'numeric'
    });
  };

  const buildWhatsAppUrl = (orderData) => {
    const productsList = orderData.items
      .map(item => `• ${item.productName} (Material: ${item.material || 'N/A'}, Color: ${item.color || 'N/A'})`)
      .join('\n');

    const message = encodeURIComponent(
      `🔄 *Solicitud de Devolución - Prop's Room*\n\n` +
      `📦 *Pedido:* ${orderData.orderNumber}\n` +
      `📅 *Fecha de compra:* ${new Date(orderData.createdAt).toLocaleDateString('es-MX')}\n` +
      `💰 *Total:* $${orderData.total?.toFixed(2)}\n\n` +
      `🛍️ *Productos:*\n${productsList}\n\n` +
      `Hola, me gustaría solicitar la devolución de mi pedido. ¿Podrían ayudarme con el proceso?`
    );

    return `https://wa.me/${ADMIN_CONTACTS.WHATSAPP}?text=${message}`;
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

  const getTrackingUrl = (carrier, trackingNumber) => {
    if (!carrier || !trackingNumber) return '#';
    
    const normalizedCarrier = carrier.toLowerCase();
    
    switch (normalizedCarrier) {
      case 'estafeta':
        return `https://www.estafeta.com/rastrear-envio?rastreo=${trackingNumber}`;
      case 'dhl':
        return `https://www.dhl.com/mx-es/home/tracking.html?tracking-id=${trackingNumber}`;
      case 'fedex':
        return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
      case 'ups':
        return `https://www.ups.com/track?tracknum=${trackingNumber}`;
      case 'paquetexpress':
        return `https://www.paquetexpress.com.mx/rastreo?tracking=${trackingNumber}`;
      case '99minutos':
        return `https://tracking.99minutos.com/search?tracking_id=${trackingNumber}`;
      case 'sendex':
        return `https://www.sendex.mx/Rastreo/Rastreo.aspx?guia=${trackingNumber}`;
      case 'redpack':
        return `http://www.redpack.com.mx/rastreo-de-envios/`; 
      default: 
        return `https://app.envia.com/shiptracking/${trackingNumber}`;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded w-1/4 mb-8"></div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-80 bg-white/5 rounded-2xl"></div>
              <div className="h-40 bg-white/5 rounded-xl"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-white/5 rounded-xl"></div>
              <div className="h-32 bg-white/5 rounded-xl"></div>
              <div className="h-48 bg-white/5 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-500/10 text-red-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">Pedido no encontrado</h2>
        <p className="text-gray-400 mb-6">{error || 'El pedido que buscas no existe o no tienes acceso a él.'}</p>
        <button 
          onClick={() => navigate('/pedidos')}
          className="btn btn-primary flex items-center gap-2 mx-auto"
        >
          <ArrowLeft size={18} />
          Volver a mis pedidos
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Cancelar pedido</h3>
                <p className="text-sm text-gray-400">{order.orderNumber}</p>
              </div>
            </div>

            {order.paymentStatus === 'PAID' && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-4 text-sm text-blue-300">
                💳 Se procesará un reembolso completo a tu tarjeta (3-5 días hábiles).
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Motivo de cancelación *</label>
              <select
                id="cancel-reason-select"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-dark-900 border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="">Selecciona un motivo...</option>
                {CANCEL_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {cancelReason === 'OTHER' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Cuéntanos más (opcional)</label>
                <textarea
                  value={cancelDetails}
                  onChange={(e) => setCancelDetails(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="¿Qué pasó con tu pedido?"
                  className="w-full bg-dark-900 border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors resize-none"
                />
              </div>
            )}

            {cancelError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 text-sm text-red-300">
                {cancelError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowCancelModal(false); setCancelError(null); }}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl border border-border text-gray-300 hover:bg-white/5 transition-all text-sm font-medium disabled:opacity-50"
              >
                Mantener pedido
              </button>
              <button
                id="btn-confirm-cancel"
                onClick={handleCancelOrder}
                disabled={cancelling || !cancelReason}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-red-500/30 text-white transition-all text-sm font-semibold disabled:cursor-not-allowed"
              >
                {cancelling ? 'Cancelando...' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Back Button */}
      <div className="mb-8">
        <button 
          onClick={() => navigate('/pedidos')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Volver a mis pedidos</span>
        </button>
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Pedido {order.orderNumber}</h1>
              <button 
                onClick={() => copyToClipboard(order.orderNumber, 'order')}
                className="text-primary-400 hover:text-primary-300 p-1"
              >
                {copiedId === 'order' ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <p className="text-sm text-text-secondary">Realizado el {formatFullDate(order.createdAt)}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {canCancel(order.status) && (
              <button
                id="btn-cancel-order"
                onClick={() => { setCancelError(null); setShowCancelModal(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all text-sm font-medium"
              >
                <XCircle size={16} />
                Cancelar pedido
              </button>
            )}
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusColor(order.status)} uppercase tracking-wider`}>
              {getStatusLabel(order.status)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        
        {/* Left Column - Products (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-white/5">
              <h2 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                <Package className="text-primary-400" size={18} />
                Productos del pedido ({order.items?.length || 0})
              </h2>
            </div>
            
            <div className="divide-y divide-border">
              {order.items?.map((item) => (
                <div key={item.id} className="p-5 flex gap-5 items-start hover:bg-white/[0.02] transition-colors">
                  {/* Compact Product Image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-dark-900 rounded-lg border border-border overflow-hidden flex-shrink-0">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.productName} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null; 
                          e.target.src = 'https://via.placeholder.com/400?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <Package size={32} />
                      </div>
                    )}
                  </div>
                  
                  {/* Product Details - Compact */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white mb-1 line-clamp-1">{item.productName}</h3>
                    
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {item.material && (
                        <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-text-secondary border border-border">
                          Material: <span className="text-white font-bold">{item.material}</span>
                        </span>
                      )}
                      {item.color && (
                        <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-text-secondary border border-border">
                          Color: <span className="text-white font-bold">{item.color}</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                      <div className="text-[11px] text-text-muted font-medium">
                        Cant: <span className="text-white">{item.quantity}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-text-muted italic">{formatCurrency(item.unitPrice)} c/u</div>
                        <div className="text-base font-bold text-primary">{formatCurrency(item.unitPrice * item.quantity)}</div>
                      </div>
                    </div>
                    {/* Boton para reseñar si el pedido ya se entrego y existe el slug */}
                    {order.status === 'DELIVERED' && item.productSlug && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <Link
                          to={`/producto/${item.productSlug}`}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-br from-primary-500 to-pink-500 text-white font-bold py-2.5 px-6 rounded-xl hover:brightness-110 hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(168,85,247,0.35)] transition-all text-sm"
                        >
                          <Star size={16} className="text-yellow-400 fill-yellow-400" />
                          Calificar producto
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Totals - Compact */}
            <div className="p-4 bg-white/5 border-t border-border">
              <div className="space-y-2">
                <div className="flex justify-between text-[13px] text-text-secondary">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.shippingCost > 0 && (
                  <div className="flex justify-between text-[13px] text-text-secondary">
                    <span>Costo de envío</span>
                    <span className="text-white font-medium">{formatCurrency(order.shippingCost)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-[13px] text-green-400 font-medium tracking-wide">
                    <span>Descuento aplicado</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 mt-1 border-t border-border/50">
                  <span className="text-base font-bold text-white uppercase tracking-wider">Total</span>
                  <span className="text-xl font-black text-primary drop-shadow-sm">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Devolución Button & Banner */}
            {order.status === 'DELIVERED' && (
              <div className="p-4 bg-white/5 border-t border-border">
                <a
                  href={buildWhatsAppUrl(order)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-green-600/20 border border-green-500/50 hover:bg-green-600/40 text-green-400 font-bold rounded-xl transition-all text-sm uppercase tracking-wider"
                >
                  <MessageCircle size={18} />
                  Solicitar devolución por WhatsApp
                </a>
              </div>
            )}
            {order.status === 'RETURN_IN_PROGRESS' && (
              <div className="p-4 bg-white/5 border-t border-border">
                <div className="w-full flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                  <RefreshCw className="w-5 h-5 text-orange-400 animate-spin" />
                  <div>
                    <p className="text-orange-400 font-bold text-sm uppercase tracking-tight">Devolución en proceso</p>
                    <p className="text-orange-300/70 text-xs">Estamos procesando tu solicitud de devolución.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Details (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Order Tracking Progress Bar - smaller margins */}
          <div className="transform scale-[0.98] origin-top">
            <OrderTrackingBar 
              order={order} 
              onCopy={copyToClipboard} 
              copiedId={copiedId} 
            />
          </div>
          
          {/* Shipping Info - Compact */}
          {order.carrier && (
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
              <div className="p-3 border-b border-border bg-white/5 flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Truck className="text-primary" size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">{getCarrierLabel(order.carrier)}</h3>
                </div>
              </div>
              
              {order.trackingNumber && (
                <div className="p-3">
                  <div className="bg-dark-900 border border-border/50 rounded-lg p-2.5">
                    <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">Rastreo</div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-white text-base font-bold break-all">{order.trackingNumber}</span>
                      <button 
                        onClick={() => copyToClipboard(order.trackingNumber, 'tracking')}
                        className="p-1.5 bg-primary/10 rounded-lg text-primary hover:bg-primary/20 transition-colors flex-shrink-0"
                      >
                        {copiedId === 'tracking' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <a 
                    href={getTrackingUrl(order.carrier, order.trackingNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 w-full py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                  >
                    <Truck size={14} />
                    Rastrear pedido
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Delivery Address - Compact */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="p-3 border-b border-border bg-white/5 flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <MapPin className="text-primary" size={16} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">Entrega</h3>
            </div>
            <div className="p-3 text-[13px]">
              {order.shippingAddress ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-text-muted font-medium">Cliente</span>
                    <span className="text-white font-bold text-right">{order.shippingAddress.recipientName || 'Cliente'}</span>
                  </div>

                  <div className="flex justify-between items-start gap-4">
                    <span className="text-text-muted font-medium">Calle</span>
                    <span className="text-white font-medium text-right leading-tight">
                      {order.shippingAddress.street} {order.shippingAddress.streetLine2}
                    </span>
                  </div>

                  <div className="flex justify-between items-start gap-4">
                    <span className="text-text-muted font-medium">Ubicación</span>
                    <span className="text-white font-medium text-right">
                      {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                    </span>
                  </div>
                  
                  {order.shippingAddress.phone && (
                    <div className="flex justify-between items-start pt-1 border-t border-white/5 mt-1">
                      <span className="text-text-muted font-medium">Contacto</span>
                      <span className="text-primary font-bold text-right">{order.shippingAddress.phone}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-text-muted italic">Dirección no disponible</p>
              )}
            </div>
          </div>
          {/* Order Timeline */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-black/20 flex items-center gap-3">
              <div className="p-2 bg-primary-500/10 rounded-lg">
                <Clock className="text-primary-400" size={20} />
              </div>
              <h3 className="font-semibold text-white">Historial del pedido</h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Timeline Items */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 ring-4 ring-green-500/20"></div>
                  <div className="flex-1">
                    <div className="text-white font-medium">Pedido realizado</div>
                    <div className="text-sm text-gray-400">{formatFullDate(order.createdAt)}</div>
                  </div>
                </div>
                
                {order.paidAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 ring-4 ring-green-500/20"></div>
                    <div className="flex-1">
                      <div className="text-white font-medium">Pago confirmado</div>
                      <div className="text-sm text-gray-400">{formatFullDate(order.paidAt)}</div>
                    </div>
                  </div>
                )}
                
                {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 ring-4 ring-green-500/20"></div>
                    <div className="flex-1">
                      <div className="text-white font-medium">Pedido enviado</div>
                      <div className="text-sm text-gray-400">{formatFullDate(order.updatedAt)}</div>
                    </div>
                  </div>
                )}
                
                {order.status === 'DELIVERED' && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 ring-4 ring-green-500/20"></div>
                    <div className="flex-1">
                      <div className="text-white font-medium">Pedido entregado</div>
                      <div className="text-sm text-gray-400">{formatFullDate(order.updatedAt)}</div>
                    </div>
                  </div>
                )}

                {order.status === 'CANCELLED' && (
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5 ring-4 ring-red-500/20"></div>
                    <div className="flex-1">
                      <div className="text-red-400 font-medium">Pedido cancelado</div>
                      <div className="text-sm text-gray-400">{formatFullDate(order.updatedAt)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-black/20 flex items-center gap-3">
              <div className="p-2 bg-primary-500/10 rounded-lg">
                <CreditCard className="text-primary-400" size={20} />
              </div>
              <h3 className="font-semibold text-white">Método de pago</h3>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg">
                  <CreditCard className="text-gray-400" size={24} />
                </div>
                <div>
                  <div className="text-white font-medium">{getPaymentMethodLabel(order.paymentMethod)}</div>
                  {order.paymentId && (
                    <div className="text-xs text-gray-400 font-mono">ID: {order.paymentId.slice(0, 20)}...</div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
