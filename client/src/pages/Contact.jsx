import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Phone, MapPin, Clock, Send, User, MessageSquare, Facebook, Instagram, Twitter, Share2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5003/api';

// Marqueur de version — si vous voyez cette ligne dans la console, le nouveau code est bien chargé
console.log('%c[Contact] V2 chargé — axios dynamique actif', 'color: green; font-weight: bold');

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'L\'email est invalide';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Le sujet est requis';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Le message est requis';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Le message doit contenir au moins 10 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/contact`, formData);
      console.log('[Contact] Message envoyé, ID:', response.data?.id);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('[Contact] ERREUR envoi:', error);
      console.error('[Contact] Réponse serveur:', error.response?.data);
      console.error('[Contact] Statut HTTP:', error.response?.status);
      let msg;
      if (error.response?.status === 429) {
        msg = 'Trop de tentatives. Veuillez patienter quelques minutes.';
      } else if (error.response?.status === 400) {
        const details = error.response.data?.details;
        msg = details?.[0]?.msg || error.response.data?.message || 'Données invalides.';
      } else if (!error.response) {
        msg = 'Impossible de contacter le serveur. Vérifiez qu\'il est démarré sur le port 5003.';
      } else {
        msg = error.response?.data?.message || error.response?.data?.error || 'Une erreur est survenue. Veuillez réessayer.';
      }
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-luxury font-bold text-neutral-900 mb-4">
            Message Envoyé !
          </h2>
          <p className="text-neutral-600 mb-6">
            Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="btn-luxury"
          >
            Envoyer un autre message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-100">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-luxury font-bold text-neutral-900 mb-2">
            Contact
          </h1>
          <p className="text-lg text-neutral-600">
            Nous sommes là pour répondre à toutes vos questions
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-luxury font-bold text-neutral-900 mb-6">
                Entrons en Contact
              </h2>
              <p className="text-neutral-600 mb-8">
                Que vous ayez une question sur nos produits, besoin d'aide pour une commande 
                ou souhaitiez simplement en savoir plus sur BOURBON MORELLI, notre équipe est 
                à votre disposition.
              </p>
            </div>

            {/* Contact Cards */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Email</h3>
                  <p className="text-neutral-600">contact@bourbonmorelli.com</p>
                  <p className="text-sm text-neutral-500">Réponse sous 24h</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Téléphone</h3>
                  <p className="text-neutral-600">+33 1 23 45 67 89</p>
                  <p className="text-sm text-neutral-500">Lundi-vendredi 9h-18h</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Share2 className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Réseaux sociaux</h3>
                  <div className="flex space-x-3">
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-primary-500 transition-colors">
                      <Facebook className="w-5 h-5" />
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-primary-500 transition-colors">
                      <Instagram className="w-5 h-5" />
                    </a>
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-neutral-600 hover:text-primary-500 transition-colors">
                      <Twitter className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Boutique bourbon Morelli</h3>
                  <p className="text-neutral-600">
                    101 By Pass <br />
                    Antananarivo, Madagascar
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">Horaires d'Ouverture</h3>
                  <p className="text-neutral-600">
                    Mardi - Samedi: 10h - 19h<br />
                    Dimanche: Fermé
                  </p>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="pt-8 border-t border-neutral-200">
              <h3 className="font-semibold text-neutral-900 mb-4">Suivez-nous</h3>
              <p className="text-neutral-600 mb-4">
                Restez connecté avec l'actualité BOURBON MORELLI
              </p>
              <div className="flex space-x-4">
                <button 
                  className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center hover:bg-primary-500 hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <span className="text-sm font-medium">f</span>
                </button>
                <button 
                  className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center hover:bg-primary-500 hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <span className="text-sm font-medium">ig</span>
                </button>
                <button 
                  className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center hover:bg-primary-500 hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <span className="text-sm font-medium">tw</span>
                </button>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-luxury font-bold text-neutral-900 mb-6">
                Envoyez-nous un Message
              </h2>

              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{errors.general}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Nom complet
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`input-luxury pl-10 ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="Jean Dupont"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

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
                    Sujet
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className={`input-luxury ${errors.subject ? 'border-red-500' : ''}`}
                  >
                    <option value="">Sélectionnez un sujet</option>
                    <option value="order">Question sur une commande</option>
                    <option value="product">Information sur un produit</option>
                    <option value="return">Retour ou échange</option>
                    <option value="partnership">Partenariat</option>
                    <option value="other">Autre</option>
                  </select>
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Message
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                    <textarea
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      className={`input-luxury pl-10 resize-none ${errors.message ? 'border-red-500' : ''}`}
                      rows={6}
                      placeholder="Votre message..."
                    />
                  </div>
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Envoyer le message</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm text-neutral-600">
                  En soumettant ce formulaire, vous acceptez notre{' '}
                  <a href="/privacy" className="text-primary-500 hover:text-primary-600">
                    politique de confidentialité
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
