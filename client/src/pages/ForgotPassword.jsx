import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import authService from '../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) newErrors.email = 'Email requis';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email invalide';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Appeler le service de récupération de mot de passe
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        setSuccess(true);
      } else {
        setErrors({ submit: response.message || 'Erreur lors de la demande de réinitialisation' });
      }
    } catch (error) {
      console.error('Erreur de récupération mot de passe:', error);
      setErrors({ 
        submit: error.message || 'Erreur lors de l\'envoi du lien de réinitialisation' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    // Récupérer le token de réinitialisation depuis localStorage
    const resetData = localStorage.getItem('passwordReset');
    let resetLink = '';
    
    if (resetData) {
      const resetInfo = JSON.parse(resetData);
      resetLink = `${window.location.origin}/reset-password?token=${resetInfo.token}`;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Lien de réinitialisation généré !
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Un lien de réinitialisation a été généré pour <strong>{email}</strong>
            </p>
            <p className="mt-2 text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
              <strong>Mode Démo :</strong> Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe
            </p>
          </div>
          
          {/* Afficher le lien de réinitialisation */}
          {resetLink && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Lien de réinitialisation :</p>
              <a
                href={resetLink}
                className="text-blue-600 hover:text-blue-800 text-sm break-all underline"
              >
                {resetLink}
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(resetLink);
                  alert('Lien copié dans le presse-papiers !');
                }}
                className="mt-2 text-xs text-gray-500 hover:text-gray-700"
              >
                Copier le lien
              </button>
            </div>
          )}
          
          <div className="mt-8">
            <Link
              to="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Retour à la connexion
            </Link>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Vous n'avez pas reçu l'email ?{' '}
              <button
                onClick={() => {
                  setSuccess(false);
                  setErrors({});
                }}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Générer un nouveau lien
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link
            to="/login"
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour à la connexion
          </Link>
          
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Mot de passe oublié ?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`appearance-none block w-full px-3 py-2 pl-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="votre@email.com"
              />
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>
          
          {errors.submit && <p className="mt-2 text-sm text-red-600 text-center">{errors.submit}</p>}
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </button>
          </div>
        </form>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Vous vous souvenez de votre mot de passe ?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
