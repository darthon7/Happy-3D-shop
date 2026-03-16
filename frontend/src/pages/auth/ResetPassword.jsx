import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lock, Loader2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { validateField, validatePasswordMatch } from '../../lib/validation';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!token) {
      toast.error('Token de recuperación inválido');
      navigate('/login');
    }
  }, [token, navigate]);

  const handleBlur = (field, value, type, required = true) => {
    const result = validateField(value, type, { required });
    setFieldErrors(prev => ({ ...prev, [field]: result.error }));
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 0, label: '', color: '' };
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    
    const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
    const colors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    
    return { strength, label: labels[strength], color: colors[strength] };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    const passwordResult = validateField(password, 'password');
    const confirmResult = validatePasswordMatch(password, confirmPassword);

    if (!passwordResult.isValid) errors.password = passwordResult.error;
    if (!confirmResult.isValid) errors.confirmPassword = confirmResult.error;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: password
      });
      setIsSuccess(true);
      toast.success('Contraseña actualizada exitosamente');
    } catch (error) {
      console.error('Error:', error);
      const message = error.response?.data?.message || 'Error al restablecer la contraseña';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col">
        <div className="flex-grow flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-black text-white mb-4">¡Contraseña Restablecida!</h1>
            <p className="text-text-secondary mb-8">
              Tu contraseña ha sido actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.
            </p>
            <Link
              to="/login"
              className="inline-block bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-lg transition-all duration-300"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Effects matching Login/Register */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 w-full max-w-md px-4 py-12">
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-text-secondary hover:text-white mb-6 sm:mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a iniciar sesión
        </Link>

        {/* Card matching Login/Register style */}
        <div className="bg-surface/50 backdrop-blur-xl border border-border rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/20">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Nueva Contraseña</h1>
            <p className="text-text-secondary text-sm">
              Ingresa tu nueva contraseña para recuperar tu cuenta.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-secondary">
                Nueva contraseña
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <Lock className="w-5 h-5" />
                </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => handleBlur('password', password, 'password')}
                    placeholder="Mínimo 8 caracteres"
                    minLength={8}
                    required
                    className={`w-full bg-surface-elevated border rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-border focus:border-primary focus:ring-primary/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>}
                
                {/* Password Strength Indicator */}
                {password && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1 bg-surface-elevated rounded-full overflow-hidden flex gap-0.5">
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

              <div className="space-y-2 mt-4">
                <label className="block text-sm font-medium text-text-secondary">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    required
                    className={`w-full bg-surface-elevated border rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                      confirmPassword && password !== confirmPassword 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                        : confirmPassword && password === confirmPassword
                        ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                        : 'border-border focus:border-primary focus:ring-primary/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {(fieldErrors.confirmPassword || (confirmPassword && password !== confirmPassword)) && (
                  <p className="text-red-400 text-xs mt-1">{fieldErrors.confirmPassword || 'Las contraseñas no coinciden'}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !token}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 mt-4"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  'Restablecer Contraseña'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
  );
};

export default ResetPassword;
