import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, Send } from 'lucide-react';
import authService from '../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [resetData, setResetData] = useState(null); // { devResetLink? }

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
      const response = await authService.forgotPassword(email);
      setResetData(response);
    } catch (error) {
      setErrors({ submit: error.message || 'Erreur lors de l\'envoi du lien' });
    } finally {
      setLoading(false);
    }
  };

  // Écran de confirmation après envoi
  if (resetData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-neutral-900 mb-3">
              Email envoyé !
            </h2>
            <p className="text-neutral-600 mb-2">
              Un lien de réinitialisation a été envoyé à
            </p>
            <p className="font-semibold text-neutral-900 mb-4">{email}</p>
            <p className="text-sm text-neutral-500 mb-8">
              Vérifiez votre boîte de réception et cliquez sur le lien pour définir
              un nouveau mot de passe. Le lien est valable <strong>1 heure</strong>.
            </p>


            <Link
              to="/login"
              className="block w-full py-3 px-4 bg-neutral-900 text-white text-center rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors mb-4"
            >
              Retour à la connexion
            </Link>

            <button
              onClick={() => { setResetData(null); setErrors({}); }}
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              Vous n'avez pas reçu l'email ? Renvoyer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Formulaire de demande
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <Link
            to="/login"
            className="flex items-center text-sm text-neutral-500 hover:text-neutral-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour à la connexion
          </Link>

          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-neutral-600" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-neutral-900 text-center mb-2">
              Mot de passe oublié ?
            </h2>
            <p className="text-sm text-neutral-500 text-center">
              Entrez votre adresse email. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Adresse email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                  className={`w-full px-4 py-3 pl-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 ${
                    errors.email ? 'border-red-400' : 'border-neutral-300'
                  }`}
                  placeholder="votre@email.com"
                  autoComplete="email"
                  autoFocus
                />
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {errors.submit && (
              <p className="text-sm text-red-600 text-center">{errors.submit}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer le lien de réinitialisation
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-500">
            Vous vous souvenez de votre mot de passe ?{' '}
            <Link to="/login" className="font-medium text-neutral-900 hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
