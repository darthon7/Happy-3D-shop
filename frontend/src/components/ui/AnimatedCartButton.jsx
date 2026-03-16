import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Check, Shirt } from 'lucide-react';
import { cn } from '../../lib/utils';

export const AnimatedCartButton = ({ 
  onClick, 
  disabled, 
  className,
  text = 'Agregar al Carrito',
  addedText = '¡Agregado!'
}) => {
  const [status, setStatus] = useState('idle');

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (status !== 'idle' || disabled) return;
    
    setStatus('animating');
    
    try {
      // Garantizar que la animación luzca unos milisegundos incluso si el servidor es muy rápido
      const minAnimationPromise = new Promise(resolve => setTimeout(resolve, 1100));
      const actionPromise = onClick ? onClick(e) : Promise.resolve();
      
      await Promise.all([minAnimationPromise, actionPromise]);
      
      setStatus('success');
      
      // Regresar al estado inactivo luego de 2.5 segundos
      setTimeout(() => setStatus('idle'), 2500);
    } catch (error) {
      // Si falla la petición (ej. no autorizado), no mostrar la palomita
      setStatus('idle');
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || status !== 'idle'}
      className={cn(
        "relative overflow-hidden w-full h-12 rounded-lg text-sm font-bold shadow-glow transition-all duration-300 flex items-center justify-center",
        // Evitamos que active:scale aplique cuando está en medio de la animación o success
        status === 'idle' && !disabled ? "active:scale-[0.98]" : "",
        disabled && status === 'idle'
          ? "bg-gray-600 cursor-not-allowed opacity-75"
          : status === 'success'
            ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] border border-emerald-400"
            : "bg-primary hover:shadow-glow-lg hover:bg-primary-600",
        className
      )}
    >
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            key="idle"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <ShoppingCart className="w-[18px] h-[18px]" />
            <span>{disabled ? 'Agotado' : text}</span>
          </motion.div>
        )}

        {status === 'animating' && (
          <motion.div
            key="animating"
            className="flex items-center justify-center w-full h-full relative"
          >
            {/* El carrito esperando abajo y rebotando */}
            <motion.div
              animate={{
                y: [0, 5, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 0.4,
                delay: 0.5, // Rebota justo cuando cae la camisa
                times: [0, 0.5, 1]
              }}
            >
              <ShoppingCart className="w-[20px] h-[20px]" />
            </motion.div>

            {/* El artículo (prenda/caja) que cae dentro del carrito */}
            <motion.div
              initial={{ y: -30, opacity: 0, scale: 0.5 }}
              animate={{ 
                y: [ -30, -5, 8 ], 
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 0.6,
                delay: 0.15,
                times: [0, 0.7, 1],
                ease: "anticipate"
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[15px]"
            >
              <Shirt className="w-[14px] h-[14px] fill-white text-white" />
            </motion.div>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            key="success"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex items-center gap-2 text-white"
          >
            <motion.div
              initial={{ rotate: -90, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
            >
              <Check className="w-[20px] h-[20px]" strokeWidth={3} />
            </motion.div>
            <span>{addedText}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

export default AnimatedCartButton;
