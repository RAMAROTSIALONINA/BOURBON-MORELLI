import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, Truck, Shield, ArrowLeft, Check, Smartphone, Wallet } from 'lucide-react';
import cartService from '../services/cartService';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:5003';

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
      method: 'card',
      card_type: 'visa',
      card_holder: '',
      card_number: '',
      card_expiry: '',
      cvv: '',
      save_card: false,
      paypal_email: '',
      paypal_payment_id: '',
      paypal_payer_id: '',
      paypal_verified: false,
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

    // Charger les données des pays et le panier en parallèle
    fetchCountriesData();
    loadCart();
  }, []);

  const handleInputChange = (section, field, value) => {
    let processedValue = value;
    
    // Formatage automatique pour le numéro de carte
    if (section === 'payment' && field === 'card_number') {
      processedValue = formatCardNumber(value);
      
      // Détecter automatiquement le type de carte
      const cardType = detectCardType(processedValue.replace(/\s/g, ''));
      setFormData(prev => ({
        ...prev,
        payment: {
          ...prev.payment,
          card_type: cardType
        }
      }));
    }
    
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

  // Fonction pour détecter le type de carte
  const detectCardType = (cardNumber) => {
    const cleanedNumber = cardNumber.replace(/\s/g, '');
    
    // Visa: commence par 4, 13 ou 16 chiffres
    if (/^4/.test(cleanedNumber) && (cleanedNumber.length === 13 || cleanedNumber.length === 16)) {
      return 'visa';
    }
    
    // Mastercard: commence par 51-55, 16 chiffres
    if (/^5[1-5]/.test(cleanedNumber) && cleanedNumber.length === 16) {
      return 'mastercard';
    }
    
    // American Express: commence par 34 ou 37, 15 chiffres
    if (/^3[47]/.test(cleanedNumber) && cleanedNumber.length === 15) {
      return 'amex';
    }
    
    return null;
  };

  // Fonction pour formater le numéro de carte
  const formatCardNumber = (value) => {
    const cleanedValue = value.replace(/\s/g, '');
    const cardType = detectCardType(cleanedValue);
    
    // Formatage selon le type de carte
    if (cardType === 'amex') {
      // American Express: 4-6-5 (ex: 3782 822463 10005)
      return cleanedValue.replace(/(\d{4})(\d{6})(\d{0,5})/, '$1 $2 $3').trim();
    } else {
      // Visa/Mastercard: 4-4-4-4 (ex: 4242 4242 4242 4242)
      return cleanedValue.replace(/(\d{4})(\d{4})(\d{4})(\d{0,4})/, '$1 $2 $3 $4').trim();
    }
  };

  // Fonction pour obtenir le logo de la carte
  const getCardLogo = (cardType) => {
    switch (cardType) {
      case 'visa':
        return (
          <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
            VISA
          </div>
        );
      case 'mastercard':
        return (
          <div className="w-8 h-5 bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold">
            MC
          </div>
        );
      case 'amex':
        return (
          <div className="w-8 h-5 bg-green-600 rounded flex items-center justify-center text-white text-xs font-bold">
            AMEX
          </div>
        );
      default:
        return null;
    }
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
        case 'card_holder':
          if (formData.payment.method === 'card' && (!value || value.trim().length < 3)) {
            error = 'Le nom du titulaire doit contenir au moins 3 caractères';
          }
          break;
        case 'card_number':
          if (formData.payment.method === 'card') {
            const cleanedNumber = value.replace(/\s/g, '');
            const cardType = detectCardType(cleanedNumber);
            
            if (!cleanedNumber) {
              error = 'Le numéro de carte est requis';
            } else if (!cardType) {
              error = 'Type de carte non reconnu (Visa, Mastercard ou American Express)';
            } else {
              // Validation spécifique selon le type
              if (cardType === 'amex' && cleanedNumber.length !== 15) {
                error = 'American Express doit contenir 15 chiffres';
              } else if (cardType !== 'amex' && (cleanedNumber.length !== 13 && cleanedNumber.length !== 16)) {
                error = 'Visa/Mastercard doit contenir 13 ou 16 chiffres';
              }
            }
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
        case 'paypal':
        // Email PayPal est optionnel - pas de validation requise
        break;
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

  const handlePayPalPayment = () => {
    // Simuler une redirection vers PayPal
    // En production, ce serait une vraie redirection vers l'API PayPal
    
    // Afficher une confirmation avant la redirection
    const confirmMessage = `Vous allez être redirigé vers PayPal pour payer ${formatPrice(totals.total)}.\n\n` +
      `Montant: ${formatPrice(totals.total)}\n` +
      `Articles: ${cartItems.length} article(s)\n\n` +
      `Cliquez sur OK pour continuer vers PayPal.`;
    
    if (window.confirm(confirmMessage)) {
      // Simuler la redirection vers PayPal
      // En production: window.location.href = 'https://www.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=...';
      
      // Pour la démo, on simule le succès du paiement PayPal
      setTimeout(() => {
        // Simuler une réponse PayPal réussie
        const paypalResponse = {
          success: true,
          paymentId: 'PAYPAL_' + Date.now(),
          payerId: 'PAYER_' + Math.random().toString(36).substr(2, 9),
          email: formData.payment.paypal_email || formData.shipping.email || 'customer@example.com',
          amount: totals.total
        };  
        
        // Mettre à jour les détails du paiement PayPal
        setFormData(prev => ({
          ...prev,
          payment: {
            ...prev.payment,
            paypal_payment_id: paypalResponse.paymentId,
            paypal_payer_id: paypalResponse.payerId,
            paypal_verified: true
          }
        }));
        
        // Passer à l'étape de confirmation
        setCurrentStep(3);
        
        // Afficher un message de succès
        alert(`Paiement PayPal accepté!\n\nID Payment: ${paypalResponse.paymentId}\nMontant: ${formatPrice(paypalResponse.amount)}\nEmail: ${paypalResponse.email}`);
      }, 2000); // Simuler 2 secondes de redirection
      
      // Message de chargement pendant la "redirection"
      alert('Redirection vers PayPal en cours...\n\nDans une vraie application, vous seriez redirigé vers le site PayPal sécurisé.');
    }
  };

  const handleMobilePayment = () => {
    // Afficher une confirmation avant le paiement
    const operatorName = formData.payment.mobile_operator === 'mvol' ? 'MVola' : 
                      formData.payment.mobile_operator === 'orange' ? 'Orange' : 'Airtel';
    
    const confirmMessage = `Vous allez payer ${formatPrice(totals.total)} avec ${operatorName}.\n\n` +
      `Montant: ${formatPrice(totals.total)}\n` +
      `Opérateur: ${operatorName}\n` +
      `Téléphone: ${formData.payment.mobile_phone}\n` +
      `Nom: ${formData.payment.mobile_name}\n` +
      `Articles: ${cartItems.length} article(s)\n\n` +
      `Cliquez sur OK pour confirmer le paiement.`;
    
    if (window.confirm(confirmMessage)) {
      // Simuler le traitement du paiement Mobile Money
      setTimeout(() => {
        // Simuler une réponse Mobile Money réussie
        const mobileResponse = {
          success: true,
          transactionId: 'MOBILE_' + Date.now(),
          operator: operatorName,
          phone: formData.payment.mobile_phone,
          name: formData.payment.mobile_name,
          amount: totals.total,
          reference: Math.random().toString(36).substr(2, 9).toUpperCase()
        };
        
        // Mettre à jour les détails du paiement Mobile Money
        setFormData(prev => ({
          ...prev,
          payment: {
            ...prev.payment,
            mobile_transaction_id: mobileResponse.transactionId,
            mobile_operator: operatorName,
            mobile_verified: true
          }
        }));
        
        // Passer à l'étape de confirmation
        setCurrentStep(3);
        
        // Afficher un message de succès
        alert(`Paiement ${operatorName} accepté!\n\n` +
          `Transaction: ${mobileResponse.transactionId}\n` +
          `Opérateur: ${mobileResponse.operator}\n` +
          `Montant: ${formatPrice(mobileResponse.amount)}\n` +
          `Téléphone: ${mobileResponse.phone}\n` +
          `Référence: ${mobileResponse.reference}`);
      }, 1500); // Simuler 1.5 secondes de traitement
      
      // Message de chargement pendant le traitement
      alert(`Traitement du paiement ${operatorName} en cours...\n\n` +
        `Dans une vraie application, vous recevriez une notification de confirmation sur votre téléphone.`);
    }
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
        // PayPal ne nécessite pas de validation locale
        // Le processus PayPal gère la validation
        break;
        
      case 'mobile':
        if (!payment.mobile_operator) {
          errors.push('Veuillez choisir un opérateur Mobile Money');
        }
        // Nettoyer le numéro pour compter seulement les chiffres
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

  const processPayment = async () => {
    alert('TEST: Traitement du paiement en cours...\n\nMéthode: ' + formData.payment.method.toUpperCase() + '\nMontant: ' + formatPrice(totals.total));

    // Enregistrer la commande côté backend
    let savedOrderId = 'ORD-' + Date.now();
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
        payment_method: formData.payment.method
      };
      const response = await axios.post(`${BACKEND_URL}/api/orders/public`, payload);
      if (response.data?.order?.id) {
        savedOrderId = response.data.order.id;
        console.log('✅ Commande enregistrée #', savedOrderId);
      }
    } catch (err) {
      console.error('❌ Erreur enregistrement commande:', err);
      alert('Attention : la commande n\'a pas pu être enregistrée côté serveur. Contactez le support.');
    }

    setTimeout(() => {
      // Construire les détails de paiement selon la méthode (exigé par OrderConfirmation)
      const method = formData.payment.method;
      let paymentDetails = {};

      if (method === 'card') {
        paymentDetails = {
          cardNumber: formData.payment.card_number,
          expiry: formData.payment.card_expiry,
          cvv: formData.payment.cvv,
          holder: formData.payment.card_holder,
          type: formData.payment.card_type
        };
      } else if (method === 'paypal') {
        paymentDetails = {
          email: formData.payment.paypal_email || formData.shipping.email,
          name: `${formData.shipping.first_name} ${formData.shipping.last_name}`.trim(),
          paymentId: formData.payment.paypal_payment_id,
          payerId: formData.payment.paypal_payer_id
        };
      } else if (method === 'mobile') {
        paymentDetails = {
          operator: formData.payment.mobile_operator,
          phone: formData.payment.mobile_phone,
          holderName: formData.payment.mobile_name
        };
      }

      const orderData = {
        id: savedOrderId,
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
        payment: {
          method,
          status: 'paid',
          details: paymentDetails
        },
        created_at: new Date().toISOString()
      };

      cartService.clearCart();
      navigate('/order-confirmation', { state: { order: orderData, paymentMethod: method } });
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
                    
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                        {formData.payment.card_type ? (
                          getCardLogo(formData.payment.card_type)
                        ) : (
                          <CreditCard className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Numéro de carte (ex: 4242 4242 4242 4242)"
                        value={formData.payment.card_number}
                        onChange={(e) => handleInputChange('payment', 'card_number', e.target.value)}
                        className={`w-full p-3 pl-12 border rounded-lg ${touchedFields.payment.card_number && fieldErrors.payment.card_number ? 'border-red-500' : 'border-neutral-200'}`}
                        maxLength={19} // Maximum pour formatage avec espaces
                      />
                    </div>
                    {formData.payment.card_type && (
                      <p className="text-xs text-green-600 mt-1">
                        {formData.payment.card_type === 'visa' && 'Visa détectée'}
                        {formData.payment.card_type === 'mastercard' && 'Mastercard détectée'}
                        {formData.payment.card_type === 'amex' && 'American Express détectée'}
                      </p>
                    )}
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
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Wallet className="w-6 h-6 text-blue-600" />
                        <h3 className="font-semibold text-blue-900">Paiement PayPal sécurisé</h3>
                      </div>
                      <p className="text-sm text-blue-700 mb-4">
                        Vous serez redirigé vers PayPal pour finaliser votre paiement en toute sécurité.
                      </p>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-blue-900 mb-1">
                            Email PayPal (optionnel)
                          </label>
                          <input
                            type="email"
                            placeholder="votre@email.com"
                            value={formData.payment.paypal_email}
                            onChange={(e) => handleInputChange('payment', 'paypal_email', e.target.value)}
                            className="w-full p-3 border border-blue-200 rounded-lg bg-white"
                          />
                          <p className="text-xs text-blue-600 mt-1">
                            Pour recevoir votre reçu par email
                          </p>
                        </div>
                        
                        <button
                          type="button"
                          onClick={handlePayPalPayment}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                          <Wallet className="w-5 h-5" />
                          <span>Payer avec PayPal</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-gray-600">
                          <p className="font-medium text-gray-700 mb-1">Sécurité garantie</p>
                          <ul className="space-y-1">
                            <li> chiffrement SSL 256-bit</li>
                            <li> Protection acheteur PayPal</li>
                            <li> Paiement sans partager vos informations bancaires</li>
                          </ul>
                        </div>
                      </div>
                    </div>
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
                        
                        <button
                          type="button"
                          onClick={handleMobilePayment}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                          <Smartphone className="w-5 h-5" />
                          <span>Payer avec Mobile Money</span>
                        </button>
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
