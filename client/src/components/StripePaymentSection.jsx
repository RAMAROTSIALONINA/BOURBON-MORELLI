import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const StripePaymentSection = forwardRef(function StripePaymentSection({ disabled }, ref) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);

  useImperativeHandle(ref, () => ({
    confirmPayment: async (returnUrl) => {
      if (!stripe || !elements) throw new Error('Stripe non chargé');

      // Valider le formulaire avant confirmation (obligatoire pour les méthodes redirect)
      const { error: submitError } = await elements.submit();
      if (submitError) throw new Error(submitError.message);

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: 'if_required',
      });

      // Si on arrive ici avec une erreur (pas de redirect = erreur inline)
      if (result.error) throw new Error(result.error.message);

      // Paiement inline réussi (carte sans redirect 3DS)
      return result.paymentIntent || null;
    },
  }));

  return (
    <div className="space-y-3">
      {!ready && (
        <div className="space-y-2 animate-pulse">
          <div className="h-12 bg-neutral-100 rounded-lg" />
          <div className="h-12 bg-neutral-100 rounded-lg" />
        </div>
      )}
      <div style={{ display: ready ? 'block' : 'none' }}>
        <PaymentElement
          onReady={() => setReady(true)}
          options={{
            layout: 'tabs',
            wallets: { applePay: 'never', googlePay: 'never' },
            link: { enabled: false }
          }}
        />
      </div>
      {ready && (
        <p className="text-xs text-neutral-500 flex items-center gap-1 mt-2">
          🔒 Paiement sécurisé par Stripe — données chiffrées
        </p>
      )}
    </div>
  );
});

export default StripePaymentSection;
