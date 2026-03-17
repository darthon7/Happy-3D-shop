import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores';
import { validateField } from '../../lib/validation';
import SocialLoginButtons from '../../components/auth/SocialLoginButtons';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: null, password: null });
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleBlur = (field, value, type) => {
    const result = validateField(value, type);
    setFieldErrors(prev => ({ ...prev, [field]: result.error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const emailResult = validateField(email, 'email');
    const passwordResult = validateField(password, 'password');
    
    setFieldErrors({
      email: emailResult.error,
      password: passwordResult.error,
    });
    
    if (!emailResult.isValid || !passwordResult.isValid) {
      return;
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    const result = await login(normalizedEmail, password);
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
            <div className="w-12 h-12 bg-[#C9A84C] rounded-[8px] flex items-center justify-center text-white font-bold text-xl">PR</div>
            <h1 className="text-2xl font-bold text-header">PROP'S <span className="text-brand">ROOM</span></h1>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#C9A84C]/20 rounded-[8px] p-5 sm:p-8 shadow-lg">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl font-bold text-header mb-2">
              Iniciar Sesión
            </h1>
            <p className="text-[#2C1F0E]/60 text-sm">
              Ingresa tus credenciales para continuar
            </p>
          </div>
         
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-[8px] bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-500 text-sm font-medium">{error}</p>
              </div>
              <button 
                onClick={clearError} 
                className="text-red-500 hover:text-red-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#2C1F0E]/70">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2C1F0E]/50">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email', email, 'email')}
                  className={`w-full border rounded-[8px] py-3.5 pl-12 pr-4 text-header placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#C9A84C]/30 focus:border-brand focus:ring-brand/20'
                  }`}
                  placeholder="tu@email.com"
                  required
                />
              </div>
              {fieldErrors.email && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>
            
            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#2C1F0E]/70">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2C1F0E]/50">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password', password, 'password')}
                  className={`w-full border rounded-[8px] py-3.5 pl-12 pr-12 text-header placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#C9A84C]/30 focus:border-brand focus:ring-brand/20'
                  }`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2C1F0E]/50 hover:text-[#2C1F0E] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link 
                to="/forgot-password" 
                className="text-sm text-brand hover:text-[#C9A84C]-dark transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#C9A84C] hover:bg-[#b8943e] text-white font-bold py-3.5 sm:py-4 rounded-[8px] transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Social Login Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#C9A84C]/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#2C1F0E]/60">
                o continúa con
              </span>
            </div>
          </div>

          <SocialLoginButtons onSuccess={() => navigate('/')} />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#C9A84C]/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#2C1F0E]/60">
                ¿Nuevo en Prop's Room?
              </span>
            </div>
          </div>

          {/* Register Link */}
          <Link
            to="/registro"
            className="w-full block text-center py-3.5 rounded-[8px] border border-[#C9A84C]/30 text-[#2C1F0E] font-bold hover:bg-[#C9A84C]/10 hover:border-[#C9A84C]/50 transition-all duration-300"
          >
            Crear una cuenta
          </Link>
        </div>

        {/* Back to Home */}
        <p className="text-center mt-6 text-[#2C1F0E]/60 text-sm">
          <Link to="/" className="hover:text-[#C9A84C] transition-colors">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
