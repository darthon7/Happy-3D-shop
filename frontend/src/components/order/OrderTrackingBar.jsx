import { Truck, Package, CheckCircle2, MapPin, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import OrderTrackingEvents from './OrderTrackingEvents';
import './OrderTrackingBar.css';

/**
 * Order tracking progress bar component.
 * Shows: estimated delivery, carrier + tracking number, and a visual step bar.
 * All data is dynamic from the order object.
 */
const OrderTrackingBar = ({ order, onCopy, copiedId }) => {
  const [showTrackingDetails, setShowTrackingDetails] = useState(false);
  
  // Define the tracking steps matching the Order status flow
  const STEPS = [
    { key: 'ordered', label: 'Pedido', icon: Package },
    { key: 'shipped', label: 'Enviado', icon: Truck },
    { key: 'in_transit', label: 'En reparto', icon: MapPin },
    { key: 'delivered', label: 'Entregado', icon: CheckCircle2 },
  ];

  // Map order status to step index
  const getActiveStep = (status) => {
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED':
      case 'PROCESSING':
        return 0;
      case 'SHIPPED':
        return 1;
      case 'DELIVERED':
      case 'RETURN_IN_PROGRESS':
        return 3;
      case 'CANCELLED':
      case 'REFUNDED':
        return -1; // No step active
      default:
        return 0;
    }
  };

  // Get a human-readable status description based on actual order data
  const getStatusDescription = (status, carrier) => {
    const carrierLabel = getCarrierLabel(carrier);
    switch (status) {
      case 'PENDING':
        return 'Tu pedido está pendiente de confirmación.';
      case 'CONFIRMED':
        return 'Tu pedido ha sido confirmado y está siendo preparado.';
      case 'PROCESSING':
        return 'Tu pedido está siendo procesado para envío.';
      case 'SHIPPED':
        return `Paquete recogido y en camino vía ${carrierLabel}.`;
      case 'DELIVERED':
        return 'Tu paquete ha sido entregado.';
      case 'RETURN_IN_PROGRESS':
        return 'Tu solicitud de devolución está siendo procesada.';
      case 'CANCELLED':
        return 'Este pedido fue cancelado.';
      case 'REFUNDED':
        return 'Este pedido fue reembolsado.';
      default:
        return '';
    }
  };

  const getCarrierLabel = (carrier) => {
    const labels = {
      'estafeta': 'Estafeta',
      'dhl': 'DHL Express',
      'fedex': 'FedEx',
      'ups': 'UPS',
      'paquetexpress': 'Paquete Express',
      '99minutos': '99 Minutos',
      'redpack': 'Redpack',
      'sendex': 'Sendex',
    };
    return labels[carrier?.toLowerCase()] || carrier || 'Paquetería';
  };

  const getTrackingUrl = (carrier, trackingNumber) => {
    if (!carrier || !trackingNumber) return null;
    const normalized = carrier.toLowerCase();
    switch (normalized) {
      case 'estafeta':
        return `https://www.estafeta.com/rastrear-envio?rastreo=${trackingNumber}`;
      case 'dhl':
        return `https://www.dhl.com/mx-es/home/tracking.html?tracking-id=${trackingNumber}`;
      case 'fedex':
        return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
      case 'ups':
        return `https://www.ups.com/track?tracknum=${trackingNumber}`;
      default:
        return `https://app.envia.com/shiptracking/${trackingNumber}`;
    }
  };

  // Format the estimated delivery date range
  const formatEstimatedDelivery = () => {
    if (!order.estimatedDeliveryDate) return null;

    const deliveryDate = new Date(order.estimatedDeliveryDate + 'T00:00:00');
    const day = deliveryDate.getDate();
    const month = deliveryDate.toLocaleDateString('es-MX', { month: 'short' });

    // Show a range of ±1 day around the estimated date
    const dayBefore = day - 1 > 0 ? day - 1 : day;
    const dayAfter = day + 1;

    return `${dayBefore}–${dayAfter} ${month}`;
  };

  const activeStep = getActiveStep(order.status);
  const isCancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED';

  // Don't render for PENDING orders without payment
  if (order.status === 'PENDING' && order.paymentStatus === 'PENDING') {
    return null;
  }

  const estimatedDelivery = formatEstimatedDelivery();
  const trackingUrl = getTrackingUrl(order.carrier, order.trackingNumber);

  return (
    <div className={`tracking-bar ${isCancelled ? 'tracking-bar--cancelled' : ''}`}>
      {/* Header: Estimated delivery */}
      <div className="tracking-bar__header">
        {isCancelled ? (
          <h3 className="tracking-bar__title tracking-bar__title--cancelled">
            Pedido {order.status === 'CANCELLED' ? 'Cancelado' : 'Reembolsado'}
          </h3>
        ) : estimatedDelivery ? (
          <h3 className="tracking-bar__title">
            Entrega estimada {estimatedDelivery}
          </h3>
        ) : (
          <h3 className="tracking-bar__title">
            Seguimiento del pedido
          </h3>
        )}

        <p className="tracking-bar__description">
          {getStatusDescription(order.status, order.carrier)}
        </p>

        {/* Carrier + Tracking number inline */}
        {order.trackingNumber && (
          <p className="tracking-bar__tracking-info">
            Número de seguimiento de {getCarrierLabel(order.carrier)}:{' '}
            <button
              className="tracking-bar__tracking-number"
              onClick={() => onCopy?.(order.trackingNumber, 'tracking-bar')}
              title="Copiar número de seguimiento"
            >
              <span className="tracking-bar__tracking-text">{order.trackingNumber}</span>
              {copiedId === 'tracking-bar' ? (
                <Check size={14} className="tracking-bar__copy-icon" />
              ) : (
                <Copy size={14} className="tracking-bar__copy-icon" />
              )}
            </button>
          </p>
        )}
      </div>

      {/* Progress bar */}
      {!isCancelled && (
        <div className="tracking-bar__progress">
          {/* Background line */}
          <div className="tracking-bar__line">
            <div
              className="tracking-bar__line-fill"
              style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }}
            />
          </div>

          {/* Step dots */}
          <div className="tracking-bar__steps">
            {STEPS.map((step, index) => {
              const isCompleted = index < activeStep;
              const isActive = index === activeStep;
              const isPending = index > activeStep;
              const StepIcon = step.icon;

              return (
                <div
                  key={step.key}
                  className={`tracking-bar__step ${isCompleted ? 'tracking-bar__step--completed' : ''} ${isActive ? 'tracking-bar__step--active' : ''} ${isPending ? 'tracking-bar__step--pending' : ''}`}
                >
                  <div className="tracking-bar__dot">
                    {isActive ? (
                      <div className="tracking-bar__dot-icon">
                        <StepIcon size={18} />
                      </div>
                    ) : isCompleted ? (
                      <div className="tracking-bar__dot-filled" />
                    ) : (
                      <div className="tracking-bar__dot-empty" />
                    )}
                  </div>
                  <span className={`tracking-bar__label ${isActive ? 'tracking-bar__label--active' : ''}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Track button */}
      {trackingUrl && (
        <div className="space-y-3">
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tracking-bar__button"
          >
            <Truck size={18} />
            Ver la información de seguimiento
          </a>
          
          {order.status === 'SHIPPED' && (
            <button
              onClick={() => setShowTrackingDetails(!showTrackingDetails)}
              className="w-full py-2 px-4 bg-surface-elevated hover:bg-surface border border-border rounded-lg text-white text-sm font-medium transition-colors"
            >
              {showTrackingDetails ? 'Ocultar detalles de追踪' : 'Ver detalles de追踪'}
            </button>
          )}
          
          {showTrackingDetails && order.orderNumber && (
            <div className="mt-4 p-4 bg-surface rounded-lg border border-border">
              <OrderTrackingEvents 
                orderNumber={order.orderNumber} 
                carrier={order.carrier}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderTrackingBar;
