import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { 
  CheckCircle, 
  CreditCard, 
  Lock, 
  ArrowRight,
  ShieldCheck,
  Shield,
  ShoppingBag,
  AlertCircle
} from 'lucide-react';
import { useCartStore, useAuthStore } from '../stores';
import { ordersApi, paymentApi } from '../api';
import StripePayment from '../components/payment/StripePayment';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { items, subtotal, discount, total, clearCart } = useCartStore();
  
  // Get shipping data from navigation state
  const shippingData = location.state?.shippingData;
  const selectedRate = location.state?.selectedRate;
  
  // Stripe state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if no shipping data
  useEffect(() => {
    if (!shippingData || !selectedRate) {
      toast.error('Por favor selecciona un método de envío primero');
      navigate('/checkout');
    }
  }, [shippingData, selectedRate, navigate]);

  // Calculate totals
  const shippingCost = selectedRate ? parseFloat(selectedRate.price) : 0;
  // Get tax from store if available, or calculate fallback
  const taxAmount = useCartStore((state) => state.tax) ?? ((subtotal - discount) * 0.16);
  // Total is store.total (which includes tax/discount) + shipping
  const displayTotal = total + shippingCost;

  // Store order info for after payment
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [pendingOrderNumber, setPendingOrderNumber] = useState(null);

  const handleProceedToPayment = async () => {
    setIsSubmitting(true);
    try {
      // Step 1: Create order first (status will be PENDING)
      const orderData = {
        shippingStreet: shippingData.address,
        shippingStreetLine2: shippingData.apartment,
        shippingCity: shippingData.city,
        shippingState: shippingData.state,
        shippingPostalCode: shippingData.postalCode,
        shippingCountry: 'México',
        sameAsShipping: true,
        paymentMethod: 'STRIPE',
        guestEmail: shippingData.email,
        guestPhone: shippingData.phone,
        notes: '',
        shippingCost: shippingCost,
        carrier: selectedRate?.provider,
        serviceLevel: selectedRate?.serviceName,
        serviceCode: selectedRate?.serviceCode
      };

      const orderRes = await ordersApi.checkout(orderData);
      const orderId = orderRes.data.id;
      const orderNumber = orderRes.data.orderNumber;
      
      setPendingOrderId(orderId);
      setPendingOrderNumber(orderNumber);

      // Step 2: Create Stripe Payment Intent with orderId
      const intentRes = await paymentApi.createStripeIntent(orderId);
      
      setClientSecret(intentRes.data.stripeClientSecret);
      setShowPaymentModal(true);
    } catch (err) {
      console.error('Payment/Order Error:', err);
      toast.error('Error al procesar. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId) => {
    console.log('handlePaymentSuccess called with paymentIntentId:', paymentIntentId);
    try {
      // Call backend to confirm payment and create shipment in Envia
      if (paymentIntentId) {
        console.log('Calling confirmStripePayment API...');
        const response = await paymentApi.confirmStripePayment(paymentIntentId);
        console.log('confirmStripePayment response:', response);
      } else {
        console.warn('No paymentIntentId provided, skipping backend confirmation');
      }
      
      // Payment successful - order already created
      clearCart();
      toast.success('¡Pedido realizado con éxito!');
      navigate('/pedidos');
    } catch (err) {
      console.error('Post-payment error:', err);
      // Still navigate to orders even if shipment creation fails
      clearCart();
      toast.success('¡Pedido realizado con éxito!');
      navigate('/pedidos');
    }
    setShowPaymentModal(false);
  };

  const handleCancelPayment = async () => {
    setShowPaymentModal(false);
    if (pendingOrderNumber) {
      try {
        await ordersApi.cancel(pendingOrderNumber, { 
          reason: 'CHANGED_MIND', 
          details: 'Usuario cerró el modal de pago' 
        });
        toast.error('Pago cancelado. Puedes volver a intentarlo.');
        setPendingOrderId(null);
        setPendingOrderNumber(null);
        
        // Re-fetch cart just in case
        await useCartStore.getState().fetchCart();
      } catch (err) {
        console.error('Error cancelling order:', err);
      }
    }
  };

  if (!shippingData || !selectedRate) {
    return null;
  }

  return (
    <div className="bg-[#16091b] min-h-screen flex flex-col font-sans">
      {/* Stripe Payment Modal */}
      {showPaymentModal && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
            <StripePayment 
                clientSecret={clientSecret} 
                onSuccess={handlePaymentSuccess}
                onCancel={handleCancelPayment}
            />
        </Elements>
      )}

      {/* Main Layout */}
      <main className="flex-grow w-full px-4 md:px-10 py-8 max-w-7xl mx-auto">
        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-[#301c2f] -z-10"></div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#fa1c75] flex items-center justify-center text-white font-bold shadow-lg shadow-[#fa1c75]/30 ring-4 ring-[#16091b]">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-[#fa1c75]">Carrito</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#fa1c75] flex items-center justify-center text-white font-bold shadow-lg shadow-[#fa1c75]/30 ring-4 ring-[#16091b]">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-[#fa1c75]">Envío</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#fa1c75] flex items-center justify-center text-white font-bold shadow-lg shadow-[#fa1c75]/30 ring-4 ring-[#16091b]">3</div>
              <span className="text-sm font-bold text-white">Pago</span>
            </div>
          </div>
        </div>

        {/* Page Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-[#432841] pb-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight text-white mb-2">Finalizar Pago</h2>
            <p className="text-[#c398bf] text-base md:text-lg">Revisa tu pedido y completa el pago.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN: Order Summary */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Shipping Summary */}
            <section className="bg-[#20131f] rounded-xl border border-[#60395d] p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Dirección de Envío
              </h3>
              <div className="text-[#c398bf] space-y-1">
                <p className="text-white font-medium">{shippingData.firstName} {shippingData.lastName}</p>
                <p>{shippingData.address}</p>
                {shippingData.apartment && <p>{shippingData.apartment}</p>}
                <p>{shippingData.city}, {shippingData.state} {shippingData.postalCode}</p>
                <p>México</p>
                <p className="mt-2">{shippingData.email}</p>
                <p>{shippingData.phone}</p>
              </div>
              <Link to="/checkout" className="text-[#fa1c75] text-sm mt-4 inline-block hover:underline">
                ← Modificar dirección
              </Link>
            </section>

            {/* Shipping Method Summary */}
            <section className="bg-[#20131f] rounded-xl border border-[#60395d] p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Método de Envío
              </h3>
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#fa1c75]/10 border border-[#fa1c75]">
                <div>
                  <p className="text-white font-bold">{selectedRate.provider}</p>
                  <p className="text-[#c398bf] text-sm">{selectedRate.serviceName} • {selectedRate.estimatedDays} días</p>
                </div>
                <span className="text-white font-bold">${shippingCost.toFixed(2)} {selectedRate.currency}</span>
              </div>
              <Link to="/checkout" className="text-[#fa1c75] text-sm mt-4 inline-block hover:underline">
                ← Cambiar método de envío
              </Link>
            </section>

            {/* Products */}
            <section className="bg-[#20131f] rounded-xl border border-[#60395d] p-6">
              <h3 className="text-lg font-bold text-white mb-4">Productos</h3>
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden shrink-0 border border-[#432841] bg-[#20131f]">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-[#c398bf]" />
                        </div>
                      )}
                      <span className="absolute top-0 right-0 bg-[#fa1c75] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl">{item.quantity}</span>
                    </div>
                    <div className="flex flex-col flex-1 justify-center">
                      <h4 className="text-white text-sm font-bold leading-tight">{item.productName}</h4>
                      <p className="text-[#c398bf] text-xs mt-1">
                        {item.size && `Size: ${item.size}`} {item.color && `/ Color: ${item.color}`}
                      </p>
                    </div>
                    <div className="flex flex-col justify-center items-end">
                      <p className="text-white font-bold text-sm">${item.totalPrice?.toFixed(2) || (item.unitPrice * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Payment */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Order Total Card */}
            <div className="bg-[#301c2f] rounded-xl border border-[#432841] p-6 shadow-xl shadow-black/20">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-[#432841] pb-3">Resumen del Pedido</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#c398bf]">Subtotal</span>
                  <span className="text-white font-medium">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#c398bf]">Descuento</span>
                    <span className="text-green-400 font-medium">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#c398bf]">Envío ({selectedRate.provider})</span>
                  <span className="text-white font-medium">${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-[#c398bf]">IVA (16%)</span>
                   <span className="text-white font-medium">${taxAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-[#432841] pt-4 mt-4">
                <div className="flex justify-between items-end">
                  <span className="text-white font-bold text-lg">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#fa1c75]">${displayTotal.toFixed(2)} MXN</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-[#20131f] rounded-xl border border-[#60395d] p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#fa1c75]" />
                Método de Pago
              </h3>
              
              {/* Payment Method - Card Only */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-[#fa1c75]/20 border border-[#fa1c75] mb-6">
                <CreditCard className="w-6 h-6 text-[#fa1c75]" />
                <div>
                  <p className="text-white font-bold text-sm">Pago con Tarjeta</p>
                  <p className="text-[#c398bf] text-xs">Débito o Crédito</p>
                </div>
              </div>

              <p className="text-sm text-[#c398bf] mb-4">
                Haz clic en "Pagar Ahora" para abrir el formulario de pago seguro.
              </p>

              {/* Action Button */}
              <button 
                type="button"
                onClick={handleProceedToPayment}
                disabled={isSubmitting}
                className="w-full bg-[#fa1c75] hover:bg-[#cc1261] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg h-14 rounded-lg shadow-lg shadow-[#fa1c75]/20 transition-all flex items-center justify-center gap-2 group"
              >
                {isSubmitting ? 'Procesando...' : 'Pagar Ahora'}
                {!isSubmitting && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>

              {/* Trust Signals */}
              <div className="flex justify-center items-center gap-4 mt-6 opacity-50">
                <Lock className="w-6 h-6 text-white" />
                <ShieldCheck className="w-6 h-6 text-white" />
                <Shield className="w-6 h-6 text-white" />
                <p className="text-[10px] text-white uppercase tracking-wider font-bold">SSL Encrypted</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payment;
