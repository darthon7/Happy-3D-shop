import { useState, useEffect } from 'react';
import { Eye, ShoppingBag, CheckCircle, RefreshCw, Package, Truck, MapPin, Clock, X, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge, Skeleton } from '../../components/ui';
import api, { shippingApi } from '../../api';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 0, totalPages: 0 });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = async (page = 0) => {
    setLoading(true);
    try {
      const params = { page, size: 12 };
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      const response = await api.get('/admin/orders', { params });
      setOrders(response.data.content || []);
      setPagination({
        page: response.data.number || 0,
        totalPages: response.data.totalPages || 0,
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      fetchOrders(pagination.page);
    } catch (error) {
      alert(error.response?.data?.message || 'Error al actualizar estado');
    }
  };

  const verifyDelivery = async (orderId) => {
    try {
      const response = await shippingApi.verifyDelivery(orderId);
      alert(response.data === 'Order marked as DELIVERED' 
        ? 'El pedido ha sido marcado como ENTREGADO' 
        : 'El pedido aún no ha sido entregado');
      fetchOrders(pagination.page);
    } catch (error) {
      alert('Error al verificar entrega');
    }
  };

  const statuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'RETURN_IN_PROGRESS', 'CANCELLED'];

  const statusLabels = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmado',
    PROCESSING: 'Procesando',
    SHIPPED: 'Enviado',
    DELIVERED: 'Entregado',
    RETURN_IN_PROGRESS: 'Devolución',
    CANCELLED: 'Cancelado',
    REFUNDED: 'Reembolsado'
  };

  const VALID_TRANSITIONS = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: ['RETURN_IN_PROGRESS', 'REFUNDED'],
    RETURN_IN_PROGRESS: ['DELIVERED', 'REFUNDED'],
    CANCELLED: [],
    REFUNDED: []
  };

  const getNextStatuses = (currentStatus) => {
    return VALID_TRANSITIONS[currentStatus] || [];
  };

  const getTransitionMessage = (currentStatus, targetStatus) => {
    if (currentStatus === targetStatus) return '';
    const nextStatuses = getNextStatuses(currentStatus);
    if (nextStatuses.includes(targetStatus)) return '';
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = statuses[currentIndex + 1];
    if (nextStatus) return `Primero debe cambiar a ${nextStatus}`;
    return `No se puede revertir a este estado`;
  };

  const getStatusConfig = (status) => {
    const config = {
      PENDING: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Pendiente', icon: Clock },
      CONFIRMED: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Confirmado', icon: CheckCircle },
      PROCESSING: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Procesando', icon: Package },
      SHIPPED: { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: 'Enviado', icon: Truck },
      DELIVERED: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Entregado', icon: CheckCircle },
      RETURN_IN_PROGRESS: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Devolución', icon: RefreshCw },
      CANCELLED: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Cancelado', icon: X },
      REFUNDED: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Reembolsado', icon: RefreshCw },
    };
    return config[status] || config.PENDING;
  };

  const getProgressSteps = (status) => {
    const steps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentIndex = steps.indexOf(status);
    return steps.map((step, index) => ({
      status: step,
      label: statusLabels[step],
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
  };

  const statusChips = [
    { value: '', label: 'Todos', icon: ShoppingBag },
    { value: 'PENDING', label: 'Pendientes', icon: Clock },
    { value: 'PROCESSING', label: 'Procesando', icon: Package },
    { value: 'SHIPPED', label: 'Enviados', icon: Truck },
    { value: 'DELIVERED', label: 'Entregados', icon: CheckCircle },
    { value: 'RETURN_IN_PROGRESS', label: 'Devoluciones', icon: RefreshCw },
  ];

  return (
    <div className="p-4 lg:p-8 bg-background-dark min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-display tracking-wide text-white">PEDIDOS</h1>
          <p className="text-text-secondary text-sm mt-1">{orders.length} pedidos encontrados</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Buscar por número de pedido o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-11 bg-surface border border-border rounded-xl text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        </div>

        {/* Status Chips */}
        <div className="flex flex-wrap gap-2">
          {statusChips.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setStatusFilter(chip.value)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                statusFilter === chip.value
                  ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30"
                  : "bg-surface border border-border text-text-secondary hover:bg-surface-elevated hover:text-white"
              )}
            >
              <chip.icon className="w-4 h-4" />
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid - Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-surface rounded-2xl border border-border p-6">
              <Skeleton className="h-6 w-1/2 mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-16 text-center">
          <div className="w-20 h-20 bg-surface-elevated rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No hay pedidos</h3>
          <p className="text-text-secondary">Los pedidos que se generen aparecerán aquí</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <>
            {orders.map((order, index) => {
              const statusConfig = getStatusConfig(order.status);
              const progressSteps = getProgressSteps(order.status);
              
              return (
                <div
                  key={order.id}
                  className="bg-surface rounded-2xl border border-border overflow-hidden hover:border-primary/50 transition-colors duration-200 group"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-border bg-gradient-to-r from-surface-elevated/50 to-transparent">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono font-bold text-white text-lg tracking-wider">
                        {order.orderNumber}
                      </span>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold border",
                        statusConfig.color
                      )}>
                        {statusConfig.label}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="flex items-center gap-1">
                      {progressSteps.map((step, i) => (
                        <div key={step.status} className="flex-1 flex items-center">
                          <div className={cn(
                            "h-1.5 flex-1 rounded-full transition-all",
                            step.completed 
                              ? step.current 
                                ? "bg-primary" 
                                : "bg-green-500"
                              : "bg-border"
                          )} />
                          {i < progressSteps.length - 1 && (
                            <div className={cn(
                              "w-2 h-px bg-border",
                              progressSteps[i + 1].completed && "bg-green-500"
                            )} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      {progressSteps.map((step) => (
                        <span key={step.status} className={cn(
                          "text-[10px]",
                          step.completed ? "text-text-secondary" : "text-text-muted"
                        )}>
                          {step.label.slice(0, 3)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    {/* Customer Info */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium text-white">
                          {order.shippingAddress?.recipientName || 'Cliente'}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted pl-6">
                        {order.shippingAddress?.email || 'Sin email'}
                      </p>
                    </div>

                    {/* Order Details */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-text-secondary text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(order.createdAt).toLocaleDateString('es-MX')}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white font-mono">
                          ${order.total?.toFixed(2)}
                        </p>
                        <p className="text-xs text-text-muted">
                          {order.items?.length || 0} productos
                        </p>
                      </div>
                    </div>

                    {/* Status Selector */}
                    <div className="mb-4">
                      <label className="text-xs text-text-muted mb-2 block">Cambiar estado:</label>
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-white text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {statuses.map((s) => {
                          const nextStatuses = getNextStatuses(order.status);
                          const isDisabled = s !== order.status && !nextStatuses.includes(s);
                          const message = getTransitionMessage(order.status, s);
                          return (
                            <option 
                              key={s} 
                              value={s}
                              disabled={isDisabled}
                              title={message}
                            >
                              {statusLabels[s]}{isDisabled ? ' (no disponible)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-elevated hover:bg-primary/20 border border-border hover:border-primary/50 rounded-xl text-white text-sm font-medium transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalles
                      </button>
                      {order.status === 'SHIPPED' && order.trackingNumber && (
                        <button
                          onClick={() => verifyDelivery(order.id)}
                          className="px-4 py-2.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded-xl transition-all"
                          title="Verificar entrega"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <button
            onClick={() => fetchOrders(pagination.page - 1)}
            disabled={pagination.page === 0}
            className="p-2 bg-surface border border-border rounded-xl text-white hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => fetchOrders(i)}
                className={cn(
                  "w-10 h-10 rounded-xl text-sm font-medium transition-all",
                  pagination.page === i 
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30' 
                    : 'bg-surface border border-border hover:bg-surface-elevated text-text-secondary'
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchOrders(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages - 1}
            className="p-2 bg-surface border border-border rounded-xl text-white hover:bg-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Order Details Modal */}
      <>
        {selectedOrder && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <div
              className="bg-surface rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-auto border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              {orders.filter(o => o.id === selectedOrder.id).map(order => {
                const statusConfig = getStatusConfig(order.status);
                return (
                  <div key={order.id}>
                    <div className="sticky top-0 bg-surface-elevated border-b border-border p-6 flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-white font-mono">{order.orderNumber}</h2>
                        <p className="text-text-secondary text-sm">
                          {new Date(order.createdAt).toLocaleDateString('es-MX', { dateStyle: 'full' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-sm font-bold border",
                          statusConfig.color
                        )}>
                          {statusConfig.label}
                        </span>
                        <button 
                          onClick={() => setSelectedOrder(null)} 
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-muted hover:text-white"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="bg-surface-elevated rounded-xl p-4 border border-border">
                          <h3 className="font-semibold mb-2 text-white flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            Cliente
                          </h3>
                          <p className="text-text-secondary">
                            {order.shippingAddress?.recipientName || 'Cliente'}
                          </p>
                          <p className="text-sm text-text-muted">{order.shippingAddress?.email}</p>
                          {order.shippingAddress?.phone && (
                            <p className="text-sm text-text-muted">{order.shippingAddress?.phone}</p>
                          )}
                        </div>
                        <div className="bg-surface-elevated rounded-xl p-4 border border-border">
                          <h3 className="font-semibold mb-2 text-white flex items-center gap-2">
                            <Truck className="w-4 h-4 text-primary" />
                            Dirección de envío
                          </h3>
                          <p className="text-sm text-text-secondary">{order.shippingAddress?.street}</p>
                          <p className="text-sm text-text-muted">
                            {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
                          </p>
                          {order.shippingAddress?.country && (
                            <p className="text-sm text-text-muted">{order.shippingAddress?.country}</p>
                          )}
                        </div>
                      </div>

                      {order.trackingNumber && (
                        <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/30 mb-6">
                          <h3 className="font-semibold mb-2 text-cyan-400 flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Información de envío
                          </h3>
                          <p className="text-sm text-text-secondary">
                            <span className="text-text-muted">Tracking:</span> {order.trackingNumber}
                          </p>
                          {order.carrier && (
                            <p className="text-sm text-text-secondary">
                              <span className="text-text-muted">Carrier:</span> {order.carrier}
                            </p>
                          )}
                        </div>
                      )}
                      
                      <h3 className="font-semibold mb-3 text-white">Artículos del pedido</h3>
                      <div className="space-y-3 mb-6">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex items-center gap-4 p-4 bg-surface-elevated rounded-xl border border-border">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.productName}
                                className="w-14 h-14 rounded-lg object-cover border border-border"
                              />
                            ) : (
                              <div className="w-14 h-14 bg-border rounded-lg flex items-center justify-center">
                                <Package className="w-6 h-6 text-text-muted" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white truncate">{item.productName}</p>
                              <p className="text-sm text-text-secondary">
                                {item.color} / {item.material} × {item.quantity}
                              </p>
                            </div>
                            <span className="font-semibold text-white font-mono">
                              ${item.totalPrice?.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t border-border pt-4 space-y-2">
                        <div className="flex justify-between text-text-secondary">
                          <span>Subtotal</span>
                          <span className="font-mono">${(order.subtotal || 0).toFixed(2)}</span>
                        </div>
                        {order.shippingCost > 0 && (
                          <div className="flex justify-between text-text-secondary">
                            <span>Envío</span>
                            <span className="font-mono">${order.shippingCost.toFixed(2)}</span>
                          </div>
                        )}
                        {order.discount > 0 && (
                          <div className="flex justify-between text-green-400">
                            <span>Descuento</span>
                            <span className="font-mono">-${order.discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
                          <span className="text-white">Total</span>
                          <span className="text-primary">${order.total?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>
    </div>
  );
};

export default AdminOrders;
