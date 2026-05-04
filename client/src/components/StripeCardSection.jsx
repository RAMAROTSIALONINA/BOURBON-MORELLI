import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '15px',
      color: '#171717',
      fontFamily: 'inherit',
      '::placeholder': { color: '#a3a3a3' },
      iconColor: '#737373',
    },
    invalid: { color: '#ef4444', iconColor: '#ef4444' },
  },
  hidePostalCode: true,
};

const StripeCardSection = forwardRef(function StripeCardSection({ disabled }, ref) {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState('');

  useImperativeHandle(ref, () => ({
    // Appelé à l'étape 2 pour capturer les données carte → retourne un paymentMethodId
    capturePaymentMethod: async () => {
      if (!stripe || !elements) throw new Error('Stripe non chargé');
      const cardElement = elements.getElement(CardElement);
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });
      if (error) throw new Error(error.message);
      return paymentMethod.id;
    },
  }));

  return (
    <div className="space-y-3">
      <div className={`border rounded-lg px-4 py-3.5 bg-white transition-colors ${disabled ? 'opacity-50' : 'border-neutral-300 focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900'}`}>
        <CardElement
          options={CARD_ELEMENT_OPTIONS}
          onChange={(e) => setCardError(e.error ? e.error.message : '')}
        />
      </div>
      {cardError && <p className="text-sm text-red-600">{cardError}</p>}
      <p className="text-xs text-neutral-500 flex items-center gap-1">
        <span>🔒</span> Paiement sécurisé par Stripe — vos données sont chiffrées
      </p>
    </div>
  );
});

export default StripeCardSection;
