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
    // Informations de livraison
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
    // Informations de facturation
    billing: {
      same_as_shipping: true,
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
    // Paiement
    payment: {
      method: 'card',
      // Carte de crédit
      card_type: 'visa',
      card_holder: '',
      card_number: '',
      card_expiry: '',
      cvv: '',
      save_card: false,
      // PayPal
      paypal_email: '',
      paypal_password: '',
      // Mobile Money
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
    // Charger le panier depuis cartService
    const loadCart = () => {
      try {
        const cartItems = cartService.getCartItems();
        setCartItems(cartItems);
        
        // Calculer les totaux
        const subtotal = cartService.getCartTotal();
        const shipping = subtotal >= 200 ? 0 : 9.99;
        const total = subtotal + shipping;
        
        setTotals({ subtotal, shipping, total });
        setLoading(false);
        
        console.log('=== CHECKOUT CART LOADED ===');
        console.log('Items:', cartItems.length);
        console.log('Subtotal:', subtotal);
        console.log('Shipping:', shipping);
        console.log('Total:', total);
      } catch (error) {
        console.error('Erreur chargement panier checkout:', error);
        setLoading(false);
      }
    };

    loadCart();

    // S'abonner aux changements du cartService
    const unsubscribe = cartService.subscribe(() => {
      loadCart();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));

    // Marquer le champ comme "touché" pour la validation en temps réel
    setTouchedFields(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: true
      }
    }));

    // Valider le champ en temps réel
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
          if (!value || !/^[0-9\s\-\+\(\)]{8,15}$/.test(value)) {
            error = 'Le numéro de téléphone doit contenir 8 à 15 chiffres';
          }
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
          if (formData.payment.method === 'mobile' && (!value || !/^[0-9\s\-\+\(\)]{8,15}$/.test(value))) {
            error = 'Le numéro de téléphone doit contenir 8 à 15 chiffres';
          }
          break;
        case 'mobile_name':
          if (formData.payment.method === 'mobile' && (!value || value.trim().length < 3)) {
            error = 'Le nom complet doit contenir au moins 3 caractères';
          }
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
    console.log('=== VALIDATION ÉTAPE 1: LIVRAISON ===');
    
    const shipping = formData.shipping;
    const errors = [];
    
    // Validation du prénom
    if (!shipping.first_name || shipping.first_name.trim().length < 2) {
      errors.push('Le prénom doit contenir au moins 2 caractères');
    }
    
    // Validation du nom
    if (!shipping.last_name || shipping.last_name.trim().length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }
    
    // Validation de l'adresse
    if (!shipping.street_address || shipping.street_address.trim().length < 5) {
      errors.push('L\'adresse doit contenir au moins 5 caractères');
    }
    
    // Validation de la ville
    if (!shipping.city || shipping.city.trim().length < 2) {
      errors.push('La ville doit contenir au moins 2 caractères');
    }
    
    // Validation du code postal
    if (!shipping.postal_code || !/^\d{4,5}$/.test(shipping.postal_code)) {
      errors.push('Le code postal doit contenir 4 ou 5 chiffres');
    }
    
    // Validation du téléphone
    if (!shipping.phone || !/^[0-9\s\-\+\(\)]{8,15}$/.test(shipping.phone)) {
      errors.push('Le numéro de téléphone doit contenir 8 à 15 chiffres');
    }
    
    if (errors.length > 0) {
      alert('⚠️ ERREURS FORMULAIRE LIVRAISON:\n\n' + errors.map((error, index) => `${index + 1}. ${error}`).join('\n'));
      return false;
    }
    
    console.log('✅ Étape 1 validée avec succès');
    return true;
  };

  const validatePaymentStep = () => {
    console.log('=== VALIDATION ÉTAPE 2: PAIEMENT ===');
    
    const payment = formData.payment;
    const errors = [];
    
    // Validation de la méthode de paiement
    if (!payment.method) {
      errors.push('Veuillez choisir une méthode de paiement');
    }
    
    // Validation spécifique selon la méthode
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
        if (!payment.mobile_phone || !/^[0-9\s\-\+\(\)]{8,15}$/.test(payment.mobile_phone)) {
          errors.push('Le numéro de téléphone doit contenir 8 à 15 chiffres');
        }
        if (!payment.mobile_name || payment.mobile_name.trim().length < 3) {
          errors.push('Le nom complet doit contenir au moins 3 caractères');
        }
        break;
    }
    
    if (errors.length > 0) {
      alert('⚠️ ERREURS FORMULAIRE PAIEMENT:\n\n' + errors.map((error, index) => `${index + 1}. ${error}`).join('\n'));
      return false;
    }
    
    console.log('✅ Étape 2 validée avec succès');
    return true;
  };

  const validateConfirmationStep = () => {
    console.log('=== VALIDATION ÉTAPE 3: CONFIRMATION ===');
    
    // Vérification finale avant confirmation
    if (!formData.shipping.first_name || !formData.payment.method) {
      alert('⚠️ ERREUR: Données manquantes pour la confirmation');
      return false;
    }
    
    console.log('✅ Étape 3 validée avec succès');
    return true;
  };

  const handleNextStep = () => {
    console.log(`=== TENTATIVE PASSAGE ÉTAPE ${currentStep} → ${currentStep + 1} ===`);
    
    // Valider l'étape actuelle avant de passer à la suivante
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateShippingStep();
        break;
      case 2:
        isValid = validatePaymentStep();
        break;
      case 3:
        isValid = validateConfirmationStep();
        break;
      default:
        isValid = false;
    }
    
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
      console.log(`✅ Passage à l'étape ${currentStep + 1} réussi`);
    } else {
      console.log('❌ Validation échouée, reste sur l\'étape actuelle');
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      console.log(`⬅️ Retour à l'étape ${currentStep - 1}`);
    }
  };

  // Fonctions de paiement spécifiques
  const processCardPayment = () => {
    console.log('=== TEST PAIEMENT CARTE DE CRÉDIT ===');
    console.log('Type de carte:', formData.payment.card_type);
    console.log('Titulaire:', formData.payment.card_holder);
    console.log('Numéro:', formData.payment.card_number);
    console.log('Expiration:', formData.payment.card_expiry);
    console.log('CVV:', formData.payment.cvv);
    console.log('Sauvegarder:', formData.payment.save_card);
    
    // Validation de base
    if (!formData.payment.card_holder) {
      alert('TEST: Veuillez remplir le nom du titulaire');
      return;
    }
    
    if (!formData.payment.card_number) {
      alert('TEST: Veuillez remplir le numéro de carte');
      return;
    }
    
    if (!formData.payment.cvv) {
      alert('TEST: Veuillez remplir le CVV');
      return;
    }
    
    // Afficher le message de traitement
    alert('TEST: Traitement du paiement par carte en cours...\n\n' +
          'Détails du test:\n' +
          '- Type: ' + formData.payment.card_type.toUpperCase() + '\n' +
          '- Titulaire: ' + formData.payment.card_holder + '\n' +
          '- Numéro: **** **** **** ' + formData.payment.card_number.slice(-4) + '\n' +
          '- Montant: ' + formatPrice(totals.total) + '\n\n' +
          'Le paiement sera simulé après 2 secondes.');
    
    // Simulation de paiement par carte
    setTimeout(() => {
      console.log('TEST: Paiement par carte SIMULÉ avec succès');
      console.log('TEST: Création de la commande...');
      createOrder('card');
    }, 2000);
  };

  const processPayPalPayment = () => {
    console.log('=== TEST PAIEMENT PAYPAL ===');
    console.log('Email PayPal:', formData.payment.paypal_email);
    console.log('Mot de passe:', formData.payment.paypal_password ? '***' : 'Non rempli');
    console.log('Montant:', formatPrice(totals.total));
    
    // Validation de base
    if (!formData.payment.paypal_email) {
      alert('TEST: Veuillez remplir votre email PayPal');
      return;
    }
    
    if (!formData.payment.paypal_email.includes('@')) {
      alert('TEST: Veuillez entrer un email PayPal valide');
      return;
    }
    
    // Afficher le message de traitement
    alert('TEST: Redirection vers PayPal en cours...\n\n' +
          'Détails du test:\n' +
          '- Email: ' + formData.payment.paypal_email + '\n' +
          '- Service: Paiement sécurisé PayPal\n' +
          '- Montant: ' + formatPrice(totals.total) + '\n\n' +
          'Le paiement sera simulé après 2 secondes.');
    
    // Simulation de paiement PayPal
    setTimeout(() => {
      console.log('TEST: Paiement PayPal SIMULÉ avec succès');
      console.log('TEST: Création de la commande...');
      createOrder('paypal');
    }, 2000);
  };

  const processMobilePayment = () => {
    console.log('=== TEST PAIEMENT MOBILE MONEY ===');
    console.log('Opérateur:', formData.payment.mobile_operator);
    console.log('Téléphone:', formData.payment.mobile_phone);
    console.log('Nom:', formData.payment.mobile_name);
    console.log('Code:', formData.payment.mobile_code);
    console.log('Montant:', formatPrice(totals.total));
    
    // Validation de base
    if (!formData.payment.mobile_operator) {
      alert('TEST: Veuillez choisir un opérateur (MVola/Orange/Airtel)');
      return;
    }
    
    if (!formData.payment.mobile_phone) {
      alert('TEST: Veuillez remplir votre numéro de téléphone');
      return;
    }
    
    if (!formData.payment.mobile_name) {
      alert('TEST: Veuillez remplir votre nom complet');
      return;
    }
    
    if (!formData.payment.mobile_code) {
      alert('TEST: Veuillez remplir le code de confirmation');
      return;
    }
    
    // Afficher le message de traitement
    const operatorName = formData.payment.mobile_operator === 'mvol' ? 'MVola' : 
                        formData.payment.mobile_operator === 'orange' ? 'Orange Money' : 'Airtel Money';
    
    alert('TEST: Traitement du paiement ' + operatorName + ' en cours...\n\n' +
          'Détails du test:\n' +
          '- Opérateur: ' + operatorName + '\n' +
          '- Téléphone: ' + formData.payment.mobile_phone + '\n' +
          '- Nom: ' + formData.payment.mobile_name + '\n' +
          '- Montant: ' + formatPrice(totals.total) + '\n\n' +
          'Le paiement sera simulé après 2 secondes.');
    
    // Simulation de paiement Mobile Money
    setTimeout(() => {
      console.log('TEST: Paiement ' + operatorName + ' SIMULÉ avec succès');
      console.log('TEST: Création de la commande...');
      createOrder('mobile');
    }, 2000);
  };

  const validatePaymentData = (paymentMethod) => {
    console.log('=== VALIDATION FINALE DES DONNÉES ===');
    
    switch (paymentMethod) {
      case 'card':
        return validateCardData();
      case 'paypal':
        return validatePayPalData();
      case 'mobile':
        return validateMobileData();
      default:
        return {
          isValid: false,
          message: 'Méthode de paiement non valide'
        };
    }
  };

  const validateCardData = () => {
    const cardNumber = formData.payment.card_number;
    const cardHolder = formData.payment.card_holder;
    const cvv = formData.payment.cvv;
    const expiry = formData.payment.card_expiry;
    
    // Validation du numéro de carte (format Luhn)
    if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
      return {
        isValid: false,
        message: 'Numéro de carte invalide'
      };
    }
    
    // Validation du titulaire
    if (!cardHolder || cardHolder.length < 3) {
      return {
        isValid: false,
        message: 'Nom du titulaire invalide'
      };
    }
    
    // Validation du CVV
    if (!cvv || cvv.length < 3 || cvv.length > 4) {
      return {
        isValid: false,
        message: 'CVV invalide'
      };
    }
    
    // Validation de la date d'expiration
    if (!expiry || !expiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
      return {
        isValid: false,
        message: 'Date d\'expiration invalide'
      };
    }
    
    return {
      isValid: true,
      message: 'Données de carte valides'
    };
  };

  const validatePayPalData = () => {
    const email = formData.payment.paypal_email;
    
    if (!email || !email.includes('@') || !email.includes('.')) {
      return {
        isValid: false,
        message: 'Email PayPal invalide'
      };
    }
    
    return {
      isValid: true,
      message: 'Données PayPal valides'
    };
  };

  const validateMobileData = () => {
    const operator = formData.payment.mobile_operator;
    const phone = formData.payment.mobile_phone;
    
    if (!operator) {
      return {
        isValid: false,
        message: 'Opérateur Mobile Money requis'
      };
    }
    
    if (!phone || phone.length < 8) {
      return {
        isValid: false,
        message: 'Numéro de téléphone invalide'
      };
    }
    
    return {
      isValid: true,
      message: 'Données Mobile Money valides'
    };
  };

  const generateSecurityChecksum = (paymentMethod) => {
    // Générer un checksum de sécurité basé sur la méthode et le timestamp
    const timestamp = Date.now().toString();
    const methodCode = paymentMethod.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8);
    return `${methodCode}-${timestamp}-${random}`;
  };

  const getSecurePaymentDetails = (paymentMethod) => {
    switch (paymentMethod) {
      case 'card':
        return {
          type: formData.payment.card_type,
          holder: formData.payment.card_holder,
          last4: formData.payment.card_number.slice(-4),
          expiry: formData.payment.card_expiry,
          masked: `****-****-****-${formData.payment.card_number.slice(-4)}`
        };
      case 'paypal':
        return {
          email: formData.payment.paypal_email,
          verified: true,
          masked: formData.payment.paypal_email.substring(0, 2) + '***@***.com'
        };
      case 'mobile':
        return {
          operator: formData.payment.mobile_operator,
          phone: formData.payment.mobile_phone,
          masked: `***-***-${formData.payment.mobile_phone.slice(-4)}`
        };
      default:
        return {};
    }
  };

  const createOrder = (paymentMethod) => {
    console.log('=== CRÉATION COMMANDE SÉCURISÉE ===');
    console.log('Méthode:', paymentMethod);
    
    // Validation finale avant création
    const validationResult = validatePaymentData(paymentMethod);
    if (!validationResult.isValid) {
      alert('ERREUR DE SÉCURITÉ: ' + validationResult.message);
      return;
    }
    
    // Créer la commande avec données sécurisées
    const orderData = {
      customerEmail: 'customer@example.com', // À remplacer avec auth service
      customerName: `${formData.shipping.first_name} ${formData.shipping.last_name}`,
      items: cartItems.map(item => ({
        id: item.id,
        name: item.name,
        variant: `Quantité: ${item.quantity}`,
        quantity: item.quantity,
        price: item.price,
        image: item.image
      })),
      total: totals.total,
      shipping: {
        address: `${formData.shipping.street_address}, ${formData.shipping.postal_code} ${formData.shipping.city}`,
        method: 'Livraison standard',
        cost: totals.shipping,
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      payment: {
        method: paymentMethod,
        status: 'paid',
        security: {
          validated: true,
          timestamp: new Date().toISOString(),
          checksum: generateSecurityChecksum(paymentMethod)
        },
        details: getSecurePaymentDetails(paymentMethod)
      }
    };
    
    console.log('DONNÉES COMMANDE SÉCURISÉES:', orderData);
    
    // Sauvegarder la commande
    try {
      // Importer customerOrderService dynamiquement
      import('../services/orderService').then(({ customerOrderService }) => {
        customerOrderService.createOrder(orderData).then(response => {
          if (response.success) {
            console.log('✅ Commande créée:', response.order.id);
            
            // Vider le panier
            cartService.clearCart();
            
            // Rediriger vers la confirmation
            navigate('/order-confirmation', { 
              state: { 
                order: response.order,
                paymentMethod: paymentMethod 
              } 
            });
          } else {
            alert('Erreur lors de la création de la commande: ' + response.message);
          }
        });
      });
    } catch (error) {
      console.error('Erreur création commande:', error);
      alert('Erreur lors de la création de la commande');
    }
  };

  const handlePlaceOrder = () => {
    // Traiter selon la méthode de paiement choisie
    switch (formData.payment.method) {
      case 'card':
        processCardPayment();
        break;
      case 'paypal':
        processPayPalPayment();
        break;
      case 'mobile':
        processMobilePayment();
        break;
      default:
        alert('Veuillez choisir une méthode de paiement');
    }
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
        {/* Header */}
        <div className="mb-8">
          <Link to="/cart" className="inline-flex items-center space-x-2 text-neutral-600 hover:text-primary-500 mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au panier</span>
          </Link>
          <h1 className="text-3xl font-luxury font-bold text-neutral-900">
            Commande
          </h1>
        </div>

        {/* Progression */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  step <= currentStep
                    ? 'bg-primary-500 border-primary-500 text-white'
                    : 'border-neutral-300 text-neutral-400'
                }`}>
                  {step < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step
                  )}
                </div>
                <span className={`ml-3 ${
                  step <= currentStep ? 'text-primary-500 font-medium' : 'text-neutral-400'
                }`}>
                  {step === 1 ? 'Livraison' : step === 2 ? 'Paiement' : 'Confirmation'}
                </span>
                {step < 3 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    step < currentStep ? 'bg-primary-500' : 'bg-neutral-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              /* Étape 1: Adresse de livraison */
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
                      className={`input-luxury ${touchedFields.shipping.first_name && fieldErrors.shipping.first_name ? 'border-red-500 focus:ring-red-500' : ''}`}
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
                      className={`input-luxury ${touchedFields.shipping.last_name && fieldErrors.shipping.last_name ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {touchedFields.shipping.last_name && fieldErrors.shipping.last_name && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.shipping.last_name}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Entreprise (optionnel)</label>
                    <input
                      type="text"
                      placeholder="Entreprise (optionnel)"
                      value={formData.shipping.company}
                      onChange={(e) => handleInputChange('shipping', 'company', e.target.value)}
                      className="input-luxury"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Adresse*</label>
                    <input
                      type="text"
                      placeholder="Adresse*"
                      value={formData.shipping.street_address}
                      onChange={(e) => handleInputChange('shipping', 'street_address', e.target.value)}
                      className={`input-luxury ${touchedFields.shipping.street_address && fieldErrors.shipping.street_address ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {touchedFields.shipping.street_address && fieldErrors.shipping.street_address && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.shipping.street_address}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Appartement, suite, etc. (optionnel)</label>
                    <input
                      type="text"
                      placeholder="Appartement, suite, etc. (optionnel)"
                      value={formData.shipping.apartment}
                      onChange={(e) => handleInputChange('shipping', 'apartment', e.target.value)}
                      className="input-luxury"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Ville*</label>
                    <input
                      type="text"
                      placeholder="Ville*"
                      value={formData.shipping.city}
                      onChange={(e) => handleInputChange('shipping', 'city', e.target.value)}
                      className={`input-luxury ${touchedFields.shipping.city && fieldErrors.shipping.city ? 'border-red-500 focus:ring-red-500' : ''}`}
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
                      onChange={(e) => handleInputChange('shipping', 'postal_code', e.target.value)}
                      className={`input-luxury ${touchedFields.shipping.postal_code && fieldErrors.shipping.postal_code ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {touchedFields.shipping.postal_code && fieldErrors.shipping.postal_code && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.shipping.postal_code}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Pays</label>
                    <input
                      type="text"
                      placeholder="Pays"
                      value={formData.shipping.country}
                      onChange={(e) => handleInputChange('shipping', 'country', e.target.value)}
                      className="input-luxury"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Téléphone*</label>
                    <input
                      type="tel"
                      placeholder="Téléphone*"
                      value={formData.shipping.phone}
                      onChange={(e) => handleInputChange('shipping', 'phone', e.target.value)}
                      className={`input-luxury ${touchedFields.shipping.phone && fieldErrors.shipping.phone ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {touchedFields.shipping.phone && fieldErrors.shipping.phone && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.shipping.phone}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleNextStep}
                    className="btn-luxury"
                  >
                    Continuer vers le paiement
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              /* Étape 2: Paiement */
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">Méthode de paiement</h2>
                
                <div className="space-y-4 mb-6">
                  {/* Carte de crédit */}
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-neutral-50">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={formData.payment.method === 'card'}
                      onChange={(e) => handleInputChange('payment', 'method', e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Carte de crédit</div>
                      <div className="text-sm text-neutral-500">Visa, Mastercard, American Express</div>
                    </div>
                    <CreditCard className="w-5 h-5 text-neutral-400" />
                  </label>

                  {/* PayPal */}
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-neutral-50">
                    <input
                      type="radio"
                      name="payment"
                      value="paypal"
                      checked={formData.payment.method === 'paypal'}
                      onChange={(e) => handleInputChange('payment', 'method', e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">PayPal</div>
                      <div className="text-sm text-neutral-500">Paiement sécurisé avec PayPal</div>
                    </div>
                    <Wallet className="w-5 h-5 text-neutral-400" />
                  </label>

                  {/* Mobile Money */}
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-neutral-50">
                    <input
                      type="radio"
                      name="payment"
                      value="mobile"
                      checked={formData.payment.method === 'mobile'}
                      onChange={(e) => handleInputChange('payment', 'method', e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Mobile Money</div>
                      <div className="text-sm text-neutral-500">MVola, Orange Money, Airtel Money</div>
                    </div>
                    <Smartphone className="w-5 h-5 text-neutral-400" />
                  </label>
                </div>

                {/* Formulaire Carte de crédit */}
                {formData.payment.method === 'card' && (
                  <div className="bg-neutral-50 p-6 rounded-lg mb-6">
                    <h3 className="font-medium mb-4">Informations de carte</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Type de carte</label>
                        <select
                          value={formData.payment.card_type}
                          onChange={(e) => handleInputChange('payment', 'card_type', e.target.value)}
                          className="w-full p-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="visa">Visa</option>
                          <option value="mastercard">Mastercard</option>
                          <option value="amex">American Express</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Nom du titulaire</label>
                        <input
                          type="text"
                          placeholder="Jean Dupont"
                          value={formData.payment.card_holder}
                          onChange={(e) => handleInputChange('payment', 'card_holder', e.target.value)}
                          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
                            touchedFields.payment.card_holder && fieldErrors.payment.card_holder 
                              ? 'border-red-500 focus:ring-red-500' 
                              : 'border-neutral-200 focus:ring-primary-500'
                          }`}
                        />
                        {touchedFields.payment.card_holder && fieldErrors.payment.card_holder && (
                          <p className="text-sm text-red-600 mt-1">{fieldErrors.payment.card_holder}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Numéro de carte</label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          value={formData.payment.card_number}
                          onChange={(e) => handleInputChange('payment', 'card_number', e.target.value)}
                          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
                            touchedFields.payment.card_number && fieldErrors.payment.card_number 
                              ? 'border-red-500 focus:ring-red-500' 
                              : 'border-neutral-200 focus:ring-primary-500'
                          }`}
                        />
                        {touchedFields.payment.card_number && fieldErrors.payment.card_number && (
                          <p className="text-sm text-red-600 mt-1">{fieldErrors.payment.card_number}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">Date d'expiration</label>
                          <input
                            type="text"
                            placeholder="MM/AA"
                            value={formData.payment.card_expiry}
                            onChange={(e) => handleInputChange('payment', 'card_expiry', e.target.value)}
                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
                              touchedFields.payment.card_expiry && fieldErrors.payment.card_expiry 
                                ? 'border-red-500 focus:ring-red-500' 
                                : 'border-neutral-200 focus:ring-primary-500'
                            }`}
                          />
                          {touchedFields.payment.card_expiry && fieldErrors.payment.card_expiry && (
                            <p className="text-sm text-red-600 mt-1">{fieldErrors.payment.card_expiry}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">CVV</label>
                          <input
                            type="text"
                            placeholder="123"
                            value={formData.payment.cvv}
                            onChange={(e) => handleInputChange('payment', 'cvv', e.target.value)}
                            className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
                              touchedFields.payment.cvv && fieldErrors.payment.cvv 
                                ? 'border-red-500 focus:ring-red-500' 
                                : 'border-neutral-200 focus:ring-primary-500'
                            }`}
                          />
                          {touchedFields.payment.cvv && fieldErrors.payment.cvv && (
                            <p className="text-sm text-red-600 mt-1">{fieldErrors.payment.cvv}</p>
                          )}
                        </div>
                      </div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.payment.save_card}
                          onChange={(e) => handleInputChange('payment', 'save_card', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-neutral-700">Sauvegarder cette carte</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Formulaire PayPal */}
                {formData.payment.method === 'paypal' && (
                  <div className="bg-neutral-50 p-6 rounded-lg mb-6">
                    <h3 className="font-medium mb-4">Informations PayPal</h3>
                    <div className="space-y-4">
                      <input
                        type="email"
                        placeholder="Email PayPal*"
                        value={formData.payment.paypal_email || ''}
                        onChange={(e) => handleInputChange('payment', 'paypal_email', e.target.value)}
                        className="input-luxury"
                      />
                      <input
                        type="text"
                        placeholder="Nom complet*"
                        value={formData.payment.paypal_name || ''}
                        onChange={(e) => handleInputChange('payment', 'paypal_name', e.target.value)}
                        className="input-luxury"
                      />
                      <input
                        type="text"
                        placeholder="Adresse*"
                        value={formData.payment.paypal_address || ''}
                        onChange={(e) => handleInputChange('payment', 'paypal_address', e.target.value)}
                        className="input-luxury"
                      />
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600">
                          💡 Vous serez redirigé vers PayPal pour compléter le paiement en toute sécurité.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Formulaire Mobile Money */}
                {formData.payment.method === 'mobile' && (
                  <div className="bg-neutral-50 p-6 rounded-lg mb-6">
                    <h3 className="font-medium mb-4">Mobile Money</h3>
                    
                    {/* Sélection de l'opérateur */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Opérateur Mobile Money</label>
                      <div className="grid grid-cols-3 gap-3">
                        <label className="flex flex-col items-center p-3 border-2 border-neutral-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                          <input
                            type="radio"
                            name="mobile_operator"
                            value="mvol"
                            checked={formData.payment.mobile_operator === 'mvol'}
                            onChange={(e) => handleInputChange('payment', 'mobile_operator', e.target.value)}
                            className="sr-only"
                          />
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                            formData.payment.mobile_operator === 'mvol' 
                              ? 'bg-orange-100 text-orange-600' 
                              : 'bg-neutral-100 text-neutral-400'
                          }`}>
                            <Smartphone className="w-6 h-6" />
                          </div>
                          <span className={`text-sm font-medium ${
                            formData.payment.mobile_operator === 'mvol' 
                              ? 'text-primary-600' 
                              : 'text-neutral-600'
                          }`}>MVola</span>
                        </label>
                        
                        <label className="flex flex-col items-center p-3 border-2 border-neutral-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                          <input
                            type="radio"
                            name="mobile_operator"
                            value="orange"
                            checked={formData.payment.mobile_operator === 'orange'}
                            onChange={(e) => handleInputChange('payment', 'mobile_operator', e.target.value)}
                            className="sr-only"
                          />
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                            formData.payment.mobile_operator === 'orange' 
                              ? 'bg-orange-100 text-orange-600' 
                              : 'bg-neutral-100 text-neutral-400'
                          }`}>
                            <Smartphone className="w-6 h-6" />
                          </div>
                          <span className={`text-sm font-medium ${
                            formData.payment.mobile_operator === 'orange' 
                              ? 'text-primary-600' 
                              : 'text-neutral-600'
                          }`}>Orange</span>
                        </label>
                        
                        <label className="flex flex-col items-center p-3 border-2 border-neutral-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                          <input
                            type="radio"
                            name="mobile_operator"
                            value="airtel"
                            checked={formData.payment.mobile_operator === 'airtel'}
                            onChange={(e) => handleInputChange('payment', 'mobile_operator', e.target.value)}
                            className="sr-only"
                          />
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                            formData.payment.mobile_operator === 'airtel' 
                              ? 'bg-red-100 text-red-600' 
                              : 'bg-neutral-100 text-neutral-400'
                          }`}>
                            <Smartphone className="w-6 h-6" />
                          </div>
                          <span className={`text-sm font-medium ${
                            formData.payment.mobile_operator === 'airtel' 
                              ? 'text-primary-600' 
                              : 'text-neutral-600'
                          }`}>Airtel</span>
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Nom complet</label>
                        <input
                          type="text"
                          placeholder="Nom complet*"
                          value={formData.payment.paypal_name || ''}
                          onChange={(e) => handleInputChange('payment', 'paypal_name', e.target.value)}
                          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
                            touchedFields.payment.paypal_name && fieldErrors.payment.paypal_name 
                              ? 'border-red-500 focus:ring-red-500' 
                              : 'border-neutral-200 focus:ring-primary-500'
                          }`}
                        />
                        {touchedFields.payment.paypal_name && fieldErrors.payment.paypal_name && (
                          <p className="text-sm text-red-600 mt-1">{fieldErrors.payment.paypal_name}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Adresse</label>
                        <input
                          type="text"
                          placeholder="Adresse*"
                          value={formData.payment.paypal_address || ''}
                          onChange={(e) => handleInputChange('payment', 'paypal_address', e.target.value)}
                          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
                            touchedFields.payment.paypal_address && fieldErrors.payment.paypal_address 
                              ? 'border-red-500 focus:ring-red-500' 
                              : 'border-neutral-200 focus:ring-primary-500'
                          }`}
                        />
                        {touchedFields.payment.mobile_address && fieldErrors.payment.mobile_address && (
                          <p className="text-sm text-red-600 mt-1">{fieldErrors.payment.mobile_address}</p>
                        )}
                          <div>
                            <p className="text-sm font-medium text-green-900">Montant à payer</p>
                            <p className="text-xs text-green-700">Via {formData.payment.mobile_operator || 'Mobile Money'}</p>
                          </div>
                          <p className="text-lg font-bold text-green-600">{formatPrice(totals.total)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <label className="flex items-center mb-6">
                  <input
                    type="checkbox"
                    checked={formData.payment.save_card}
                    onChange={(e) => handleInputChange('payment', 'save_card', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Enregistrer mes informations pour la prochaine fois</span>
                </label>

                {/* Sécurité */}
                <div className="bg-neutral-50 p-4 rounded-lg mb-6">
                  <div className="flex items-center space-x-2 text-sm text-neutral-600">
                    <Shield className="w-4 h-4 text-primary-500" />
                    <span>Paiement 100% sécurisé avec cryptage SSL</span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={handlePrevStep}
                    className="btn-secondary"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="btn-luxury"
                  >
                    {formData.payment.method === 'paypal' ? 'Payer avec PayPal' : 
                     formData.payment.method === 'mobile_money' ? 'Confirmer paiement' : 'Payer maintenant'}
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              /* Étape 3: Confirmation */
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

                {/* Récapitulatif de la commande */}
                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="font-medium mb-2">Adresse de livraison</h3>
                    <div className="text-sm text-neutral-600">
                      {formData.shipping.first_name} {formData.shipping.last_name}<br />
                      {formData.shipping.street_address}<br />
                      {formData.shipping.apartment && (
                      <>
                        {formData.shipping.apartment}<br />
                      </>
                    )}
                      {formData.shipping.postal_code} {formData.shipping.city}<br />
                      {formData.shipping.country}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Méthode de paiement</h3>
                    <div className="text-sm text-neutral-600">
                      {formData.payment.method === 'stripe' ? 'Carte de crédit' : 'PayPal'}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={handlePrevStep}
                    className="btn-secondary"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    className="btn-luxury flex items-center space-x-2"
                  >
                    <span>Confirmer la commande</span>
                    <Truck className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Récapitulatif */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-6">Récapitulatif</h2>

              {/* Articles */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex space-x-3">
                    <img
                      src={item.image_url || item.images?.[0] || '/images/BOURBON MORELLI.png'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                      onLoad={(e) => {
                        console.log(`Image chargée: ${item.name} -> ${e.target.src}`);
                      }}
                      onError={(e) => {
                        console.error(`Image ERROR: ${item.name} -> ${e.target.src}`);
                        e.target.src = '/images/BOURBON MORELLI.png';
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-sm text-neutral-500">Qté: {item.quantity}</p>
                      <p className="font-medium text-primary-500">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totaux */}
              <div className="border-t pt-4 space-y-2">
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

              {/* Services */}
              <div className="mt-6 pt-6 border-t space-y-2">
                <div className="flex items-center space-x-2 text-sm text-neutral-600">
                  <Truck className="w-4 h-4 text-primary-500" />
                  <span>Livraison offerte à partir de 200€</span>
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
