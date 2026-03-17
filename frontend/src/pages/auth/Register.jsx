import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Phone, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores';
import { validateField, validatePasswordMatch } from '../../lib/validation';
import SocialLoginButtons from '../../components/auth/SocialLoginButtons';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const handleBlur = (field, value, type, required = true) => {
    const result = validateField(value, type, { required });
    setFieldErrors(prev => ({ ...prev, [field]: result.error }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (validationError) setValidationError('');
  };

  // Password strength checker
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
    const colors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    
    return { strength, label: labels[strength], color: colors[strength] };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const errors = {};
    const firstNameResult = validateField(formData.firstName, 'name');
    const lastNameResult = validateField(formData.lastName, 'name');
    const emailResult = validateField(formData.email, 'email');
    const phoneResult = validateField(formData.phone, 'phone', { required: false });
    const passwordResult = validateField(formData.password, 'password');
    const confirmResult = validatePasswordMatch(formData.password, formData.confirmPassword);
    
    if (!firstNameResult.isValid) errors.firstName = firstNameResult.error;
    if (!lastNameResult.isValid) errors.lastName = lastNameResult.error;
    if (!emailResult.isValid) errors.email = emailResult.error;
    if (!phoneResult.isValid) errors.phone = phoneResult.error;
    if (!passwordResult.isValid) errors.password = passwordResult.error;
    if (!confirmResult.isValid) errors.confirmPassword = confirmResult.error;
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setValidationError('Por favor corrige los errores en el formulario');
      return;
    }

    const { confirmPassword, ...registerData } = formData;
    registerData.email = registerData.email.trim().toLowerCase();
    
    const result = await register(registerData);
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-12 h-12 bg-[#C9A84C] rounded-[8px] flex items-center justify-center text-[#2C1F0E] font-bold text-xl">PR</div>
            <h1 className="text-2xl font-bold text-[#2C1F0E]">PROP'S <span className="text-brand">ROOM</span></h1>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#C9A84C]/20 rounded-[8px] p-5 sm:p-8 shadow-lg">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#2C1F0E] mb-2">
              Crear Cuenta
            </h1>
            <p className="text-[#2C1F0E]/60 text-sm">
              Completa tus datos para unirte a nosotros
            </p>
          </div>
         
          {/* Error Alerts */}
          {(error || validationError) && (
            <div className="mb-6 p-4 rounded-[8px] bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-500 text-sm font-medium">{error || validationError}</p>
              </div>
              <button 
                onClick={() => { clearError(); setValidationError(''); }} 
                className="text-red-500 hover:text-red-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#2C1F0E]/70">
                  Nombre
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2C1F0E]/50">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('firstName', formData.firstName, 'name')}
                    className={`w-full border rounded-[8px] py-3 pl-10 pr-3 text-[#2C1F0E] text-sm focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.firstName ? 'border-red-500 focus:ring-red-500/20' : 'border-[#C9A84C]/30 focus:border-brand focus:ring-brand/20'
                    }`}
                    placeholder="Juan"
                    required
                  />
                </div>
                {fieldErrors.firstName && <p className="text-red-500 text-xs">{fieldErrors.firstName}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#2C1F0E]/70">
                  Apellido
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('lastName', formData.lastName, 'name')}
                  className={`w-full bg-white border rounded-xl py-3 px-3 text-[#2C1F0E] placeholder-gray-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.lastName ? 'border-red-500 focus:ring-red-500/20' : 'border-[#C9A84C]/30 focus:border-brand focus:ring-brand/20'
                  }`}
                  placeholder="Pérez"
                  required
                />
                {fieldErrors.lastName && <p className="text-red-400 text-xs">{fieldErrors.lastName}</p>}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#2C1F0E]/70">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2C1F0E]/60">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email', formData.email, 'email')}
                  className={`w-full bg-white border rounded-xl py-3 pl-10 pr-3 text-[#2C1F0E] placeholder-gray-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.email ? 'border-red-500 focus:ring-red-500/20' : 'border-[#C9A84C]/30 focus:border-brand focus:ring-brand/20'
                  }`}
                  placeholder="tu@email.com"
                  required
                />
              </div>
              {fieldErrors.email && <p className="text-red-400 text-xs">{fieldErrors.email}</p>}
            </div>

            {/* Phone Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#2C1F0E]/70">
                Teléfono <span className="text-[#2C1F0E]/60 text-xs">(opcional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2C1F0E]/60">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={() => handleBlur('phone', formData.phone, 'phone', false)}
                  className={`w-full bg-white border rounded-xl py-3 pl-10 pr-3 text-[#2C1F0E] placeholder-gray-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.phone ? 'border-red-500 focus:ring-red-500/20' : 'border-[#C9A84C]/30 focus:border-brand focus:ring-brand/20'
                  }`}
                  placeholder="+52 123 456 7890"
                />
              </div>
              {fieldErrors.phone && <p className="text-red-400 text-xs">{fieldErrors.phone}</p>}
            </div>
            
            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#2C1F0E]/70">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2C1F0E]/60">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password', formData.password, 'password')}
                  className={`w-full bg-white border rounded-xl py-3 pl-10 pr-10 text-[#2C1F0E] placeholder-gray-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.password ? 'border-red-500 focus:ring-red-500/20' : 'border-[#C9A84C]/30 focus:border-brand focus:ring-brand/20'
                  }`}
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2C1F0E]/60 hover:text-[#2C1F0E] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-400 text-xs">{fieldErrors.password}</p>}
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1 bg-white rounded-full overflow-hidden flex gap-0.5">
                    {[1, 2, 3, 4].map((level) => (
                      <div 
                        key={level}
                        className={`flex-1 h-full transition-colors ${level <= passwordStrength.strength ? passwordStrength.color : 'bg-gray-700'}`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${
                    passwordStrength.strength <= 1 ? 'text-red-400' :
                    passwordStrength.strength === 2 ? 'text-yellow-400' :
                    passwordStrength.strength === 3 ? 'text-blue-400' : 'text-green-400'
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#2C1F0E]/70">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2C1F0E]/60">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full bg-white border rounded-xl py-3 pl-10 pr-10 text-[#2C1F0E] placeholder-gray-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                      ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                      : 'border-[#C9A84C]/30 focus:border-brand focus:ring-brand/20'
                  }`}
                  placeholder="Repite tu contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2C1F0E]/60 hover:text-[#2C1F0E] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {(fieldErrors.confirmPassword || (formData.confirmPassword && formData.password !== formData.confirmPassword)) && (
                <p className="text-red-400 text-xs mt-1">{fieldErrors.confirmPassword || 'Las contraseñas no coinciden'}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#C9A84C] hover:bg-[#b8943e] text-[#2C1F0E] font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#C9A84C]/20 hover:shadow-[#C9A84C]/40 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  Crear Cuenta
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Social Login Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#C9A84C]/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#2C1F0E]/70">
                o continúa con
              </span>
            </div>
          </div>

          <SocialLoginButtons onSuccess={() => navigate('/')} />

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#C9A84C]/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#2C1F0E]/70">
                ¿Ya tienes cuenta?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            to="/login"
            className="w-full block text-center py-3 rounded-xl border border-[#C9A84C]/30 text-[#2C1F0E] font-bold hover:bg-white hover:border-[#C9A84C]/50 transition-all duration-300"
          >
            Iniciar Sesión
          </Link>
        </div>

        {/* Back to Home */}
        <p className="text-center mt-6 text-[#2C1F0E]/70 text-sm">
          <Link to="/" className="hover:text-[#C9A84C] transition-colors">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
