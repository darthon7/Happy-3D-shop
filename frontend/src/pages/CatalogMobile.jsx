import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Search, X, ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal, Trash2 } from 'lucide-react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../components/ui';
import { productsApi, categoriesApi } from '../api';
import { EmptySearchIllustration } from '../components/ui/EmptySearchIllustration';

/* ─── Compact product card (mobile-only, rediseñada) ─── */
const CompactProductCard = ({ product }) => {
  const imageUrl = product.mainImageUrl || product.images?.find(i => i.isMain)?.url || product.images?.[0]?.url;
  const hasDiscount = product.salePrice && product.salePrice < product.basePrice;
  const discountPct = hasDiscount ? Math.round((1 - product.salePrice / product.basePrice) * 100) : 0;
  const currentPrice = hasDiscount ? product.salePrice : product.basePrice;

  return (
    <Link to={`/producto/${product.slug}`} className="flex flex-col group relative">
      {/* Contenedor de Imagen con Glassmorphism */}
      <div className="relative aspect-[3/4] w-full bg-surface border border-border overflow-hidden rounded-2xl mb-2 sm:mb-3 shadow-lg group-hover:shadow-primary/10 transition-shadow">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-background-dark/50 text-text-secondary text-xs">
            Sin imagen
          </div>
        )}
        
        {/* Overlay sutil para mejorar contraste del badge */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent pointer-events-none" />

        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full border border-red-500/20 shadow-lg flex items-center gap-0.5">
            <span>-{discountPct}%</span>
          </div>
        )}
      </div>

      {/* Info mejorada tipográficamente */}
      <div className="px-1 flex flex-col flex-1">
        <h3 className="text-text-secondary text-xs sm:text-sm font-medium line-clamp-2 leading-snug mb-1.5 min-h-[2rem]">
          {product.name}
        </h3>
        <div className="mt-auto flex items-baseline gap-2 flex-wrap">
          <span className="text-white font-bold text-sm sm:text-base tracking-tight">
            ${currentPrice?.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-gray-500 text-[10px] sm:text-xs line-through decoration-gray-500/50">
              ${product.basePrice?.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

/* ─── Main component ─── */
const CatalogMobile = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [isScrolled, setIsScrolled] = useState(false);

  /* State */
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState('categories'); // 'categories' | 'price'
  
  const searchInputRef = useRef(null);

  const [pagination, setPagination] = useState({ page: 0, size: 20, totalElements: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    categoryId: null,
    minPrice: '',
    maxPrice: '',
    sort: '',
  });
  const [pendingFilters, setPendingFilters] = useState({ categoryId: null, minPrice: '', maxPrice: '' });
  const [debouncedMin, setDebouncedMin] = useState('');
  const [debouncedMax, setDebouncedMax] = useState('');
  const [filterResetKey, setFilterResetKey] = useState(0);

  /* Scroll event listener para el header */
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* Debounce prices */
  useEffect(() => { const t = setTimeout(() => setDebouncedMin(filters.minPrice), 500); return () => clearTimeout(t); }, [filters.minPrice]);
  useEffect(() => { const t = setTimeout(() => setDebouncedMax(filters.maxPrice), 500); return () => clearTimeout(t); }, [filters.maxPrice]);

  /* Fetch categories */
  useEffect(() => {
    categoriesApi.getAll().then(r => setCategories(r.data || [])).catch(console.error);
  }, []);

  /* Sync slug → categoryId */
  useEffect(() => {
    if (slug && categories.length > 0) {
      const cat = categories.find(c => c.slug === slug);
      if (cat && filters.categoryId !== cat.id) {
        setFilters(prev => ({ ...prev, categoryId: cat.id }));
        setPendingFilters(prev => ({ ...prev, categoryId: cat.id }));
      }
    } else if (!slug && filters.categoryId) {
        // Reset category if slug is removed indicating viewing all
        setFilters(prev => ({ ...prev, categoryId: null }));
        setPendingFilters(prev => ({ ...prev, categoryId: null }));
    }
  }, [slug, categories]);

  /* Sort param helpers */
  const getSortParams = (s) => {
    switch (s) {
      case 'price_asc':  return { sortBy: 'currentPrice', sortDir: 'asc' };
      case 'price_desc': return { sortBy: 'currentPrice', sortDir: 'desc' };
      case 'name_asc':   return { sortBy: 'name',         sortDir: 'asc'  };
      case 'newest':     return { sortBy: 'createdAt',    sortDir: 'desc' };
      default:           return {};
    }
  };

  /* Fetch products — stale-response guard */
  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      pagination.page > 0 ? setLoadingMore(true) : setLoading(true);
      try {
        const { sortBy, sortDir } = getSortParams(filters.sort);
        const params = { page: pagination.page, size: pagination.size };
        if (sortBy) {
          params.sortBy = sortBy;
          params.sortDir = sortDir;
        }
        if (debouncedMin) params.minPrice = parseFloat(debouncedMin);
        if (debouncedMax) params.maxPrice = parseFloat(debouncedMax);
        if (filters.categoryId) params.categoryId = filters.categoryId;

        const query = searchParams.get('q');
        let response;
        if (query) {
          response = await productsApi.search(query, params);
        } else {
          response = await productsApi.getWithFilters(params);
        }

        if (cancelled) return;

        const data = response.data;
        setProducts(prev => pagination.page === 0 ? (data.content || []) : [...prev, ...(data.content || [])]);
        setPagination(prev => ({ ...prev, totalElements: data.totalElements || 0, totalPages: data.totalPages || 0 }));
      } catch (e) {
        if (!cancelled) console.error('Error fetching products:', e);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };
    fetchProducts();

    return () => { cancelled = true; };
  }, [searchParams, pagination.page, filters.categoryId, debouncedMin, debouncedMax, filters.sort, filterResetKey]);

  /* Handlers */
  const handleCategoryChange = useCallback((catId, catSlug) => {
    setFilters(prev => ({ ...prev, categoryId: catId }));
    setPendingFilters(prev => ({ ...prev, categoryId: catId }));
    setPagination(prev => ({ ...prev, page: 0 }));
    setProducts([]);
    setFilterResetKey(k => k + 1);
    
    if (catId && catSlug) {
      navigate(`/categoria/${catSlug}`, { replace: true });
    } else {
      navigate('/catalogo', { replace: true });
    }
  }, [navigate]);

  const applyFilters = useCallback(() => {
    setFilters(prev => ({ 
      ...prev, 
      minPrice: pendingFilters.minPrice, 
      maxPrice: pendingFilters.maxPrice 
    }));
    setPagination(prev => ({ ...prev, page: 0 }));
    setProducts([]);
    setShowFilters(false);
  }, [pendingFilters]);

  const clearFilters = useCallback(() => {
    const clean = { minPrice: '', maxPrice: '' };
    setFilters(prev => ({ ...prev, ...clean, sort: '' }));
    setPendingFilters(prev => ({...prev, ...clean}));
    setPagination(prev => ({ ...prev, page: 0 }));
    setProducts([]);
    setShowFilters(false);
  }, []);

  const clearAllFiltersAndSearch = useCallback(() => {
       const clean = { minPrice: '', maxPrice: '', categoryId: null };
       setFilters(prev => ({ ...prev, ...clean, sort: '' }));
       setPendingFilters(clean);
       setPagination(prev => ({ ...prev, page: 0 }));
       setProducts([]);
       setShowFilters(false);
       navigate('/catalogo');
  }, [navigate]);


  const setSort = useCallback((val) => {
    setFilters(prev => ({ ...prev, sort: val }));
    setPagination(prev => ({ ...prev, page: 0 }));
    setProducts([]);
    setFilterResetKey(k => k + 1);
  }, []);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.minPrice) n++;
    if (filters.maxPrice) n++;
    return n;
  }, [filters]);

  /* Sort chip definitions */
  const sortChips = [
    { value: 'newest',     label: 'Novedades',   Icon: null },
    { value: 'price_asc',  label: 'Menor precio',      Icon: ArrowUp },
    { value: 'price_desc', label: 'Mayor precio',      Icon: ArrowDown },
    { value: 'name_asc',   label: 'A-Z',         Icon: null },
  ];

  return (
    <div className="min-h-screen bg-background-dark flex flex-col pb-20">
      {/* ── Sticky header renovado ── */}
      <header 
        className={`sticky top-14 z-30 transition-all duration-300 pt-2 ${
            isScrolled 
            ? 'bg-background-dark/95 backdrop-blur-xl border-b border-border shadow-md' 
            : 'bg-background-dark border-b border-transparent'
        }`}
      >
        {/* Action Row: Filtros y Orden */}
        <div className="px-4 pb-3 flex items-center gap-3">
            <button 
                onClick={() => setShowFilters(true)}
                className={`py-2 px-4 rounded-full flex items-center gap-2 text-xs font-bold transition-all ${
                    activeFilterCount > 0 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-surface border border-border text-white hover:bg-surface-elevated'
                }`}
            >
                <SlidersHorizontal className="w-4 h-4" />
                Filtrar
                {activeFilterCount > 0 && (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white text-primary text-[10px] ml-1">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {/* Scrollable Sort Chips */}
            <div className="flex-1 overflow-x-auto scrollbar-hide flex gap-2 pl-1 pr-4 py-1 -mr-4">
                {sortChips.map(chip => {
                    const isActive = filters.sort === chip.value;
                    return (
                    <button
                        key={chip.value}
                        onClick={() => setSort(chip.value)}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all ${
                        isActive
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'bg-transparent border-border text-text-secondary hover:text-white'
                        }`}
                    >
                        {chip.label}
                        {chip.Icon && <chip.Icon className="w-3.5 h-3.5" />}
                    </button>
                    );
                })}
            </div>
        </div>
        
        {/* Scrollable Category Indicator Line (Decorative) */}
        {!isScrolled && (
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-border to-transparent" />
        )}
      </header>

      {/* ── Categorías horizontales con estilo pill ── */}
      <div className="px-0 py-4 bg-background-dark/50">
        <div className="flex overflow-x-auto scrollbar-hide px-4 gap-2.5 pb-2">
            <button
                onClick={() => handleCategoryChange(null, null)}
                className={`flex-shrink-0 px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                !filters.categoryId 
                    ? 'bg-white text-[#2C1F0E]' 
                    : 'bg-surface border border-border text-text-secondary hover:text-white'
                }`}
            >
                Todos
            </button>
            {categories.map(cat => (
                <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id, cat.slug)}
                className={`flex-shrink-0 px-5 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                    filters.categoryId === cat.id 
                    ? 'bg-white text-[#2C1F0E]' 
                    : 'bg-surface border border-border text-text-secondary hover:text-white'
                }`}
                >
                {cat.name}
                </button>
            ))}
        </div>
      </div>



      {/* ── Product grid ── */}
      <main className="flex-1 px-4 pt-2 -mt-2 relative z-0">
        {loading && pagination.page === 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton.Card key={i} showImage className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <motion.div 
                className="grid grid-cols-2 gap-3 sm:gap-4"
                initial="hidden"
                animate="visible"
                variants={{
                    visible: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.05 } }
                }}
            >
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
                  }}
                  style={{ willChange: 'transform, opacity' }}
                >
                  <CompactProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>

            {/* Load more */}
            {pagination.page < pagination.totalPages - 1 && (
              <div className="flex justify-center mt-10 mb-6">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={loadingMore}
                  className="px-8 py-3.5 rounded-full border border-border bg-surface text-white text-sm font-bold hover:border-primary disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
                >
                  {loadingMore ? (
                      <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                  ) : null}
                  {loadingMore ? 'Cargando...' : 'Ver más productos'}
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptySearchIllustration />
        )}
      </main>

      {/* ── Filters bottom sheet (Modernized) ── */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
                onClick={() => setShowFilters(false)} 
            />

            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-background border-t border-border rounded-t-[2.5rem] flex flex-col shadow-2xl"
              style={{ maxHeight: '85vh', paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              {/* Drag Handle & Header */}
              <div className="flex flex-col items-center pt-3 pb-4 border-b border-border px-6 relative">
                <div className="w-12 h-1.5 bg-border rounded-full mb-4" />
                <h3 className="text-xl font-black text-white w-full text-center">Filtros</h3>
                <button 
                    onClick={() => setShowFilters(false)} 
                    className="absolute top-6 right-6 p-2 rounded-full bg-surface-elevated text-text-secondary hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido de Filtros - Single Column para móvil */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                
                {/* Categoría (solo si no estamos en una categoría en la url) */}
                {!slug && (
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Categoría</h4>
                         <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setPendingFilters(prev => ({ ...prev, categoryId: null }))}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                            !pendingFilters.categoryId
                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                : 'bg-surface border-border text-text-secondary hover:text-white'
                            }`}
                        >
                            Todas
                        </button>
                        {categories.map(cat => (
                            <button
                            key={cat.id}
                            onClick={() => setPendingFilters(prev => ({ ...prev, categoryId: cat.id }))}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                                pendingFilters.categoryId === cat.id
                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                : 'bg-surface border-border text-text-secondary hover:text-white'
                            }`}
                            >
                            {cat.name}
                            </button>
                        ))}
                        </div>
                    </div>
                )}

                {/* Separador */}
                {!slug && <div className="h-[1px] w-full bg-border" />}

                {/* Precio */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Rango de Precio</h4>
                        {(pendingFilters.minPrice || pendingFilters.maxPrice) && (
                             <button
                                onClick={() => setPendingFilters(prev => ({...prev, minPrice: '', maxPrice: ''}))}
                                className="text-xs text-primary font-semibold hover:underline"
                             >
                                Limpiar precio
                             </button>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <label className="text-[10px] text-gray-500 font-medium mb-1 block ml-1">MÍNIMO</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold group-focus-within:text-white transition-colors">$</span>
                            <input
                                type="number"
                                placeholder="0"
                                value={pendingFilters.minPrice}
                                onChange={e => setPendingFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                                className="w-full bg-surface border border-border rounded-xl py-3.5 pl-8 pr-4 text-sm font-bold text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                    
                    <div className="relative flex-1">
                        <label className="text-[10px] text-gray-500 font-medium mb-1 block ml-1">MÁXIMO</label>
                         <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-bold group-focus-within:text-white transition-colors">$</span>
                            <input
                                type="number"
                                placeholder="Any"
                                value={pendingFilters.maxPrice}
                                onChange={e => setPendingFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                                className="w-full bg-surface border border-border rounded-xl py-3.5 pl-8 pr-4 text-sm font-bold text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                    </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-border bg-background-dark/50 backdrop-blur-md pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex gap-3">
                <button
                  onClick={clearFilters}
                  className="px-6 py-4 bg-surface hover:bg-surface-elevated text-white rounded-2xl font-bold text-sm transition-colors flex items-center justify-center border border-border"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-1 py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                >
                  Mostrar resultados
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CatalogMobile;
