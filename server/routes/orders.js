const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
require('dotenv').config();

// Middleware pour vérifier l'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requis' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// GET /api/orders - Récupérer les commandes (admin ou utilisateur)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = isAdmin ? '' : 'WHERE o.user_id = ?';
    let params = isAdmin ? [] : [req.user.id];

    if (status) {
      whereClause += (isAdmin ? 'WHERE' : 'AND') + ' o.status = ?';
      params.push(status);
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    const safeLimit = Math.max(1, Math.min(parseInt(limit) || 10, 500));
    const safeOffset = Math.max(0, parseInt(offset) || 0);

    const ordersQuery = `
      SELECT
        o.*,
        o.email as customer_email,
        COALESCE(u.email, o.email) as user_email,
        COALESCE(CONCAT(u.first_name, ' ', u.last_name), '') as customer_name,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;

    const [orders] = await connection.execute(ordersQuery, params);

    // Comptage total
    const countQuery = `
      SELECT COUNT(*) as total FROM orders o ${whereClause}
    `;
    const [countResult] = await connection.execute(countQuery, params);
    const total = countResult[0].total;

    // Récupérer les articles pour chaque commande
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await connection.execute(`
          SELECT 
            oi.*,
            (SELECT image_url FROM product_images WHERE product_id = oi.product_id AND is_primary = 1 LIMIT 1) as product_image
          FROM order_items oi
          WHERE oi.order_id = ?
          ORDER BY oi.id ASC
        `, [order.id]);

        return {
          ...order,
          items: items.map(item => ({
            ...item,
            unit_price: parseFloat(item.unit_price),
            total_price: parseFloat(item.total_price)
          }))
        };
      })
    );

    await connection.end();

    res.json({
      success: true,
      orders: ordersWithItems.map(order => {
        // Parser les notes si JSON (commandes publiques)
        let notesData = {};
        try { notesData = order.notes ? JSON.parse(order.notes) : {}; } catch (e) { notesData = {}; }
        return {
          ...order,
          customer_name: order.customer_name?.trim() || notesData.customer_name || order.customer_email || 'Invité',
          customer_email: order.customer_email || order.user_email,
          customer_phone: notesData.customer_phone || null,
          shipping_address: notesData.shipping_address || null,
          shipping_city: notesData.shipping_city || null,
          shipping_postal_code: notesData.shipping_postal_code || null,
          shipping_country: notesData.shipping_country || null,
          payment_status: notesData.payment_method ? 'paid' : null,
          subtotal: parseFloat(order.subtotal),
          tax_amount: parseFloat(order.tax_amount),
          shipping_amount: parseFloat(order.shipping_amount),
          total_amount: parseFloat(order.total_amount)
        };
      }),
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les commandes'
    });
  }
});

// GET /api/orders/:id - Récupérer une commande spécifique
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const { id } = req.params;

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    // Récupérer la commande
    let whereClause = 'WHERE o.id = ?';
    let params = [id];
    
    if (!isAdmin) {
      whereClause += ' AND o.user_id = ?';
      params.push(req.user.id);
    }

    const [orders] = await connection.execute(`
      SELECT o.*, u.email as user_email, CONCAT(u.first_name, ' ', u.last_name) as customer_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${whereClause}
    `, params);

    if (orders.length === 0) {
      await connection.end();
      return res.status(404).json({
        error: 'Commande non trouvée',
        message: 'Cette commande n\'existe pas' + (isAdmin ? '' : ' ou ne vous appartient pas')
      });
    }

    const order = orders[0];

    // Récupérer les articles
    const [items] = await connection.execute(`
      SELECT 
        oi.*,
        (SELECT image_url FROM product_images WHERE product_id = oi.product_id AND is_primary = 1 LIMIT 1) as product_image
      FROM order_items oi
      WHERE oi.order_id = ?
      ORDER BY oi.id ASC
    `, [id]);

    // Récupérer les adresses
    const [addresses] = await connection.execute(`
      SELECT * FROM order_addresses 
      WHERE order_id = ? 
      ORDER BY type ASC
    `, [id]);

    // Formater les adresses
    const shippingAddress = addresses.find(addr => addr.type === 'shipping');
    const billingAddress = addresses.find(addr => addr.type === 'billing');

    await connection.end();

    res.json({
      success: true,
      order: {
        ...order,
        subtotal: parseFloat(order.subtotal),
        tax_amount: parseFloat(order.tax_amount),
        shipping_amount: parseFloat(order.shipping_amount),
        total_amount: parseFloat(order.total_amount),
        items: items.map(item => ({
          ...item,
          unit_price: parseFloat(item.unit_price),
          total_price: parseFloat(item.total_price)
        })),
        shipping_address: shippingAddress,
        billing_address: billingAddress
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer la commande'
    });
  }
});

// PUT /api/orders/:id/status - Mettre à jour le statut d'une commande (admin seulement)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès admin requis' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    await connection.execute(`
      UPDATE orders 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [status, id]);

    await connection.end();

    res.json({
      success: true,
      message: 'Statut de la commande mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de mettre à jour le statut'
    });
  }
});

// DELETE /api/orders/:id - Supprimer une commande (admin uniquement)
router.delete('/:id', authenticateToken, async (req, res) => {
  let connection;
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès admin requis' });
    }
    const { id } = req.params;

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    await connection.beginTransaction();
    await connection.execute('DELETE FROM order_items WHERE order_id = ?', [id]);
    const [result] = await connection.execute('DELETE FROM orders WHERE id = ?', [id]);
    await connection.commit();
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    res.json({ success: true, message: 'Commande supprimée' });
  } catch (error) {
    if (connection) { try { await connection.rollback(); await connection.end(); } catch (e) {} }
    console.error('Erreur suppression commande:', error);
    res.status(500).json({ error: 'Erreur serveur', message: 'Impossible de supprimer la commande' });
  }
});

// GET /api/orders/by-email/:email - Récupérer les commandes d'un client (public, par email)
router.get('/by-email/:email', async (req, res) => {
  let connection;
  try {
    const { email } = req.params;
    if (!email) return res.status(400).json({ error: 'Email requis' });

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    const [orders] = await connection.execute(
      `SELECT o.*
       FROM orders o
       WHERE o.email = ?
       ORDER BY o.created_at DESC`,
      [email]
    );

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await connection.execute(
          `SELECT oi.*,
            (SELECT image_url FROM product_images WHERE product_id = oi.product_id AND is_primary = 1 LIMIT 1) as product_image
           FROM order_items oi WHERE oi.order_id = ? ORDER BY oi.id ASC`,
          [order.id]
        );
        let notesData = {};
        try { notesData = order.notes ? JSON.parse(order.notes) : {}; } catch (e) {}
        return {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          date: order.created_at,
          total: parseFloat(order.total_amount),
          subtotal: parseFloat(order.subtotal),
          customer_email: order.email,
          items: items.map(it => ({
            id: it.id,
            product_id: it.product_id,
            name: it.product_name,
            quantity: it.quantity,
            price: parseFloat(it.unit_price),
            image: it.product_image || '/images/placeholder-product.jpg'
          })),
          shipping: {
            address: notesData.shipping_address || '',
            city: notesData.shipping_city || '',
            postal_code: notesData.shipping_postal_code || '',
            country: notesData.shipping_country || '',
            method: 'Livraison standard',
            cost: parseFloat(order.shipping_amount) || 0,
            estimatedDelivery: new Date(new Date(order.created_at).getTime() + 5 * 86400000).toISOString()
          },
          payment: {
            method: notesData.payment_method || 'card',
            status: 'paid',
            transactionId: order.order_number
          }
        };
      })
    );

    await connection.end();
    res.json({ success: true, orders: ordersWithItems });
  } catch (error) {
    if (connection) { try { await connection.end(); } catch (e) {} }
    console.error('Erreur récupération commandes par email:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/orders/public - Création de commande publique (invité ou client)
router.post('/public', async (req, res) => {
  let connection;
  try {
    const {
      customer = {},
      shipping = {},
      items = [],
      subtotal = 0,
      shipping_amount = 0,
      total,
      payment_method = 'card',
      notes = null
    } = req.body;

    if (!customer.email || !items.length || !total) {
      return res.status(400).json({ error: 'Données incomplètes (email, articles, total requis)' });
    }

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    await connection.beginTransaction();

    // Retrouver l'utilisateur par email (optionnel)
    let userId = null;
    const [users] = await connection.execute(
      'SELECT id, first_name, last_name FROM users WHERE email = ? LIMIT 1',
      [customer.email]
    );
    if (users.length > 0) userId = users[0].id;

    const orderNumber = 'BM-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const notesBlob = notes || JSON.stringify({
      customer_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
      customer_phone: customer.phone || '',
      shipping_address: shipping.street_address || '',
      shipping_city: shipping.city || '',
      shipping_postal_code: shipping.postal_code || '',
      shipping_country: shipping.country || '',
      payment_method
    });

    const [orderResult] = await connection.execute(
      `INSERT INTO orders
        (order_number, user_id, email, status, currency, subtotal, shipping_amount, total_amount, notes)
       VALUES (?, ?, ?, 'pending', 'EUR', ?, ?, ?, ?)`,
      [orderNumber, userId, customer.email, subtotal, shipping_amount, total, notesBlob]
    );
    const orderId = orderResult.insertId;

    // Insérer les articles
    for (const item of items) {
      await connection.execute(
        `INSERT INTO order_items
          (order_id, product_id, product_name, product_sku, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id || item.id || 0,
          item.name || 'Produit',
          item.sku || '',
          item.quantity || 1,
          parseFloat(item.price) || 0,
          (parseFloat(item.price) || 0) * (item.quantity || 1)
        ]
      );
    }

    // Créer l'entrée dans payments (statut 'pending' par défaut)
    // Mapping méthodes checkout → ENUM payments
    const methodMap = {
      card: 'credit_card',
      credit_card: 'credit_card',
      paypal: 'paypal',
      mobile: 'mobile_money',
      mobile_money: 'mobile_money',
      bank: 'bank_transfer',
      bank_transfer: 'bank_transfer'
    };
    const dbMethod = methodMap[payment_method] || 'credit_card';
    const transactionId = `TX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    await connection.execute(
      `INSERT INTO payments
        (order_id, amount, currency, payment_method, payment_status, transaction_id, gateway_response, processed_at)
       VALUES (?, ?, 'EUR', ?, 'completed', ?, ?, CURRENT_TIMESTAMP)`,
      [
        orderId,
        total,
        dbMethod,
        transactionId,
        JSON.stringify({ method: payment_method, created_via: 'checkout_public' })
      ]
    );

    await connection.commit();
    await connection.end();

    res.status(201).json({
      success: true,
      order: { id: orderId, order_number: orderNumber, status: 'pending' }
    });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); await connection.end(); } catch (e) {}
    }
    console.error('Erreur création commande publique:', error);
    res.status(500).json({ error: 'Erreur serveur', message: 'Impossible de créer la commande' });
  }
});

module.exports = router;
