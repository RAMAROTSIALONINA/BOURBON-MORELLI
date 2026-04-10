import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, Truck, Shield, ArrowLeft, Check } from 'lucide-react';

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
      card_holder: '',
      card_number: '',
      card_expiry: '',
      cvv: '',
      billing_address: '',
      paypal_email: '',
      paypal_name: '',
      paypal_address: '',
      mobile_operator: '',
      mobile_phone: '',
      mobile_name: '',
      save_card: false
    }
  });

  const [totals, setTotals] = useState({
    subtotal: 0,
    shipping: 0,
    total: 0
  });

  useEffect(() => {
    // Simuler le chargement du panier
    setTimeout(() => {
      const mockCartItems = [
        {
          id: 1,
          name: 'Nappe de Table Luxe',
          price: 89.99,
          quantity: 1,
          image_url: '/images/nappe-table.png',
          images: ['/images/nappe-table.png'],
          category: { name: 'Nappes' }
        },
        {
          id: 2,
          name: 'T-shirt Premium',
          price: 39.99,
          quantity: 1,
          image_url: '/images/T-shirts1.PNG',
          images: ['/images/T-shirts1.PNG'],
          category: { name: 'T-Shirts' }
        }
      ];

      setCartItems(mockCartItems);
      
      // Logs des URLs d'images
      mockCartItems.forEach(item => {
        console.log(`Image URL pour ${item.name}:`, item.image_url);
        console.log(`Images array pour ${item.name}:`, item.images);
      });
      
      // Calcul plus robuste avec vérification
      const subtotal = mockCartItems.reduce((sum, item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);
        console.log(`🧮 Calcul: ${item.name} = ${item.price} × ${item.quantity} = ${itemTotal}`);
        return sum + itemTotal;
      }, 0);
      
      const shipping = subtotal >= 200 ? 0 : 9.99;
      
      console.log(`💰 Totaux calculés: Sous-total=${subtotal}, Livraison=${shipping}, Total=${subtotal + shipping}`);
      
      setTotals({
        subtotal,
        shipping,
        total: subtotal + shipping
      });
      
      setLoading(false);
    }, 1000);
  }, []);

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlaceOrder = () => {
    console.log('Commande passée:', { formData, cartItems, totals });
    // Rediriger vers la page de confirmation
    navigate('/order-confirmation');
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
                  <input
                    type="text"
                    placeholder="Prénom*"
                    value={formData.shipping.first_name}
                    onChange={(e) => handleInputChange('shipping', 'first_name', e.target.value)}
                    className="input-luxury"
                  />
                  <input
                    type="text"
                    placeholder="Nom*"
                    value={formData.shipping.last_name}
                    onChange={(e) => handleInputChange('shipping', 'last_name', e.target.value)}
                    className="input-luxury"
                  />
                  <input
                    type="text"
                    placeholder="Entreprise (optionnel)"
                    value={formData.shipping.company}
                    onChange={(e) => handleInputChange('shipping', 'company', e.target.value)}
                    className="input-luxury md:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="Adresse*"
                    value={formData.shipping.street_address}
                    onChange={(e) => handleInputChange('shipping', 'street_address', e.target.value)}
                    className="input-luxury md:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="Appartement, suite, etc. (optionnel)"
                    value={formData.shipping.apartment}
                    onChange={(e) => handleInputChange('shipping', 'apartment', e.target.value)}
                    className="input-luxury md:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="Ville*"
                    value={formData.shipping.city}
                    onChange={(e) => handleInputChange('shipping', 'city', e.target.value)}
                    className="input-luxury"
                  />
                  <input
                    type="text"
                    placeholder="Code postal*"
                    value={formData.shipping.postal_code}
                    onChange={(e) => handleInputChange('shipping', 'postal_code', e.target.value)}
                    className="input-luxury"
                  />
                  <select
                    value={formData.shipping.country}
                    onChange={(e) => handleInputChange('shipping', 'country', e.target.value)}
                    className="input-luxury"
                  >
                    <option value="France">France</option>
                    <option value="Belgique">Belgique</option>
                    <option value="Suisse">Suisse</option>
                    <option value="Luxembourg">Luxembourg</option>
                  </select>
                  <input
                    type="tel"
                    placeholder="Téléphone*"
                    value={formData.shipping.phone}
                    onChange={(e) => handleInputChange('shipping', 'phone', e.target.value)}
                    className="input-luxury"
                  />
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
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-neutral-50">
                    <input
                      type="radio"
                      name="payment"
                      value="stripe"
                      checked={formData.payment.method === 'stripe'}
                      onChange={(e) => handleInputChange('payment', 'method', e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Carte de crédit</div>
                      <div className="text-sm text-neutral-500">Visa, Mastercard, American Express</div>
                    </div>
                    <CreditCard className="w-5 h-5 text-neutral-400" />
                  </label>

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
                  </label>

                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-neutral-50">
                    <input
                      type="radio"
                      name="payment"
                      value="mobile_money"
                      checked={formData.payment.method === 'mobile_money'}
                      onChange={(e) => handleInputChange('payment', 'method', e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Mobile Money</div>
                      <div className="text-sm text-neutral-500">MVola, Orange Money, Airtel Money</div>
                    </div>
                  </label>
                </div>

                {/* Formulaire Carte de crédit */}
                {formData.payment.method === 'stripe' && (
                  <div className="bg-neutral-50 p-6 rounded-lg mb-6">
                    <h3 className="font-medium mb-4">Informations de carte</h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Nom du titulaire*"
                        value={formData.payment.card_holder || ''}
                        onChange={(e) => handleInputChange('payment', 'card_holder', e.target.value)}
                        className="input-luxury"
                      />
                      <input
                        type="text"
                        placeholder="Numéro de carte*"
                        value={formData.payment.card_number || ''}
                        onChange={(e) => handleInputChange('payment', 'card_number', e.target.value)}
                        className="input-luxury"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="MM/AA*"
                          value={formData.payment.card_expiry || ''}
                          onChange={(e) => handleInputChange('payment', 'card_expiry', e.target.value)}
                          className="input-luxury"
                        />
                        <input
                          type="text"
                          placeholder="CVV*"
                          value={formData.payment.cvv || ''}
                          onChange={(e) => handleInputChange('payment', 'cvv', e.target.value)}
                          className="input-luxury"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Adresse de facturation*"
                        value={formData.payment.billing_address || ''}
                        onChange={(e) => handleInputChange('payment', 'billing_address', e.target.value)}
                        className="input-luxury"
                      />
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
                {formData.payment.method === 'mobile_money' && (
                  <div className="bg-neutral-50 p-6 rounded-lg mb-6">
                    <h3 className="font-medium mb-4">Informations Mobile Money</h3>
                    <div className="space-y-4">
                      <select
                        value={formData.payment.mobile_operator || ''}
                        onChange={(e) => handleInputChange('payment', 'mobile_operator', e.target.value)}
                        className="input-luxury"
                      >
                        <option value="">Choisir l'opérateur*</option>
                        <option value="mvola">MVola</option>
                        <option value="orange_money">Orange Money</option>
                        <option value="airtel_money">Airtel Money</option>
                      </select>
                      <input
                        type="tel"
                        placeholder="Numéro de téléphone*"
                        value={formData.payment.mobile_phone || ''}
                        onChange={(e) => handleInputChange('payment', 'mobile_phone', e.target.value)}
                        className="input-luxury"
                      />
                      <input
                        type="text"
                        placeholder="Nom du client*"
                        value={formData.payment.mobile_name || ''}
                        onChange={(e) => handleInputChange('payment', 'mobile_name', e.target.value)}
                        className="input-luxury"
                      />
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600">
                          💰 Montant à payer : <span className="font-bold">{formatPrice(totals.total)}</span>
                        </p>
                        <p className="text-sm text-green-600 mt-2">
                          📱 Instructions de paiement seront envoyées après confirmation.
                        </p>
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
                      {formData.shipping.apartment && <>{formData.shipping.apartment}<br /></>}
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
