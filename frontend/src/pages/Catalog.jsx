import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Filter, X, SearchX } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import { Skeleton } from '../components/ui';
import { productsApi } from '../api';
import { useIsMobile } from '../hooks/useIsMobile';
import { useCategoryStore } from '../stores';

const Catalog = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [products, setProducts] = useState([]);
  const categories = useCategoryStore(s => s.categories);
  const fetchCategories = useCategoryStore(s => s.fetchCategories);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 12,
    totalElements: 0,
    totalPages: 0,
  });
  
  const [filters, setFilters] = useState({
    categoryId: null,
    minPrice: '',
    maxPrice: '',
    sort: '',
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const getSortParams = (sortValue) => {
    switch (sortValue) {
      case 'price_asc':
        return { sortBy: 'currentPrice', sortDir: 'asc' };
      case 'price_desc':
        return { sortBy: 'currentPrice', sortDir: 'desc' };
      case 'name_asc':
        return { sortBy: 'name', sortDir: 'asc' };
      case 'newest':
        return { sortBy: 'createdAt', sortDir: 'desc' };
      default:
        return {};
    }
  };

  const [debouncedMinPrice, setDebouncedMinPrice] = useState('');
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMinPrice(filters.minPrice);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.minPrice]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMaxPrice(filters.maxPrice);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.maxPrice]);

  const activeFilters = useMemo(() => {
    const filtersList = [];
    if (filters.categoryId) {
      const cat = categories.find(c => c.id === filters.categoryId);
      if (cat) filtersList.push({ type: 'category', label: cat.name, key: 'categoryId', value: null });
    }
    if (filters.minPrice) {
      filtersList.push({ type: 'price', label: `$${filters.minPrice}+`, key: 'minPrice', value: '' });
    }
    if (filters.maxPrice) {
      filtersList.push({ type: 'price', label: `<=$${filters.maxPrice}`, key: 'maxPrice', value: '' });
    }
    return filtersList;
  }, [filters, categories]);

  const removeFilter = useCallback((filter) => {
    if (filter.key === 'categoryId') {
      handleCategoryChange(null, null);
    } else {
      handleFilterChange(filter.key, filter.value);
    }
  }, [categories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (slug && categories.length > 0) {
      const category = categories.find(c => c.slug === slug);
      if (category && filters.categoryId !== category.id) {
        setFilters(prev => ({ ...prev, categoryId: category.id }));
      }
    }
  }, [slug, categories]);

  useEffect(() => {
    const abortController = new AbortController();
    let cancelled = false;

    const fetchProducts = async () => {
      if (pagination.page > 0) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      try {
        const { sortBy, sortDir } = getSortParams(filters.sort);
        const params = {
          page: pagination.page,
          size: pagination.size,
        };
        if (sortBy) {
          params.sortBy = sortBy;
          params.sortDir = sortDir;
        }
        
        if (debouncedMinPrice) params.minPrice = parseFloat(debouncedMinPrice);
        if (debouncedMaxPrice) params.maxPrice = parseFloat(debouncedMaxPrice);
        
        if (filters.categoryId) params.categoryId = filters.categoryId;
        
        let response;
        const query = searchParams.get('q');
        
        if (query) {
          response = await productsApi.search(query, params);
        } else {
          response = await productsApi.getWithFilters(params);
        }
        
        if (cancelled) return;

        const data = response.data;
        if (pagination.page === 0) {
          setProducts(data.content || []);
        } else {
          setProducts(prev => [...prev, ...(data.content || [])]);
        }
        
        setPagination(prev => ({
          ...prev,
          totalElements: data.totalElements || 0,
          totalPages: data.totalPages || 0,
        }));
      } catch (error) {
        if (error.name === 'CanceledError' || error.name === 'AbortError') return;
        if (!cancelled) console.error('Error fetching products:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };
    
    fetchProducts();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [searchParams, pagination.page, filters.categoryId, debouncedMinPrice, debouncedMaxPrice, filters.sort]);
  
  const handleCategoryChange = (categoryId, categorySlug) => {
    setFilters(prev => ({ ...prev, categoryId }));
    setPagination(prev => ({ ...prev, page: 0 }));
    setProducts([]);
    
    if (categoryId && categorySlug) {
      navigate(`/categoria/${categorySlug}`);
    } else {
      navigate('/catalogo');
    }
    setShowMobileFilters(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = useCallback(() => {
    setPagination(prev => ({ ...prev, page: 0 }));
    setProducts([]);
    setShowMobileFilters(false);
  }, []);
  
  const handleLoadMore = () => {
    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
  };
  
  const clearFilters = () => {
    setFilters({
      categoryId: null,
      minPrice: '',
      maxPrice: '',
      sort: '',
    });
    setPagination(prev => ({ ...prev, page: 0 }));
    setProducts([]);
    navigate('/catalogo');
  };
  
  const getTitle = () => {
    const query = searchParams.get('q');
    if (query) return `Resultados para "${query}"`;
    if (filters.categoryId) {
      const category = categories.find(c => c.id === filters.categoryId);
      return category?.name || 'Categoría';
    }
    return 'Catálogo';
  };

  return (
    <div className="min-h-screen bg-white text-header font-sans">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="sticky top-28">
              <h2 className="text-lg font-bold mb-6 text-header uppercase tracking-wider">Categorías</h2>
              <div className="space-y-6">
                {/* Category Filter */}
                <section>
                  <h3 className="text-sm font-semibold text-header/60 mb-3 uppercase">Tipo</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={!filters.categoryId}
                        onChange={() => handleCategoryChange(null, null)}
                        className="rounded border-gray-300 text-brand focus:ring-brand"
                      />
                      <label className="text-sm cursor-pointer" onClick={() => handleCategoryChange(null, null)}>Todos</label>
                    </li>
                    {categories.map(category => (
                      <li key={category.id} className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={filters.categoryId === category.id}
                          onChange={() => handleCategoryChange(category.id, category.slug)}
                          className="rounded border-gray-300 text-brand focus:ring-brand"
                        />
                        <label className="text-sm cursor-pointer" onClick={() => handleCategoryChange(category.id, category.slug)}>{category.name}</label>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Price Range Filter */}
                <section>
                  <h3 className="text-sm font-semibold text-header/60 mb-3 uppercase">Precio</h3>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:border-brand"
                      />
                      <input 
                        type="number" 
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                </section>

                {/* Clear Filters */}
                {activeFilters.length > 0 && (
                  <button 
                    onClick={clearFilters}
                    className="text-sm text-brand hover:text-brand-dark font-medium"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <section className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-medium text-header">
                {loading ? 'Cargando...' : `Mostrando ${products.length} resultados`}
              </h2>
              <div className="flex items-center gap-2">
                <label className="text-sm text-header/60">Ordenar por:</label>
                <select 
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="border-0 bg-transparent text-sm font-semibold focus:ring-0 cursor-pointer text-header"
                >
                  <option value="">Más recientes</option>
                  <option value="price_asc">Precio: Menor a Mayor</option>
                  <option value="price_desc">Precio: Mayor a Menor</option>
                  <option value="name_asc">Nombre: A-Z</option>
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {activeFilters.map((filter, i) => (
                  <span 
                    key={i}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-brand/10 text-brand text-sm rounded-full"
                  >
                    {filter.label}
                    <button onClick={() => removeFilter(filter)} className="hover:text-brand-dark">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-[8px] overflow-hidden">
                    <div className="aspect-square bg-gray-100 animate-pulse" />
                    <div className="p-5">
                      <div className="h-3 bg-gray-100 rounded w-1/3 mb-2" />
                      <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <SearchX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-header mb-2">No se encontraron productos</h3>
                <p className="text-gray-500 mb-6">Intenta con otros filtros o términos de búsqueda</p>
                <button 
                  onClick={clearFilters}
                  className="bg-brand text-white px-6 py-3 rounded-[8px] font-semibold hover:bg-brand-dark transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Load More */}
            {!loading && products.length > 0 && pagination.page < pagination.totalPages - 1 && (
              <div className="mt-12 text-center">
                <button 
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="bg-brand text-white px-8 py-3 rounded-[8px] font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Cargando...' : 'Cargar más'}
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Catalog;
