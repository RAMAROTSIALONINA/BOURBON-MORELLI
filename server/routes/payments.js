const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const stripeService = require('../services/stripeService');
const { decreaseStockForOrder } = require('../services/stockService');
const { sendOrderConfirmationById } = require('../services/emailService');

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

    const paymentIntent = await stripeService.createPaymentIntent({
      amount,
      currency: currency.toLowerCase(),
      metadata: { order_id: String(order_id), user_id: String(userId) }
    });

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

// POST /api/payments/stripe/create-intent-public - Créer un PaymentIntent pour commande publique (invité)
router.post('/stripe/create-intent-public', [
  body('order_id').isInt({ min: 1 }),
  body('email').isEmail().normalizeEmail(),
  body('currency').optional().isIn(['EUR', 'USD', 'MGA'])
], handleValidationErrors, async (req, res) => {
  try {
    const { order_id, email, currency = 'EUR' } = req.body;

    // Vérifier la commande par ID + email (sans auth)
    const orders = await query(`
      SELECT * FROM orders WHERE id = ? AND email = ? AND status = 'pending'
    `, [order_id, email]);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée ou non payable' });
    }

    const order = orders[0];
    let amount = order.total_amount;
    if (currency !== 'EUR') {
      const rates = { USD: process.env.EUR_TO_USD || 1.08, MGA: process.env.EUR_TO_MGA || 4900 };
      if (rates[currency]) amount = order.total_amount * parseFloat(rates[currency]);
    }

    const paymentIntent = await stripeService.createPaymentIntent({
      amount,
      currency: currency.toLowerCase(),
      metadata: { order_id: String(order_id) }
    });

    await query(`
      INSERT INTO payment_transactions (order_id, gateway, transaction_id, amount, currency, status, gateway_response)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [order_id, 'stripe', paymentIntent.id, amount, currency, 'pending', JSON.stringify(paymentIntent)]);

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount,
      currency
    });
  } catch (error) {
    console.error('Erreur create-intent-public:', error);
    res.status(500).json({ error: 'Erreur serveur', message: 'Impossible de créer l\'intention de paiement' });
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

    const paymentIntent = await stripeService.retrievePaymentIntent(payment_intent_id);

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

// GET /api/payments/by-intent/:pi_id - Récupérer les détails d'une commande via PaymentIntent (public)
// Utilisé par OrderConfirmation quand sessionStorage est vide (retour PayPal redirect)
router.get('/by-intent/:pi_id', async (req, res) => {
  try {
    const { pi_id } = req.params;
    if (!pi_id || !pi_id.startsWith('pi_')) {
      return res.status(400).json({ error: 'payment_intent_id invalide' });
    }

    // Trouver la transaction et la commande associée
    const rows = await query(`
      SELECT
        pt.transaction_id, pt.amount AS pt_amount, pt.currency, pt.gateway,
        o.id AS order_id, o.email, o.subtotal, o.shipping_amount, o.total_amount,
        o.notes, o.status AS order_status
      FROM payment_transactions pt
      JOIN orders o ON o.id = pt.order_id
      WHERE pt.transaction_id = ?
      LIMIT 1
    `, [pi_id]);

    if (!rows.length) {
      return res.status(404).json({ error: 'Transaction introuvable' });
    }

    const row = rows[0];

    // Articles de la commande (avec image principale du produit)
    const items = await query(`
      SELECT oi.product_id, oi.product_name AS name, oi.product_sku AS sku,
             oi.quantity, oi.unit_price AS price,
             (SELECT image_url FROM product_images
              WHERE product_id = oi.product_id AND is_primary = 1 LIMIT 1) AS image_url
      FROM order_items oi
      WHERE oi.order_id = ?
    `, [row.order_id]);

    // Données client depuis notes JSON
    let shipping = {};
    try {
      const notes = JSON.parse(row.notes || '{}');
      shipping = {
        firstName:     notes.customer_name?.split(' ')[0] || '',
        lastName:      notes.customer_name?.split(' ').slice(1).join(' ') || '',
        streetAddress: notes.shipping_address || '',
        city:          notes.shipping_city || '',
        postalCode:    notes.shipping_postal_code || '',
        country:       notes.shipping_country || '',
        email:         row.email || ''
      };
    } catch (e) { /* notes non parsable */ }

    res.json({
      order: {
        id: row.order_id,
        payment: { method: row.gateway || 'stripe', status: 'paid' },
        items: items.map(it => ({
          id: it.product_id,
          name: it.name,
          price: parseFloat(it.price) || 0,
          quantity: it.quantity || 1,
          image_url: it.image_url || null
        })),
        subtotal:     parseFloat(row.subtotal)      || 0,
        shippingCost: parseFloat(row.shipping_amount) || 0,
        total:        parseFloat(row.total_amount)   || 0,
        currency:     row.currency || 'EUR',
        shipping
      }
    });
  } catch (error) {
    console.error('Erreur GET /payments/by-intent:', error);
    res.status(500).json({ error: 'Erreur serveur' });
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

// Helper : extrait le type de méthode réelle depuis un PaymentIntent enrichi
const extractPaymentMethod = (pi) => {
  // Méthode réelle via latest_charge
  const chargeType = pi.latest_charge?.payment_method_details?.type;
  if (chargeType) return chargeType; // 'card', 'paypal', 'link', ...

  // Repli : objet payment_method étendu
  const pmType = pi.payment_method?.type;
  if (pmType) return pmType;

  // Repli : payment_method_types (présent pour méthodes explicites)
  const types = pi.payment_method_types || [];
  if (types.length === 1) return types[0];

  return 'card'; // défaut
};

// POST /api/payments/stripe/complete-transaction
// Appelé après confirmation (carte inline ou retour PayPal).
// Récupère le vrai statut + méthode depuis Stripe et met à jour payment_transactions.
router.post('/stripe/complete-transaction', async (req, res) => {
  try {
    const { payment_intent_id, order_id } = req.body;
    if (!payment_intent_id) {
      return res.status(400).json({ error: 'payment_intent_id requis' });
    }

    // Récupérer le PaymentIntent final (avec charges étendues)
    const pi = await stripeService.retrievePaymentIntentWithCharges(payment_intent_id);

    const stripeStatus = pi.status; // 'succeeded', 'payment_failed', 'canceled', ...
    const dbStatus = stripeStatus === 'succeeded' ? 'completed'
                   : stripeStatus === 'canceled'  ? 'cancelled'
                   : stripeStatus === 'payment_failed' ? 'failed'
                   : 'pending';

    const actualMethod = extractPaymentMethod(pi); // 'card', 'paypal', 'link', ...

    // Mettre à jour payment_transactions (amount corrigé depuis Stripe, en euros)
    const stripeAmountEur = pi.amount ? parseFloat((pi.amount / 100).toFixed(2)) : null;
    await query(
      `UPDATE payment_transactions
       SET status = ?, gateway = ?, amount = COALESCE(?, amount), gateway_response = ?, updated_at = CURRENT_TIMESTAMP
       WHERE transaction_id = ?`,
      [dbStatus, actualMethod, stripeAmountEur, JSON.stringify(pi), payment_intent_id]
    );

    // Mettre à jour le statut de la commande si réussi
    if (dbStatus === 'completed' && order_id) {
      await query(
        `UPDATE orders SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [order_id]
      );
      // Décrémenter le stock UNE SEULE FOIS (garde via stock_decremented)
      const stockGuard = await query(
        `UPDATE orders SET stock_decremented = 1
         WHERE id = ? AND stock_decremented = 0`,
        [order_id]
      );
      if (stockGuard && stockGuard.affectedRows > 0) {
        await decreaseStockForOrder(order_id);
        sendOrderConfirmationById(order_id).catch(() => {}); // non-bloquant
      }
    }

    res.json({ success: true, status: dbStatus, method: actualMethod });
  } catch (error) {
    console.error('Erreur complete-transaction:', error);
    res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
});

// POST /api/payments/admin/sync-stripe - Synchronise tous les payment_transactions depuis Stripe
// Admin uniquement — remet à jour amount, status et gateway pour tous les enregistrements
router.post('/admin/sync-stripe', authenticateToken, async (req, res) => {
  try {
    if (!req.user?.is_admin && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Accès administrateur requis' });
    }

    const rows = await query(
      `SELECT id, transaction_id, order_id FROM payment_transactions WHERE gateway != 'mobile' ORDER BY id ASC`
    );

    const results = [];
    for (const row of rows) {
      try {
        const pi = await stripeService.retrievePaymentIntentWithCharges(row.transaction_id);
        const stripeStatus = pi.status;
        const dbStatus = stripeStatus === 'succeeded' ? 'completed'
                       : stripeStatus === 'canceled'  ? 'cancelled'
                       : stripeStatus === 'requires_payment_method' ? 'failed'
                       : stripeStatus === 'payment_failed' ? 'failed'
                       : 'pending';
        const actualMethod = extractPaymentMethod(pi);
        const stripeAmountEur = parseFloat((pi.amount / 100).toFixed(2));

        await query(
          `UPDATE payment_transactions
           SET status = ?, gateway = ?, amount = ?, gateway_response = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [dbStatus, actualMethod, stripeAmountEur, JSON.stringify(pi), row.id]
        );

        // Synchroniser le statut de la commande
        if (dbStatus === 'completed' && row.order_id) {
          await query(
            `UPDATE orders SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [row.order_id]
          );
          // Décrémenter le stock UNE SEULE FOIS (garde via stock_decremented)
          const syncGuard = await query(
            `UPDATE orders SET stock_decremented = 1 WHERE id = ? AND stock_decremented = 0`,
            [row.order_id]
          );
          if (syncGuard && syncGuard.affectedRows > 0) {
            await decreaseStockForOrder(row.order_id);
            sendOrderConfirmationById(row.order_id).catch(() => {}); // non-bloquant
          }
          // Synchroniser payments table
          await query(
            `UPDATE payments SET payment_status = 'completed', updated_at = CURRENT_TIMESTAMP
             WHERE order_id = ? AND payment_status != 'completed'`,
            [row.order_id]
          );
        } else if ((dbStatus === 'failed' || dbStatus === 'cancelled') && row.order_id) {
          // Corriger les paiements incorrectement marqués 'completed' pour des PI échoués
          await query(
            `UPDATE payments SET payment_status = 'failed', updated_at = CURRENT_TIMESTAMP
             WHERE order_id = ? AND payment_status = 'completed'`,
            [row.order_id]
          );
        }

        results.push({ id: row.id, pi_id: row.transaction_id, status: dbStatus, method: actualMethod, amount: stripeAmountEur });
      } catch (err) {
        results.push({ id: row.id, pi_id: row.transaction_id, error: err.message });
      }
    }

    res.json({ success: true, synced: results.length, results });
  } catch (error) {
    console.error('Erreur sync-stripe:', error);
    res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
});

// Webhook Stripe — corps brut requis (configuré dans server/index.js avant express.json)
router.post('/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Si le secret n'est pas configuré, ignorer silencieusement
  if (!webhookSecret || webhookSecret.startsWith('whsec_REMPLACER')) {
    return res.json({ received: true });
  }

  let event;
  try {
    event = stripeService.constructWebhookEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature invalide: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const orderId = pi.metadata?.order_id;
        const actualMethod = extractPaymentMethod(pi);
        await query(
          `UPDATE payment_transactions
           SET status = 'completed', gateway = ?, gateway_response = ?, updated_at = CURRENT_TIMESTAMP
           WHERE transaction_id = ?`,
          [actualMethod, JSON.stringify(pi), pi.id]
        );
        if (orderId) {
          await query(
            `UPDATE orders SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [orderId]
          );
          // Décrémenter le stock UNE SEULE FOIS (garde via stock_decremented)
          const whGuard = await query(
            `UPDATE orders SET stock_decremented = 1 WHERE id = ? AND stock_decremented = 0`,
            [orderId]
          );
          if (whGuard && whGuard.affectedRows > 0) {
            await decreaseStockForOrder(orderId);
            sendOrderConfirmationById(orderId).catch(() => {}); // non-bloquant
          }
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const failureMsg = pi.last_payment_error?.message || 'Paiement refusé';
        await query(
          `UPDATE payment_transactions
           SET status = 'failed', gateway_response = ?, updated_at = CURRENT_TIMESTAMP
           WHERE transaction_id = ?`,
          [JSON.stringify(pi), pi.id]
        );
        break;
      }
    }
    res.json({ received: true });
  } catch (error) {
    console.error('Erreur webhook Stripe:', error);
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

// GET /api/payments/history - Historique complet des transactions (admin)
// Combine payment_transactions (Stripe brut) + payments (tous modes de paiement)
router.get('/history', authenticateAdmin, async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        pt.id,
        pt.order_id,
        pt.gateway,
        pt.transaction_id,
        pt.amount,
        pt.currency,
        COALESCE(
          NULLIF(pt.status, 'pending'),
          pay.payment_status,
          pt.status
        )                   AS status,
        pt.gateway_response,
        pt.created_at,
        pt.updated_at,
        o.order_number,
        o.notes  AS order_notes,
        o.email  AS order_email,
        u.first_name,
        u.last_name,
        u.email  AS user_email
      FROM payment_transactions pt
      LEFT JOIN payments pay ON pay.order_id = pt.order_id
      LEFT JOIN orders o ON o.id = pt.order_id
      LEFT JOIN users  u ON u.id = o.user_id

      UNION ALL

      SELECT
        p.id,
        p.order_id,
        p.payment_method    AS gateway,
        p.transaction_id,
        p.amount,
        p.currency,
        p.payment_status    AS status,
        p.gateway_response,
        p.created_at,
        p.updated_at,
        o.order_number,
        o.notes  AS order_notes,
        o.email  AS order_email,
        u.first_name,
        u.last_name,
        u.email  AS user_email
      FROM payments p
      LEFT JOIN orders o ON o.id = p.order_id
      LEFT JOIN users  u ON u.id = o.user_id
      WHERE p.order_id NOT IN (SELECT DISTINCT order_id FROM payment_transactions)

      ORDER BY created_at DESC
    `);

    // Normalise les noms de gateway pour le frontend
    const normalizeGateway = (rawGateway, gr) => {
      // Si complete-transaction a déjà mis à jour gateway avec la vraie méthode → la respecter
      // Sinon essayer de l'extraire du gateway_response (PaymentIntent final)
      let g = rawGateway || 'stripe';

      if (g === 'stripe' || g === 'card') {
        // Essayer d'extraire la méthode réelle depuis le PaymentIntent stocké
        const chargeType = gr?.latest_charge?.payment_method_details?.type
          || gr?.charges?.data?.[0]?.payment_method_details?.type
          || gr?.payment_method?.type;
        if (chargeType && chargeType !== 'card') g = chargeType; // 'paypal', 'link', ...
        else g = 'stripe'; // carte standard
      }

      if (g === 'credit_card') return 'stripe';
      if (g === 'mobile_money') return 'mobile';
      return g; // stripe / paypal / mobile / link / ...
    };

    const transactions = rows.map(row => {
      let gr = {};
      try { gr = JSON.parse(row.gateway_response || '{}'); } catch (e) { /* ignore */ }

      let customerName  = `${row.first_name || ''} ${row.last_name || ''}`.trim();
      let customerEmail = row.user_email || row.order_email || '';

      if (!customerName || !customerEmail) {
        try {
          const notes = JSON.parse(row.order_notes || '{}');
          const c = notes.customer || {};
          if (!customerName)  customerName  = `${c.first_name || ''} ${c.last_name || ''}`.trim();
          if (!customerEmail) customerEmail = c.email || '';
        } catch (e) { /* ignore */ }
      }

      // Date de remboursement
      const refundedAt   = gr.refunded_at   || null;
      const refundReason = gr.refund_reason  || null;

      // Motif de refus
      let failureReason = null;
      const status = row.status || '';
      if (status === 'failed') {
        failureReason = gr.last_payment_error?.message
          || gr.failure_message
          || gr.error?.message
          || 'Paiement refusé';
      }

      return {
        id:             row.id,
        order_id:       row.order_id,
        order_number:   row.order_number,
        gateway:        normalizeGateway(row.gateway, gr),
        transaction_id: row.transaction_id,
        amount:         parseFloat(row.amount) || 0,
        currency:       row.currency || 'EUR',
        status,
        description:    `Commande #${row.order_id}${row.order_number ? ' (' + row.order_number + ')' : ''}`,
        customer_name:  customerName  || 'Client inconnu',
        customer_email: customerEmail || '',
        created_at:     row.created_at,
        updated_at:     row.updated_at,
        refunded_at:    refundedAt,
        refund_reason:  refundReason,
        failure_reason: failureReason
      };
    });

    res.json({ transactions, total: transactions.length });
  } catch (error) {
    console.error('Erreur GET /payments/history:', error);
    res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
});

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
