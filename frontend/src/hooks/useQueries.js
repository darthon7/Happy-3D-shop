import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, categoriesApi, cartApi, ordersApi, wishlistApi } from '../api';

export const useProducts = (params = {}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productsApi.getAll(params).then(res => res.data),
  });
};

export const useProductBySlug = (slug) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug).then(res => res.data),
    enabled: !!slug,
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsApi.getFeatured().then(res => res.data),
  });
};

export const useNewArrivals = (limit = 3) => {
  return useQuery({
    queryKey: ['products', 'new-arrivals', limit],
    queryFn: () => productsApi.getNewArrivals().then(res => res.data),
  });
};

export const useOnSaleProducts = () => {
  return useQuery({
    queryKey: ['products', 'on-sale'],
    queryFn: () => productsApi.getOnSale().then(res => res.data),
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then(res => res.data),
    staleTime: 30 * 60 * 1000,
  });
};

export const useCart = () => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get().then(res => res.data),
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ variantId, quantity }) => cartApi.addItem(variantId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useWishlist = () => {
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.get().then(res => res.data),
  });
};

export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productId) => wishlistApi.add(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
};

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productId) => wishlistApi.remove(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
};

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getAll().then(res => res.data),
  });
};
