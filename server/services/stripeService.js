const Stripe = require('stripe');

let _stripe = null;

const getStripe = () => {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.startsWith('sk_test_REMPLACER')) {
      throw new Error('STRIPE_SECRET_KEY non configurée. Ajoutez votre clé secrète dans server/.env');
    }
    _stripe = Stripe(key);
  }
  return _stripe;
};

const createPaymentIntent = async ({ amount, currency = 'eur', metadata = {} }) => {
  return getStripe().paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    automatic_payment_methods: { enabled: true },
    metadata
  });
};

const retrievePaymentIntent = async (paymentIntentId) => {
  return getStripe().paymentIntents.retrieve(paymentIntentId);
};

// Récupère le PaymentIntent final avec les charges étendues
// → permet de lire le type de méthode réellement utilisé (card / paypal / link…)
const retrievePaymentIntentWithCharges = async (paymentIntentId) => {
  return getStripe().paymentIntents.retrieve(paymentIntentId, {
    expand: ['payment_method', 'latest_charge']
  });
};

const constructWebhookEvent = (payload, signature, secret) => {
  return getStripe().webhooks.constructEvent(payload, signature, secret);
};

module.exports = { createPaymentIntent, retrievePaymentIntent, retrievePaymentIntentWithCharges, constructWebhookEvent };
