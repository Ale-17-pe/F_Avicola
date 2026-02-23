import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, AlertCircle, Shield, Mail, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import logoImage from '../assets/AvicolaLogo.png';
import avicolaBackground from 'figma:asset/fa25e4c6806fdd3db2dbb1c20513fce22ccd856a.png';

export function Login() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; code?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'login' | '2fa' | 'recover'>('login');
  const [code2FA, setCode2FA] = useState(['', '', '', '', '', '']);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [credencialesTemporales, setCredencialesTemporales] = useState<{username: string, password: string} | null>(null);
  
  // Estados para recuperación de contraseña
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverCode, setRecoverCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [recoverStep, setRecoverStep] = useState<'email' | 'code' | 'password'>('email');
  const [recoverErrors, setRecoverErrors] = useState<{ email?: string; code?: string; password?: string; confirm?: string }>({});
  const [recoverSuccess, setRecoverSuccess] = useState(false);

  useEffect(() => {
    document.title = "Iniciar Sesión | Avícola Jossy";
  }, []);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'El usuario es requerido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    // Simulación de llamada a API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Verificar credenciales
    const loginExitoso = login(email, password);
    
    if (loginExitoso) {
      // Obtener el rol del usuario que acaba de hacer login
      const usuarioInfo = [
        { username: 'admin', rol: 'administrador' },
        { username: 'secretaria', rol: 'secretaria' },
        { username: 'operador', rol: 'operador' },
        { username: 'conductor', rol: 'conductor' },
        { username: 'cobranza', rol: 'cobranza' },
      ].find(u => u.username === email);
      
      if (usuarioInfo?.rol === 'operador') {
        setIsLoading(false);
        navigate('/dashboard-operador');
        return;
      }

      if (usuarioInfo?.rol === 'conductor') {
        setIsLoading(false);
        navigate('/dashboard-conductor');
        return;
      }

      if (usuarioInfo?.rol === 'cobranza') {
        setIsLoading(false);
        navigate('/dashboard-cobranza');
        return;
      }
      
      // Para otros roles, hacer logout temporal y continuar con 2FA
      logout();
      setCredencialesTemporales({ username: email, password: password });
      setIsLoading(false);
      setStep('2fa');
      setTimeout(() => {
        if (inputsRef.current[0]) {
          inputsRef.current[0].focus();
        }
      }, 100);
    } else {
      // Credenciales incorrectas - mostrar alerta
      setIsLoading(false);
      setErrors({ general: 'Usuario o contraseña incorrectos' });
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const fullCode = code2FA.join('');
    
    if (fullCode.length !== 6) {
      setErrors({ code: 'Por favor ingrese los 6 dígitos' });
      return;
    }

    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (fullCode === '123456') {
      if (credencialesTemporales) {
        const loginExitoso = login(credencialesTemporales.username, credencialesTemporales.password);
        
        if (loginExitoso) {
          setIsLoading(false);
          if (credencialesTemporales.username === 'secretaria') {
            navigate('/dashboard-secretaria');
          } else if (credencialesTemporales.username === 'conductor') {
            navigate('/dashboard-conductor');
          } else if (credencialesTemporales.username === 'cobranza') {
            navigate('/dashboard-cobranza');
          } else {
            navigate('/dashboard');
          }
        } else {
          setIsLoading(false);
          setErrors({ general: 'Credenciales incorrectas' });
          setStep('login');
        }
      }
    } else {
      setIsLoading(false);
      setErrors({ code: 'Código incorrecto. Intente nuevamente.' });
      setCode2FA(['', '', '', '', '', '']);
      if (inputsRef.current[0]) {
        inputsRef.current[0].focus();
      }
    }
  };

  const handle2FAChange = (index: number, value: string) => {
    const newCode2FA = [...code2FA];
    newCode2FA[index] = value;
    setCode2FA(newCode2FA);

    if (value && index < 5) {
      const nextInput = inputsRef.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  // Funciones para recuperación de contraseña
  const handleRecoverEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recoverEmail) {
      setRecoverErrors({ email: 'El correo es requerido' });
      return;
    }

    // Validar que sea un correo corporativo
    if (!recoverEmail.endsWith('@avicolajossy.com')) {
      setRecoverErrors({ email: 'Debe usar un correo corporativo (@avicolajossy.com)' });
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simular envío de código a secretaria@avicolajossy.com
    console.log(`Código de recuperación enviado a secretaria@avicolajossy.com para el usuario ${recoverEmail}`);
    
    setIsLoading(false);
    setRecoverStep('code');
    setRecoverErrors({});
    
    // Auto-focus en el primer input del código
    setTimeout(() => {
      if (inputsRef.current[0]) {
        inputsRef.current[0].focus();
      }
    }, 100);
  };

  const handleRecoverCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const fullCode = recoverCode.join('');
    
    if (fullCode.length !== 6) {
      setRecoverErrors({ code: 'Por favor ingrese los 6 dígitos' });
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Código de prueba: 123456
    if (fullCode === '123456') {
      setIsLoading(false);
      setRecoverStep('password');
      setRecoverErrors({});
    } else {
      setIsLoading(false);
      setRecoverErrors({ code: 'Código incorrecto' });
      setRecoverCode(['', '', '', '', '', '']);
    }
  };

  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { password?: string; confirm?: string } = {};
    
    if (!newPassword) {
      newErrors.password = 'La nueva contraseña es requerida';
    } else if (newPassword.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    if (newPassword !== confirmPassword) {
      newErrors.confirm = 'Las contraseñas no coinciden';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setRecoverErrors(newErrors);
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Aquí iría la lógica para actualizar la contraseña
    setRecoverSuccess(true);
    setIsLoading(false);
    
    // Cerrar modal después de 2 segundos
    setTimeout(() => {
      setShowRecoverModal(false);
      setRecoverSuccess(false);
      setRecoverStep('email');
      setRecoverEmail('');
      setRecoverCode(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
    }, 2000);
  };

  const closeRecoverModal = () => {
    setShowRecoverModal(false);
    setRecoverStep('email');
    setRecoverEmail('');
    setRecoverCode(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setRecoverErrors({});
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Imagen de fondo (sin cambios) */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src={avicolaBackground}
          alt="Gallinas Avícola"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ 
          background: 'linear-gradient(to right, rgba(0, 0, 0, 0.85), rgba(15, 10, 0, 0.80), rgba(25, 20, 0, 0.75))' 
        }}></div>
        
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 animate-float"
              style={{
                width: `${Math.random() * 6 + 4}px`,
                height: `${Math.random() * 6 + 4}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 10 + 10}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Modal de Recuperación de Contraseña */}
      {showRecoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeRecoverModal}
          />
          
          <div 
            className="relative z-10 w-full max-w-md rounded-2xl shadow-2xl p-8"
            style={{
              background: 'rgba(0, 0, 0, 0.95)',
              border: '1px solid rgba(204, 170, 0, 0.2)',
              boxShadow: '0 8px 32px 0 rgba(13, 74, 36, 0.5)'
            }}
          >
            {/* Botón cerrar */}
            <button
              onClick={closeRecoverModal}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: '#9ca3af' }}
            >
              <X className="w-5 h-5" />
            </button>

            {recoverSuccess ? (
              <div className="text-center py-8">
                <div 
                  className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '2px solid #22c55e'
                  }}
                >
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">¡Contraseña Actualizada!</h3>
                <p className="text-gray-400">Ya puedes iniciar sesión con tu nueva contraseña</p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-white mb-6 text-center">
                  Recuperar Contraseña
                </h3>

                {recoverStep === 'email' && (
                  <form onSubmit={handleRecoverEmailSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#ccaa00' }}>
                        Correo Corporativo
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5" style={{ color: '#b8941e' }} />
                        </div>
                        <input
                          type="email"
                          value={recoverEmail}
                          onChange={(e) => setRecoverEmail(e.target.value)}
                          className="block w-full pl-12 pr-4 py-3.5 text-white rounded-lg focus:ring-2 focus:border-transparent transition-all placeholder-gray-400"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: recoverErrors.email ? '#ef4444' : 'rgba(255, 255, 255, 0.1)',
                            outlineColor: '#ccaa00'
                          }}
                          placeholder="usuario@avicolajossy.com"
                        />
                      </div>
                      {recoverErrors.email && (
                        <p className="mt-2 text-red-400 text-sm">{recoverErrors.email}</p>
                      )}
                    </div>

                    <p className="text-sm text-gray-400 text-center">
                      Se enviará un código de verificación al correo de la secretaria para autorizar el cambio
                    </p>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 px-4 rounded-lg font-bold shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                      style={{
                        background: 'linear-gradient(to right, #0d4a24, #166534)',
                        color: '#ffffff'
                      }}
                    >
                      {isLoading ? 'Enviando...' : 'ENVIAR CÓDIGO'}
                    </button>
                  </form>
                )}

                {recoverStep === 'code' && (
                  <form onSubmit={handleRecoverCodeSubmit} className="space-y-6">
                    <div className="text-center mb-4">
                      <p className="text-white">Se ha enviado un código a:</p>
                      <p className="font-medium" style={{ color: '#ccaa00' }}>secretaria@avicolajossy.com</p>
                    </div>

                    <div>
                      <div className="flex justify-center gap-2 sm:gap-3 mb-4">
                        {recoverCode.map((digit, index) => (
                          <input
                            key={index}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={digit}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '');
                              if (value.length <= 1) {
                                const newCode = [...recoverCode];
                                newCode[index] = value;
                                setRecoverCode(newCode);
                                if (value && index < 5) {
                                  const nextInput = inputsRef.current[index + 1];
                                  if (nextInput) nextInput.focus();
                                }
                              }
                            }}
                            ref={(el) => { inputsRef.current[index] = el; }}
                            className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold text-white rounded-lg sm:rounded-xl"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              borderWidth: '2px',
                              borderStyle: 'solid',
                              borderColor: digit 
                                ? 'rgba(204, 170, 0, 0.5)' 
                                : recoverErrors.code 
                                  ? '#ef4444' 
                                  : 'rgba(255, 255, 255, 0.1)'
                            }}
                            maxLength={1}
                          />
                        ))}
                      </div>
                      {recoverErrors.code && (
                        <p className="text-red-400 text-sm text-center mb-4">{recoverErrors.code}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 px-4 rounded-lg font-bold shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                      style={{
                        background: 'linear-gradient(to right, #0d4a24, #166534)',
                        color: '#ffffff'
                      }}
                    >
                      {isLoading ? 'Verificando...' : 'VERIFICAR CÓDIGO'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecoverStep('email')}
                      className="w-full text-sm transition-colors hover:underline"
                      style={{ color: '#ccaa00' }}
                    >
                      ← Volver
                    </button>
                  </form>
                )}

                {recoverStep === 'password' && (
                  <form onSubmit={handleNewPasswordSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#ccaa00' }}>
                        Nueva Contraseña
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5" style={{ color: '#b8941e' }} />
                        </div>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="block w-full pl-12 pr-4 py-3.5 text-white rounded-lg"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: recoverErrors.password ? '#ef4444' : 'rgba(255, 255, 255, 0.1)',
                            outlineColor: '#ccaa00'
                          }}
                          placeholder="••••••••"
                        />
                      </div>
                      {recoverErrors.password && (
                        <p className="mt-2 text-red-400 text-sm">{recoverErrors.password}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#ccaa00' }}>
                        Confirmar Contraseña
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5" style={{ color: '#b8941e' }} />
                        </div>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="block w-full pl-12 pr-4 py-3.5 text-white rounded-lg"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: recoverErrors.confirm ? '#ef4444' : 'rgba(255, 255, 255, 0.1)',
                            outlineColor: '#ccaa00'
                          }}
                          placeholder="••••••••"
                        />
                      </div>
                      {recoverErrors.confirm && (
                        <p className="mt-2 text-red-400 text-sm">{recoverErrors.confirm}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 px-4 rounded-lg font-bold shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                      style={{
                        background: 'linear-gradient(to right, #0d4a24, #166534)',
                        color: '#ffffff'
                      }}
                    >
                      {isLoading ? 'Actualizando...' : 'ACTUALIZAR CONTRASEÑA'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecoverStep('code')}
                      className="w-full text-sm transition-colors hover:underline"
                      style={{ color: '#ccaa00' }}
                    >
                      ← Volver
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Contenido principal (con alerta de error y enlace de recuperación) */}
      <div className="relative z-10 w-full flex flex-col lg:flex-row">
        
        {/* Lado Izquierdo - Logo y Branding (sin cambios) */}
        <div className="lg:w-1/2 flex flex-col lg:justify-center lg:items-center px-8 py-6 lg:py-0">
          <div className="flex lg:hidden items-start justify-between mb-6">
            <div>
              <img 
                src={logoImage} 
                alt="Avícola Jossy" 
                className="w-20 h-auto"
                style={{
                  filter: 'drop-shadow(0 10px 20px rgba(255, 215, 0, 0.4)) contrast(1.1)',
                  imageRendering: 'crisp-edges',
                  WebkitFontSmoothing: 'antialiased',
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(0)',
                }}
              />
            </div>
            <div className="text-right">
              <h1 className="text-lg font-bold leading-tight">
                <div style={{ color: '#22c55e' }}>AVÍCOLA</div>
                <div style={{ color: '#ccaa00' }}>JOSSY</div>
              </h1>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-center">
            <div className="animate-float-logo mb-6">
              <img 
                src={logoImage} 
                alt="Avícola Jossy" 
                className="w-64 h-auto lg:w-80"
                style={{
                  filter: 'drop-shadow(0 25px 50px rgba(255, 215, 0, 0.4)) contrast(1.1)',
                  imageRendering: 'crisp-edges',
                  WebkitFontSmoothing: 'antialiased',
                  backfaceVisibility: 'hidden',
                  transform: 'translateZ(0)',
                }}
              />
            </div>
            <div className="text-center">
              <h1 className="text-4xl font-bold">
                <span style={{ color: '#22c55e' }}>AVÍCOLA </span>
                <span style={{ color: '#ccaa00' }}>JOSSY</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Lado Derecho - Formulario de Login */}
        <div className="lg:w-1/2 flex items-center justify-center px-6 py-6 lg:py-0">
          <div className="w-full max-w-md">
            {/* Card de Login */}
            <div className="backdrop-blur-xl rounded-2xl shadow-2xl p-8 lg:p-10" style={{ 
              background: 'rgba(0, 0, 0, 0.15)',
              boxShadow: '0 8px 32px 0 rgba(13, 74, 36, 0.3), inset 0 1px 1px 0 rgba(204, 170, 0, 0.1)'
            }}>
              {/* Header */}
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Iniciar Sesión</h2>
                <p className="text-gray-300">Sistema de Gestión Empresarial</p>
              </div>

              {/* Alerta de error general */}
              {errors.general && (
                <div 
                  className="mb-6 p-4 rounded-lg flex items-center gap-3"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm flex-1">{errors.general}</p>
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={step === 'login' ? handleSubmit : handle2FASubmit} className="space-y-6">
                {step === 'login' && (
                  <>
                    {/* Campo de Usuario */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ 
                        color: '#ccaa00'
                      }}>
                        Usuario
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="h-5 w-5" style={{ color: '#b8941e' }} />
                        </div>
                        <input
                          id="email"
                          type="text"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full pl-12 pr-4 py-3.5 text-white rounded-lg focus:ring-2 focus:border-transparent transition-all placeholder-gray-400"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: errors.email ? '#ef4444' : 'rgba(255, 255, 255, 0.1)',
                            outlineColor: '#ccaa00'
                          }}
                          placeholder="Ingrese su usuario"
                        />
                      </div>
                      {errors.email && (
                        <div className="mt-2 flex items-center gap-1 text-red-400 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Campo de Contraseña */}
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ 
                        color: '#ccaa00'
                      }}>
                        Contraseña
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5" style={{ color: '#b8941e' }} />
                        </div>
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full pl-12 pr-12 py-3.5 text-white rounded-lg focus:ring-2 focus:border-transparent transition-all placeholder-gray-400"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: errors.password ? '#ef4444' : 'rgba(255, 255, 255, 0.1)',
                            outlineColor: '#ccaa00'
                          }}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 transition-colors" style={{ color: '#9ca3af' }} />
                          ) : (
                            <Eye className="h-5 w-5 transition-colors" style={{ color: '#9ca3af' }} />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <div className="mt-2 flex items-center gap-1 text-red-400 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.password}</span>
                        </div>
                      )}
                    </div>

                    {/* Enlace de recuperación */}
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setShowRecoverModal(true)}
                        className="text-sm transition-colors hover:underline focus:outline-none"
                        style={{ color: '#ccaa00' }}
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  </>
                )}

                {step === '2fa' && (
                  <>
                    {/* Icono de Seguridad */}
                    <div className="flex justify-center mb-6">
                      <div 
                        className="w-20 h-20 rounded-full flex items-center justify-center animate-pulse"
                        style={{
                          background: 'linear-gradient(135deg, rgba(204, 170, 0, 0.2), rgba(204, 170, 0, 0.1))',
                          border: '2px solid rgba(204, 170, 0, 0.5)'
                        }}
                      >
                        <Shield className="w-10 h-10" style={{ color: '#ccaa00' }} />
                      </div>
                    </div>

                    <div className="text-center mb-6">
                      <p className="text-white font-medium mb-2">Verificación de Dos Pasos</p>
                      <p className="text-gray-400 text-sm">
                        Ingrese el código de 6 dígitos enviado a su dispositivo
                      </p>
                    </div>

                    {/* Campo de Código 2FA */}
                    <div>
                      <div className="flex justify-center gap-2 sm:gap-3 mb-4">
                        {code2FA.map((digit, index) => (
                          <input
                            key={index}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={digit}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '');
                              if (value.length <= 1) {
                                handle2FAChange(index, value);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Backspace' && !code2FA[index] && index > 0) {
                                const prevInput = inputsRef.current[index - 1];
                                if (prevInput) {
                                  prevInput.focus();
                                }
                              }
                            }}
                            ref={(el) => { inputsRef.current[index] = el; }}
                            className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold text-white rounded-lg sm:rounded-xl focus:ring-2 focus:border-transparent transition-all"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              borderWidth: '2px',
                              borderStyle: 'solid',
                              borderColor: digit 
                                ? 'rgba(204, 170, 0, 0.5)' 
                                : errors.code 
                                  ? '#ef4444' 
                                  : 'rgba(255, 255, 255, 0.1)',
                              outlineColor: '#ccaa00'
                            }}
                            maxLength={1}
                            autoComplete="off"
                          />
                        ))}
                      </div>
                      {errors.code && (
                        <div className="flex items-center justify-center gap-2 text-red-400 text-sm mb-4">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.code}</span>
                        </div>
                      )}
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setStep('login')}
                          className="text-sm transition-colors hover:underline"
                          style={{ color: '#ccaa00' }}
                        >
                          ← Volver al inicio de sesión
                        </button>
                      </div>
                    </div>

                    {/* Ayuda adicional */}
                    <div 
                      className="p-4 rounded-lg"
                      style={{
                        background: 'rgba(204, 170, 0, 0.1)',
                        border: '1px solid rgba(204, 170, 0, 0.2)'
                      }}
                    >
                      <p className="text-xs text-gray-300 text-center">
                        💡 <span className="font-medium" style={{ color: '#ccaa00' }}>Código de prueba:</span> 123456
                      </p>
                    </div>
                  </>
                )}

                {/* Botón de Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-4 rounded-lg font-bold shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                  style={{
                    background: 'linear-gradient(to right, #0d4a24, #166534, #b8941e, #ccaa00)',
                    color: '#ffffff',
                    boxShadow: '0 10px 25px -5px rgba(13, 74, 36, 0.4)',
                    ringColor: '#166534',
                    ringOffsetColor: '#000000'
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: '#ffffff' }}>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verificando...
                    </span>
                  ) : (
                    step === 'login' ? 'INICIAR SESIÓN' : 'VERIFICAR CÓDIGO'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}