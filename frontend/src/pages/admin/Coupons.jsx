import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Ticket, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge, Skeleton } from '../../components/ui';
import api from '../../api';
import { validateField } from '../../lib/validation';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minPurchase: '',
    maxUses: '',
    expiresAt: '',
    isActive: true,
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/coupons');
      setCoupons(response.data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const errors = {};
    const codeResult = validateField(formData.code, 'couponCode');
    const valueResult = validateField(formData.discountValue, 'positiveNumber');
    
    if (!codeResult.isValid) errors.code = codeResult.error;
    if (!valueResult.isValid) errors.discountValue = valueResult.error;
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    try {
      const data = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : null,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
      };
      
      if (editingCoupon) {
        await api.put(`/admin/coupons/${editingCoupon.id}`, data);
      } else {
        await api.post('/admin/coupons', data);
      }
      setShowModal(false);
      fetchCoupons();
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este cupón?')) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      fetchCoupons();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const toggleActive = async (coupon) => {
    try {
      await api.put(`/admin/coupons/${coupon.id}`, {
        ...coupon,
        isActive: !coupon.isActive,
      });
      fetchCoupons();
    } catch (error) {
      console.error('Error toggling coupon:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '', description: '', discountType: 'PERCENTAGE',
      discountValue: '', minPurchase: '', maxUses: '', expiresAt: '', isActive: true,
    });
    setEditingCoupon(null);
  };

  const openEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchase: coupon.minPurchase || '',
      maxUses: coupon.maxUses || '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
      isActive: coupon.isActive,
    });
    setShowModal(true);
  };

  return (
    <div className="p-4 lg:p-8 bg-background-dark min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Cupones</h1>
          <p className="text-text-secondary">{coupons.length} cupones</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/30"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cupón
        </button>
      </div>
      
      {/* Coupons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl p-6 border border-border">
              <Skeleton className="h-6 w-1/2 mb-4" />
              <Skeleton className="h-10 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))
        ) : coupons.length === 0 ? (
          <div className="col-span-full bg-surface rounded-2xl p-16 text-center border border-border">
            <div className="w-20 h-20 bg-surface-elevated rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-10 h-10 text-text-muted" />
            </div>
            <p className="text-text-secondary mb-4">No hay cupones. Crea el primero.</p>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="btn bg-gradient-to-r from-primary-500 to-primary-600 text-white"
            >
              <Plus className="w-4 h-4" />
              Crear Cupón
            </button>
          </div>
        ) : (
          coupons.map((coupon) => (
            <div 
              key={coupon.id} 
              className="bg-surface rounded-2xl p-6 border-2 border-dashed border-border hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="font-mono text-lg font-bold text-white bg-primary/20 px-3 py-1 rounded-lg">{coupon.code}</span>
                  <p className="text-sm text-text-secondary mt-2 line-clamp-1">{coupon.description}</p>
                </div>
                <button
                  onClick={() => toggleActive(coupon)}
                  className={cn(
                    "transition-colors",
                    coupon.isActive ? 'text-green-400 hover:text-green-300' : 'text-text-muted hover:text-text-secondary'
                  )}
                >
                  {coupon.isActive ? (
                    <ToggleRight className="w-7 h-7" />
                  ) : (
                    <ToggleLeft className="w-7 h-7" />
                  )}
                </button>
              </div>
              
              <div className="text-4xl font-bold mb-4">
                <span className="text-primary">
                  {coupon.discountType === 'PERCENTAGE' 
                    ? `${coupon.discountValue}%`
                    : `$${coupon.discountValue}`
                  }
                </span>
                <span className="text-sm font-normal text-text-secondary ml-2">descuento</span>
              </div>
              
              <div className="space-y-2 text-sm text-text-secondary mb-4">
                {coupon.minPurchase && (
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Compra mínima: ${coupon.minPurchase}
                  </p>
                )}
                {coupon.maxUses && (
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Usos: {coupon.usedCount || 0} / {coupon.maxUses}
                  </p>
                )}
                {coupon.expiresAt && (
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Expira: {new Date(coupon.expiresAt).toLocaleDateString('es-MX')}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2 pt-4 border-t border-border">
                <button
                  onClick={() => openEdit(coupon)}
                  className="btn bg-surface-elevated text-primary hover:bg-primary/20 flex-1 text-sm border border-border"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(coupon.id)}
                  className="btn bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm px-4 border border-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md border border-border overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface-elevated border-b border-border p-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingCoupon ? 'Editar Cupón' : 'Nuevo Cupón'}
              </h2>
              <button 
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary">Código</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="VERANO20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary">Descripción</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Descuento de verano"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Tipo</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="PERCENTAGE">Porcentaje</option>
                    <option value="FIXED">Monto fijo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Valor</label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={formData.discountType === 'PERCENTAGE' ? '20' : '100'}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Compra Mínima</label>
                  <input
                    type="number"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-secondary">Usos Máximos</label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary">Fecha de Expiración</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn bg-gradient-to-r from-primary-500 to-primary-600 text-white flex-1 shadow-lg shadow-primary-500/30">
                  {editingCoupon ? 'Guardar' : 'Crear Cupón'}
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

export default AdminCoupons;
