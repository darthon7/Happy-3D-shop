import { useEffect, useState } from 'react';
import { Button } from './ui/Button';

const InactivityModal = ({ show, remainingTime, onExtend, onLogout }) => {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const seconds = Math.ceil(remainingTime / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    setCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
  }, [remainingTime]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div className="relative z-10 bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-yellow-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2">
            Sesión por expirar
          </h3>
          
          <p className="text-gray-400 mb-6">
            Tu sesión se cerrará automáticamente debido a inactividad.
          </p>
          
          <div className="bg-gray-800 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-400">Tiempo restante</p>
            <p className="text-3xl font-mono font-bold text-yellow-500">
              {countdown}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onLogout}
            >
              Cerrar sesión
            </Button>
            <Button
              className="flex-1"
              onClick={onExtend}
            >
              Continuar sesión
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InactivityModal;
