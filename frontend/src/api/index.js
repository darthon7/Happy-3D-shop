import api from "./axios";

// Auth API
export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  oauth2Login: (provider, accessToken) => api.post(`/auth/oauth2/${provider}`, { accessToken }),
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
  refreshToken: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
};

// User API
export const userApi = {
  getProfile: () => api.get("/user/profile"),
  updateProfile: (data) => api.put("/user/profile", data),
  changePassword: (data) => api.post("/user/change-password", data),
  getAddresses: () => api.get("/user/addresses"),
  addAddress: (data) => api.post("/user/addresses", data),
  updateAddress: (id, data) => api.put(`/user/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/user/addresses/${id}`),
};

// Products API
export const productsApi = {
  getAll: (params) => api.get("/products", { params }),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  getByCategory: (categoryId, params) =>
    api.get(`/products/category/${categoryId}`, { params }),
  getWithFilters: (params) => api.get("/products/filter", { params }),
  search: (query, params) =>
    api.get("/products/search", { params: { q: query, ...params } }),
  getFeatured: () => api.get("/products/featured"),
  getNewArrivals: () => api.get("/products/new-arrivals"),
  getOnSale: () => api.get("/products/on-sale"),
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get("/categories"),
  getBySlug: (slug) => api.get(`/categories/${slug}`),
  getSubcategories: (slug) => api.get(`/categories/${slug}/subcategories`),
};

// Cart API
export const cartApi = {
  get: () => api.get("/cart"),
  addItem: (variantId, quantity) =>
    api.post("/cart/items", { variantId, quantity }),
  updateItem: (itemId, quantity) =>
    api.put(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
  applyCoupon: (code) => api.post("/cart/coupon", { code }),
  removeCoupon: () => api.delete("/cart/coupon"),
  clear: () => api.delete("/cart"),
};

// Orders API
export const ordersApi = {
  checkout: (data) => api.post("/orders/checkout", data),
  getAll: () => api.get("/orders"),
  getByNumber: (orderNumber) => api.get(`/orders/${orderNumber}`),
  cancel: (orderNumber, data) =>
    api.post(`/orders/${orderNumber}/cancel`, data),
};

// Payment API
export const paymentApi = {
  createStripeIntent: (orderId) =>
    api.post(`/payments/stripe/create-intent/${orderId}`),
  confirmStripePayment: (paymentIntentId) =>
    api.post(`/payments/stripe/confirm/${paymentIntentId}`),
};

// Shipping API
export const shippingApi = {
  getRates: (data) => api.post("/shipping/rates", data),
  trackOrder: (orderNumber) => api.get(`/shipping/track/order/${orderNumber}`),
  verifyDelivery: (orderId) =>
    api.post(`/shipping/track/verify-delivery/${orderId}`),
};

// EnvioClick Shipping API
export const envioClickApi = {
  getRates: (data) => api.post("/shipping/envioclick/rates", data),
  trackOrder: (orderNumber) => api.get(`/shipping/envioclick/track/order/${orderNumber}`),
  verifyDelivery: (orderId) =>
    api.post(`/shipping/envioclick/track/verify-delivery/${orderId}`),
  discoverEndpoints: () => api.post("/shipping/envioclick/discover"),
};

// Wishlist API
export const wishlistApi = {
  get: () => api.get("/wishlist"),
  add: (productId) => api.post(`/wishlist/products/${productId}`),
  remove: (productId) => api.delete(`/wishlist/products/${productId}`),
  check: (productId) => api.get(`/wishlist/products/${productId}/check`),
  clear: () => api.delete("/wishlist"),
};

// Upload API (Cloudinary)
export const uploadApi = {
  productImage: (file) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post("/admin/upload/product", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  categoryImage: (file) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post("/admin/upload/category", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteImage: (url) => api.delete("/admin/upload", { params: { url } }),
};

// Gallery API (Public)
export const galleryApi = {
  getAll: () => api.get("/gallery"),
};

// Admin Gallery API
export const adminGalleryApi = {
  getAll: () => api.get("/admin/gallery"),
  upload: (file, data = {}) => {
    const formData = new FormData();
    formData.append("file", file);
    if (data.title) formData.append("title", data.title);
    if (data.description) formData.append("description", data.description);
    if (data.altText) formData.append("altText", data.altText);
    if (data.sortOrder !== undefined)
      formData.append("sortOrder", data.sortOrder);
    if (data.isActive !== undefined) formData.append("isActive", data.isActive);
    return api.post("/admin/gallery", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  update: (id, data) => api.put(`/admin/gallery/${id}`, data),
  delete: (id) => api.delete(`/admin/gallery/${id}`),
  reorder: (imageIds) => api.post("/admin/gallery/reorder", imageIds),
};

export const zipCodeApi = {
  get: (code) => api.get(`/public/zipcodes/${code}`),
};

// Reviews API
export const reviewsApi = {
  getByProduct: (productId, params) =>
    api.get(`/reviews/product/${productId}`, { params }),
  getStats: (productId) => api.get(`/reviews/product/${productId}/stats`),
  canReview: (productId) => api.get(`/reviews/product/${productId}/can-review`),
  create: (productId, data) => api.post(`/reviews/product/${productId}`, data),
};

export default api;
