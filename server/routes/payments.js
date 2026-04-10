const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Import des gateways de paiement (à implémenter)
// const stripeService = require('../services/stripe');
// const paypalService = require('../services/paypal');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Erreur de validation',
      details: errors.array()
    });
  }
  next();
};

// POST /api/payments/stripe/create-intent - Créer une intention de paiement Stripe
router.post('/stripe/create-intent', authenticateToken, [
  body('order_id').isInt({ min: 1 }),
  body('currency').optional().isIn(['EUR', 'USD', 'MGA'])
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.id;
    const { order_id, currency = 'EUR' } = req.body;

    // Vérifier que la commande existe et appartient à l'utilisateur
    const orders = await query(`
      SELECT * FROM orders 
      WHERE id = ? AND user_id = ? AND status = 'pending'
    `, [order_id, userId]);

    if (orders.length === 0) {
      return res.status(404).json({
        error: 'Commande non trouvée',
        message: 'Cette commande n\'existe pas, ne vous appartient pas ou n\'est plus payable'
      });
    }

    const order = orders[0];

    // Conversion de devise si nécessaire
    let amount = order.total_amount;
    if (currency !== 'EUR') {
      // Implémenter la conversion de devise
      const rates = {
        USD: process.env.EUR_TO_USD || 1.08,
        MGA: process.env.EUR_TO_MGA || 4900
      };
      
      if (rates[currency]) {
        amount = order.total_amount * parseFloat(rates[currency]);
      }
    }

    // Créer l'intention de paiement Stripe (simulation)
    // const paymentIntent = await stripeService.createPaymentIntent({
    //   amount: Math.round(amount * 100), // Stripe travaille en centimes
    //   currency: currency.toLowerCase(),
    //   metadata: {
    //     order_id: order_id,
    //     user_id: userId
    //   }
    // });

    // Simulation pour le développement
    const paymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      client_secret: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random().toString(36).substr(2, 9)}`,
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      status: 'requires_payment_method'
    };

    // Enregistrer la transaction
    await query(`
      INSERT INTO payment_transactions (
        order_id, gateway, transaction_id, amount, currency, status, gateway_response
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      order_id,
      'stripe',
      paymentIntent.id,
      amount,
      currency,
      'pending',
      JSON.stringify(paymentIntent)
    ]);

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: amount,
      currency: currency
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'intention de paiement Stripe:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de créer l\'intention de paiement'
    });
  }
});

// POST /api/payments/stripe/confirm - Confirmer un paiement Stripe
router.post('/stripe/confirm', authenticateToken, [
  body('payment_intent_id').isString(),
  body('order_id').isInt({ min: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.id;
    const { payment_intent_id, order_id } = req.body;

    // Vérifier que la commande existe et appartient à l'utilisateur
    const orders = await query(`
      SELECT * FROM orders 
      WHERE id = ? AND user_id = ?
    `, [order_id, userId]);

    if (orders.length === 0) {
      return res.status(404).json({
        error: 'Commande non trouvée',
        message: 'Cette commande n\'existe pas ou ne vous appartient pas'
      });
    }

    // Vérifier la transaction
    const transactions = await query(`
      SELECT * FROM payment_transactions 
      WHERE order_id = ? AND gateway = 'stripe' AND transaction_id = ?
    `, [order_id, payment_intent_id]);

    if (transactions.length === 0) {
      return res.status(404).json({
        error: 'Transaction non trouvée',
        message: 'Cette transaction n\'existe pas'
      });
    }

    // Récupérer le statut du paiement depuis Stripe
    // const paymentIntent = await stripeService.retrievePaymentIntent(payment_intent_id);

    // Simulation pour le développement
    const paymentIntent = {
      id: payment_intent_id,
      status: 'succeeded',
      amount: transactions[0].amount * 100,
      currency: transactions[0].currency.toLowerCase()
    };

    // Mettre à jour la transaction
    await query(`
      UPDATE payment_transactions 
      SET status = ?, gateway_response = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      paymentIntent.status === 'succeeded' ? 'completed' : 'failed',
      JSON.stringify(paymentIntent),
      transactions[0].id
    ]);

    // Si le paiement est réussi, mettre à jour le statut de la commande
    if (paymentIntent.status === 'succeeded') {
      await query(`
        UPDATE orders 
        SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [order_id]);

      // Envoyer un email de confirmation (à implémenter)
      // await emailService.sendOrderConfirmation(order_id);

      res.json({
        message: 'Paiement confirmé avec succès',
        order_status: 'confirmed',
        payment_status: 'completed'
      });
    } else {
      res.status(400).json({
        error: 'Paiement échoué',
        message: 'Le paiement n\'a pas pu être complété',
        payment_status: paymentIntent.status
      });
    }

  } catch (error) {
    console.error('Erreur lors de la confirmation du paiement Stripe:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de confirmer le paiement'
    });
  }
});

// POST /api/payments/paypal/create-order - Créer une commande PayPal
router.post('/paypal/create-order', authenticateToken, [
  body('order_id').isInt({ min: 1 }),
  body('currency').optional().isIn(['EUR', 'USD'])
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.id;
    const { order_id, currency = 'EUR' } = req.body;

    // Vérifier que la commande existe et appartient à l'utilisateur
    const orders = await query(`
      SELECT * FROM orders 
      WHERE id = ? AND user_id = ? AND status = 'pending'
    `, [order_id, userId]);

    if (orders.length === 0) {
      return res.status(404).json({
        error: 'Commande non trouvée',
        message: 'Cette commande n\'existe pas, ne vous appartient pas ou n\'est plus payable'
      });
    }

    const order = orders[0];

    // Créer la commande PayPal (simulation)
    // const paypalOrder = await paypalService.createOrder({
    //   intent: 'CAPTURE',
    //   purchase_units: [{
    //     amount: {
    //       currency_code: currency,
    //       value: order.total_amount.toString()
    //     },
    //     reference_id: order_id.toString()
    //   }]
    // });

    // Simulation pour le développement
    const paypalOrder = {
      id: `PAYPAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'CREATED',
      links: [
        {
          rel: 'approve',
          href: `https://www.sandbox.paypal.com/checkoutnow?token=${Date.now()}`
        }
      ]
    };

    // Enregistrer la transaction
    await query(`
      INSERT INTO payment_transactions (
        order_id, gateway, transaction_id, amount, currency, status, gateway_response
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      order_id,
      'paypal',
      paypalOrder.id,
      order.total_amount,
      currency,
      'pending',
      JSON.stringify(paypalOrder)
    ]);

    res.json({
      order_id: paypalOrder.id,
      approval_url: paypalOrder.links.find(link => link.rel === 'approve')?.href,
      amount: order.total_amount,
      currency: currency
    });

  } catch (error) {
    console.error('Erreur lors de la création de la commande PayPal:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de créer la commande PayPal'
    });
  }
});

// POST /api/payments/paypal/capture - Capturer un paiement PayPal
router.post('/paypal/capture', authenticateToken, [
  body('paypal_order_id').isString(),
  body('order_id').isInt({ min: 1 })
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.id;
    const { paypal_order_id, order_id } = req.body;

    // Vérifier que la commande existe et appartient à l'utilisateur
    const orders = await query(`
      SELECT * FROM orders 
      WHERE id = ? AND user_id = ?
    `, [order_id, userId]);

    if (orders.length === 0) {
      return res.status(404).json({
        error: 'Commande non trouvée',
        message: 'Cette commande n\'existe pas ou ne vous appartient pas'
      });
    }

    // Vérifier la transaction
    const transactions = await query(`
      SELECT * FROM payment_transactions 
      WHERE order_id = ? AND gateway = 'paypal' AND transaction_id = ?
    `, [order_id, paypal_order_id]);

    if (transactions.length === 0) {
      return res.status(404).json({
        error: 'Transaction non trouvée',
        message: 'Cette transaction n\'existe pas'
      });
    }

    // Capturer le paiement PayPal
    // const captureData = await paypalService.capturePayment(paypal_order_id);

    // Simulation pour le développement
    const captureData = {
      id: paypal_order_id,
      status: 'COMPLETED',
      purchase_units: [{
        payments: {
          captures: [{
            id: `CAPTURE-${Date.now()}`,
            status: 'COMPLETED',
            amount: {
              currency_code: transactions[0].currency,
              value: transactions[0].amount.toString()
            }
          }]
        }
      }]
    };

    // Mettre à jour la transaction
    await query(`
      UPDATE payment_transactions 
      SET status = ?, gateway_response = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      'completed',
      JSON.stringify(captureData),
      transactions[0].id
    ]);

    // Mettre à jour le statut de la commande
    await query(`
      UPDATE orders 
      SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [order_id]);

    // Envoyer un email de confirmation (à implémenter)
    // await emailService.sendOrderConfirmation(order_id);

    res.json({
      message: 'Paiement PayPal confirmé avec succès',
      order_status: 'confirmed',
      payment_status: 'completed',
      capture_id: captureData.purchase_units[0].payments.captures[0].id
    });

  } catch (error) {
    console.error('Erreur lors de la capture du paiement PayPal:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de capturer le paiement PayPal'
    });
  }
});

// GET /api/payments/transactions/:orderId - Récupérer les transactions d'une commande
router.get('/transactions/:orderId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    // Vérifier que la commande appartient à l'utilisateur
    const orders = await query(`
      SELECT id FROM orders WHERE id = ? AND user_id = ?
    `, [orderId, userId]);

    if (orders.length === 0) {
      return res.status(404).json({
        error: 'Commande non trouvée',
        message: 'Cette commande n\'existe pas ou ne vous appartient pas'
      });
    }

    // Récupérer les transactions
    const transactions = await query(`
      SELECT * FROM payment_transactions 
      WHERE order_id = ? 
      ORDER BY created_at DESC
    `, [orderId]);

    res.json({
      transactions: transactions.map(transaction => ({
        ...transaction,
        amount: parseFloat(transaction.amount),
        gateway_response: JSON.parse(transaction.gateway_response || '{}')
      }))
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des transactions:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les transactions'
    });
  }
});

// Webhook Stripe (à configurer dans le dashboard Stripe)
router.post('/stripe/webhook', async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Vérifier la signature du webhook
    // const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    // Simulation pour le développement
    const event = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: `pi_${Date.now()}`,
          metadata: {
            order_id: '1',
            user_id: '1'
          },
          amount: 29999,
          currency: 'eur'
        }
      }
    };

    // Traiter l'événement
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.order_id;

        // Mettre à jour la transaction et la commande
        await query(`
          UPDATE payment_transactions 
          SET status = 'completed', updated_at = CURRENT_TIMESTAMP
          WHERE transaction_id = ? AND gateway = 'stripe'
        `, [paymentIntent.id]);

        await query(`
          UPDATE orders 
          SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [orderId]);

        console.log(`Paiement Stripe réussi pour la commande ${orderId}`);
        break;

      case 'payment_intent.payment_failed':
        // Gérer l'échec de paiement
        console.log('Paiement Stripe échoué:', event.data.object);
        break;

      default:
        console.log(`Événement Stripe non géré: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Erreur lors du traitement du webhook Stripe:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
