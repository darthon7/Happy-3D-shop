import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cartApi } from "../api";

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      coupon: null,
      itemCount: 0,
      isLoading: false,

      // Fetch cart from API and auto-remove out-of-stock items
      fetchCart: async () => {
        set({ isLoading: true });
        try {
          const response = await cartApi.get();
          const cart = response.data;
          const items = cart.items || [];

          set({
            items,
            subtotal: cart.subtotal || 0,
            discount: cart.discount || 0,
            tax: cart.tax || 0,
            total: cart.total || 0,
            coupon: cart.appliedCoupon || null,
            itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
            isLoading: false,
          });

          // Auto-remove items that are out of stock
          const outOfStock = items.filter((item) => item.availableStock === 0);
          if (outOfStock.length > 0) {
            await get().removeOutOfStockItems(outOfStock);
          }
        } catch (error) {
          console.error("Error fetching cart:", error);
          set({ isLoading: false });
        }
      },

      // Remove all out-of-stock items silently (called from fetchCart)
      removeOutOfStockItems: async (outOfStockItems) => {
        try {
          await Promise.all(
            outOfStockItems.map((item) => cartApi.removeItem(item.id)),
          );
          // Re-fetch to get updated totals (without triggering another removal loop)
          const response = await cartApi.get();
          const cart = response.data;
          const items = cart.items || [];
          set({
            items,
            subtotal: cart.subtotal || 0,
            discount: cart.discount || 0,
            tax: cart.tax || 0,
            total: cart.total || 0,
            coupon: cart.appliedCoupon || null,
            itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
          });
        } catch (error) {
          console.error("Error removing out-of-stock items:", error);
        }
      },

      // Add item to cart
      addItem: async (variantId, quantity = 1) => {
        set({ isLoading: true });
        try {
          await cartApi.addItem(variantId, quantity);
          await get().fetchCart();
        } catch (error) {
          console.error("Error adding to cart:", error);
          set({ isLoading: false });
          throw error; // Re-throw so caller can handle it
        }
      },

      // Update item quantity
      updateItem: async (itemId, quantity) => {
        set({ isLoading: true });
        try {
          await cartApi.updateItem(itemId, quantity);
          await get().fetchCart();
        } catch (error) {
          console.error("Error updating cart:", error);
          set({ isLoading: false });
        }
      },

      // Remove item
      removeItem: async (itemId) => {
        set({ isLoading: true });
        try {
          await cartApi.removeItem(itemId);
          await get().fetchCart();
        } catch (error) {
          console.error("Error removing from cart:", error);
          set({ isLoading: false });
        }
      },

      // Apply coupon
      applyCoupon: async (code) => {
        set({ isLoading: true });
        try {
          await cartApi.applyCoupon(code);
          await get().fetchCart();
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: error.response?.data?.message };
        }
      },

      // Remove coupon
      removeCoupon: async () => {
        set({ isLoading: true });
        try {
          await cartApi.removeCoupon();
          await get().fetchCart();
        } catch (error) {
          console.error("Error removing coupon:", error);
          set({ isLoading: false });
        }
      },

      // Clear cart
      clearCart: async () => {
        set({ isLoading: true });
        try {
          await cartApi.clear();
          set({
            items: [],
            subtotal: 0,
            discount: 0,
            total: 0,
            coupon: null,
            itemCount: 0,
            isLoading: false,
          });
        } catch (error) {
          console.error("Error clearing cart:", error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "cart-storage",
      partialize: () => ({}),
    },
  ),
);

export default useCartStore;
