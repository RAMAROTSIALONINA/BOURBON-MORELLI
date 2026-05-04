import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, Truck, Shield, ArrowLeft, Check, Smartphone, Wallet } from 'lucide-react';
import cartService from '../services/cartService';
import axios from 'axios';
import { useCurrency } from '../contexts/CurrencyContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentSection from '../components/StripePaymentSection';

const stripePublicKey = process.env.REACT_APP_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const BACKEND_URL = 'http://localhost:5003';

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return `${BACKEND_URL}${url}`;
  return url;
};

const Checkout = () => {
  const navigate = useNavigate();

  // État pour stocker les données des pays et régions
  const [countriesData, setCountriesData] = useState({});
  const [loadingCountries, setLoadingCountries] = useState(true);

  // Fonction pour récupérer les données des pays et régions depuis l'API
  const fetchCountriesData = async () => {
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/states');
      const data = await response.json();
      
      if (data.error === false && data.data) {
        // Transformer les données de l'API en notre format
        const transformedData = {};
        
        // Ajouter nos pays prioritaires avec leurs formats de code postal spécifiques
        const priorityCountries = {
          'France': {
            code: 'FR',
            regions: [
              'Île-de-France (Paris)',
              'Auvergne-Rhône-Alpes (Lyon)',
              "Provence-Alpes-Côte d'Azur (Marseille)",
              'Occitanie (Toulouse)',
              'Nouvelle-Aquitaine (Bordeaux)',
              'Grand Est (Strasbourg)',
              'Hauts-de-France (Lille)',
              'Normandie (Rouen)',
              'Bretagne (Rennes)',
              'Pays de la Loire (Nantes)',
              'Centre-Val de Loire (Orléans)',
              'Bourgogne-Franche-Comté (Dijon)',
              'Corse (Ajaccio)',
              'Guadeloupe (Basse-Terre)',
              'Martinique (Fort-de-France)',
              'Guyane (Cayenne)',
              'La Réunion (Saint-Denis)',
              'Mayotte (Mamoudzou)'
            ],
            postalCodePattern: /^\d{5}$/,
            postalCodePlaceholder: '75001',
            postalCodeFormat: '5 chiffres (ex: 75001)'
          },
          'Belgique': {
            code: 'BE',
            regions: [
              'Région flamande', 'Région wallonne', 'Région de Bruxelles-Capitale'
            ],
            postalCodePattern: /^\d{4}$/,
            postalCodePlaceholder: '1000',
            postalCodeFormat: '4 chiffres (ex: 1000)'
          },
          'Suisse': {
            code: 'CH',
            regions: [
              'Zurich', 'Berne', 'Lucerne', 'Uri', 'Schwyz', 'Obwald', 'Nidwald',
              'Glaris', 'Zoug', 'Fribourg', 'Soleure', 'Bâle-Ville', 'Bâle-Campagne',
              'Schaffhouse', 'Appenzell Rhodes-Extérieures', 'Appenzell Rhodes-Intérieures',
              'Saint-Gall', 'Grisons', 'Argovie', 'Thurgovie', 'Tessin', 'Vaud', 'Valais',
              'Neuchâtel', 'Genève', 'Jura'
            ],
            postalCodePattern: /^\d{4}$/,
            postalCodePlaceholder: '8001',
            postalCodeFormat: '4 chiffres (ex: 8001)'
          },
          'Canada': {
            code: 'CA',
            regions: [
              'Alberta', 'Colombie-Britannique', 'Île-du-Prince-Édouard', 'Manitoba',
              'Nouveau-Brunswick', 'Nouvelle-Écosse', 'Nunavut', 'Ontario',
              'Québec', 'Saskatchewan', 'Terre-Neuve-et-Labrador', 'Territoires du Nord-Ouest', 'Yukon'
            ],
            postalCodePattern: /^[A-Z]\d[A-Z] \d[A-Z]\d$/,
            postalCodePlaceholder: 'H3A 1A1',
            postalCodeFormat: 'A1A 1A1 (ex: H3A 1A1)'
          },
          'Madagascar': {
            code: 'MG',
            regions: [
              'Analamanga (Antananarivo)',
              'Vakinankaratra (Antsirabe)',
              'Itasy (Miarinarivo)',
              'Bongolava (Tsiroanomandidy)',
              'Diana (Antsiranana)',
              'Sava (Sambava)',
              'Atsinanana (Toamasina)',
              'Alaotra-Mangoro (Ambatondrazaka)',
              'Boeny (Mahajanga)',
              'Sofia (Antsohihy)',
              'Betsiboka (Maevatanana)',
              'Melaky (Maintirano)',
              'Menabe (Morondava)',
              'Atsimo-Andrefana (Toliara)',
              'Androy (Ambovombe)',
              'Anosy (Taolagnaro)',
              'Atsimo-Atsinanana (Farafangana)',
              'Vatovavy (Mananjary)',
              'Fitovinany (Manakara)',
              'Haute Matsiatra (Fianarantsoa)',
              'Amoron\'i Mania (Ambositra)',
              'Ihorombe (Ihosy)'
            ],
            postalCodePattern: /^\d{3}$/,
            postalCodePlaceholder: '101',
            postalCodeFormat: '3 chiffres (ex: 101)'
          }
        };
        
        // Ajouter les pays prioritaires
        Object.assign(transformedData, priorityCountries);
        
        // Ajouter les autres pays de l'API avec format par défaut
        data.data.forEach(country => {
          if (!priorityCountries[country.name]) {
            transformedData[country.name] = {
              code: country.iso2,
              regions: country.states.map(state => state.name),
              postalCodePattern: /^\d+$/,
              postalCodePlaceholder: '00000',
              postalCodeFormat: 'Format local'
            };
          }
        });
        
        setCountriesData(transformedData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des pays:', error);
      // En cas d'erreur, utiliser les données par défaut
      setCountriesData({
        'France': {
          code: 'FR',
          regions: ['Île-de-France (Paris)', 'Auvergne-Rhône-Alpes (Lyon)'],
          postalCodePattern: /^\d{5}$/,
          postalCodePlaceholder: '75001',
          postalCodeFormat: '5 chiffres (ex: 75001)'
        }
      });
    } finally {
      setLoadingCountries(false);
    }
  };
  const stripeRef = useRef(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [stripeLoading, setStripeLoading] = useState(false);
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
      region: '',
      postal_code: '',
      country: 'France',
      phone: '',
      email: ''
    },
    payment: {
      method: 'stripe',
      mobile_operator: 'mvol',
      mobile_phone: '',
      mobile_name: ''
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
    const loadCart = async () => {
      try {
        const cartData = cartService.getCart();
        setCartItems(cartData.items || []);
        
        const subtotal = cartData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal >= 200 ? 0 : 9.99;
        const total = subtotal + shipping;
        
        setTotals({
          subtotal,
          shipping,
          total
        });
      } catch (error) {
        console.error('Erreur chargement panier:', error);
      } finally {
        setLoading(false);
      }
    };

    // Pré-remplir le formulaire depuis le compte connecté
    try {
      const raw = localStorage.getItem('userInfo');
      if (raw) {
        const u = JSON.parse(raw);
        setFormData(prev => ({
          ...prev,
          shipping: {
            ...prev.shipping,
            first_name: prev.shipping.first_name || u.firstName || u.first_name || '',
            last_name:  prev.shipping.last_name  || u.lastName  || u.last_name  || '',
            email:      prev.shipping.email      || u.email     || '',
            phone:      prev.shipping.phone      || u.phone     || ''
          }
        }));
      }
    } catch (e) { /* ignore */ }

    // Charger les données des pays et le panier en parallèle
    fetchCountriesData();
    loadCart();
  }, []);

  const handleInputChange = (section, field, value) => {
    let processedValue = value;
    
    // Formatage automatique et détection du préfixe pour le numéro de téléphone Mobile Money
    if (section === 'payment' && field === 'mobile_phone') {
      const operator = formData.payment.mobile_operator;
      let prefix = '';
      
      // Déterminer le préfixe selon l'opérateur
      if (operator === 'mvol') {
        prefix = '034';
      } else if (operator === 'orange') {
        prefix = '032';
      } else if (operator === 'airtel') {
        prefix = '033';
      }
      
      // Nettoyer et formater le numéro
      processedValue = value.replace(/[^\d\s]/g, '');
      
      // Ajouter automatiquement le préfixe si le numéro commence par 03
      if (processedValue.startsWith('03') && !processedValue.startsWith(prefix)) {
        // Remplacer le préfixe existant par celui de l'opérateur
        processedValue = prefix + processedValue.substring(3);
      } else if (processedValue.length > 0 && !processedValue.startsWith('03')) {
        // Ajouter le préfixe de l'opérateur si aucun préfixe 03
        processedValue = prefix + processedValue;
      }
      
      // Formater avec espaces pour la lisibilité et limiter à 10 chiffres
      const digits = processedValue.replace(/\s/g, '');
      const limitedDigits = digits.substring(0, 10); // Limiter à 10 chiffres
      
      if (limitedDigits.length > 6) {
        processedValue = limitedDigits.substring(0, 3) + ' ' + limitedDigits.substring(3, 6) + ' ' + limitedDigits.substring(6);
      } else if (limitedDigits.length > 3) {
        processedValue = limitedDigits.substring(0, 3) + ' ' + limitedDigits.substring(3);
      } else {
        processedValue = limitedDigits;
      }
    }
    
    // Formatage spécial pour le code postal
    if (section === 'shipping' && field === 'postal_code') {
      const country = formData.shipping.country;
      const countryData = countriesData[country];
      
      if (countryData) {
        if (country === 'Canada') {
          // Formatage pour Canada: A1A 1A1
          const cleanedValue = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
          const formattedValue = cleanedValue.replace(/([A-Z]\d[A-Z])(\d[A-Z]\d)/, '$1 $2');
          processedValue = formattedValue;
        } else if (country === 'France' || country === 'Belgique' || country === 'Suisse' || country === 'Madagascar') {
          // Formatage pour pays avec chiffres seulement
          processedValue = value.replace(/\D/g, '');
        }
      }
    }
    
    // Mettre à jour le préfixe si l'opérateur change
    if (section === 'payment' && field === 'mobile_operator') {
      // D'abord, mettre à jour l'opérateur sélectionné
      setFormData(prev => ({
        ...prev,
        payment: {
          ...prev.payment,
          [field]: value
        }
      }));
      
      // Ensuite, mettre à jour le numéro de téléphone avec le nouveau préfixe
      const currentPhone = formData.payment.mobile_phone || '';
      if (currentPhone.startsWith('03')) {
        let newPrefix = '';
        if (value === 'mvol') newPrefix = '034';
        else if (value === 'orange') newPrefix = '032';
        else if (value === 'airtel') newPrefix = '033';
        
        // Remplacer le préfixe existant
        const digits = currentPhone.replace(/\s/g, '');
        if (digits.length > 3) {
          const newPhone = newPrefix + digits.substring(3);
          const limitedPhone = newPhone.substring(0, 10); // Limiter à 10 chiffres
          
          // Formater avec espaces
          let formattedPhone = limitedPhone;
          if (limitedPhone.length > 6) {
            formattedPhone = limitedPhone.substring(0, 3) + ' ' + limitedPhone.substring(3, 6) + ' ' + limitedPhone.substring(6);
          } else if (limitedPhone.length > 3) {
            formattedPhone = limitedPhone.substring(0, 3) + ' ' + limitedPhone.substring(3);
          }
          
          // Mettre à jour le numéro de téléphone
          setTimeout(() => {
            setFormData(prev => ({
              ...prev,
              payment: {
                ...prev.payment,
                mobile_phone: formattedPhone
              }
            }));
            validateField('payment', 'mobile_phone', formattedPhone);
          }, 0);
        }
      }
      
      // Marquer le champ comme touché
      setTouchedFields(prev => ({
        ...prev,
        payment: {
          ...prev.payment,
          [field]: true
        }
      }));
      
      return; // Sortir après avoir géré le changement d'opérateur
    }

    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: processedValue
      }
    }));

    setTouchedFields(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: true
      }
    }));

    validateField(section, field, processedValue);
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
          if (!value) {
            error = 'Le code postal est requis';
          } else {
            const country = formData.shipping.country;
            const countryData = countriesData[country];
            
            if (countryData && countryData.postalCodePattern) {
              if (!countryData.postalCodePattern.test(value)) {
                error = `Format invalide pour ${country}. ${countryData.postalCodeFormat}`;
              }
            } else {
              error = 'Format de code postal invalide';
            }
          }
          break;
        case 'phone':
          if (!value || !/^[0-9\s\-+()]{8,15}$/.test(value)) {
            error = 'Le numéro de téléphone doit contenir 8 à 15 chiffres';
          }
          break;
        case 'email':
          if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            error = 'Veuillez entrer une adresse email valide';
          }
          break;
      default:
        break;
      }
    } else if (section === 'payment') {
      switch (field) {
        case 'mobile_phone':
          if (formData.payment.method === 'mobile') {
            const cleanPhone = value.replace(/\s/g, '');
            if (!value || !/^[0-9\s]{10,12}$/.test(value)) {
              error = 'Le numéro de téléphone doit contenir exactement 10 chiffres (ex: 034 650 345 4)';
            } else if (cleanPhone.length !== 10) {
              error = 'Le numéro de téléphone doit contenir exactement 10 chiffres';
            }
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

  // Crée l'ordre + le PaymentIntent Stripe dès que l'utilisateur arrive à l'étape 2
  useEffect(() => {
    if (currentStep === 2 && stripePromise && !stripeClientSecret && !stripeLoading && cartItems.length > 0) {
      const createOrderAndIntent = async () => {
        setStripeLoading(true);
        setPaymentError('');
        try {
          const payload = {
            customer: {
              email: formData.shipping.email,
              first_name: formData.shipping.first_name,
              last_name: formData.shipping.last_name,
              phone: formData.shipping.phone
            },
            shipping: {
              street_address: formData.shipping.street_address,
              city: formData.shipping.city,
              postal_code: formData.shipping.postal_code,
              country: formData.shipping.country
            },
            items: cartItems.map(it => ({
              product_id: it.id || it.product_id,
              name: it.name,
              sku: it.sku || '',
              price: parseFloat(it.price) || 0,
              quantity: it.quantity || 1
            })),
            subtotal: totals.subtotal,
            shipping_amount: totals.shipping || 0,
            total: totals.total,
            payment_method: 'stripe'
          };
          const orderRes = await axios.post(`${BACKEND_URL}/api/orders/public`, payload);
          const orderId = orderRes.data?.order?.id;
          setPendingOrderId(orderId);

          const intentRes = await axios.post(`${BACKEND_URL}/api/payments/stripe/create-intent-public`, {
            order_id: orderId,
            email: formData.shipping.email,
            currency: 'EUR'
          });
          setStripeClientSecret(intentRes.data.client_secret);
        } catch (err) {
          // Erreur stock côté serveur (409)
          if (err.response?.status === 409) {
            setPaymentError(err.response.data?.message || 'Stock insuffisant pour un ou plusieurs articles.');
          } else {
            setPaymentError('Impossible d\'initialiser le paiement. Veuillez réessayer.');
          }
        } finally {
          setStripeLoading(false);
        }
      };
      createOrderAndIntent();
    }
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildOrderData = (orderId, method, extraDetails = {}) => ({
    id: orderId || ('ORD-' + Date.now()),
    customerName: `${formData.shipping.first_name} ${formData.shipping.last_name}`,
    items: cartItems.map(item => ({
      ...item,
      price: parseFloat(item.price) || 0,
      quantity: item.quantity || 1,
      image: item.image || item.image_url || (item.images && item.images[0]) || '/images/placeholder-product.jpg'
    })),
    subtotal: totals.subtotal,
    shipping: {
      firstName: formData.shipping.first_name,
      lastName: formData.shipping.last_name,
      streetAddress: formData.shipping.street_address,
      postalCode: formData.shipping.postal_code,
      city: formData.shipping.city,
      country: formData.shipping.country,
      email: formData.shipping.email,
      phone: formData.shipping.phone
    },
    shippingCost: totals.shipping || 0,
    total: totals.total,
    payment: { method, status: 'paid', details: extraDetails },
    created_at: new Date().toISOString()
  });

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
    
    if (!shipping.country) {
      errors.push('Le pays est requis');
    }
    
    if (!shipping.region) {
      errors.push('La région est requise');
    }
    
    if (!shipping.postal_code) {
      errors.push('Le code postal est requis');
    } else {
      const country = shipping.country;
      const countryData = countriesData[country];
      
      if (countryData && countryData.postalCodePattern) {
        if (!countryData.postalCodePattern.test(shipping.postal_code)) {
          errors.push(`Format invalide pour ${country}. ${countryData.postalCodeFormat}`);
        }
      } else {
        errors.push('Format de code postal invalide');
      }
    }
    
    if (!shipping.phone || !/^[0-9\s\-+()]{8,15}$/.test(shipping.phone)) {
      errors.push('Le numéro de téléphone doit contenir 8 à 15 chiffres');
    }
    
    if (!shipping.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) {
      errors.push('Veuillez entrer une adresse email valide');
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
      case 'stripe':
        // PaymentElement (carte / PayPal) — validation gérée par Stripe
        break;

      case 'mobile':
        if (!payment.mobile_operator) {
          errors.push('Veuillez choisir un opérateur Mobile Money');
        }
        const cleanPhone = payment.mobile_phone.replace(/\s/g, '');
        if (!payment.mobile_phone || !/^[0-9\s]{10,12}$/.test(payment.mobile_phone)) {
          errors.push('Le numéro de téléphone doit contenir exactement 10 chiffres (ex: 034 650 345 4)');
        } else if (cleanPhone.length !== 10) {
          errors.push('Le numéro de téléphone doit contenir exactement 10 chiffres');
        }
        if (!payment.mobile_name || payment.mobile_name.trim().length < 3) {
          errors.push('Le nom complet doit contenir au moins 3 caractères');
        }
        break;

      default:
        break;
    }
    
    if (errors.length > 0) {
      setPaymentError(errors[0]);
      return false;
    }
    
    return true;
  };

  const handleNextStep = async () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = validateShippingStep();
        break;
      case 2:
        isValid = validatePaymentStep();
        if (isValid && formData.payment.method !== 'mobile') {
          // Paiement Stripe (carte / PayPal) — confirmer directement ici
          setPaymentError('');
          setPaymentProcessing(true);
          try {
            const returnUrl = `${window.location.origin}/order-confirmation`;
            // Sauvegarde avant redirect PayPal (location.state ne survit pas aux redirects)
            sessionStorage.setItem('pendingOrder', JSON.stringify(buildOrderData(pendingOrderId, 'stripe')));
            const paymentIntent = await stripeRef.current.confirmPayment(returnUrl);
            // paymentIntent non-null = carte payée inline (pas de redirect)
            if (paymentIntent) {
              // Synchroniser le statut et la méthode réelle dans payment_transactions
              try {
                await axios.post(`${BACKEND_URL}/api/payments/stripe/complete-transaction`, {
                  payment_intent_id: paymentIntent.id,
                  order_id: pendingOrderId
                });
              } catch (e) { /* non-bloquant */ }

              sessionStorage.removeItem('pendingOrder');
              const orderData = buildOrderData(pendingOrderId, 'stripe');
              cartService.clearCart();
              navigate('/order-confirmation', { state: { order: orderData, paymentMethod: 'stripe' } });
            }
            // Si null = redirect PayPal géré automatiquement par Stripe
          } catch (err) {
            setPaymentError(err.message || 'Le paiement a échoué. Veuillez réessayer.');
          } finally {
            setPaymentProcessing(false);
          }
          return;
        }
        break;
      case 3:
        isValid = true;
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

  // processPayment : uniquement pour Mobile Money (étape 3)
  const processPayment = async () => {
    setPaymentError('');
    setPaymentProcessing(true);
    let savedOrderId = null;
    try {
      const payload = {
        customer: { email: formData.shipping.email, first_name: formData.shipping.first_name, last_name: formData.shipping.last_name, phone: formData.shipping.phone },
        shipping: { street_address: formData.shipping.street_address, city: formData.shipping.city, postal_code: formData.shipping.postal_code, country: formData.shipping.country },
        items: cartItems.map(it => ({ product_id: it.id || it.product_id, name: it.name, sku: it.sku || '', price: parseFloat(it.price) || 0, quantity: it.quantity || 1 })),
        subtotal: totals.subtotal,
        shipping_amount: totals.shipping || 0,
        total: totals.total,
        payment_method: 'mobile'
      };
      const response = await axios.post(`${BACKEND_URL}/api/orders/public`, payload);
      if (response.data?.order?.id) savedOrderId = response.data.order.id;
    } catch (err) {
      if (err.response?.status === 409) {
        setPaymentError(err.response.data?.message || 'Stock insuffisant pour un ou plusieurs articles.');
      } else {
        setPaymentError('La commande n\'a pas pu être enregistrée. Veuillez réessayer.');
      }
      setPaymentProcessing(false);
      return;
    }
    const orderData = buildOrderData(savedOrderId, 'mobile', {
      operator: formData.payment.mobile_operator,
      phone: formData.payment.mobile_phone,
      holderName: formData.payment.mobile_name
    });
    cartService.clearCart();
    setPaymentProcessing(false);
    navigate('/order-confirmation', { state: { order: orderData, paymentMethod: 'mobile' } });
  };

  const { format: formatPrice } = useCurrency();

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
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Prénom</label>
                    <input
                      type="text"
                      placeholder="Prénom"
                      value={formData.shipping.first_name}
                      onChange={(e) => handleInputChange('shipping', 'first_name', e.target.value)}
                      className={`input-luxury ${touchedFields.shipping.first_name && fieldErrors.shipping.first_name ? 'border-red-500' : ''}`}
                    />
                    {touchedFields.shipping.first_name && fieldErrors.shipping.first_name && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.shipping.first_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Nom</label>
                    <input
                      type="text"
                      placeholder="Nom"
                      value={formData.shipping.last_name}
                      onChange={(e) => handleInputChange('shipping', 'last_name', e.target.value)}
                      className={`input-luxury ${touchedFields.shipping.last_name && fieldErrors.shipping.last_name ? 'border-red-500' : ''}`}
                    />
                    {touchedFields.shipping.last_name && fieldErrors.shipping.last_name && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.shipping.last_name}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Adresse</label>
                    <input
                      type="text"
                      placeholder="Adresse"
                      value={formData.shipping.street_address}
                      onChange={(e) => handleInputChange('shipping', 'street_address', e.target.value)}
                      className={`input-luxury ${touchedFields.shipping.street_address && fieldErrors.shipping.street_address ? 'border-red-500' : ''}`}
                    />
                    {touchedFields.shipping.street_address && fieldErrors.shipping.street_address && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.shipping.street_address}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Pays</label>
                    <select
                      value={formData.shipping.country}
                      onChange={(e) => handleInputChange('shipping', 'country', e.target.value)}
                      disabled={loadingCountries}
                      className={`w-full p-3 border rounded-lg ${touchedFields.shipping.country && fieldErrors.shipping.country ? 'border-red-500' : 'border-neutral-200'} ${loadingCountries ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      <option value="">Sélectionner un pays</option>
                      {Object.keys(countriesData)
                        .sort((a, b) => {
                          // Mettre nos pays prioritaires en premier
                          const priorityOrder = ['France', 'Belgique', 'Suisse', 'Canada', 'Madagascar'];
                          const aIndex = priorityOrder.indexOf(a);
                          const bIndex = priorityOrder.indexOf(b);
                          
                          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                          if (aIndex !== -1) return -1;
                          if (bIndex !== -1) return 1;
                          
                          return a.localeCompare(b);
                        })
                        .map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                    </select>
                    {loadingCountries && (
                      <p className="text-xs text-gray-500 mt-1">Chargement des pays...</p>
                    )}
                    {!loadingCountries && Object.keys(countriesData).length === 0 && (
                      <p className="text-xs text-red-500 mt-1">Erreur de chargement, veuillez réessayer</p>
                    )}
                    {touchedFields.shipping.country && fieldErrors.shipping.country && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.shipping.country}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Région</label>
                    <select
                      value={formData.shipping.region}
                      onChange={(e) => handleInputChange('shipping', 'region', e.target.value)}
                      disabled={!formData.shipping.country}
                      className={`w-full p-3 border rounded-lg ${touchedFields.shipping.region && fieldErrors.shipping.region ? 'border-red-500' : 'border-neutral-200'} ${!formData.shipping.country ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      <option value="">Sélectionner une région</option>
                      {formData.shipping.country && countriesData[formData.shipping.country]?.regions.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                    {touchedFields.shipping.region && fieldErrors.shipping.region && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.shipping.region}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Ville</label>
                    <input
                      type="text"
                      placeholder="Ville"
                      value={formData.shipping.city}
                      onChange={(e) => handleInputChange('shipping', 'city', e.target.value)}
                      className={`input-luxury ${touchedFields.shipping.city && fieldErrors.shipping.city ? 'border-red-500' : ''}`}
                    />
                    {touchedFields.shipping.city && fieldErrors.shipping.city && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.shipping.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Code postal</label>
                    <input
                      type="text"
                      placeholder={countriesData[formData.shipping.country]?.postalCodePlaceholder || 'Code postal'}
                      value={formData.shipping.postal_code}
                      onChange={(e) => handleInputChange('shipping', 'postal_code', e.target.value)}
                      className={`input-luxury ${touchedFields.shipping.postal_code && fieldErrors.shipping.postal_code ? 'border-red-500' : ''}`}
                      maxLength={formData.shipping.country === 'Canada' ? 7 : 10}
                    />
                    {formData.shipping.country && (
                      <p className="text-xs text-gray-500 mt-1">
                        Format: {countriesData[formData.shipping.country]?.postalCodeFormat}
                      </p>
                    )}
                    {touchedFields.shipping.postal_code && fieldErrors.shipping.postal_code && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.shipping.postal_code}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      placeholder="Téléphone"
                      value={formData.shipping.phone}
                      onChange={(e) => handleInputChange('shipping', 'phone', e.target.value)}
                      className={`input-luxury ${touchedFields.shipping.phone && fieldErrors.shipping.phone ? 'border-red-500' : ''}`}
                    />
                    {touchedFields.shipping.phone && fieldErrors.shipping.phone && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.shipping.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.shipping.email || ''}
                      onChange={(e) => handleInputChange('shipping', 'email', e.target.value)}
                      className={`input-luxury ${touchedFields.shipping.email && fieldErrors.shipping.email ? 'border-red-500' : ''}`}
                    />
                    {touchedFields.shipping.email && fieldErrors.shipping.email && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.shipping.email}</p>
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
                
                <div className="space-y-3 mb-6">
                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.payment.method !== 'mobile' ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="stripe"
                      checked={formData.payment.method !== 'mobile'}
                      onChange={() => handleInputChange('payment', 'method', 'stripe')}
                      className="mr-3"
                    />
                    <CreditCard className="w-5 h-5 mr-2 text-neutral-700" />
                    <Wallet className="w-5 h-5 mr-2 text-blue-500" />
                    <span className="font-medium">Carte de crédit / PayPal</span>
                  </label>

                  <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.payment.method === 'mobile' ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'}`}>
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

                {/* Stripe PaymentElement (carte + PayPal) */}
                {formData.payment.method !== 'mobile' && (
                  <div className="mb-4">
                    {stripeLoading && (
                      <div className="space-y-2 animate-pulse">
                        <div className="h-12 bg-neutral-100 rounded-lg" />
                        <div className="h-12 bg-neutral-100 rounded-lg" />
                      </div>
                    )}
                    {stripeClientSecret && stripePromise && (
                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret: stripeClientSecret,
                          appearance: {
                            theme: 'stripe',
                            variables: { colorPrimary: '#171717', borderRadius: '8px' }
                          }
                        }}
                      >
                        <StripePaymentSection ref={stripeRef} disabled={paymentProcessing} />
                      </Elements>
                    )}
                    {!stripeLoading && !stripeClientSecret && paymentError && (
                      <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-sm text-red-700">{paymentError}</div>
                    )}
                  </div>
                )}


                {formData.payment.method === 'mobile' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <label className={`flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${formData.payment.mobile_operator === 'mvol' ? 'border-orange-500 bg-orange-50' : 'border-neutral-200 hover:border-neutral-300'}`}>
                        <input
                          type="radio"
                          name="mobile_operator"
                          value="mvol"
                          checked={formData.payment.mobile_operator === 'mvol'}
                          onChange={(e) => handleInputChange('payment', 'mobile_operator', e.target.value)}
                          className="sr-only"
                        />
                        <img 
                          src="/images/Mvola.PNG" 
                          alt="MVola" 
                          className="w-12 h-12 mb-2 object-contain"
                          onError={(e) => {
                            e.target.src = '/images/placeholder-logo.png';
                          }}
                        />
                        <span className="text-sm font-medium">MVola</span>
                      </label>
                      <label className={`flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${formData.payment.mobile_operator === 'orange' ? 'border-orange-500 bg-orange-50' : 'border-neutral-200 hover:border-neutral-300'}`}>
                        <input
                          type="radio"
                          name="mobile_operator"
                          value="orange"
                          checked={formData.payment.mobile_operator === 'orange'}
                          onChange={(e) => handleInputChange('payment', 'mobile_operator', e.target.value)}
                          className="sr-only"
                        />
                        <img 
                          src="/images/orange.PNG" 
                          alt="Orange" 
                          className="w-12 h-12 mb-2 object-contain"
                          onError={(e) => {
                            e.target.src = '/images/placeholder-logo.png';
                          }}
                        />
                        <span className="text-sm font-medium">Orange</span>
                      </label>
                      <label className={`flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${formData.payment.mobile_operator === 'airtel' ? 'border-red-500 bg-red-50' : 'border-neutral-200 hover:border-neutral-300'}`}>
                        <input
                          type="radio"
                          name="mobile_operator"
                          value="airtel"
                          checked={formData.payment.mobile_operator === 'airtel'}
                          onChange={(e) => handleInputChange('payment', 'mobile_operator', e.target.value)}
                          className="sr-only"
                        />
                        <img 
                          src="/images/Airtel.PNG" 
                          alt="Airtel" 
                          className="w-12 h-12 mb-2 object-contain"
                          onError={(e) => {
                            e.target.src = '/images/placeholder-logo.png';
                          }}
                        />
                        <span className="text-sm font-medium">Airtel</span>
                      </label>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Smartphone className="w-6 h-6 text-green-600" />
                        <h3 className="font-semibold text-green-900">Paiement Mobile Money</h3>
                      </div>
                      <p className="text-sm text-green-700 mb-4">
                        Choisissez votre opérateur et entrez vos informations pour finaliser le paiement.
                      </p>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-green-900 mb-1">
                            Numéro de téléphone
                          </label>
                          <input
                            type="tel"
                            placeholder="034 650 345 4"
                            value={formData.payment.mobile_phone}
                            onChange={(e) => handleInputChange('payment', 'mobile_phone', e.target.value)}
                            className="w-full p-3 border border-green-200 rounded-lg bg-white"
                          />
                          {touchedFields.payment.mobile_phone && fieldErrors.payment.mobile_phone && (
                            <p className="text-sm text-red-600 mt-1">{fieldErrors.payment.mobile_phone}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-green-900 mb-1">
                            Nom complet du titulaire
                          </label>
                          <input
                            type="text"
                            placeholder="Prénom Nom"
                            value={formData.payment.mobile_name}
                            onChange={(e) => handleInputChange('payment', 'mobile_name', e.target.value)}
                            className="w-full p-3 border border-green-200 rounded-lg bg-white"
                          />
                          {touchedFields.payment.mobile_name && fieldErrors.payment.mobile_name && (
                            <p className="text-sm text-red-600 mt-1">{fieldErrors.payment.mobile_name}</p>
                          )}
                        </div>
                        
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-gray-600">
                          <p className="font-medium text-gray-700 mb-1">Sécurité garantie</p>
                          <ul className="space-y-1">
                            <li>• Transactions cryptées et sécurisées</li>
                            <li>• Validation instantanée des opérateurs</li>
                            <li>• Paiement sans partager vos informations bancaires</li>
                            <li>• Support client 24/7 disponible</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {paymentError && formData.payment.method !== 'mobile' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-4">
                    {paymentError}
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <button onClick={handlePrevStep} className="btn-secondary" disabled={paymentProcessing}>
                    Retour
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="btn-luxury flex items-center gap-2 disabled:opacity-60"
                    disabled={paymentProcessing || (formData.payment.method !== 'mobile' && stripeLoading)}
                  >
                    {paymentProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Traitement...
                      </>
                    ) : formData.payment.method === 'mobile' ? (
                      'Continuer'
                    ) : (
                      'Payer maintenant'
                    )}
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
                      {formData.shipping.email}<br />
                      {formData.shipping.street_address}<br />
                      {formData.shipping.postal_code} {formData.shipping.city}<br />
                      {formData.shipping.region}<br />
                      {formData.shipping.country}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Méthode de paiement</h3>
                    <div className="text-sm text-neutral-600">
                      {formData.payment.method === 'card' ? 'Carte de crédit' : 
                       formData.payment.method === 'paypal' ? 'PayPal' : 'Mobile Money'}
                    </div>
                    {formData.payment.method === 'mobile' && (
                      <div className="mt-2 space-y-1 text-xs text-neutral-500">
                        <div><strong>Opérateur:</strong> {formData.payment.mobile_operator === 'mvol' ? 'MVola' : formData.payment.mobile_operator === 'orange' ? 'Orange' : 'Airtel'}</div>
                        <div><strong>Téléphone:</strong> {formData.payment.mobile_phone}</div>
                        <div><strong>Nom:</strong> {formData.payment.mobile_name}</div>
                      </div>
                    )}
                  </div>
                </div>

                {paymentError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                    {paymentError}
                  </div>
                )}

                <div className="flex justify-between">
                  <button onClick={handlePrevStep} className="btn-secondary" disabled={paymentProcessing}>
                    Retour
                  </button>
                  <button
                    onClick={processPayment}
                    className="btn-luxury flex items-center gap-2 disabled:opacity-60"
                    disabled={paymentProcessing}
                  >
                    {paymentProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Traitement en cours...
                      </>
                    ) : (
                      'Confirmer la commande'
                    )}
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
                      src={resolveImageUrl(item.image || item.image_url || item.images?.[0]) || '/images/placeholder-product.jpg'}
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
