import { useState, useEffect } from 'react';
import { shippingApi } from '../../api';
import { RefreshCw, MapPin, Clock, Package, Truck, CheckCircle2, AlertCircle } from 'lucide-react';

const POLLING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const OrderTrackingEvents = ({ orderNumber, carrier, onClose }) => {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchTracking = async () => {
    try {
      setError(null);
      const response = await shippingApi.trackOrder(orderNumber);
      setTracking(response.data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching tracking:', err);
      setError('No se pudo obtener la información de seguimiento');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();

    // Set up polling for SHIPPED orders
    const intervalId = setInterval(() => {
      if (tracking?.currentStatus && 
          !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(tracking.currentStatus)) {
        fetchTracking();
      }
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [orderNumber]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    if (!status) return <Package size={20} className="text-gray-400" />;
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('delivered') || statusLower.includes('entregado')) {
      return <CheckCircle2 size={20} className="text-green-500" />;
    }
    if (statusLower.includes('transit') || statusLower.includes('transito') || statusLower.includes('ruta')) {
      return <Truck size={20} className="text-blue-500" />;
    }
    if (statusLower.includes('pickup') || statusLower.includes('recolect') || statusLower.includes('recog')) {
      return <Package size={20} className="text-purple-500" />;
    }
    if (statusLower.includes('exception') || statusLower.includes('error') || statusLower.includes('fall')) {
      return <AlertCircle size={20} className="text-red-500" />;
    }
    
    return <Clock size={20} className="text-yellow-500" />;
  };

  if (loading && !tracking) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-primary mr-2" />
        <span className="text-gray-400">Cargando información de seguimiento...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p className="text-red-400 text-center">{error}</p>
        <button
          onClick={fetchTracking}
          className="mt-2 w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!tracking?.success) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-yellow-400 text-center">
          {tracking?.errorMessage || 'No hay información de seguimiento disponible'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with status */}
      <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-lg">
        <div className="flex items-center gap-3">
          {getStatusIcon(tracking.currentStatus)}
          <div>
            <p className="font-bold text-white">{tracking.currentStatusDescription || tracking.currentStatus}</p>
            <p className="text-sm text-gray-400">
              {tracking.carrier} • {tracking.trackingNumber}
            </p>
          </div>
        </div>
        <button
          onClick={fetchTracking}
          className="p-2 hover:bg-surface rounded-lg transition-colors"
          title="Actualizar"
        >
          <RefreshCw size={18} className="text-gray-400" />
        </button>
      </div>

      {/* Last update */}
      {lastUpdate && (
        <p className="text-xs text-gray-500 text-right">
          Última actualización: {formatDate(lastUpdate.toISOString())}
        </p>
      )}

      {/* Events timeline */}
      {tracking.events && tracking.events.length > 0 ? (
        <div className="space-y-0">
          {tracking.events.map((event, index) => (
            <div key={index} className="flex gap-4 relative">
              {/* Timeline line */}
              {index < tracking.events.length - 1 && (
                <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-700" />
              )}
              
              {/* Icon */}
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center z-10">
                {getStatusIcon(event.status)}
              </div>
              
              {/* Content */}
              <div className="flex-1 pb-4">
                <p className="font-medium text-white">{event.description || event.status}</p>
                {event.location && (
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <MapPin size={14} />
                    {event.location}
                  </p>
                )}
                {event.date && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Clock size={12} />
                    {formatDate(event.date)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-4">
          No hay eventos de seguimiento disponibles
        </p>
      )}

      {/* Auto-refresh notice */}
      <p className="text-xs text-gray-600 text-center mt-4">
        La información se actualiza automáticamente cada 5 minutos
      </p>
    </div>
  );
};

export default OrderTrackingEvents;
