import { useState, useEffect } from 'react';
import { Loader2, Upload, Plus, Edit, Trash2, FolderTree, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge, Skeleton } from '../../components/ui';
import api, { uploadApi } from '../../api';
import { validateField } from '../../lib/validation';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: null,
    isActive: true,
    imageUrl: '',
  });
  const [uploading, setUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate name field
    const nameResult = validateField(formData.name, 'name');
    const errors = {};
    if (!nameResult.isValid) errors.name = nameResult.error;
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    try {
      if (editingCategory) {
        await api.put(`/admin/categories/${editingCategory.id}`, formData);
      } else {
        await api.post('/admin/categories', formData);
      }
      setShowModal(false);
      fetchCategories();
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      fetchCategories();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al eliminar');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', slug: '', description: '', parentId: null, isActive: true, imageUrl: '' });
    setEditingCategory(null);
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parentId: category.parentId,
      isActive: category.isActive,
      imageUrl: category.imageUrl || '',
    });
    setShowModal(true);
  };

  const generateSlug = (name) => {
    return name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <div className="p-4 lg:p-8 bg-background-dark min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Categorías</h1>
          <p className="text-text-secondary">{categories.length} categorías</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/30"
        >
          <Plus className="w-4 h-4" />
          Nueva Categoría
        </button>
      </div>
      
      {/* Categories List */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-surface-elevated rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderTree className="w-10 h-10 text-text-muted" />
            </div>
            <p className="text-text-secondary mb-4">No hay categorías. Crea la primera.</p>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="btn bg-gradient-to-r from-primary-500 to-primary-600 text-white"
            >
              <Plus className="w-4 h-4" />
              Crear Categoría
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {categories.map((category) => (
              <div key={category.id} className="p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-elevated/50 transition-colors">
                <div className="flex items-center gap-4">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover border border-border"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                      <FolderTree className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-white">{category.name}</p>
                    <p className="text-sm text-text-muted font-mono">/{category.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 ml-16 sm:ml-0">
                  <Badge variant={category.isActive ? 'success' : 'secondary'}>
                    {category.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                  <span className="text-sm text-text-secondary hidden sm:inline">
                    {category.productCount || 0} productos
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(category)}
                      className="p-2 hover:bg-primary/20 rounded-lg text-text-muted hover:text-primary transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg text-text-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Modal Categories */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md border border-border overflow-hidden">
            <div className="bg-surface-elevated border-b border-border p-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
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
                <label className="block text-sm font-medium mb-2 text-text-secondary">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: editingCategory ? formData.slug : generateSlug(e.target.value),
                  })}
                  className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-text-secondary">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-border bg-surface-elevated text-primary focus:ring-primary"
                />
                <span className="text-sm text-text-secondary">Categoría activa</span>
              </label>

              {/* Image Upload */}
              <div className="pt-2">
                <label className="block text-sm font-medium mb-2 text-text-secondary">Imagen de Categoría</label>
                <div className="border-2 border-dashed border-border rounded-xl p-4 bg-surface-elevated/30">
                  {uploading ? (
                    <div className="flex flex-col items-center py-4">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                      <span className="text-sm text-text-secondary font-mono text-[10px]">Subiendo...</span>
                    </div>
                  ) : formData.imageUrl ? (
                    <div className="flex items-center gap-4">
                      <img src={formData.imageUrl} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-border" />
                      <div className="flex-1">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: '' })}
                          className="text-xs text-red-500 hover:text-red-400 font-bold"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer py-2">
                      <Upload className="w-6 h-6 text-primary mb-2" />
                      <span className="text-xs font-medium text-white">Subir imagen</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploading(true);
                            try {
                              const response = await uploadApi.categoryImage(file);
                              setFormData({ ...formData, imageUrl: response.data.url });
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
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="O pega una URL de imagen aquí"
                  className="w-full px-4 py-2 mt-2 bg-surface-elevated border border-border rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn bg-gradient-to-r from-primary-500 to-primary-600 text-white flex-1 shadow-lg shadow-primary-500/30">
                  {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
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

export default AdminCategories;
