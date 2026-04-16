import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, Truck, Shield, ArrowLeft, Check, Smartphone, Wallet } from 'lucide-react';
import cartService from '../services/cartService';

const Checkout = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    shipping: {
      first_name: '',
      last_name: '',
      company: '',
      street_address: '',
      apartment: '',
      city: '',
      postal_code: '',
      country: 'France',
      phone: ''
    },
    payment: {
      method: 'card',
      card_type: 'visa',
      card_holder: '',
      card_number: '',
      card_expiry: '',
      cvv: '',
      save_card: false,
      paypal_email: '',
      paypal_password: '',
      mobile_operator: 'mvol',
      mobile_phone: '',
      mobile_name: '',
      mobile_code: ''
    }
  });

  const [fieldErrors, setFieldErrors] = useState({
    shipping: {},
    payment: {}
  });

  const [touchedFields, setTouchedFields] = useState({
    shipping: {},
    payment: {}
  });

  const [totals, setTotals] = useState({
    subtotal: 0,
    shipping: 0,
    total: 0
  });

  useEffect(() => {
    const loadCart = () => {
      try {
        const cartData = cartService.getCart();
        setCartItems(cartData.items || []);
        
        const subtotal = cartData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal >= 200 ? 0 : 9.99;
        const total = subtotal + shipping;
        
        setTotals({ subtotal, shipping, total });
        setLoading(false);
      } catch (error) {
        console.error('Erreur chargement panier:', error);
        setLoading(false);
      }
    };

    loadCart();
  }, []);

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));

    setTouchedFields(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: true
      }
    }));

    validateField(section, field, value);
  };

  const validateField = (section, field, value) => {
    let error = '';
    
    if (section === 'shipping') {
      switch (field) {
        case 'first_name':
          if (!value || value.trim().length < 2) {
            error = 'Le prénom doit contenir au moins 2 caractères';
          }
          break;
        case 'last_name':
          if (!value || value.trim().length < 2) {
            error = 'Le nom doit contenir au moins 2 caractères';
          }
          break;
        case 'street_address':
          if (!value || value.trim().length < 5) {
            error = 'L\'adresse doit contenir au moins 5 caractères';
          }
          break;
        case 'city':
          if (!value || value.trim().length < 2) {
            error = 'La ville doit contenir au moins 2 caractères';
          }
          break;
        case 'postal_code':
          if (!value || !/^\d{4,5}$/.test(value)) {
            error = 'Le code postal doit contenir 4 ou 5 chiffres';
          }
          break;
        case 'phone':
          if (!value || !/^[0-9\s\-+()]{8,15}$/.test(value)) {
            error = 'Le numéro de téléphone doit contenir 8 à 15 chiffres';
          }
          break;
      default:
        break;
      }
    } else if (section === 'payment') {
      switch (field) {
        case 'card_holder':
          if (formData.payment.method === 'card' && (!value || value.trim().length < 3)) {
            error = 'Le nom du titulaire doit contenir au moins 3 caractères';
          }
          break;
        case 'card_number':
          if (formData.payment.method === 'card' && (!value || !/^\d{13,19}$/.test(value.replace(/\s/g, '')))) {
            error = 'Le numéro de carte doit contenir 13 à 19 chiffres';
          }
          break;
        case 'card_expiry':
          if (formData.payment.method === 'card' && (!value || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(value))) {
            error = 'La date d\'expiration doit être au format MM/AA';
          }
          break;
        case 'cvv':
          if (formData.payment.method === 'card' && (!value || !/^\d{3,4}$/.test(value))) {
            error = 'Le CVV doit contenir 3 ou 4 chiffres';
          }
          break;
        case 'paypal_email':
          if (formData.payment.method === 'paypal' && (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) {
            error = 'Veuillez entrer une adresse email valide';
          }
          break;
        case 'mobile_phone':
          if (formData.payment.method === 'mobile' && (!value || !/^[0-9\s\-+()]{8,15}$/.test(value))) {
            error = 'Le numéro de téléphone doit contenir 8 à 15 chiffres';
          }
          break;
        case 'mobile_name':
          if (formData.payment.method === 'mobile' && (!value || value.trim().length < 3)) {
            error = 'Le nom complet doit contenir au moins 3 caractères';
          }
          break;
      default:
        break;
      }
    }
    
    setFieldErrors(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: error
      }
    }));
  };

  const validateShippingStep = () => {
    const shipping = formData.shipping;
    const errors = [];
    
    if (!shipping.first_name || shipping.first_name.trim().length < 2) {
      errors.push('Le prénom doit contenir au moins 2 caractères');
    }
    
    if (!shipping.last_name || shipping.last_name.trim().length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }
    
    if (!shipping.street_address || shipping.street_address.trim().length < 5) {
      errors.push('L\'adresse doit contenir au moins 5 caractères');
    }
    
    if (!shipping.city || shipping.city.trim().length < 2) {
      errors.push('La ville doit contenir au moins 2 caractères');
    }
    
    if (!shipping.postal_code || !/^\d{4,5}$/.test(shipping.postal_code)) {
      errors.push('Le code postal doit contenir 4 ou 5 chiffres');
    }
    
    if (!shipping.phone || !/^[0-9\s\-+()]{8,15}$/.test(shipping.phone)) {
      errors.push('Le numéro de téléphone doit contenir 8 à 15 chiffres');
    }
    
    if (errors.length > 0) {
      alert('ERREURS FORMULAIRE LIVRAISON:\n\n' + errors.map((error, index) => `${index + 1}. ${error}`).join('\n'));
      return false;
    }
    
    return true;
  };

  const validatePaymentStep = () => {
    const payment = formData.payment;
    const errors = [];
    
    if (!payment.method) {
      errors.push('Veuillez choisir une méthode de paiement');
    }
    
    switch (payment.method) {
      case 'card':
        if (!payment.card_type) {
          errors.push('Veuillez choisir le type de carte');
        }
        if (!payment.card_holder || payment.card_holder.trim().length < 3) {
          errors.push('Le nom du titulaire doit contenir au moins 3 caractères');
        }
        if (!payment.card_number || !/^\d{13,19}$/.test(payment.card_number.replace(/\s/g, ''))) {
          errors.push('Le numéro de carte doit contenir 13 à 19 chiffres');
        }
        if (!payment.card_expiry || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(payment.card_expiry)) {
          errors.push('La date d\'expiration doit être au format MM/AA');
        }
        if (!payment.cvv || !/^\d{3,4}$/.test(payment.cvv)) {
          errors.push('Le CVV doit contenir 3 ou 4 chiffres');
        }
        break;
        
      case 'paypal':
        if (!payment.paypal_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payment.paypal_email)) {
          errors.push('Veuillez entrer une adresse email PayPal valide');
        }
        break;
        
      case 'mobile':
        if (!payment.mobile_operator) {
          errors.push('Veuillez choisir un opérateur Mobile Money');
        }
        if (!payment.mobile_phone || !/^[0-9\s\-+()]{8,15}$/.test(payment.mobile_phone)) {
          errors.push('Le numéro de téléphone doit contenir 8 à 15 chiffres');
        }
        if (!payment.mobile_name || payment.mobile_name.trim().length < 3) {
          errors.push('Le nom complet doit contenir au moins 3 caractères');
        }
        break;
      default:
        errors.push('Méthode de paiement non reconnue');
        break;
    }
    
    if (errors.length > 0) {
      alert('ERREURS FORMULAIRE PAIEMENT:\n\n' + errors.map((error, index) => `${index + 1}. ${error}`).join('\n'));
      return false;
    }
    
    return true;
  };

  const handleNextStep = () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateShippingStep();
        break;
      case 2:
        isValid = validatePaymentStep();
        break;
      case 3:
        isValid = true; // Étape finale, toujours valide
        break;
      default:
        isValid = false;
    }
    
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const processPayment = () => {
    alert('TEST: Traitement du paiement en cours...\n\nMéthode: ' + formData.payment.method.toUpperCase() + '\nMontant: ' + formatPrice(totals.total));
    
    setTimeout(() => {
      const orderData = {
        customerName: `${formData.shipping.first_name} ${formData.shipping.last_name}`,
        items: cartItems,
        total: totals.total,
        payment: {
          method: formData.payment.method,
          status: 'paid'
        }
      };
      
      cartService.clearCart();
      navigate('/order-confirmation', { state: { order: orderData, paymentMethod: formData.payment.method } });
    }, 2000);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-luxury font-bold mb-4">Panier vide</h1>
          <Link to="/cart" className="btn-luxury">
            Retour au panier
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/cart" className="inline-flex items-center space-x-2 text-neutral-600 hover:text-primary-500 mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au panier</span>
          </Link>
          <h1 className="text-3xl font-luxury font-bold text-neutral-900">Commande</h1>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  step <= currentStep ? 'bg-primary-500 border-primary-500 text-white' : 'border-neutral-300 text-neutral-400'
                }`}>
                  {step < currentStep ? <Check className="w-5 h-5" /> : step}
                </div>
                <span className={`ml-3 ${step <= currentStep ? 'text-primary-500 font-medium' : 'text-neutral-400'}`}>
                  {step === 1 ? 'Livraison' : step === 2 ? 'Paiement' : 'Confirmation'}
                </span>
                {step < 3 && <div className={`flex-1 h-1 mx-4 ${step < currentStep ? 'bg-primary-500' : 'bg-neutral-300'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Adresse de livraison</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Prénom*</label>
                    <input
                      type="text"
                      placeholder="Prénom*"
                      value={formData.shipping.first_name}
                      onChange={(e) => handleInputChange('shipping', 'first_name', e.target.value)}
                      className={`input-luxury ${touchedFields.shipping.first_name && fieldErrors.shipping.first_name ? 'border-red-500' : ''}`}
                    />
                    {touchedFields.shipping.first_name && fieldErrors.shipping.first_name && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.shipping.first_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Nom*</label>
                    <input
                      type="text"
                      placeholder="Nom*"
                      value={formData.shipping.last_name}
                      onChange={(e) => handleInputChange('shipping', 'last_name', e.target.value)}
                      className={`input-luxury ${touchedFields.shipping.last_name && fieldErrors.shipping.last_name ? 'border-red-500' : ''}`}
                    />
                    {touchedFields.shipping.last_name && fieldErrors.shipping.last_name && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.shipping.last_name}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Adresse*</label>
                    <input
                      type="text"
                      placeholder="Adresse*"
                      value={formData.shipping.street_address}
                      onChange={(e) => handleInputChange('shipping', 'street_address', e.target.value)}
                      className={`input-luxury ${touchedFields.shipping.street_address && fieldErrors.shipping.street_address ? 'border-red-500' : ''}`}
                    />
                    {touchedFields.shipping.street_address && fieldErrors.shipping.street_address && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.shipping.street_address}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Ville*</label>
                    <input
                      type="text"
                      placeholder="Ville*"
                      value={formData.shipping.city}
                      onChange={(e) => handleInputChange('shipping', 'city', e.target.value)}
                      className={`input-luxury ${touchedFields.shipping.city && fieldErrors.shipping.city ? 'border-red-500' : ''}`}
                    />
                    {touchedFields.shipping.city && fieldErrors.shipping.city && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.shipping.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Code postal*</label>
                    <input
                      type="text"
                      placeholder="Code postal*"
                      value={formData.shipping.postal_code}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        handleInputChange('shipping', 'postal_code', value);
                      }}
                      className={`input-luxury ${touchedFields.shipping.postal_code && fieldErrors.shipping.postal_code ? 'border-red-500' : ''}`}
                    />
                    {touchedFields.shipping.postal_code && fieldErrors.shipping.postal_code && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.shipping.postal_code}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Téléphone*</label>
                    <input
                      type="tel"
                      placeholder="Téléphone*"
                      value={formData.shipping.phone}
                      onChange={(e) => handleInputChange('shipping', 'phone', e.target.value)}
                      className={`input-luxury ${touchedFields.shipping.phone && fieldErrors.shipping.phone ? 'border-red-500' : ''}`}
                    />
                    {touchedFields.shipping.phone && fieldErrors.shipping.phone && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.shipping.phone}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button onClick={handleNextStep} className="btn-luxury">
                    Continuer vers le paiement
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Méthode de paiement</h2>
                
                <div className="space-y-4 mb-6">
                  <label className="flex items-center p-4 border border-neutral-200 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="payment_method"
                      value="card"
                      checked={formData.payment.method === 'card'}
                      onChange={(e) => handleInputChange('payment', 'method', e.target.value)}
                      className="mr-3"
                    />
                    <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                    <span className="font-medium">Carte de crédit</span>
                  </label>
                  
                  <label className="flex items-center p-4 border border-neutral-200 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="payment_method"
                      value="paypal"
                      checked={formData.payment.method === 'paypal'}
                      onChange={(e) => handleInputChange('payment', 'method', e.target.value)}
                      className="mr-3"
                    />
                    <Wallet className="w-5 h-5 mr-2 text-blue-500" />
                    <span className="font-medium">PayPal</span>
                  </label>
                  
                  <label className="flex items-center p-4 border border-neutral-200 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="payment_method"
                      value="mobile"
                      checked={formData.payment.method === 'mobile'}
                      onChange={(e) => handleInputChange('payment', 'method', e.target.value)}
                      className="mr-3"
                    />
                    <Smartphone className="w-5 h-5 mr-2 text-green-600" />
                    <span className="font-medium">Mobile Money</span>
                  </label>
                </div>

                {formData.payment.method === 'card' && (
                  <div className="space-y-4">
                    <select
                      value={formData.payment.card_type}
                      onChange={(e) => handleInputChange('payment', 'card_type', e.target.value)}
                      className="w-full p-3 border border-neutral-200 rounded-lg"
                    >
                      <option value="visa">Visa</option>
                      <option value="mastercard">Mastercard</option>
                      <option value="amex">American Express</option>
                    </select>
                    
                    <input
                      type="text"
                      placeholder="Nom du titulaire"
                      value={formData.payment.card_holder}
                      onChange={(e) => handleInputChange('payment', 'card_holder', e.target.value)}
                      className={`w-full p-3 border rounded-lg ${touchedFields.payment.card_holder && fieldErrors.payment.card_holder ? 'border-red-500' : 'border-neutral-200'}`}
                    />
                    {touchedFields.payment.card_holder && fieldErrors.payment.card_holder && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.payment.card_holder}</p>
                    )}
                    
                    <input
                      type="text"
                      placeholder="Numéro de carte"
                      value={formData.payment.card_number}
                      onChange={(e) => handleInputChange('payment', 'card_number', e.target.value)}
                      className={`w-full p-3 border rounded-lg ${touchedFields.payment.card_number && fieldErrors.payment.card_number ? 'border-red-500' : 'border-neutral-200'}`}
                    />
                    {touchedFields.payment.card_number && fieldErrors.payment.card_number && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.payment.card_number}</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="MM/AA"
                        value={formData.payment.card_expiry}
                        onChange={(e) => handleInputChange('payment', 'card_expiry', e.target.value)}
                        className={`w-full p-3 border rounded-lg ${touchedFields.payment.card_expiry && fieldErrors.payment.card_expiry ? 'border-red-500' : 'border-neutral-200'}`}
                      />
                      {touchedFields.payment.card_expiry && fieldErrors.payment.card_expiry && (
                        <p className="text-sm text-red-600 mt-1">{fieldErrors.payment.card_expiry}</p>
                      )}
                      
                      <input
                        type="text"
                        placeholder="CVV"
                        value={formData.payment.cvv}
                        onChange={(e) => handleInputChange('payment', 'cvv', e.target.value)}
                        className={`w-full p-3 border rounded-lg ${touchedFields.payment.cvv && fieldErrors.payment.cvv ? 'border-red-500' : 'border-neutral-200'}`}
                      />
                      {touchedFields.payment.cvv && fieldErrors.payment.cvv && (
                        <p className="text-sm text-red-600 mt-1">{fieldErrors.payment.cvv}</p>
                      )}
                    </div>
                  </div>
                )}

                {formData.payment.method === 'paypal' && (
                  <div className="space-y-4">
                    <input
                      type="email"
                      placeholder="Email PayPal"
                      value={formData.payment.paypal_email}
                      onChange={(e) => handleInputChange('payment', 'paypal_email', e.target.value)}
                      className={`w-full p-3 border rounded-lg ${touchedFields.payment.paypal_email && fieldErrors.payment.paypal_email ? 'border-red-500' : 'border-neutral-200'}`}
                    />
                    {touchedFields.payment.paypal_email && fieldErrors.payment.paypal_email && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.payment.paypal_email}</p>
                    )}
                  </div>
                )}

                {formData.payment.method === 'mobile' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <label className="flex flex-col items-center p-3 border-2 border-neutral-200 rounded-lg cursor-pointer">
                        <input
                          type="radio"
                          name="mobile_operator"
                          value="mvol"
                          checked={formData.payment.mobile_operator === 'mvol'}
                          onChange={(e) => handleInputChange('payment', 'mobile_operator', e.target.value)}
                          className="sr-only"
                        />
                        <Smartphone className="w-6 h-6 mb-1" />
                        <span className="text-sm">MVola</span>
                      </label>
                      <label className="flex flex-col items-center p-3 border-2 border-neutral-200 rounded-lg cursor-pointer">
                        <input
                          type="radio"
                          name="mobile_operator"
                          value="orange"
                          checked={formData.payment.mobile_operator === 'orange'}
                          onChange={(e) => handleInputChange('payment', 'mobile_operator', e.target.value)}
                          className="sr-only"
                        />
                        <Smartphone className="w-6 h-6 mb-1" />
                        <span className="text-sm">Orange</span>
                      </label>
                      <label className="flex flex-col items-center p-3 border-2 border-neutral-200 rounded-lg cursor-pointer">
                        <input
                          type="radio"
                          name="mobile_operator"
                          value="airtel"
                          checked={formData.payment.mobile_operator === 'airtel'}
                          onChange={(e) => handleInputChange('payment', 'mobile_operator', e.target.value)}
                          className="sr-only"
                        />
                        <Smartphone className="w-6 h-6 mb-1" />
                        <span className="text-sm">Airtel</span>
                      </label>
                    </div>
                    
                    <input
                      type="tel"
                      placeholder="Numéro de téléphone"
                      value={formData.payment.mobile_phone}
                      onChange={(e) => handleInputChange('payment', 'mobile_phone', e.target.value)}
                      className={`w-full p-3 border rounded-lg ${touchedFields.payment.mobile_phone && fieldErrors.payment.mobile_phone ? 'border-red-500' : 'border-neutral-200'}`}
                    />
                    {touchedFields.payment.mobile_phone && fieldErrors.payment.mobile_phone && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.payment.mobile_phone}</p>
                    )}
                    
                    <input
                      type="text"
                      placeholder="Nom complet"
                      value={formData.payment.mobile_name}
                      onChange={(e) => handleInputChange('payment', 'mobile_name', e.target.value)}
                      className={`w-full p-3 border rounded-lg ${touchedFields.payment.mobile_name && fieldErrors.payment.mobile_name ? 'border-red-500' : 'border-neutral-200'}`}
                    />
                    {touchedFields.payment.mobile_name && fieldErrors.payment.mobile_name && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.payment.mobile_name}</p>
                    )}
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <button onClick={handlePrevStep} className="btn-secondary">
                    Retour
                  </button>
                  <button onClick={handleNextStep} className="btn-luxury">
                    Continuer
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Confirmation de commande</h2>
                
                <div className="mb-6">
                  <div className="flex items-center space-x-2 text-green-600 mb-4">
                    <Check className="w-5 h-5" />
                    <span>Presque terminé !</span>
                  </div>
                  <p className="text-neutral-600">
                    Vérifiez les informations ci-dessous avant de confirmer votre commande.
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="font-medium mb-2">Adresse de livraison</h3>
                    <div className="text-sm text-neutral-600">
                      {formData.shipping.first_name} {formData.shipping.last_name}<br />
                      {formData.shipping.street_address}<br />
                      {formData.shipping.postal_code} {formData.shipping.city}<br />
                      {formData.shipping.country}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Méthode de paiement</h3>
                    <div className="text-sm text-neutral-600">
                      {formData.payment.method === 'card' ? 'Carte de crédit' : 
                       formData.payment.method === 'paypal' ? 'PayPal' : 'Mobile Money'}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button onClick={handlePrevStep} className="btn-secondary">
                    Retour
                  </button>
                  <button onClick={processPayment} className="btn-luxury">
                    Confirmer la commande
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-6">Récapitulatif</h2>

              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <img
                      src={item.image || item.image_url || item.images?.[0] || '/images/placeholder-product.jpg'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = '/images/placeholder-product.jpg';
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-neutral-600">Quantité: {item.quantity}</p>
                    </div>
                    <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Sous-total</span>
                  <span>{formatPrice(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Livraison</span>
                  <span>{totals.shipping === 0 ? 'Gratuite' : formatPrice(totals.shipping)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary-500">{formatPrice(totals.total)}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t space-y-2">
                <div className="flex items-center space-x-2 text-sm text-neutral-600">
                  <Truck className="w-4 h-4 text-primary-500" />
                  <span>Livraison offerte à partir de 200</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-neutral-600">
                  <Shield className="w-4 h-4 text-primary-500" />
                  <span>Paiement 100% sécurisé</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
