import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { 
  CheckCircle, 
  CreditCard, 
  AlertCircle,
  Truck, 
  Lock, 
  ChevronRight, 
  ArrowRight,
  Wallet,
  Smartphone,
  ShieldCheck,
  Shield,
  HelpCircle,
  ShoppingBag
} from 'lucide-react';
import { useCartStore, useAuthStore } from '../stores';
import toast from 'react-hot-toast';
import { MEXICO_STATES, CITIES_BY_STATE } from '../data/mexicoData';
import { ordersApi, userApi, paymentApi, shippingApi, zipCodeApi } from '../api';
import { validateField } from '../lib/validation';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder');

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, discount, total, fetchCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [shippingRates, setShippingRates] = useState([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [selectedRate, setSelectedRate] = useState(null);
  const [ratesError, setRatesError] = useState(null);
  
  const [formData, setFormData] = useState({
    email: user?.email || '',
    phone: user?.phone || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    country: 'México',
    postalCode: '',
    colonia: '',
  });

  const [availableColonias, setAvailableColonias] = useState([]);
  const [isLoadingZip, setIsLoadingZip] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleBlur = (field, value, type, required = true) => {
    const result = validateField(value, type, { required });
    setFieldErrors(prev => ({ ...prev, [field]: result.error }));
  };

  useEffect(() => {
    const fetchZipInfo = async () => {
        if (formData.postalCode && formData.postalCode.length === 5) {
            setIsLoadingZip(true);
            try {
                const res = await zipCodeApi.get(formData.postalCode);
                const data = res.data;
                const stateObj = MEXICO_STATES.find(s => s.label.toLowerCase() === data.state.toLowerCase()) || 
                                MEXICO_STATES.find(s => data.state.toLowerCase().includes(s.label.toLowerCase()));
                
                setFormData(prev => ({
                    ...prev,
                    state: stateObj ? stateObj.value : prev.state,
                    city: data.city || data.municipality,
                    colonia: '',
                    country: 'México'
                }));
                setAvailableColonias([...new Set(data.colonias || [])]);
            } catch (error) {
                console.log("Zip code not found", error);
                setAvailableColonias([]);
            } finally {
                setIsLoadingZip(false);
            }
        }
    };
    
    if (formData.postalCode.length === 5) {
        const timeoutId = setTimeout(fetchZipInfo, 500);
        return () => clearTimeout(timeoutId);
    }
  }, [formData.postalCode]);
  
  const shippingCost = selectedRate ? parseFloat(selectedRate.price) : 0;
  const taxAmount = useCartStore((state) => state.tax) ?? ((subtotal - discount) * 0.16);
  const displayTotal = total + shippingCost;

  const fetchShippingRates = async () => {
    if (!formData.address || !formData.city || !formData.postalCode || !formData.state) {
        setRatesError("Completa la dirección para calcular envío");
        toast.error("Por favor completa la dirección primero");
        return;
    }
    setIsLoadingRates(true);
    setRatesError(null);
    setShippingRates([]);
    setSelectedRate(null);
    try {
        const res = await shippingApi.getRates({
           shippingStreet: formData.address,
           shippingCity: formData.city,
           shippingState: formData.state,
           shippingPostalCode: formData.postalCode,
           shippingCountry: formData.country,
           shippingStreetLine2: formData.apartment
        });
        setShippingRates(res.data);
        if (res.data.length === 0) setRatesError("No se encontraron tarifas para esta dirección.");
        else toast.success("Tarifas calculadas");
    } catch (err) {
        console.error(err);
        setRatesError("Error al cargar tarifas.");
    } finally {
        setIsLoadingRates(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      userApi.getAddresses()
        .then(res => {
          setAddresses(res.data || []);
          const defaultAddr = res.data?.find(a => a.isDefault);
          if (defaultAddr) handleAddressSelect(defaultAddr);
        })
        .catch(console.error);
    }
  }, [isAuthenticated, fetchCart]);
  
  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setFormData(prev => ({
      ...prev,
      address: address.street,
      apartment: address.streetLine2 || '',
      city: address.city,
      state: address.state || '',
      postalCode: address.postalCode,
      country: address.country,
    }));
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'state' ? { city: '' } : {})
    }));
  };
  
  const handleContinueToPayment = (e) => {
    e.preventDefault();
    
    // Validate required fields
    const required = ['email', 'phone', 'firstName', 'lastName', 'address', 'city', 'state', 'postalCode'];
    const errors = {};
    
    required.forEach(field => {
        if (!formData[field]) errors[field] = "Campo requerido";
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    if (!selectedRate) {
      toast.error('Selecciona un método de envío');
      return;
    }
    
    navigate('/pago', { 
      state: { 
        shippingData: formData,
        selectedRate: selectedRate
      } 
    });
  };
  
  if (items.length === 0) {
    navigate('/carrito');
    return null;
  }
  
  return (
    <div className="bg-[#F5F0E8] text-[#2C1F0E] font-sans min-h-screen flex flex-col">
      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-10 py-12 w-full">
        <div className="flex flex-col mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-black text-[#1B2A5E] mb-2 uppercase tracking-tight">Finalizar Compra</h1>
            <p className="text-[#2C1F0E]/70 text-lg italic">Revisa tus detalles de envío y selecciona mensajería.</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12 max-w-3xl mx-auto">
          <div className="flex items-center justify-between relative px-4 text-xs font-bold uppercase tracking-widest">
            <div className="absolute left-0 top-1/2 w-full h-[1px] bg-[#C9A84C]/20 -z-10"></div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C9A84C] text-white flex items-center justify-center shadow-lg ring-4 ring-[#F5F0E8]">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-[#C9A84C]">Carrito</span>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C9A84C] text-white flex items-center justify-center shadow-lg ring-4 ring-[#F5F0E8]">
                02
              </div>
              <span className="text-[#C9A84C]">Envío</span>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-[#C9A84C]/20 text-[#C9A84C]/30 flex items-center justify-center ring-4 ring-[#F5F0E8]">
                03
              </div>
              <span className="text-[#2C1F0E]/30">Pago</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* LEFT COLUMN */}
          <section className="lg:col-span-8 space-y-8">
            
            {/* Contact Information */}
            <div className="bg-white p-8 rounded-[8px] border border-[#C9A84C]/20 shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center text-[#1B2A5E] uppercase tracking-tight">
                Información de Contacto
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-[#2C1F0E]/60 uppercase tracking-wider mb-2">Correo electrónico</label>
                  <input 
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-[#F5F0E8]/50 border border-[#C9A84C]/30 p-3 rounded-[4px] outline-none focus:border-[#C9A84C] transition-colors"
                  />
                  {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2C1F0E]/60 uppercase tracking-wider mb-2">Teléfono</label>
                  <input 
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="10 dígitos"
                    className="w-full bg-[#F5F0E8]/50 border border-[#C9A84C]/30 p-3 rounded-[4px] outline-none focus:border-[#C9A84C] transition-colors"
                  />
                  {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white p-8 rounded-[8px] border border-[#C9A84C]/20 shadow-sm">
              <h2 className="text-xl font-bold flex items-center text-[#1B2A5E] uppercase tracking-tight mb-6">
                  <Truck className="w-5 h-5 mr-3 text-[#C9A84C]" />
                  Dirección de Envío
              </h2>

              {addresses.length > 0 && (
                <div className="mb-8">
                  <p className="text-xs font-bold text-[#2C1F0E]/60 uppercase tracking-wider mb-3">Usar guardada:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map(addr => (
                      <div 
                        key={addr.id}
                        onClick={() => handleAddressSelect(addr)}
                        className={`p-4 rounded-[4px] border cursor-pointer transition-all ${
                          selectedAddress?.id === addr.id 
                          ? 'border-[#C9A84C] bg-[#C9A84C]/5' 
                          : 'border-[#C9A84C]/20 hover:border-[#C9A84C]/40'
                        }`}
                      >
                        <p className="font-bold text-[#2C1F0E] text-sm">{addr.street}</p>
                        <p className="text-xs text-[#2C1F0E]/70">{addr.city}, {addr.state} {addr.postalCode}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-[#2C1F0E]/60 uppercase tracking-wider mb-2">Nombre</label>
                  <input 
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full bg-[#F5F0E8]/50 border border-[#C9A84C]/30 p-3 rounded-[4px] outline-none focus:border-[#C9A84C]"
                  />
                  {fieldErrors.firstName && <p className="text-red-500 text-xs mt-1">{fieldErrors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2C1F0E]/60 uppercase tracking-wider mb-2">Apellido</label>
                  <input 
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full bg-[#F5F0E8]/50 border border-[#C9A84C]/30 p-3 rounded-[4px] outline-none focus:border-[#C9A84C]"
                  />
                  {fieldErrors.lastName && <p className="text-red-500 text-xs mt-1">{fieldErrors.lastName}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#2C1F0E]/60 uppercase tracking-wider mb-2">Dirección</label>
                  <input 
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Calle y número"
                    className="w-full bg-[#F5F0E8]/50 border border-[#C9A84C]/30 p-3 rounded-[4px] outline-none focus:border-[#C9A84C]"
                  />
                  {fieldErrors.address && <p className="text-red-500 text-xs mt-1">{fieldErrors.address}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#2C1F0E]/60 uppercase tracking-wider mb-2">Colonia / Asentamiento</label>
                  <select 
                    name="colonia"
                    value={formData.colonia}
                    onChange={handleInputChange}
                    className="w-full bg-[#F5F0E8]/50 border border-[#C9A84C]/30 p-3 rounded-[4px] outline-none focus:border-[#C9A84C]"
                  >
                    <option value="">Selecciona</option>
                    {availableColonias.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-[#2C1F0E]/60 uppercase tracking-wider mb-2">Estado</label>
                    <select 
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full bg-[#F5F0E8]/50 border border-[#C9A84C]/30 p-3 rounded-[4px] outline-none focus:border-[#C9A84C]"
                    >
                        <option value="">Selecciona</option>
                        {MEXICO_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2C1F0E]/60 uppercase tracking-wider mb-2">Ciudad</label>
                  <input 
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full bg-[#F5F0E8]/50 border border-[#C9A84C]/30 p-3 rounded-[4px] outline-none focus:border-[#C9A84C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2C1F0E]/60 uppercase tracking-wider mb-2">Código Postal</label>
                  <input 
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    maxLength={5}
                    className="w-full bg-[#F5F0E8]/50 border border-[#C9A84C]/30 p-3 rounded-[4px] outline-none focus:border-[#C9A84C]"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Method */}
            <div className="bg-white p-8 rounded-[8px] border border-[#C9A84C]/20 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-xl font-bold text-[#1B2A5E] uppercase tracking-tight">Método de Envío</h2>
                    <button 
                        type="button"
                        onClick={fetchShippingRates}
                        disabled={isLoadingRates || !formData.address || !formData.postalCode}
                        className="bg-[#C9A84C] hover:bg-[#b8943e] text-white px-8 py-3 rounded-[4px] font-black text-sm transition-all disabled:opacity-50"
                    >
                        {isLoadingRates ? 'Calculando...' : 'Calcular Envío'}
                    </button>
                </div>
              
                {ratesError && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-[4px] text-red-600 text-sm mb-6 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {ratesError}
                  </div>
                )}
                
                {shippingRates.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {shippingRates.map(rate => (
                      <label key={rate.id} className={`flex items-center justify-between p-4 rounded-[4px] border cursor-pointer transition-all ${
                          selectedRate?.id === rate.id
                          ? 'border-[#C9A84C] bg-[#C9A84C]/5' 
                          : 'border-[#C9A84C]/10 hover:border-[#C9A84C]/30'
                      }`}>
                          <div className="flex items-center gap-4">
                            <input 
                                type="radio"
                                name="shippingRate"
                                checked={selectedRate?.id === rate.id}
                                onChange={() => setSelectedRate(rate)}
                                className="h-5 w-5 text-[#C9A84C] focus:ring-[#C9A84C]"
                            />
                            <div className="flex flex-col">
                                <span className="font-bold text-[#2C1F0E] text-sm">{rate.provider}</span>
                                <span className="text-[#2C1F0E]/50 text-xs italic">{rate.serviceName} • {rate.estimatedDays} días</span>
                            </div>
                          </div>
                          <span className="font-black text-[#1B2A5E]">${parseFloat(rate.price).toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 rounded-[4px] border-2 border-dashed border-[#C9A84C]/10 text-center bg-[#F5F0E8]/30">
                      <p className="text-[#2C1F0E]/40 text-sm italic">
                          Ingresa tu dirección arriba para ver las opciones de mensajería disponibles.
                      </p>
                  </div>
                )}
            </div>
          </section>

          {/* RIGHT COLUMN: Summary */}
          <aside className="lg:col-span-4">
            <div className="bg-white p-8 rounded-[8px] border border-[#C9A84C]/20 sticky top-8 shadow-md">
              <h2 className="text-xl font-black text-[#1B2A5E] mb-6 uppercase tracking-widest border-b border-[#C9A84C]/10 pb-4">Tu Pedido</h2>
              
              <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-20 rounded-[4px] overflow-hidden shrink-0 border border-[#C9A84C]/10 bg-[#F5F0E8]">
                      {item.imageUrl && (
                        <img alt={item.productName} className="w-full h-full object-cover" src={item.imageUrl} />
                      )}
                      <span className="absolute -top-1 -right-1 bg-[#1B2A5E] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{item.quantity}</span>
                    </div>
                    <div className="flex flex-col justify-center flex-1">
                      <p className="text-[#2C1F0E] text-sm font-bold leading-tight">{item.productName}</p>
                      <p className="text-[#2C1F0E]/50 text-[10px] uppercase font-bold mt-1">
                          {item.size && `${item.size}`} {item.color && `/ ${item.color}`}
                      </p>
                    </div>
                    <span className="text-[#1B2A5E] font-bold text-sm">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-8 text-sm">
                <div className="flex justify-between text-[#2C1F0E]/70">
                  <span>Subtotal</span>
                  <span className="text-[#2C1F0E] font-bold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#2C1F0E]/70">
                  <span>Envío</span>
                  <span className="text-[#2C1F0E] font-bold">${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#2C1F0E]/70">
                  <span>IVA (16%)</span>
                  <span className="text-[#2C1F0E] font-bold">${taxAmount.toFixed(2)}</span>
                </div>
                
                <div className="pt-4 border-t border-[#C9A84C]/20 mt-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[#1B2A5E] font-black text-lg uppercase">Total</span>
                    <div className="text-right">
                        <p className="text-3xl font-black text-[#C9A84C] leading-none">${displayTotal.toFixed(2)}</p>
                        <p className="text-[10px] text-[#2C1F0E]/40 font-bold uppercase mt-1">MXN</p>
                    </div>
                  </div>
                </div>
              </div>

              {!selectedRate && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-[4px] flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-blue-600 text-[11px] leading-relaxed">
                        Calcula y selecciona un método de envío para poder habilitar el siguiente paso.
                    </p>
                </div>
              )}

              <button 
                onClick={handleContinueToPayment}
                disabled={!selectedRate}
                className="w-full bg-[#1B2A5E] hover:bg-[#0f1836] text-white font-black py-5 rounded-[4px] transition-all shadow-lg flex items-center justify-center gap-3 group disabled:opacity-30 disabled:cursor-not-allowed"
              >
                CONTINUAR AL PAGO
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="mt-6 flex items-center justify-center gap-4 opacity-30">
                  <Lock className="w-4 h-4" />
                  <p className="text-[10px] uppercase font-black tracking-widest text-[#2C1F0E]">Pago Seguro SSL</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
