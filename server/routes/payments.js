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

// ============ ROUTES ADMIN ============

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requis' });
  }
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(authHeader.replace('Bearer ', ''), process.env.JWT_SECRET || 'your-secret-key');
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Accès admin requis' });
    req.user = decoded;
    next();
  } catch (e) { res.status(401).json({ error: 'Token invalide' }); }
};

// GET /api/payments - Liste tous les paiements (admin)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        p.id,
        p.order_id,
        p.amount,
        p.currency,
        p.payment_method AS method,
        p.payment_status AS status,
        p.transaction_id,
        p.gateway_response,
        p.processed_at,
        p.created_at,
        p.updated_at,
        o.order_number,
        o.total_amount AS order_total,
        o.notes,
        u.first_name,
        u.last_name,
        u.email AS user_email,
        u.phone AS user_phone
      FROM payments p
      LEFT JOIN orders o ON o.id = p.order_id
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY p.created_at DESC
    `);

    const payments = rows.map(p => {
      let customerName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
      let customerEmail = p.user_email;
      let customerPhone = p.user_phone;
      if (!customerName || !customerEmail) {
        try {
          const notes = JSON.parse(p.notes || '{}');
          const c = notes.customer || {};
          customerName = customerName || `${c.first_name || ''} ${c.last_name || ''}`.trim();
          customerEmail = customerEmail || c.email;
          customerPhone = customerPhone || c.phone;
        } catch (e) { /* ignore */ }
      }
      let refunded = 0;
      try {
        const gr = JSON.parse(p.gateway_response || '{}');
        refunded = parseFloat(gr.refunded_amount || 0);
      } catch (e) { /* ignore */ }
      return {
        id: p.id,
        order_id: p.order_id,
        order_number: p.order_number,
        amount: parseFloat(p.amount) || 0,
        currency: p.currency || 'EUR',
        method: p.method,
        status: p.status,
        transaction_id: p.transaction_id,
        processed_at: p.processed_at,
        created_at: p.created_at,
        updated_at: p.updated_at,
        customer_name: customerName || 'Client',
        customer_email: customerEmail || '',
        customer_phone: customerPhone || '',
        refunded_amount: refunded
      };
    });

    res.json({ payments, total: payments.length });
  } catch (error) {
    console.error('Erreur GET /payments:', error);
    res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
});

// PATCH /api/payments/:id/status - Mettre à jour statut (admin)
router.patch('/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending', 'processing', 'completed', 'failed', 'refunded'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }
    await query(`
      UPDATE payments SET payment_status = ?, updated_at = CURRENT_TIMESTAMP
      ${status === 'completed' ? ', processed_at = CURRENT_TIMESTAMP' : ''}
      WHERE id = ?
    `, [status, id]);
    res.json({ success: true, message: 'Statut mis à jour' });
  } catch (error) {
    console.error('Erreur PATCH /payments/:id/status:', error);
    res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
});

// POST /api/payments/:id/refund - Rembourser un paiement (admin)
router.post('/:id/refund', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    const refundAmount = parseFloat(amount);
    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }
    const rows = await query(`SELECT * FROM payments WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Paiement non trouvé' });
    const payment = rows[0];
    if (refundAmount > parseFloat(payment.amount)) {
      return res.status(400).json({ error: 'Montant supérieur au paiement initial' });
    }
    const gatewayData = {
      refunded_amount: refundAmount,
      refund_reason: reason || 'Remboursement',
      refunded_at: new Date().toISOString()
    };
    await query(`
      UPDATE payments
      SET payment_status = 'refunded',
          gateway_response = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [JSON.stringify(gatewayData), id]);
    res.json({ success: true, message: 'Remboursement traité', refunded: refundAmount });
  } catch (error) {
    console.error('Erreur POST /payments/:id/refund:', error);
    res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
});

// DELETE /api/payments/:id - Supprimer un paiement (admin)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`DELETE FROM payments WHERE id = ?`, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }
    res.json({ success: true, message: 'Paiement supprimé' });
  } catch (error) {
    console.error('Erreur DELETE /payments/:id:', error);
    res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
});

module.exports = router;
