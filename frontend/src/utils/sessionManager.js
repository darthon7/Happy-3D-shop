/**
 * sessionManager.js
 *
 * Módulo singleton para centralizar el cierre de sesión.
 * Garantiza que cualquier logout (por inactividad, token expirado, manual)
 * siempre:
 *   1. Limpia los tokens del localStorage
 *   2. Resetea el store de Zustand
 *   3. Redirige a /login
 *
 * Se usa en:
 *   - axios.js (401 / token expirado)
 *   - useInactivityTimeout.js (inactividad de 30 min)
 *   - authStore.js (logout manual del usuario)
 */

let _storeLogout = null; // referencia al logout de Zustand, inyectada desde authStore
let _isLoggingOut = false; // guarda de reentrancia

/**
 * Registra la función de logout del store de Zustand.
 * Se llama una sola vez al inicializar authStore.
 */
export const registerLogout = (logoutFn) => {
  _storeLogout = logoutFn;
};

/**
 * Cierra la sesión de forma completa:
 * - Limpia tokens del localStorage
 * - Resetea el estado de Zustand
 * - Redirige a /login
 *
 * Incluye guarda de reentrancia para evitar múltiples
 * ejecuciones simultáneas (ej. axios interceptor + inactivity timeout).
 */
export const forceLogout = () => {
  // Evitar múltiples ejecuciones simultáneas
  if (_isLoggingOut) return;
  _isLoggingOut = true;

  // 1. Limpiar tokens
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("auth-storage");

  // 2. Resetear store de Zustand si ya fue registrado
  if (_storeLogout) {
    try {
      _storeLogout();
    } catch {
      // Si falla, no bloquear el redirect
    }
  }

  // 3. Redirigir a login (con un micro-delay para que Zustand limpie estado)
  setTimeout(() => {
    _isLoggingOut = false;
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }, 50);
};
