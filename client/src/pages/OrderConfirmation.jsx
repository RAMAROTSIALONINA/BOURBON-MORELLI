import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, CreditCard, Wallet, Smartphone, XCircle, Shield } from 'lucide-react';

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
    console.log('=== VALIDATION SÉCURITÉ PAIEMENT ===');
    
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

  const validateCardPayment = (orderData) => {
    const cardDetails = orderData.payment?.details;
    
    console.log('VALIDATION CARTE:', cardDetails);
    
    if (!cardDetails) {
      return {
        isValid: false,
        message: 'Détails de carte de crédit manquants',
        status: 'invalid'
      };
    }

    // Vérifier le format du numéro de carte
    const cardNumber = cardDetails.cardNumber?.replace(/\s/g, '');
    if (!cardNumber || !/^\d{13,19}$/.test(cardNumber)) {
      return {
        isValid: false,
        message: 'Numéro de carte invalide',
        status: 'invalid'
      };
    }

    // Vérifier la date d'expiration
    const expiry = cardDetails.expiry;
    if (!expiry || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      return {
        isValid: false,
        message: 'Date d\'expiration invalide',
        status: 'invalid'
      };
    }

    // Vérifier le CVV
    const cvv = cardDetails.cvv;
    if (!cvv || !/^\d{3,4}$/.test(cvv)) {
      return {
        isValid: false,
        message: 'CVV invalide',
        status: 'invalid'
      };
    }

    return {
      isValid: true,
      message: 'Paiement par carte validé avec succès',
      status: 'valid'
    };
  };

  const validatePayPalPayment = (orderData) => {
    const paypalDetails = orderData.payment?.details;
    
    console.log('VALIDATION PAYPAL:', paypalDetails);
    
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
    
    console.log('VALIDATION MOBILE MONEY:', mobileDetails);
    
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
    // Récupérer les données de la commande depuis l'état de navigation
    if (location.state?.order) {
      const orderData = location.state.order;
      const paymentMethod = location.state.paymentMethod;
      
      console.log('=== SÉCURITÉ PAIEMENT ===');
      console.log('Order:', orderData);
      console.log('Payment Method:', paymentMethod);
      
      // Valider la sécurité du paiement
      const securityResult = validatePaymentSecurity(orderData, paymentMethod);
      setSecurityCheck(securityResult);
      
      if (securityResult.isValid) {
        setOrder(orderData);
        console.log('✅ SÉCURITÉ: Paiement validé avec succès');
      } else {
        console.log('❌ SÉCURITÉ: Paiement rejeté -', securityResult.message);
      }
      
      setLoading(false);
    } else {
      // Si pas de commande, rediriger vers le panier
      console.log('❌ SÉCURITÉ: Aucune commande trouvée');
      navigate('/cart');
    }
  }, [location, navigate, validatePaymentSecurity]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'card':
        return <CreditCard className="w-6 h-6" />;
      case 'paypal':
        return <Wallet className="w-6 h-6" />;
      case 'mobile':
        return <Smartphone className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  const getPaymentMethodName = (method) => {
    switch (method) {
      case 'card':
        return 'Carte de crédit';
      case 'paypal':
        return 'PayPal';
      case 'mobile':
        return 'Mobile Money';
      default:
        return 'Carte de crédit';
    }
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
                      src={item.image || item.image_url || '/images/placeholder-product.jpg'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
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
                  {order.shipping.firstName} {order.shipping.lastName}<br />
                  {order.shipping.streetAddress}<br />
                  {order.shipping.postalCode} {order.shipping.city}<br />
                  {order.shipping.country}
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
