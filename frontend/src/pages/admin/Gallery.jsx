import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, Trash2, Edit2, Eye, EyeOff, Save, X, Upload, 
  Image as ImageIcon, AlertCircle, Loader2
} from 'lucide-react';
import { adminGalleryApi } from '../../api';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';

const AdminGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const fileInputRef = useRef(null);

  // Upload form state
  const [uploadData, setUploadData] = useState({
    file: null,
    preview: null,
    title: '',
    description: '',
    altText: '',
    sortOrder: 0,
  });

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await adminGalleryApi.getAll();
      setImages(response.data || []);
      setHasChanges(false);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = useCallback((fromIndex, toIndex) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setImages(newImages);
    setHasChanges(true);
  }, [images]);

  const saveOrder = async () => {
    setSavingOrder(true);
    const imageIds = images.map(img => img.id);
    try {
      await adminGalleryApi.reorder(imageIds);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving order:', error);
    } finally {
      setSavingOrder(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadData({
        ...uploadData,
        file,
        preview: URL.createObjectURL(file),
      });
    }
  };

  const handleUpload = async () => {
    if (!uploadData.file) return;
    
    setUploading(true);
    try {
      await adminGalleryApi.upload(uploadData.file, {
        title: uploadData.title,
        description: uploadData.description,
        altText: uploadData.altText,
        sortOrder: uploadData.sortOrder,
      });
      
      // Reset form and refresh
      setUploadData({ file: null, preview: null, title: '', description: '', altText: '', sortOrder: 0 });
      setShowUploadModal(false);
      fetchImages();
      setHasChanges(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingImage) return;
    
    try {
      await adminGalleryApi.update(editingImage.id, {
        title: editingImage.title,
        description: editingImage.description,
        altText: editingImage.altText,
        sortOrder: editingImage.sortOrder,
        isActive: editingImage.isActive,
      });
      
      setEditingImage(null);
      fetchImages();
    } catch (error) {
      console.error('Error updating image:', error);
      alert('Error al actualizar la imagen');
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminGalleryApi.delete(id);
      setDeleteConfirm(null);
      fetchImages();
      setHasChanges(false);
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error al eliminar la imagen');
    }
  };

  const toggleActive = async (image) => {
    try {
      await adminGalleryApi.update(image.id, { isActive: !image.isActive });
      fetchImages();
      setHasChanges(false);
    } catch (error) {
      console.error('Error toggling image:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-dark">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 bg-background-dark min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Galería</h1>
          <p className="text-text-secondary">Administra las imágenes de la galería pública</p>
        </div>
        <div className="flex gap-3">
          {hasChanges && (
            <button
              onClick={saveOrder}
              disabled={savingOrder}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {savingOrder ? 'Guardando...' : 'Guardar Orden'}
            </button>
          )}
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            Subir Imagen
          </button>
        </div>
      </div>

      {/* Images Grid */}
      {images.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-2xl border border-border">
          <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sin imágenes</h2>
          <p className="text-text-secondary mb-6">
            Sube tu primera imagen para comenzar
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-colors"
          >
            <Upload className="w-5 h-5" />
            Subir Imagen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((image, index) => {
            const thumbnailUrl = image.url?.replace('/upload/', '/upload/w_400,h_400,c_fill,q_auto,f_auto/');
            
            return (
            <DraggableImageCard
              key={image.id}
              image={image}
              index={index}
              thumbnailUrl={thumbnailUrl}
              onReorder={handleReorder}
              setEditingImage={setEditingImage}
              toggleActive={toggleActive}
              setDeleteConfirm={setDeleteConfirm}
            />
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold text-white">Subir Imagen</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* File Upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  uploadData.preview ? 'border-primary' : 'border-border hover:border-primary/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                {uploadData.preview ? (
                  <img
                    src={uploadData.preview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-text-secondary">
                      Click para seleccionar una imagen
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      PNG, JPG hasta 10MB
                    </p>
                  </>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Título (opcional)
                  </label>
                  <input
                    type="text"
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                    placeholder="Nombre de la imagen"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={uploadData.description}
                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                    className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary resize-none"
                    rows={3}
                    placeholder="Descripción de la imagen"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Orden
                  </label>
                  <input
                    type="number"
                    value={uploadData.sortOrder}
                    onChange={(e) => setUploadData({ ...uploadData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-border">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 py-3 rounded-xl border border-border text-white font-bold hover:bg-surface-elevated transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadData.file || uploading}
                className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Subir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold text-white">Editar Imagen</h2>
              <button
                onClick={() => setEditingImage(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <img
                src={editingImage.url}
                alt={editingImage.title}
                className="w-full h-48 object-cover rounded-xl"
              />
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={editingImage.title || ''}
                  onChange={(e) => setEditingImage({ ...editingImage, title: e.target.value })}
                  className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Descripción
                </label>
                <textarea
                  value={editingImage.description || ''}
                  onChange={(e) => setEditingImage({ ...editingImage, description: e.target.value })}
                  className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary resize-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Orden
                  </label>
                  <input
                    type="number"
                    value={editingImage.sortOrder || 0}
                    onChange={(e) => setEditingImage({ ...editingImage, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full bg-surface-elevated border border-border rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Estado
                  </label>
                  <button
                    onClick={() => setEditingImage({ ...editingImage, isActive: !editingImage.isActive })}
                    className={`w-full py-3 px-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
                      editingImage.isActive
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {editingImage.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    {editingImage.isActive ? 'Visible' : 'Oculta'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-border">
              <button
                onClick={() => setEditingImage(null)}
                className="flex-1 py-3 rounded-xl border border-border text-white font-bold hover:bg-surface-elevated transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdate}
                className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">¿Eliminar imagen?</h2>
            <p className="text-text-secondary mb-6">
              Esta acción no se puede deshacer. La imagen será eliminada permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl border border-border text-white font-bold hover:bg-surface-elevated transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DraggableImageCard = ({ image, index, thumbnailUrl, onReorder, setEditingImage, toggleActive, setDeleteConfirm }) => {
  const cardRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    return combine(
      draggable({
        element,
        getInitialData: () => ({ index, imageId: image.id }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element,
        getData: () => ({ index }),
        onDragEnter: () => setIsOver(true),
        onDragLeave: () => setIsOver(false),
        onDrop: ({ source }) => {
          setIsOver(false);
          const sourceIndex = source.data.index;
          if (sourceIndex !== index) {
            onReorder(sourceIndex, index);
          }
        },
      })
    );
  }, [index, image.id, onReorder]);

  return (
    <div
      ref={cardRef}
      className={`
        group relative bg-surface rounded-2xl border overflow-hidden cursor-move transition-transform duration-200
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
        ${isOver ? 'ring-4 ring-primary scale-105' : ''}
        ${image.isActive ? 'border-border' : 'border-red-500/30 opacity-70'}
      `}
    >
      <div className="aspect-square overflow-hidden">
        <img
          src={thumbnailUrl || image.url}
          alt={image.altText || image.title || ''}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-2">
        <button
          onClick={() => setEditingImage(image)}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          title="Editar"
        >
          <Edit2 className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={() => toggleActive(image)}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          title={image.isActive ? 'Ocultar' : 'Mostrar'}
        >
          {image.isActive ? (
            <EyeOff className="w-5 h-5 text-white" />
          ) : (
            <Eye className="w-5 h-5 text-white" />
          )}
        </button>
        <button
          onClick={() => setDeleteConfirm(image.id)}
          className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-5 h-5 text-red-400" />
        </button>
      </div>

      {!image.isActive && (
        <div className="absolute top-3 left-3 px-2 py-1 bg-red-500/80 rounded-lg text-xs font-bold text-white">
          Oculta
        </div>
      )}

      <div className="p-4">
        <h3 className="font-bold text-white truncate">
          {image.title || 'Sin título'}
        </h3>
        <p className="text-text-secondary text-sm truncate">
          {image.description || 'Sin descripción'}
        </p>
      </div>
    </div>
  );
};

export default AdminGallery;
