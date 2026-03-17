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
  const { items, subtotal, discount, total, clearCart, fetchCart } = useCartStore();
  
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
      toast.error('Por favor completa los datos de envío primero');
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
        shippingStreetLine2: shippingData.colonia ? `Col. ${shippingData.colonia}${shippingData.apartment ? ', ' + shippingData.apartment : ''}` : shippingData.apartment,
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
      toast.error(err.response?.data?.message || 'Error al procesar. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId) => {
    try {
      if (paymentIntentId) {
        await paymentApi.confirmStripePayment(paymentIntentId);
      }
      clearCart();
      await fetchCart();
      toast.success('¡Pedido realizado con éxito!');
      navigate('/pedidos');
    } catch (err) {
      console.error('Post-payment error:', err);
      clearCart();
      await fetchCart();
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
        await fetchCart();
      } catch (err) {
        console.error('Error cancelling order:', err);
      }
    }
  };

  if (!shippingData || !selectedRate) {
    return null;
  }

  return (
    <div className="bg-[#F5F0E8] min-h-screen flex flex-col font-sans text-[#2C1F0E]">
      {/* Stripe Payment Modal */}
      {showPaymentModal && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'flat' } }}>
            <StripePayment 
                clientSecret={clientSecret} 
                onSuccess={handlePaymentSuccess}
                onCancel={handleCancelPayment}
            />
        </Elements>
      )}

      {/* Main Layout */}
      <main className="flex-grow w-full px-4 md:px-10 py-12 max-w-7xl mx-auto">
        <div className="flex flex-col mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-black text-[#1B2A5E] mb-2 uppercase tracking-tight">Casi listo</h1>
            <p className="text-[#2C1F0E]/70 text-lg italic">Revisa tu pedido y procede al pago seguro.</p>
        </div>

        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="flex items-center justify-between relative px-4 text-xs font-bold uppercase tracking-widest">
            <div className="absolute left-0 top-1/2 w-full h-[1px] bg-[#C9A84C]/20 -z-10"></div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C9A84C] text-white flex items-center justify-center shadow-lg ring-4 ring-[#F5F0E8]">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-[#C9A84C]">Carrito</span>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C9A84C] text-white flex items-center justify-center shadow-lg ring-4 ring-[#F5F0E8]">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-[#C9A84C]">Envío</span>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1B2A5E] text-white flex items-center justify-center shadow-lg ring-4 ring-[#F5F0E8] shadow-[#1B2A5E]/20">
                03
              </div>
              <span className="text-[#1B2A5E]">Pago</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* LEFT COLUMN: Summary Cards */}
          <div className="lg:col-span-7 space-y-8">
            {/* Shipping Summary */}
            <section className="bg-white rounded-[8px] border border-[#C9A84C]/20 p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#1B2A5E] flex items-center gap-3 uppercase tracking-tight">
                    <CheckCircle className="w-5 h-5 text-[#C9A84C]" />
                    Dirección de Envío
                </h3>
                <Link to="/checkout" className="text-[#C9A84C] text-xs font-black uppercase tracking-widest hover:underline">
                    Editar
                </Link>
              </div>
              <div className="text-[#2C1F0E]/80 text-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p className="text-xs font-black text-[#C9A84C] uppercase tracking-wider mb-1">Destinatario</p>
                    <p className="font-bold text-[#2C1F0E]">{shippingData.firstName} {shippingData.lastName}</p>
                    <p>{shippingData.email}</p>
                    <p>{shippingData.phone}</p>
                </div>
                <div>
                    <p className="text-xs font-black text-[#C9A84C] uppercase tracking-wider mb-1">Ubicación</p>
                    <p>{shippingData.address}</p>
                    {shippingData.colonia && <p>Col. {shippingData.colonia}</p>}
                    {shippingData.apartment && <p>{shippingData.apartment}</p>}
                    <p>{shippingData.city}, {shippingData.state} {shippingData.postalCode}</p>
                </div>
              </div>
            </section>

            {/* Shipping Method Summary */}
            <section className="bg-white rounded-[8px] border border-[#C9A84C]/20 p-8 shadow-sm">
              <h3 className="text-xl font-bold text-[#1B2A5E] mb-6 flex items-center gap-3 uppercase tracking-tight">
                <CheckCircle className="w-5 h-5 text-[#C9A84C]" />
                Método de Envío
              </h3>
              <div className="flex items-center justify-between p-5 rounded-[4px] bg-[#F5F0E8]/50 border border-[#C9A84C]/20">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-[#C9A84C]/10">
                        <ShoppingBag className="w-6 h-6 text-[#C9A84C]" />
                    </div>
                    <div>
                        <p className="text-[#1B2A5E] font-black uppercase text-sm">{selectedRate.provider}</p>
                        <p className="text-[#2C1F0E]/60 text-xs italic">{selectedRate.serviceName} • {selectedRate.estimatedDays} días</p>
                    </div>
                </div>
                <span className="text-[#1B2A5E] font-black text-lg">${shippingCost.toFixed(2)}</span>
              </div>
            </section>

            {/* Products List */}
            <section className="bg-white rounded-[8px] border border-[#C9A84C]/20 p-8 shadow-sm">
              <h3 className="text-xl font-bold text-[#1B2A5E] mb-6 uppercase tracking-tight">Tu Compra</h3>
              <div className="space-y-6 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-20 rounded-[4px] overflow-hidden shrink-0 border border-[#C9A84C]/10 bg-[#F5F0E8]">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                      )}
                      <span className="absolute -top-1 -right-1 bg-[#1B2A5E] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{item.quantity}</span>
                    </div>
                    <div className="flex flex-col flex-1 justify-center">
                      <h4 className="text-[#2C1F0E] text-sm font-bold leading-tight">{item.productName}</h4>
                      <p className="text-[#2C1F0E]/50 text-[10px] font-black uppercase mt-1">
                        {item.size && `${item.size}`} {item.color && `/ ${item.color}`}
                      </p>
                    </div>
                    <div className="flex flex-col justify-center items-end">
                      <p className="text-[#1B2A5E] font-black text-sm">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Order Total & Payment Action */}
          <div className="lg:col-span-5 space-y-8">
            {/* Summary Totals */}
            <div className="bg-white rounded-[8px] border border-[#C9A84C]/20 p-8 shadow-md">
              <h3 className="text-xl font-black text-[#1B2A5E] mb-6 uppercase tracking-widest border-b border-[#C9A84C]/10 pb-4">Resumen</h3>
              
              <div className="space-y-4 mb-8 text-sm">
                <div className="flex justify-between text-[#2C1F0E]/70 font-medium">
                  <span>Subtotal</span>
                  <span className="text-[#2C1F0E]">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#2C1F0E]/70 font-medium">
                    <span>Descuento</span>
                    <span className="text-green-600">-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#2C1F0E]/70 font-medium">
                  <span>Envío ({selectedRate.provider})</span>
                  <span className="text-[#2C1F0E]">${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#2C1F0E]/70 font-medium">
                   <span>IVA (16%)</span>
                   <span className="text-[#2C1F0E]">${taxAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-[#C9A84C]/10 pt-6 mt-6">
                <div className="flex justify-between items-end">
                  <span className="text-[#1B2A5E] font-black text-lg uppercase">Total a Pagar</span>
                  <div className="text-right">
                    <p className="text-3xl font-black text-[#C9A84C] leading-none mb-1">${displayTotal.toFixed(2)}</p>
                    <p className="text-[10px] text-[#2C1F0E]/40 font-black uppercase">Mexican Pesos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Action Area */}
            <div className="bg-[#1B2A5E] rounded-[8px] p-8 shadow-xl shadow-[#1B2A5E]/20 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              
              <h3 className="text-xl font-black mb-6 flex items-center gap-3 uppercase tracking-tight relative z-10">
                <CreditCard className="w-5 h-5 text-[#C9A84C]" />
                Pago Seguro
              </h3>
              
              <div className="flex items-center gap-4 p-5 rounded-[4px] bg-white/10 border border-white/10 mb-8 relative z-10">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-[#C9A84C]" />
                </div>
                <div>
                  <p className="text-white font-black text-sm uppercase">Tarjeta Bancaria</p>
                  <p className="text-white/60 text-xs italic">Crédito o Débito vía Stripe</p>
                </div>
              </div>

              <p className="text-sm text-white/70 mb-8 leading-relaxed relative z-10 italic">
                Tus datos de pago están protegidos con encriptación de grado bancario. No guardamos información sensible de tu tarjeta.
              </p>

              <button 
                type="button"
                onClick={handleProceedToPayment}
                disabled={isSubmitting}
                className="w-full bg-[#C9A84C] hover:bg-[#b8943e] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-lg h-16 rounded-[4px] shadow-lg shadow-black/20 transition-all flex items-center justify-center gap-3 group relative z-10"
              >
                {isSubmitting ? (
                    <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        PROCESANDO...
                    </span>
                ) : (
                    <>
                        PAGAR AHORA
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
              </button>

              <div className="flex justify-center items-center gap-6 mt-8 opacity-40 relative z-10">
                <Lock className="w-5 h-5" />
                <ShieldCheck className="w-5 h-5" />
                <p className="text-[10px] uppercase tracking-widest font-black">Secure Checkout</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payment;
