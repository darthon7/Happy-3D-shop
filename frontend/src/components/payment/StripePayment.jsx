import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock, AlertCircle } from 'lucide-react';

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
        return_url: `${window.location.origin}/pedidos`, // Fallback
      },
      redirect: "if_required", // Important: handle redirect manually if possible
    });

    if (submitError) {
      setError(submitError.message);
      setProcessing(false);
    } else {
      // Payment succeeded! 
      // Get paymentIntentId from response or extract from clientSecret
      let paymentIntentId = paymentIntent?.id;
      if (!paymentIntentId && clientSecret) {
        // clientSecret format: pi_xxxxx_secret_xxxxx
        paymentIntentId = clientSecret.split('_secret_')[0];
      }
      console.log('Payment successful, paymentIntentId:', paymentIntentId);
      onSuccess(paymentIntentId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#20131f] border border-[#60395d] rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-scale-in">
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-[#c398bf] hover:text-white"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#fa1c75]/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-[#fa1c75]" />
          </div>
          <h3 className="text-xl font-bold text-white">Secure Payment</h3>
          <p className="text-sm text-[#c398bf]">Enter your card details securely</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement 
            options={{
              theme: 'night',
              variables: {
                colorPrimary: '#fa1c75',
                colorBackground: '#301c2f',
                colorText: '#ffffff',
                colorDanger: '#ef4444',
                fontFamily: 'Outfit, sans-serif',
                borderRadius: '8px',
              }
            }}
          />

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!stripe || processing}
            className="w-full bg-[#fa1c75] hover:bg-[#cc1261] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold h-12 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {processing ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              "Pay Now"
            )}
          </button>
        </form>
        
        <div className="mt-4 text-center">
            <p className="text-[10px] text-[#c398bf]/60 uppercase tracking-widest font-bold">Powered by Stripe</p>
        </div>
      </div>
    </div>
  );
}
