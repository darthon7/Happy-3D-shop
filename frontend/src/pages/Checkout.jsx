import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { 
  CheckCircle, 
  CreditCard, 
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
  const { items, subtotal, discount, total, clearCart, fetchCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [shippingMethod, setShippingMethod] = useState('standard');
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  
  const [shippingRates, setShippingRates] = useState([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [selectedRate, setSelectedRate] = useState(null);
  const [ratesError, setRatesError] = useState(null);
  
  const [formData, setFormData] = useState({
    email: user?.email || '',
    phone: '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    country: 'México',
    postalCode: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    cardName: '',
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
        } else {
             if (formData.postalCode.length < 5) setAvailableColonias([]);
        }
    };
    
    const timeoutId = setTimeout(fetchZipInfo, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.postalCode]);
  
  const shippingCost = selectedRate ? parseFloat(selectedRate.price) : 0;
  const taxAmount = useCartStore((state) => state.tax) ?? ((subtotal - discount) * 0.16);
  const displayTotal = total + shippingCost;

  const fetchShippingRates = async () => {
    if (!formData.address || !formData.city || !formData.postalCode || !formData.state) {
        setRatesError("Completa la dirección para calcular envío");
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
    } catch (err) {
        console.error(err);
        setRatesError(err.response?.data?.message || "Error al cargar tarifas.");
    } finally {
        setIsLoadingRates(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart().then(() => {
        const cartItems = useCartStore.getState().items;
        const hasOutOfStock = cartItems.some((item) => item.availableStock === 0);
        if (hasOutOfStock) {
          toast.error('Algunos productos ya no tienen stock.');
          navigate('/carrito');
          return;
        }
      });
      userApi.getAddresses()
        .then(res => {
          setAddresses(res.data || []);
          const defaultAddr = res.data?.find(a => a.isDefault);
          if (defaultAddr) {
            setSelectedAddress(defaultAddr);
            setFormData(prev => ({
              ...prev,
              address: defaultAddr.street,
              apartment: defaultAddr.streetLine2 || '',
              city: defaultAddr.city,
              state: defaultAddr.state || '',
              postalCode: defaultAddr.postalCode,
              country: defaultAddr.country,
            }));
          }
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = {};
    const emailResult = validateField(formData.email, 'email');
    const phoneResult = validateField(formData.phone, 'phone');
    const firstNameResult = validateField(formData.firstName, 'name');
    const lastNameResult = validateField(formData.lastName, 'name');
    const addressResult = validateField(formData.address, 'address');
    const cityResult = validateField(formData.city, 'cityState');
    const stateResult = validateField(formData.state, 'cityState');
    const postalCodeResult = validateField(formData.postalCode, 'postalCode');
    
    if (!emailResult.isValid) errors.email = emailResult.error;
    if (!phoneResult.isValid) errors.phone = phoneResult.error;
    if (!firstNameResult.isValid) errors.firstName = firstNameResult.error;
    if (!lastNameResult.isValid) errors.lastName = lastNameResult.error;
    if (!addressResult.isValid) errors.address = addressResult.error;
    if (!cityResult.isValid) errors.city = cityResult.error;
    if (!stateResult.isValid) errors.state = stateResult.error;
    if (!postalCodeResult.isValid) errors.postalCode = postalCodeResult.error;
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast.error('Por favor corrige los errores');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const checkoutData = {
        shippingStreet: formData.address,
        shippingStreetLine2: formData.colonia ? `Col. ${formData.colonia}${formData.apartment ? ', ' + formData.apartment : ''}` : formData.apartment,
        shippingCity: formData.city,
        shippingState: formData.state || formData.city,
        shippingPostalCode: formData.postalCode,
        shippingCountry: formData.country,
        sameAsShipping: true,
        paymentMethod: paymentMethod === 'card' ? 'STRIPE' : 'PAYPAL',
        guestEmail: formData.email,
        guestPhone: formData.phone,
        notes: '',
        shippingCost: shippingCost,
        carrier: selectedRate?.provider,
        serviceCode: selectedRate?.serviceCode
      };
      
      const response = await ordersApi.checkout(checkoutData);
      const newOrderNumber = response.data.orderNumber;
      const newOrderId = response.data.id;
      
      setOrderNumber(newOrderNumber);
      
      if (paymentMethod === 'card') {
        const paymentRes = await paymentApi.createStripeIntent(newOrderId);
        
        if (paymentRes.data.stripeClientSecret) {
            setClientSecret(paymentRes.data.stripeClientSecret);
            setShowPaymentModal(true);
            setIsSubmitting(false);
            return;
        }
      }

      setOrderComplete(true);
      await clearCart();
      
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error.response?.data?.message || 'Error al procesar el pedido');
    } finally {
      if (!showPaymentModal) {
          setIsSubmitting(false);
      }
    }
  };

  const handlePaymentSuccess = async () => {
      setShowPaymentModal(false);
      setOrderComplete(true);
      await clearCart();
  };
  
  if (items.length === 0 && !orderComplete) {
    navigate('/carrito');
    return null;
  }
  
  if (orderComplete) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-header mb-4">¡Pedido Confirmado!</h1>
          <p className="text-gray-600 mb-2">Gracias por tu compra, {user?.firstName || formData.firstName}.</p>
          <p className="text-gray-600 mb-6">
            Tu número de pedido es: <span className="font-mono font-bold text-brand">{orderNumber}</span>
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => navigate('/pedidos')} 
              className="px-6 py-3 bg-brand hover:bg-brand-dark text-white font-bold rounded-[8px] transition-colors"
            >
              Ver Mis Pedidos
            </button>
            <button 
              onClick={() => navigate('/catalogo')} 
              className="px-6 py-3 bg-gray-100 text-header font-bold rounded-[8px] hover:bg-gray-200 transition-colors"
            >
              Seguir Comprando
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-header font-sans min-h-screen flex flex-col">
      <main className="flex-grow max-w-6xl mx-auto px-4 py-12 w-full">
        {/* Progress Steps */}
        <nav className="mb-12">
          <ol className="flex items-center justify-center space-x-8 text-sm font-medium uppercase tracking-wider">
            <li className="flex items-center text-gray-400">
              <span className="mr-2">01</span> Carrito
              <svg className="w-4 h-4 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </li>
            <li className="flex items-center pb-1" style={{ color: '#FF5252', borderBottom: '2px solid #FF5252' }}>
              <span className="mr-2" style={{ color: '#FF5252' }}>02</span> Envío y Pago
              <svg className="w-4 h-4 ml-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </li>
            <li className="flex items-center text-gray-400">
              <span className="mr-2">03</span> Confirmación
            </li>
          </ol>
        </nav>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* LEFT COLUMN */}
            <section className="lg:col-span-2 space-y-10">
              {/* Shipping Information */}
              <div className="bg-white p-8 rounded-[8px] shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <span className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                  Información de Envío
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nombre</label>
                    <input 
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('firstName', formData.firstName, 'name')}
                      className={`w-full p-2.5 outline-none focus:ring-1 rounded-[8px] border ${fieldErrors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Jane"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Apellido</label>
                    <input 
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('lastName', formData.lastName, 'name')}
                      className={`w-full p-2.5 outline-none focus:ring-1 rounded-[8px] border ${fieldErrors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="Doe"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Dirección</label>
                    <input 
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('address', formData.address, 'address')}
                      className={`w-full p-2.5 outline-none focus:ring-1 rounded-[8px] border ${fieldErrors.address ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="123 Calle Falsa"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Ciudad</label>
                    <input 
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full p-2.5 outline-none focus:ring-1 rounded-[8px] border border-gray-300"
                      placeholder="Ciudad de México"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Estado</label>
                      <select 
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full p-2.5 outline-none focus:ring-1 rounded-[8px] border border-gray-300"
                        required
                      >
                        <option value="">Selecciona</option>
                        {MEXICO_STATES.map(state => (
                          <option key={state.value} value={state.value}>{state.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Código Postal</label>
                      <input 
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('postalCode', formData.postalCode, 'postalCode')}
                        className={`w-full p-2.5 outline-none focus:ring-1 rounded-[8px] border ${fieldErrors.postalCode ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="01000"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              <div className="bg-white p-8 rounded-[8px] shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <span className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                  Método de Envío
                </h2>
                <button 
                  type="button"
                  onClick={fetchShippingRates}
                  disabled={isLoadingRates || !formData.address}
                  className="bg-brand hover:bg-brand-dark text-white px-6 py-3 rounded-[8px] font-semibold transition-colors disabled:opacity-50 mb-4"
                >
                  {isLoadingRates ? 'Calculando...' : 'Calcular Tarifas'}
                </button>
                
                {ratesError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] text-red-600 text-sm mb-4">
                    {ratesError}
                  </div>
                )}
                
                {shippingRates.length > 0 ? (
                  <div className="space-y-3">
                    {shippingRates.map(rate => (
                      <label key={rate.id} className={`relative flex items-center justify-between p-4 rounded-[8px] border cursor-pointer transition-all ${
                          selectedRate?.id === rate.id
                          ? 'border-brand bg-brand/5' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                          <div className="flex items-center gap-3">
                          <input 
                              type="radio"
                              name="shippingRate"
                              checked={selectedRate?.id === rate.id}
                              onChange={() => setSelectedRate(rate)}
                              className="h-5 w-5 border-gray-300 text-brand focus:ring-brand"
                          />
                          <div className="flex flex-col">
                              <span className="font-medium text-header">{rate.provider}</span>
                              <span className="text-gray-500 text-xs">{rate.serviceName} • {rate.estimatedDays} días</span>
                          </div>
                          </div>
                          <span className="font-bold text-header">${parseFloat(rate.price).toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-[8px] border border-dashed border-gray-200 text-center">
                      <p className="text-gray-500 text-sm">
                          {isLoadingRates ? 'Calculando tarifas...' : 'Ingresa tu dirección y calcula el envío.'}
                      </p>
                  </div>
                )}
              </div>

              {/* Payment Information */}
              <div className="bg-white p-8 rounded-[8px] shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold mb-6 flex items-center">
                  <span className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mr-3 text-sm">3</span>
                  Método de Pago
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Número de Tarjeta</label>
                    <div className="relative">
                      <input 
                        className="w-full p-2.5 outline-none focus:ring-1 rounded-[8px] border border-gray-300 pl-10" 
                        placeholder="0000 0000 0000 0000" 
                        type="text"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <CreditCard className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Fecha de Expiración</label>
                      <input className="w-full p-2.5 outline-none focus:ring-1 rounded-[8px] border border-gray-300" placeholder="MM / YY" type="text"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">CVC</label>
                      <input className="w-full p-2.5 outline-none focus:ring-1 rounded-[8px] border border-gray-300" placeholder="123" type="text"/>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* RIGHT COLUMN: Order Summary */}
            <aside className="lg:col-span-1">
              <div className="bg-white p-8 rounded-[8px] shadow-sm border border-gray-100 sticky top-8">
                <h2 className="text-xl font-semibold mb-6">Resumen del Pedido</h2>
                
                {/* Items */}
                <div className="space-y-4 mb-6">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-[8px] mr-3 flex-shrink-0">
                          {item.imageUrl ? (
                            <img alt={item.productName} className="w-full h-full object-cover rounded-[8px]" src={item.imageUrl} />
                          ) : (
                            <ShoppingBag className="w-6 h-6 m-3 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{item.productName}</p>
                          <p className="text-xs text-gray-500">Cant: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold">${item.totalPrice?.toFixed(2) || (item.unitPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-2 mb-6">
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Envío</span>
                    <span>${shippingCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-50 mt-2">
                    <span>Total</span>
                    <span style={{ color: '#FF5252' }}>${displayTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting || !selectedRate}
                  className="w-full bg-brand hover:opacity-90 text-white font-bold py-4 rounded-[8px] transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Procesando...' : 'REALIZAR PEDIDO'}
                </button>
                <p className="text-center text-xs text-gray-400 mt-4">Transacción segura encriptada</p>
              </div>
            </aside>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Checkout;
