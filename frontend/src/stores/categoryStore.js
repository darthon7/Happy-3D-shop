import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { categoriesApi } from '../api';

const useCategoryStore = create(
  persist(
    (set, get) => ({
      categories: [],
      loading: false,
      lastFetched: null,

      fetchCategories: async (force = false) => {
        if (get().categories.length > 0 && !force) return;
        
        const ONE_HOUR = 60 * 60 * 1000;
        if (!force && get().lastFetched && 
            Date.now() - get().lastFetched < ONE_HOUR) {
          return;
        }

        set({ loading: true });
        try {
          const response = await categoriesApi.getAll();
          set({ 
            categories: response.data || [], 
            loading: false,
            lastFetched: Date.now()
          });
        } catch (error) {
          console.error('Error fetching categories:', error);
          set({ loading: false });
        }
      }
    }),
    {
      name: 'category-storage',
      partialize: (state) => ({ 
        categories: state.categories,
        lastFetched: state.lastFetched 
      }),
    }
  )
);

export default useCategoryStore;
