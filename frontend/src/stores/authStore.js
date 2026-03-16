import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi, userApi } from "../api";
import { registerLogout } from "../utils/sessionManager";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ email, password });
          const { access_token, refresh_token, user } = response.data;

          localStorage.setItem("accessToken", access_token);
          localStorage.setItem("refreshToken", refresh_token);

          set({ user, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          const message =
            error.response?.data?.message || "Error al iniciar sesión";
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      oauth2Login: async (provider, accessTokenParam) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.oauth2Login(provider, accessTokenParam);
          const { access_token, refresh_token, user } = response.data;

          localStorage.setItem("accessToken", access_token);
          localStorage.setItem("refreshToken", refresh_token);

          set({ user, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          const message =
            error.response?.data?.message || "Error al iniciar sesión con " + provider;
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);
          const { access_token, refresh_token, user } = response.data;

          localStorage.setItem("accessToken", access_token);
          localStorage.setItem("refreshToken", refresh_token);

          set({ user, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          const message =
            error.response?.data?.message || "Error al registrarse";
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      logout: () => {
        authApi.logout(); // limpia tokens del localStorage
        set({ user: null, isAuthenticated: false });
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      clearError: () => set({ error: null }),

      syncProfile: async () => {
        if (!get().isAuthenticated) return;
        try {
          const response = await userApi.getProfile();
          set((state) => ({ user: { ...state.user, ...response.data } }));
        } catch {
          // Silently ignore — user data from login is still valid
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// Registrar el logout en sessionManager usando getState() — referencia estable
// que siempre apunta al logout actual del store, independiente del timing de
// rehydratación. Así axios.js puede llamar a forceLogout() y éste resetea
// el store de Zustand correctamente.
registerLogout(() => useAuthStore.getState().logout());

export default useAuthStore;
