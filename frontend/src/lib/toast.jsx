import toast from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

/**
 * Custom toast configuration matching Prop's Room theme
 */
const toastStyles = {
  style: {
    background: '#ffffff',
    color: '#37474F',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  },
};

/**
 * Success toast with green accent
 */
export const toastSuccess = (message, options = {}) => {
  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-slide-in' : 'opacity-0'
        } max-w-md w-full bg-surface border border-green-500/30 shadow-lg shadow-green-500/10 rounded-xl pointer-events-auto flex items-center gap-3 p-4`}
      >
        <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
          <CheckCircle className="h-5 w-5 text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{message}</p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 text-text-muted hover:text-white transition-colors"
        >
          <XCircle className="h-5 w-5" />
        </button>
      </div>
    ),
    { duration: 3000, ...options }
  );
};

/**
 * Error toast with red accent
 */
export const toastError = (message, options = {}) => {
  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-slide-in' : 'opacity-0'
        } max-w-md w-full bg-surface border border-red-500/30 shadow-lg shadow-red-500/10 rounded-xl pointer-events-auto flex items-center gap-3 p-4`}
      >
        <div className="flex-shrink-0 w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
          <XCircle className="h-5 w-5 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{message}</p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 text-text-muted hover:text-white transition-colors"
        >
          <XCircle className="h-5 w-5" />
        </button>
      </div>
    ),
    { duration: 4000, ...options }
  );
};

/**
 * Warning toast with amber accent
 */
export const toastWarning = (message, options = {}) => {
  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-slide-in' : 'opacity-0'
        } max-w-md w-full bg-surface border border-amber-500/30 shadow-lg shadow-amber-500/10 rounded-xl pointer-events-auto flex items-center gap-3 p-4`}
      >
        <div className="flex-shrink-0 w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{message}</p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 text-text-muted hover:text-white transition-colors"
        >
          <XCircle className="h-5 w-5" />
        </button>
      </div>
    ),
    { duration: 4000, ...options }
  );
};

/**
 * Info toast with primary color accent
 */
export const toastInfo = (message, options = {}) => {
  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-slide-in' : 'opacity-0'
        } max-w-md w-full bg-surface border border-primary/30 shadow-lg shadow-primary/10 rounded-xl pointer-events-auto flex items-center gap-3 p-4`}
      >
        <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
          <Info className="h-5 w-5 text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{message}</p>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="flex-shrink-0 text-text-muted hover:text-white transition-colors"
        >
          <XCircle className="h-5 w-5" />
        </button>
      </div>
    ),
    { duration: 3000, ...options }
  );
};

/**
 * Loading toast with spinner
 */
export const toastLoading = (message, options = {}) => {
  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-slide-in' : 'opacity-0'
        } max-w-md w-full bg-surface border border-border shadow-lg rounded-xl pointer-events-auto flex items-center gap-3 p-4`}
      >
        <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{message}</p>
        </div>
      </div>
    ),
    { duration: Infinity, ...options }
  );
};

/**
 * Promise toast - shows loading, then success/error based on promise result
 */
export const toastPromise = (promise, messages, options = {}) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || 'Cargando...',
      success: messages.success || '¡Completado!',
      error: messages.error || 'Ocurrió un error',
    },
    {
      ...toastStyles,
      success: {
        ...toastStyles,
        style: {
          ...toastStyles.style,
          borderColor: 'rgba(34, 197, 94, 0.3)',
        },
        icon: <CheckCircle className="h-5 w-5 text-green-400" />,
      },
      error: {
        ...toastStyles,
        style: {
          ...toastStyles.style,
          borderColor: 'rgba(239, 68, 68, 0.3)',
        },
        icon: <XCircle className="h-5 w-5 text-red-400" />,
      },
      ...options,
    }
  );
};

// Default toast with theme styling
export const customToast = toast;

// Export default styles for Toaster configuration
export const toasterConfig = {
  position: 'top-right',
  toastOptions: toastStyles,
};

export default {
  success: toastSuccess,
  error: toastError,
  warning: toastWarning,
  info: toastInfo,
  loading: toastLoading,
  promise: toastPromise,
};
