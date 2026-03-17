import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function StripePayment({ clientSecret, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/pedidos`,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message);
      setProcessing(false);
    } else {
      let paymentIntentId = paymentIntent?.id;
      if (!paymentIntentId && clientSecret) {
        paymentIntentId = clientSecret.split('_secret_')[0];
      }
      onSuccess(paymentIntentId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white border border-[#C9A84C]/20 rounded-[8px] w-full max-w-md p-8 shadow-2xl relative animate-scale-in text-[#2C1F0E]">
        <button 
          onClick={onCancel}
          className="absolute top-6 right-6 text-[#2C1F0E]/40 hover:text-[#1B2A5E] transition-colors"
        >
          <span className="text-xl font-black">✕</span>
        </button>

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#F5F0E8] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#C9A84C]/10">
            <Lock className="w-8 h-8 text-[#C9A84C]" />
          </div>
          <h3 className="text-2xl font-black text-[#1B2A5E] uppercase tracking-tight">Pago Seguro</h3>
          <p className="text-sm text-[#2C1F0E]/60 italic">Ingresa los datos de tu tarjeta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="p-4 bg-[#F5F0E8]/50 rounded-[4px] border border-[#C9A84C]/10">
            <PaymentElement 
                options={{
                theme: 'none',
                variables: {
                    colorPrimary: '#1B2A5E',
                    colorBackground: '#ffffff',
                    colorText: '#2C1F0E',
                    colorDanger: '#ef4444',
                    fontFamily: 'Outfit, sans-serif',
                    spacingUnit: '4px',
                },
                rules: {
                    '.Input': {
                    border: '1px solid #C9A84C30',
                    boxShadow: 'none',
                    borderRadius: '4px',
                    },
                    '.Input:focus': {
                    border: '1px solid #1B2A5E',
                    },
                    '.Label': {
                    fontWeight: '700',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    color: '#2C1F0E90',
                    marginBottom: '4px',
                    }
                }
                }}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-[4px] flex items-center gap-3 text-red-600 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!stripe || processing}
            className="w-full bg-[#1B2A5E] hover:bg-[#0f1836] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black h-14 rounded-[4px] transition-all shadow-lg flex items-center justify-center gap-3"
          >
            {processing ? (
                <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    PROCESANDO...
                </span>
            ) : (
                <>
                    PAGAR AHORA
                    <ArrowRight className="w-5 h-5" />
                </>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center flex items-center justify-center gap-2 opacity-30">
            <ShieldCheck className="w-3 h-3" />
            <p className="text-[10px] text-[#2C1F0E] uppercase tracking-widest font-black">Powered by Stripe</p>
        </div>
      </div>
    </div>
  );
}
