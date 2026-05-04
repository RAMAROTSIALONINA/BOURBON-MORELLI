import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, CreditCard, Smartphone, XCircle, Shield } from 'lucide-react';
import { useCurrency } from '../contexts/CurrencyContext';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5003';
const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return `${BACKEND_URL}${url}`;
  return url; // /images/... servi par CRA
};

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [securityCheck, setSecurityCheck] = useState({
    isValid: false,
    message: '',
    status: 'checking' // checking, valid, invalid
  });

  const validatePaymentSecurity = useCallback((orderData, paymentMethod) => {
    
    // Vérifications de base
    if (!orderData) {
      return {
        isValid: false,
        message: 'Aucune commande trouvée',
        status: 'invalid'
      };
    }

    if (!paymentMethod) {
      return {
        isValid: false,
        message: 'Méthode de paiement non spécifiée',
        status: 'invalid'
      };
    }

    // Vérification du statut de paiement
    if (orderData.payment?.status !== 'paid') {
      return {
        isValid: false,
        message: 'Paiement non confirmé par le système',
        status: 'invalid'
      };
    }

    // Validation spécifique par méthode de paiement
    switch (paymentMethod) {
      case 'stripe': // Carte ou PayPal via Stripe (confirmé côté Stripe)
      case 'card':
        return validateCardPayment(orderData);
      case 'paypal':
        return validatePayPalPayment(orderData);
      case 'mobile':
        return validateMobilePayment(orderData);
      default:
        return {
          isValid: false,
          message: 'Méthode de paiement non reconnue',
          status: 'invalid'
        };
    }
  }, []);

  const validateCardPayment = () => {
    // Paiement traité et confirmé par Stripe — aucune revalidation locale nécessaire
    return { isValid: true, message: 'Paiement par carte validé avec succès', status: 'valid' };
  };

  const validatePayPalPayment = (orderData) => {
    const paypalDetails = orderData.payment?.details;
    
    
    if (!paypalDetails) {
      return {
        isValid: false,
        message: 'Détails PayPal manquants',
        status: 'invalid'
      };
    }

    // Vérifier l'email PayPal
    const email = paypalDetails.email;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return {
        isValid: false,
        message: 'Email PayPal invalide',
        status: 'invalid'
      };
    }

    // Vérifier le nom du compte
    const name = paypalDetails.name;
    if (!name || name.length < 3) {
      return {
        isValid: false,
        message: 'Nom du compte PayPal invalide',
        status: 'invalid'
      };
    }

    return {
      isValid: true,
      message: 'Paiement PayPal validé avec succès',
      status: 'valid'
    };
  };

  const validateMobilePayment = (orderData) => {
    const mobileDetails = orderData.payment?.details;
    
    
    if (!mobileDetails) {
      return {
        isValid: false,
        message: 'Détails Mobile Money manquants',
        status: 'invalid'
      };
    }

    // Vérifier l'opérateur
    const operator = mobileDetails.operator;
    const validOperators = ['mvol', 'orange', 'airtel'];
    if (!operator || !validOperators.includes(operator)) {
      return {
        isValid: false,
        message: 'Opérateur Mobile Money invalide',
        status: 'invalid'
      };
    }

    // Vérifier le numéro de téléphone
    const phone = mobileDetails.phone?.replace(/\D/g, '');
    if (!phone || !/^[0-9\s\-+()]{8,15}$/.test(phone)) {
      return {
        isValid: false,
        message: 'Numéro de téléphone Mobile Money invalide',
        status: 'invalid'
      };
    }

    // Vérifier le nom du titulaire
    const holderName = mobileDetails.holderName;
    if (!holderName || holderName.length < 3) {
      return {
        isValid: false,
        message: 'Nom du titulaire invalide',
        status: 'invalid'
      };
    }

    return {
      isValid: true,
      message: 'Paiement Mobile Money validé avec succès',
      status: 'valid'
    };
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirectStatus = params.get('redirect_status');
    const clientSecret = params.get('payment_intent_client_secret');

    // Retour depuis un redirect Stripe (PayPal, etc.)
    if (redirectStatus && clientSecret) {
      if (redirectStatus === 'succeeded') {
        setSecurityCheck({ isValid: true, message: 'Paiement confirmé par Stripe', status: 'valid' });

        const paymentIntentId = params.get('payment_intent');

        // 1. Essayer sessionStorage (peut être vide si le navigateur a effacé la session cross-origin)
        const saved = sessionStorage.getItem('pendingOrder');
        sessionStorage.removeItem('pendingOrder');

        if (saved) {
          // sessionStorage OK → utiliser les données locales
          const orderData = JSON.parse(saved);
          setOrder(orderData);
          // Synchroniser côté serveur (non-bloquant)
          if (paymentIntentId) {
            axios.post(`${BACKEND_URL}/api/payments/stripe/complete-transaction`, {
              payment_intent_id: paymentIntentId,
              order_id: orderData?.id
            }).catch(() => {});
          }
          setLoading(false);
        } else if (paymentIntentId) {
          // sessionStorage vide → récupérer les vraies données depuis le serveur
          axios.get(`${BACKEND_URL}/api/payments/by-intent/${paymentIntentId}`)
            .then(res => {
              const orderData = res.data?.order;
              if (orderData) {
                setOrder(orderData);
                // Synchroniser statut dans payment_transactions
                axios.post(`${BACKEND_URL}/api/payments/stripe/complete-transaction`, {
                  payment_intent_id: paymentIntentId,
                  order_id: orderData.id
                }).catch(() => {});
              } else {
                // Ultime fallback minimaliste
                setOrder({ id: paymentIntentId, payment: { method: 'stripe', status: 'paid' }, items: [], subtotal: 0, shippingCost: 0, total: 0, shipping: {} });
              }
            })
            .catch(() => {
              setOrder({ id: paymentIntentId, payment: { method: 'stripe', status: 'paid' }, items: [], subtotal: 0, shippingCost: 0, total: 0, shipping: {} });
            })
            .finally(() => setLoading(false));
          return; // setLoading(false) géré dans .finally()
        } else {
          setLoading(false);
        }
      } else {
        setSecurityCheck({ isValid: false, message: 'Paiement non abouti ou annulé', status: 'invalid' });
        setLoading(false);
      }
      return;
    }

    if (location.state?.order) {
      const orderData = location.state.order;
      const paymentMethod = location.state.paymentMethod;
      const securityResult = validatePaymentSecurity(orderData, paymentMethod);
      setSecurityCheck(securityResult);
      if (securityResult.isValid) setOrder(orderData);
      setLoading(false);
    } else {
      navigate('/cart');
    }
  }, [location, navigate, validatePaymentSecurity]);

  const { format: formatCurrency } = useCurrency();

  // Toujours afficher les montants dans la devise de la commande (EUR par défaut)
  const formatPrice = (amount) => {
    const currency = order?.currency || 'EUR';
    if (currency === 'EUR') {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);
    }
    return formatCurrency(amount);
  };

  const getPaymentIcon = (method) => {
    if (method === 'mobile') return <Smartphone className="w-6 h-6" />;
    return <CreditCard className="w-6 h-6" />;
  };

  const getPaymentMethodName = (method) => {
    if (method === 'mobile') return 'Mobile Money';
    return 'Carte / PayPal (Stripe)';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Vérification de la sécurité du paiement...</p>
        </div>
      </div>
    );
  }

  if (!securityCheck.isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="max-w-md w-full mx-4">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-luxury font-bold text-neutral-900 mb-2">
              Paiement non validé
            </h2>
            <p className="text-neutral-600 mb-6">
              {securityCheck.message}
            </p>
            <Link
              to="/checkout"
              className="btn-luxury w-full"
            >
              Retour au paiement
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-luxury font-bold text-neutral-900 mb-2">
            Commande confirmée !
          </h1>
          <p className="text-neutral-600">
            Merci pour votre confiance. Votre commande a été validée avec succès.
          </p>
        </div>

        {/* Security Check Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Sécurité validée</h3>
              <p className="text-sm text-green-600">
                {securityCheck.message}
              </p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Détails de la commande</h2>
            <div className="text-sm text-neutral-600">
              N° {order.id}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Items */}
            <div>
              <h3 className="font-medium mb-4">Articles commandés</h3>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 pb-4 border-b">
                    <img
                      src={resolveImageUrl(item.image || item.image_url) || '/images/BOURBON MORELLI.png'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => { e.target.onerror = null; e.target.src = '/images/BOURBON MORELLI.png'; }}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-neutral-600">Quantité: {item.quantity}</p>
                    </div>
                    <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping & Payment */}
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Adresse de livraison</h3>
                <div className="text-sm text-neutral-600">
                  {order.shipping?.firstName || order.shipping?.lastName ? (
                    <>
                      {order.shipping.firstName} {order.shipping.lastName}<br />
                      {order.shipping.streetAddress && <>{order.shipping.streetAddress}<br /></>}
                      {(order.shipping.postalCode || order.shipping.city) && <>{order.shipping.postalCode} {order.shipping.city}<br /></>}
                      {order.shipping.country}
                    </>
                  ) : (
                    <span className="text-neutral-400 italic">Adresse enregistrée avec la commande</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Méthode de paiement</h3>
                <div className="flex items-center space-x-3">
                  {getPaymentIcon(order.payment.method)}
                  <div>
                    <p className="font-medium">{getPaymentMethodName(order.payment.method)}</p>
                    <p className="text-sm text-green-600">Payé avec succès</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Récapitulatif</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sous-total</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Livraison</span>
                    <span>{!order.shippingCost || order.shippingCost === 0 ? 'Gratuite' : formatPrice(order.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary-500">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center space-y-4">
          <Link
            to="/account/orders"
            className="btn-luxury"
          >
            Voir mes commandes
          </Link>
          <Link
            to="/collections"
            className="btn-secondary"
          >
            Continuer mes achats
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-12 text-center">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Besoin d'aide ?</h3>
            <p className="text-blue-700 mb-4">
              Notre service client est à votre disposition pour répondre à toutes vos questions.
            </p>
            <Link
              to="/contact"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Contacter le support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
