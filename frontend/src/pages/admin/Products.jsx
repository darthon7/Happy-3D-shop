import { useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Plus, Edit, Trash2, Search, X, Upload, Loader2, Package, Box, Grid3X3, List, AlertTriangle, CheckCircle, XCircle, Check, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge, Skeleton } from '../../components/ui';
import api from '../../api';
import { uploadApi } from '../../api';
import { validateField } from '../../lib/validation';
import { useCategoryStore } from '../../stores';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const categories = useCategoryStore(s => s.categories);
  const fetchCategories = useCategoryStore(s => s.fetchCategories);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [pagination, setPagination] = useState({ page: 0, totalPages: 0, totalElements: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 320,
    overscan: 5,
  });
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    shortDescription: '',
    description: '',
    basePrice: '',
    salePrice: '',
    categoryId: '',
    isActive: true,
    isFeatured: false,
    isNew: true,
    variants: [],
    imageUrl: '',
    imagePreview: '',
    imageBase64: '',
    imageName: '',
    // Shipping dimensions
    weightKg: '',
    lengthCm: '',
    widthCm: '',
    heightCm: '',
  });

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const fetchProducts = async (page = 0) => {
    setLoading(true);
    try {
      const params = { page, size: 10 };
      if (searchQuery) params.search = searchQuery;
      let response;
      try {
        response = await api.get('/admin/products', { params });
      } catch {
        response = await api.get('/products', { params });
      }
      const data = response.data;
      setProducts(data.content || data || []);
      setPagination({
        page: data.number || 0,
        totalPages: data.totalPages || 0,
        totalElements: data.totalElements || products.length,
      });
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(0);
  };

  const generateSlug = (name) => {
    return name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const getTotalStock = (product) => {
    return product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
  };

  const getStockConfig = (stock) => {
    if (stock === 0) return { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Sin stock', icon: XCircle };
    if (stock < 10) return { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Stock bajo', icon: AlertTriangle };
    return { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'En stock', icon: CheckCircle };
  };

  const resetForm = () => {
    setFormData({
      name: '', slug: '', shortDescription: '', description: '',
      basePrice: '', salePrice: '', categoryId: '', isActive: true,
      isFeatured: false, isNew: true, variants: [],
      imageUrl: '', imagePreview: '', imageBase64: '', imageName: '',
      weightKg: '', lengthCm: '', widthCm: '', heightCm: '',
    });
    setEditingProduct(null);
  };

  const openCreateModal = () => { resetForm(); setShowModal(true); };

  const openEditModal = (product) => {
    setEditingProduct(product);
    const variants = product.variants?.length ? product.variants : [];
    const mainImage = product.images?.find(img => img.isMain) || product.images?.[0];
    setFormData({
      name: product.name || '',
      slug: product.slug || '',
      shortDescription: product.shortDescription || '',
      description: product.description || '',
      basePrice: product.basePrice || '',
      salePrice: product.salePrice || '',
      categoryId: product.category?.id || '',
      isActive: product.isActive ?? true,
      isFeatured: product.isFeatured ?? false,
      isNew: product.isNew ?? false,
      variants: variants.map(v => ({
        id: v.id,
        sku: v.sku || '',
        size: v.size || 'Único',
        color: v.color || 'Default',
        colorHex: v.colorHex || '#000000',
        stock: v.stock ?? '',
        isActive: v.isActive ?? true,
      })),
      imageUrl: mainImage?.url || '',
      imagePreview: mainImage?.url || '',
      imageBase64: '',
      imageName: '',
      // Shipping dimensions
      weightKg: product.weightKg || '',
      lengthCm: product.lengthCm || '',
      widthCm: product.widthCm || '',
      heightCm: product.heightCm || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Helper to normalize price (e.g., ".50" -> "0.50", "50." -> "50.00")
    const normalizePrice = (value) => {
      if (!value || value === '') return null;
      let normalized = value.toString().trim();
      if (normalized.startsWith('.')) normalized = '0' + normalized;
      if (normalized.endsWith('.')) normalized = normalized + '00';
      const num = parseFloat(normalized);
      return isNaN(num) ? null : num;
    };
    
    const normalizedBasePrice = normalizePrice(formData.basePrice);
    const normalizedSalePrice = normalizePrice(formData.salePrice);
    
    // Validate required fields
    const errors = {};
    
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'El nombre es requerido';
    }
    
    if (normalizedBasePrice === null || normalizedBasePrice < 0) {
      errors.basePrice = 'El precio debe ser un número válido mayor a 0';
    }
    
    if (!formData.variants || formData.variants.length === 0) {
      errors.variants = 'Debes agregar al menos una talla/variante';
    } else {
      formData.variants.forEach((v, idx) => {
        if (!v.size) errors[`variant_${idx}_size`] = 'Requerido';
        const num = parseInt(v.stock, 10);
        if (v.stock === '' || isNaN(num) || num < 0) errors[`variant_${idx}_stock`] = 'Inválido';
      });
    }
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      console.log('Validation errors:', errors);
      return;
    }
    
    setSaving(true);
    try {
      const imageUrl = formData.imageUrl || formData.imageBase64 || '';
      
      console.log('Final data to send:', {
        basePrice: normalizedBasePrice,
        salePrice: normalizedSalePrice,
        variantsCount: formData.variants?.length
      });
      
      const productData = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        shortDescription: formData.shortDescription,
        description: formData.description,
        basePrice: Number(normalizedBasePrice),
        salePrice: normalizedSalePrice ? Number(normalizedSalePrice) : null,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        isNew: formData.isNew,
        // Shipping dimensions
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : null,
        lengthCm: formData.lengthCm ? parseFloat(formData.lengthCm) : null,
        widthCm: formData.widthCm ? parseFloat(formData.widthCm) : null,
        heightCm: formData.heightCm ? parseFloat(formData.heightCm) : null,
        variants: formData.variants.map((v, i) => ({
          id: v.id,
          sku: v.sku || `DH-${Date.now().toString(36).toUpperCase()}-${i}`,
          color: v.color || 'Default',
          colorHex: v.colorHex || '#000000',
          size: v.size || 'Único',
          stock: Number(v.stock) || 0,
          priceAdjustment: 0,
          isActive: v.isActive !== false,
        })),
        images: imageUrl ? [{
          url: imageUrl, altText: formData.name, sortOrder: 0,
          isMain: true, mediaType: 'IMAGE',
        }] : [],
      };
      
      console.log('Sending product data:', JSON.stringify(productData, null, 2));
      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.id}`, productData);
      } else {
        await api.post('/admin/products', productData);
      }
      setShowModal(false);
      resetForm();
      fetchProducts(pagination.page);
    } catch (error) {
      console.error('Error saving product:', error);
      alert(error.response?.data?.message || 'Error al guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      fetchProducts(pagination.page);
    } catch (error) {
      alert(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleToggleActive = async (product) => {
    try {
      await api.put(`/admin/products/${product.id}`, {
        ...product,
        isActive: !product.isActive,
        categoryId: product.category?.id,
      });
      fetchProducts(pagination.page);
    } catch (error) {
      console.error('Error toggling product:', error);
    }
  };

  return (
    <div className="p-4 lg:p-8 bg-background-dark min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-display tracking-wide text-white">PRODUCTOS</h1>
          <p className="text-text-secondary text-sm mt-1">{pagination.totalElements} productos</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-surface rounded-xl border border-border p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-colors",
                viewMode === 'grid' 
                  ? "bg-primary text-white" 
                  : "text-text-muted hover:text-white"
              )}
              title="Vista de grid"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded-lg transition-colors",
                viewMode === 'table' 
                  ? "bg-primary text-white" 
                  : "text-text-muted hover:text-white"
              )}
              title="Vista de tabla"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          <button onClick={openCreateModal} className="btn bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/30">
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>
      
      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-11 bg-surface border border-border rounded-xl text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        </div>
      </form>
      
      {/* Table View */}
      {viewMode === 'table' && (
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-surface-elevated border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] font-mono font-medium text-text-secondary uppercase tracking-widest">Producto</th>
                <th className="px-6 py-3 text-left text-[10px] font-mono font-medium text-text-secondary uppercase tracking-widest">SKU</th>
                <th className="px-6 py-3 text-left text-[10px] font-mono font-medium text-text-secondary uppercase tracking-widest">Precio</th>
                <th className="px-6 py-3 text-left text-[10px] font-mono font-medium text-text-secondary uppercase tracking-widest">Stock</th>
                <th className="px-6 py-3 text-left text-[10px] font-mono font-medium text-text-secondary uppercase tracking-widest">Estado</th>
                <th className="px-6 py-3 text-right text-[10px] font-mono font-medium text-text-secondary uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4" colSpan={6}>
                      <Skeleton className="h-14 w-full rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td className="px-6 py-16 text-center text-text-secondary" colSpan={6}>
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-surface-elevated rounded-full flex items-center justify-center mb-4">
                        <Package className="w-10 h-10 text-text-muted" />
                      </div>
                      <p className="mb-4">No hay productos. ¡Crea el primero!</p>
                      <button onClick={openCreateModal} className="btn bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                        <Plus className="w-4 h-4" />
                        Crear Producto
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-surface-elevated rounded-xl overflow-hidden flex-shrink-0 border border-border">
                          {product.images?.[0]?.url && (
                            <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white line-clamp-1">{product.name}</p>
                          <p className="text-sm text-text-secondary">{product.category?.name || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-text-muted font-mono tracking-tight">
                      {product.variants?.[0]?.sku || '-'}
                    </td>
                    <td className="px-6 py-3 font-mono">
                      <span className="text-white">${product.basePrice?.toFixed(2)}</span>
                      {product.salePrice && (
                        <span className="text-xs text-primary ml-2">${product.salePrice.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <span className={cn(
                        "font-mono font-medium",
                        (product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0) < 10 
                          ? 'text-amber-400' : 'text-text-secondary'
                      )}>
                        {product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(product)}
                        className="transition-colors"
                      >
                        <Badge variant={product.isActive ? 'success' : 'secondary'}>
                          {product.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditModal(product)} className="p-2 hover:bg-primary/20 rounded-lg text-text-muted hover:text-primary transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-text-muted hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-text-secondary">Mostrando {products.length} de {pagination.totalElements}</p>
            <div className="flex gap-2">
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => fetchProducts(i)}
                  className={cn(
                    "w-10 h-10 rounded-xl text-sm font-medium transition-colors",
                    pagination.page === i 
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30' 
                      : 'hover:bg-surface-elevated text-text-secondary'
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-surface rounded-2xl border border-border p-4">
                  <Skeleton className="h-40 w-full rounded-xl mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-border p-16 text-center">
              <div className="w-20 h-20 bg-surface-elevated rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-text-muted" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No hay productos</h3>
              <p className="text-text-secondary mb-6">¡Crea el primero para comenzar!</p>
              <button onClick={openCreateModal} className="btn bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                <Plus className="w-4 h-4" />
                Crear Producto
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <>
                {products.map((product, index) => {
                  const totalStock = getTotalStock(product);
                  const stockConfig = getStockConfig(totalStock);
                  const mainImage = product.images?.[0]?.url;
                  
                  return (
                    <div
                      key={product.id}
                      className="bg-surface rounded-2xl border border-border overflow-hidden hover:border-primary/60 hover:shadow-[0_0_20px_rgba(198,42,185,0.15)] hover:shadow-primary/20 group cursor-pointer transition-colors duration-200"
                    >
                      {/* Image */}
                      <div className="relative aspect-square bg-surface-elevated overflow-hidden">
                        {mainImage ? (
                          <img src={mainImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-16 h-16 text-text-muted" />
                          </div>
                        )}
                        {/* Stock Badge */}
                        <div className={cn(
                          "absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 transition-colors duration-150",
                          stockConfig.color
                        )}>
                          <stockConfig.icon className="w-3 h-3" />
                          {totalStock}
                        </div>
                        {/* Active Badge */}
                        {!product.isActive && (
                          <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/80 text-white transition-colors duration-150">
                            Inactivo
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-white text-sm truncate mb-1">{product.name}</h3>
                        <p className="text-xs text-text-muted mb-3">{product.category?.name || 'Sin categoría'}</p>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold text-white font-mono">
                              ${product.basePrice?.toFixed(2)}
                            </span>
                            {product.salePrice && (
                              <span className="text-xs text-primary ml-2 line-through">
                                ${product.salePrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                          <button 
                            onClick={() => openEditModal(product)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-surface-elevated hover:bg-primary/30 border border-border hover:border-primary/60 rounded-lg text-white text-xs font-medium transition-colors duration-150"
                          >
                            <Edit className="w-3 h-3" />
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-2 hover:bg-red-500/30 border border-border hover:border-red-500/40 rounded-lg text-text-muted hover:text-red-400 transition-colors duration-150"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            </div>
          )}
        </div>
      )}

      {/* Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto border border-border">
            <div className="sticky top-0 bg-surface-elevated border-b border-border p-5 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-white">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold mb-3 text-white flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm">1</span>
                  Información Básica
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium mb-1 text-text-secondary">Nombre *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        name: e.target.value,
                        slug: editingProduct ? formData.slug : generateSlug(e.target.value)
                      })}
                      className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-white text-sm placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium mb-1 text-text-secondary">Slug</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-white text-sm placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                      placeholder="auto-generado"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium mb-1 text-text-secondary">Descripción Corta</label>
                    <input
                      type="text"
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-white text-sm placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium mb-1 text-text-secondary">Descripción</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-white text-sm placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-text-secondary">Categoría</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="font-semibold mb-3 text-white flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm">2</span>
                  Precios
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-text-secondary">Precio Base *</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="0.00"
                      required
                    />
                    {fieldErrors.basePrice && <p className="text-red-400 text-xs mt-1">{fieldErrors.basePrice}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-text-secondary">Precio de Oferta</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Opcional"
                    />
                  </div>
                </div>
              </div>

              {/* Variants (Tallas y Stock) */}
              <div>
                <h3 className="font-semibold mb-3 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm">3</span>
                    Tallas y Stock
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        variants: [...prev.variants, { size: '', color: '', colorHex: '#000000', stock: '', sku: '' }]
                      }));
                    }}
                    className="flex items-center gap-1 text-sm text-primary hover:text-primary-400"
                  >
                    <Plus className="w-4 h-4" /> Agregar Talla
                  </button>
                </h3>
                
                {fieldErrors.variants && <p className="text-red-400 text-sm mb-4">{fieldErrors.variants}</p>}
                
                {formData.variants.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-border rounded-lg bg-surface-elevated/30">
                    <p className="text-sm text-text-muted mb-2">No has agregado ninguna talla.</p>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, variants: [{ size: 'Único', color: 'Default', colorHex: '#000000', stock: '0', sku: '' }] }))}
                      className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/30 transition-colors"
                    >
                      Añadir talla por defecto
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.variants.map((variant, index) => (
                      <div key={index} className={`flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-surface-elevated p-3 rounded-xl border relative transition-all duration-300 ${variant.isActive === false ? 'border-amber-500/30 opacity-60 bg-surface-elevated/50' : 'border-border'}`}>
                        {/* Overlay to indicate it's disabled without taking up space */}
                        {!variant.isActive && (
                          <div className="absolute inset-x-0 inset-y-0 rounded-xl bg-surface/50 pointer-events-none z-10" />
                        )}
                        <div className="flex-1">
                          <label className="block text-xs text-text-secondary mb-1">Talla (ej. XS, S, M, Único)</label>
                          <input
                            type="text"
                            value={variant.size}
                            onChange={(e) => {
                              const newVariants = [...formData.variants];
                              newVariants[index].size = e.target.value;
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Talla"
                          />
                          {fieldErrors[`variant_${index}_size`] && <span className="text-red-400 text-xs mt-0.5 block">{fieldErrors[`variant_${index}_size`]}</span>}
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-text-secondary mb-1">Stock</label>
                          <input
                            type="number"
                            min="0"
                            value={variant.stock}
                            onChange={(e) => {
                              const newVariants = [...formData.variants];
                              newVariants[index].stock = e.target.value;
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="0"
                          />
                          {fieldErrors[`variant_${index}_stock`] && <span className="text-red-400 text-xs mt-0.5 block">{fieldErrors[`variant_${index}_stock`]}</span>}
                        </div>

                        {/* Colores */}
                        <div className="flex-1">
                          <label className="block text-xs text-text-secondary mb-1">Color (Nombre)</label>
                          <input
                            type="text"
                            value={variant.color}
                            onChange={(e) => {
                              const newVariants = [...formData.variants];
                              newVariants[index].color = e.target.value;
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Ej. Negro"
                          />
                        </div>
                        <div className="w-16">
                          <label className="block text-xs text-text-secondary mb-1">Color</label>
                          <input
                            type="color"
                            value={variant.colorHex || '#000000'}
                            onChange={(e) => {
                              const newVariants = [...formData.variants];
                              newVariants[index].colorHex = e.target.value;
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="w-full h-9 bg-surface border border-border rounded-lg cursor-pointer"
                          />
                        </div>

                        <div className="flex-1">
                          <label className="block text-xs text-text-secondary mb-1">SKU (Opcional)</label>
                          <input
                            type="text"
                            value={variant.sku}
                            onChange={(e) => {
                              const newVariants = [...formData.variants];
                              newVariants[index].sku = e.target.value;
                              setFormData({ ...formData, variants: newVariants });
                            }}
                            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                            placeholder="Auto-generado"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newVariants = [...formData.variants];
                            newVariants[index].isActive = !newVariants[index].isActive;
                            setFormData({ ...formData, variants: newVariants });
                          }}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 mt-0 sm:mt-5 rounded-lg text-xs font-medium transition-all duration-200 z-20 ${
                            variant.isActive 
                              ? 'text-text-muted hover:text-amber-400 hover:bg-amber-400/10 border border-transparent hover:border-amber-400/20'
                              : 'text-green-400 bg-green-400/10 hover:bg-green-400/20 shadow-sm shadow-green-500/10 border border-green-400/30'
                          }`}
                          title={variant.isActive ? 'Ocultar talla' : 'Activar talla'}
                        >
                          {variant.isActive ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Activar</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Shipping Dimensions */}
              <div>
                <h3 className="font-semibold mb-3 text-white flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 text-sm">4</span>
                  <Box className="w-4 h-4 text-amber-400" />
                  Dimensiones de Envío
                </h3>
                <p className="text-xs text-text-muted mb-3">
                  Ingresa el peso y dimensiones del producto para calcular el costo de envío correctamente.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-text-secondary">Peso (kg)</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={formData.weightKg}
                      onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                      placeholder="0.350"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-text-secondary">Largo (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.lengthCm}
                      onChange={(e) => setFormData({ ...formData, lengthCm: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-text-secondary">Ancho (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.widthCm}
                      onChange={(e) => setFormData({ ...formData, widthCm: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                      placeholder="25"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-text-secondary">Alto (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.heightCm}
                      onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <h3 className="font-semibold mb-3 text-white flex items-center gap-2">
                <span className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm">5</span>
                  Imagen del Producto
                </h3>
                <div className="border-2 border-dashed border-border rounded-xl p-4 bg-surface-elevated/30">
                  {uploading ? (
                    <div className="flex flex-col items-center py-4">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                      <span className="text-sm text-text-secondary">Subiendo imagen...</span>
                    </div>
                  ) : formData.imageUrl ? (
                    <div className="flex items-center gap-4">
                      <img src={formData.imageUrl} alt="Preview" className="w-24 h-24 object-cover rounded-xl border border-border" />
                      <div className="flex-1">
                        <p className="text-sm text-text-secondary truncate">{formData.imageName || 'Imagen subida'}</p>
                        <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          Subida a Cloudinary
                        </p>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: '', imageName: '' })}
                          className="text-sm text-red-400 hover:text-red-300 mt-2"
                        >
                          Eliminar imagen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer">
                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                        <Upload className="w-8 h-8 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-white">Subir imagen</span>
                      <span className="text-xs text-text-muted mt-1">PNG, JPG hasta 10MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploading(true);
                            try {
                              const response = await uploadApi.productImage(file);
                              setFormData({
                                ...formData,
                                imageUrl: response.data.url,
                                imageName: file.name,
                              });
                            } catch (error) {
                              console.error('Error uploading image:', error);
                              alert('Error al subir la imagen');
                            } finally {
                              setUploading(false);
                            }
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-2">O ingresa una URL directamente:</p>
                <input
                  type="url"
                  value={formData.imageUrl || ''}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 mt-2 bg-surface-elevated border border-border rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>

              {/* Options */}
              <div>
                <h3 className="font-semibold mb-3 text-white flex items-center gap-2">
                <span className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm">6</span>
                  Opciones
                </h3>
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: 'isActive', label: 'Activo' },
                    { key: 'isFeatured', label: 'Destacado' },
                    { key: 'isNew', label: 'Nuevo' },
                  ].map(opt => (
                    <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData[opt.key]}
                        onChange={(e) => setFormData({ ...formData, [opt.key]: e.target.checked })}
                        className="w-4 h-4 rounded border-border bg-surface-elevated text-primary focus:ring-1 focus:ring-primary focus:ring-offset-0"
                      />
                      <span className="text-sm text-text-secondary">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-border">
                <button type="submit" disabled={saving} className="btn bg-gradient-to-r from-primary-500 to-primary-600 text-white flex-1 shadow-lg shadow-primary-500/30 disabled:opacity-50 py-2">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="btn bg-surface-elevated text-text-secondary hover:bg-border hover:text-white border border-border"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
