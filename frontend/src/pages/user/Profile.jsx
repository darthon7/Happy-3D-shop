import { useState, useEffect } from 'react';
import { User, Lock, LogOut, Mail, Phone, Calendar, Edit3, Save, X, Shield, MapPin, Plus, Trash2, Heart, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '../../stores';
import { userApi } from '../../api';
import { validateField, validatePasswordMatch } from '../../lib/validation';

import Orders from './Orders';
import Wishlist from './Wishlist';

import { useSearchParams } from 'react-router-dom';

const Profile = () => {
  const { user, logout, setUser } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['general', 'orders', 'wishlist', 'addresses', 'password'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const handleBlur = (field, value, type, required = true) => {
    const result = validateField(value, type, { required });
    setFieldErrors(prev => ({ ...prev, [field]: result.error }));
  };

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Validate fields
    const errors = {};
    const firstNameResult = validateField(formData.firstName, 'name');
    const lastNameResult = validateField(formData.lastName, 'name');
    const phoneResult = validateField(formData.phone, 'phone', { required: false });
    
    if (!firstNameResult.isValid) errors.firstName = firstNameResult.error;
    if (!lastNameResult.isValid) errors.lastName = lastNameResult.error;
    if (!phoneResult.isValid) errors.phone = phoneResult.error;
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await userApi.updateProfile(formData);
      setUser(response.data);
      setIsEditing(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validate password fields
    const errors = {};
    const currentResult = validateField(passwordData.currentPassword, 'password');
    const newResult = validateField(passwordData.newPassword, 'password');
    const confirmResult = validatePasswordMatch(passwordData.newPassword, passwordData.confirmPassword);
    
    if (!currentResult.isValid) errors.currentPassword = currentResult.error;
    if (!newResult.isValid) errors.newPassword = newResult.error;
    if (!confirmResult.isValid) errors.confirmPassword = confirmResult.error;
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    setLoading(true);
    try {
      await userApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      alert('Contraseña actualizada correctamente');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setFieldErrors({});
    } catch (error) {
      alert(error.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'orders', label: 'Mis pedidos', icon: ShoppingBag },
    { id: 'wishlist', label: 'Favoritos', icon: Heart }, // You might need to import Heart if not already imported
    { id: 'addresses', label: 'Direcciones', icon: MapPin },
    { id: 'password', label: 'Seguridad', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-background-dark to-background-dark" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-5" />
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-12 pb-4 sm:pb-8">
          {/* Avatar and welcome - Compact mode for mobile */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="relative">
              <div className="w-20 h-20 sm:w-28 sm:h-28 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-2xl shadow-primary-500/30 ring-4 ring-primary-500/20">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full border-[3px] sm:border-4 border-background-dark flex items-center justify-center">
                <span className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></span>
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-sm sm:text-base text-gray-400 mt-1 flex items-center justify-center sm:justify-start gap-2">
                <Mail className="w-4 h-4" />
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-0 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Responsive Navigation - Horizontal tabs on mobile, Sidebar on desktop */}
          <aside className="lg:col-span-1 px-4 sm:px-0">
            <nav className="flex lg:flex-col overflow-x-auto scrollbar-hide lg:overflow-visible bg-gray-900/50 sm:bg-gray-900/50 lg:backdrop-blur-sm sm:rounded-2xl lg:border lg:border-gray-800 p-1 lg:p-2 sm:p-2 gap-2 lg:gap-1 lg:space-y-1 pb-2 lg:pb-2 -mx-4 sm:mx-0 px-4 sm:px-2 w-screen sm:w-auto mt-2 sm:mt-0">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // Update URL without reloading
                    const newUrl = new URL(window.location);
                    newUrl.searchParams.set('tab', tab.id);
                    window.history.pushState({}, '', newUrl);
                  }}
                  className={`flex-shrink-0 lg:w-full flex items-center gap-2 lg:gap-3 px-4 lg:px-4 py-2.5 lg:py-3 rounded-full lg:rounded-xl transition-all duration-200 text-sm lg:text-base ${
                    activeTab === tab.id
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-surface lg:bg-transparent border border-border lg:border-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <tab.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="font-medium whitespace-nowrap">{tab.label}</span>
                </button>
              ))}
              
            </nav>
            {/* Mobile logout button (placed under the scrollable tags) */}
            <div className="block lg:hidden mt-4 px-4 sm:px-0">
               <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
            </div>
          </aside>
          
          {/* Content Area */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6 px-4 sm:px-0 pb-20 sm:pb-8">
            {activeTab === 'general' && (
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
                <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Información Personal</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Gestiona tu información de perfil</p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl transition-all text-sm font-medium"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span className="hidden sm:inline">Editar</span>
                    </button>
                  )}
                </div>
                
                <div className="p-5 sm:p-6">
                  {isEditing ? (
                    <form onSubmit={handleUpdateProfile} className="space-y-4 sm:space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Nombre</label>
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            onBlur={() => handleBlur('firstName', formData.firstName, 'name')}
                            className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                              fieldErrors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-primary-500'
                            }`}
                            required
                          />
                          {fieldErrors.firstName && <p className="text-red-400 text-xs mt-1">{fieldErrors.firstName}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">Apellido</label>
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            onBlur={() => handleBlur('lastName', formData.lastName, 'name')}
                            className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                              fieldErrors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-primary-500'
                            }`}
                            required
                          />
                          {fieldErrors.lastName && <p className="text-red-400 text-xs mt-1">{fieldErrors.lastName}</p>}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Teléfono</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            onBlur={() => handleBlur('phone', formData.phone, 'phone', false)}
                            className={`w-full pl-12 pr-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                              fieldErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:ring-primary-500'
                            }`}
                            placeholder="+52 000 000 0000"
                          />
                        </div>
                        {fieldErrors.phone && <p className="text-red-400 text-xs mt-1">{fieldErrors.phone}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                          <input
                            type="email"
                            value={user?.email}
                            className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-500 cursor-not-allowed"
                            disabled
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-2">El email no se puede modificar</p>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button 
                          type="submit" 
                          disabled={loading} 
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-all"
                        >
                          <X className="w-4 h-4" />
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-1.5">
                            <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400" />
                            <span className="text-xs sm:text-sm text-gray-500 font-medium">Nombre completo</span>
                          </div>
                          <p className="text-base sm:text-lg font-semibold text-white tracking-tight">{user?.firstName} {user?.lastName}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400" />
                            <span className="text-xs sm:text-sm text-gray-500 font-medium">Teléfono</span>
                          </div>
                          <p className="text-base sm:text-lg font-semibold text-white tracking-tight">{user?.phone || 'No especificado'}</p>
                        </div>
                      </div>
                      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary-400" />
                          <span className="text-xs sm:text-sm text-gray-500 font-medium">Correo electrónico</span>
                        </div>
                        <p className="text-base sm:text-lg font-semibold text-white tracking-tight break-all">{user?.email}</p>
                      </div>

                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'password' && (
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
                <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-500/10 sm:bg-primary-500/20 rounded-xl flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Seguridad</h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Actualiza tu contraseña de acceso</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-5 sm:p-6">
                  <form onSubmit={handleChangePassword} className="space-y-4 sm:space-y-5 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">Contraseña Actual</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">Nueva Contraseña</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="••••••••"
                        minLength={8}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-2 font-medium">Mínimo 8 caracteres, al menos un número y una letra.</p>
                      {fieldErrors.newPassword && <p className="text-red-400 text-xs mt-1">{fieldErrors.newPassword}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">Confirmar Nueva Contraseña</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="••••••••"
                        required
                      />
                      {fieldErrors.confirmPassword && <p className="text-red-400 text-xs mt-1">{fieldErrors.confirmPassword}</p>}
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 sm:py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all disabled:opacity-50 mt-2"
                    >
                      <Shield className="w-4 h-4" />
                      {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden shadow-xl min-h-[500px]">
                <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-800">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Mis Pedidos</h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Historial de tus compras recientes</p>
                </div>
                <div className="p-0 sm:p-6 w-full max-w-full overflow-x-hidden">
                  <Orders embedded={true} />
                </div>
              </div>
            )}

            {activeTab === 'wishlist' && (
               <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden shadow-xl min-h-[500px]">
                <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-800">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Favoritos</h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Los productos que has guardado</p>
                </div>
                <div className="p-0 sm:p-6 w-full max-w-full overflow-x-hidden">
                  <Wishlist embedded={true} />
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <AddressManager />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-component for Address Management to keep file clean
const AddressManager = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        street: '',
        streetLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'México',
        isDefault: false
    });

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const res = await userApi.getAddresses();
            setAddresses(res.data || []);
        } catch (err) {
            console.error("Error fetching addresses", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (editingId) {
                await userApi.updateAddress(editingId, formData);
            } else {
                await userApi.addAddress(formData);
            }
            await fetchAddresses();
            setIsEditing(false);
            setEditingId(null);
            resetForm();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar la dirección');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta dirección?')) return;
        setLoading(true);
        try {
            await userApi.deleteAddress(id);
            await fetchAddresses();
        } catch (err) {
            alert('Error al eliminar dirección');
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (addr) => {
        setFormData({
            street: addr.street,
            streetLine2: addr.streetLine2 || '',
            city: addr.city,
            state: addr.state || '',
            postalCode: addr.postalCode,
            country: addr.country,
            isDefault: addr.isDefault
        });
        setEditingId(addr.id);
        setIsEditing(true);
        setError(null);
    };

    const resetForm = () => {
        setFormData({
            street: '',
            streetLine2: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'México',
            isDefault: false
        });
    };

    const mexicoStates = [
        "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua",
        "Ciudad de México", "Coahuila", "Colima", "Durango", "Guanajuato", "Guerrero", "Hidalgo", 
        "Jalisco", "Estado de México", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", 
        "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", 
        "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
    ];

    if (isEditing) {
        return (
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">{editingId ? 'Editar Dirección' : 'Nueva Dirección'}</h2>
                    <button onClick={() => { setIsEditing(false); setEditingId(null); resetForm(); }} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Calle y Número</label>
                                <input 
                                    type="text" 
                                    value={formData.street}
                                    onChange={e => setFormData({...formData, street: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Apartamento, suite, etc. (Opcional)</label>
                                <input 
                                    type="text" 
                                    value={formData.streetLine2}
                                    onChange={e => setFormData({...formData, streetLine2: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Ciudad</label>
                                <input 
                                    type="text" 
                                    value={formData.city}
                                    onChange={e => setFormData({...formData, city: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Estado</label>
                                <select 
                                    value={formData.state}
                                    onChange={e => setFormData({...formData, state: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
                                    required
                                >
                                    <option value="">Selecciona un estado</option>
                                    {mexicoStates.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Código Postal</label>
                                <input 
                                    type="text" 
                                    value={formData.postalCode}
                                    onChange={e => setFormData({...formData, postalCode: e.target.value})}
                                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    required
                                    maxLength={5}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">País</label>
                                <input 
                                    type="text" 
                                    value={formData.country}
                                    readOnly
                                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-500 cursor-not-allowed outline-none"
                                />
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2">
                             <input 
                                type="checkbox" 
                                id="isDefault" 
                                checked={formData.isDefault}
                                onChange={e => setFormData({...formData, isDefault: e.target.checked})}
                                className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-primary-500 focus:ring-primary-500"
                             />
                             <label htmlFor="isDefault" className="text-sm text-gray-300">Establecer como dirección predeterminada</label>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-800 mt-4">
                            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50">
                                {loading ? 'Guardando...' : 'Guardar Dirección'}
                            </button>
                            <button type="button" onClick={() => { setIsEditing(false); setEditingId(null); resetForm(); }} className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Mis Direcciones</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Gestiona tus direcciones de envío</p>
                </div>
                <button 
                  onClick={() => { resetForm(); setIsEditing(true); }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl transition-all shadow-lg shadow-primary-500/20 active:scale-95 text-sm font-semibold w-full sm:w-auto"
                >
                    <Plus className="w-4 h-4" />
                    <span>Nueva Dirección</span>
                </button>
            </div>
            
            <div className="p-4 sm:p-6">
                {loading && !addresses.length ? (
                    <div className="text-center py-8 text-gray-500">Cargando direcciones...</div>
                ) : addresses.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded-xl">
                        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">No tienes direcciones guardadas</h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">Agrega una dirección para agilizar tus compras futuras.</p>
                        <button 
                          onClick={() => { resetForm(); setIsEditing(true); }}
                          className="px-6 py-3 bg-gray-800 hover:bg-white/10 text-white font-medium rounded-xl transition-all"
                        >
                            Agregar mi primera dirección
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map(addr => (
                            <div key={addr.id} className="relative group border border-gray-800 bg-gray-800/20 rounded-xl p-5 hover:border-gray-700 transition-all">
                                {addr.isDefault && (
                                    <span className="absolute top-4 right-4 px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs font-bold uppercase tracking-wider rounded border border-primary-500/20">
                                        Default
                                    </span>
                                )}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center shrink-0 text-gray-400">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-lg leading-tight mb-1">{addr.street}</p>
                                        <p className="text-gray-400 text-sm">{addr.streetLine2}</p>
                                        <p className="text-gray-400 text-sm">{addr.city}, {addr.state} {addr.postalCode}</p>
                                        <p className="text-gray-500 text-xs mt-1 font-medium">{addr.country}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800/50">
                                    <button 
                                        onClick={() => startEdit(addr)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-800 hover:bg-gray-700 text-sm font-medium text-gray-300 rounded-lg transition-colors"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" /> Editar
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(addr.id)}
                                        className="flex items-center justify-center p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
