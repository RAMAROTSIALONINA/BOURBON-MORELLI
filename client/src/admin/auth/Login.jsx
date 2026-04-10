import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur quand l'utilisateur tape
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'L\'email est invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (!isLogin) {
      if (!formData.first_name) {
        newErrors.first_name = 'Le prénom est requis';
      }
      if (!formData.last_name) {
        newErrors.last_name = 'Le nom est requis';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        // Connexion
        const response = await fetch('http://localhost:5003/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Erreur de connexion');
        }

        // Vérifier si c'est un admin ou un utilisateur normal
        if (data.user.role === 'admin') {
          // Stocker le token admin
          localStorage.setItem('adminToken', data.token);
          localStorage.setItem('adminUser', JSON.stringify({
            id: data.user.id,
            name: `${data.user.first_name} ${data.user.last_name}`,
            email: data.user.email,
            role: 'admin'
          }));
          navigate('/admin/dashboard');
        } else {
          // Stocker le token utilisateur
          localStorage.setItem('userToken', data.token);
          localStorage.setItem('user', JSON.stringify({
            id: data.user.id,
            name: `${data.user.first_name} ${data.user.last_name}`,
            email: data.user.email,
            role: 'customer'
          }));
          navigate('/account');
        }
      } else {
        // Inscription
        const response = await fetch('http://localhost:5003/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Erreur lors de l\'inscription');
        }

        // Stocker le token utilisateur après inscription
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('user', JSON.stringify({
          id: data.user.id,
          name: `${data.user.first_name} ${data.user.last_name}`,
          email: data.user.email,
          role: 'customer'
        }));
        
        navigate('/account');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setErrors({ general: error.message || 'Une erreur est survenue. Veuillez réessayer.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl font-luxury">BM</span>
            </div>
            <span className="text-2xl font-luxury font-bold text-neutral-900">
              BOURBON MORELLI
            </span>
          </div>
          
          <h2 className="text-3xl font-luxury font-bold text-neutral-900">
            {isLogin ? 'Connexion' : 'Inscription'}
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            {isLogin 
              ? 'Connectez-vous à votre compte' 
              : 'Créez votre compte BOURBON MORELLI'
            }
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <span className="text-red-600 text-sm">{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Prénom
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        className={`input-luxury pl-10 ${errors.first_name ? 'border-red-500' : ''}`}
                        placeholder="Jean"
                      />
                    </div>
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className={`input-luxury ${errors.last_name ? 'border-red-500' : ''}`}
                      placeholder="Dupont"
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`input-luxury pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="jean.dupont@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`input-luxury pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="•••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Téléphone (optionnel)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="input-luxury"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300 rounded"
                  />
                  <label htmlFor="remember" className="ml-2 block text-sm text-neutral-700">
                    Se souvenir de moi
                  </label>
                </div>

                <Link to="/forgot-password" className="text-sm text-primary-500 hover:text-primary-600">
                  Mot de passe oublié ?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isLogin ? 'Connexion...' : 'Inscription...'}</span>
                </div>
              ) : (
                <span>{isLogin ? 'Se connecter' : 'S\'inscrire'}</span>
              )}
            </button>
          </form>

          {/* Switch entre login/inscription */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              {isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                  setFormData({
                    email: '',
                    password: '',
                    first_name: '',
                    last_name: '',
                    phone: ''
                  });
                }}
                className="ml-1 text-primary-500 hover:text-primary-600 font-medium"
              >
                {isLogin ? 'Inscrivez-vous' : 'Connectez-vous'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-neutral-500">
            En vous connectant, vous acceptez nos{' '}
            <Link to="/terms" className="text-primary-500 hover:text-primary-600">
              conditions d'utilisation
            </Link>{' '}
            et notre{' '}
            <Link to="/privacy" className="text-primary-500 hover:text-primary-600">
              politique de confidentialité
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
