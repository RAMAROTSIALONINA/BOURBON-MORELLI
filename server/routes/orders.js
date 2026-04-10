const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

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

// POST /api/orders - Créer une nouvelle commande
router.post('/', authenticateToken, [
  body('items').isArray({ min: 1 }),
  body('items.*.product_id').isInt({ min: 1 }),
  body('items.*.quantity').isInt({ min: 1 }),
  body('items.*.variant_id').optional().isInt({ min: 1 }),
  body('shipping_address').isObject(),
  body('shipping_address.first_name').trim().isLength({ min: 2 }),
  body('shipping_address.last_name').trim().isLength({ min: 2 }),
  body('shipping_address.street_address').trim().isLength({ min: 5 }),
  body('shipping_address.city').trim().isLength({ min: 2 }),
  body('shipping_address.postal_code').trim().isLength({ min: 3 }),
  body('shipping_address.country').trim().isLength({ min: 2 }),
  body('billing_address').optional().isObject(),
  body('currency').optional().isIn(['EUR', 'USD', 'MGA']),
  body('notes').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, shipping_address, billing_address, currency = 'EUR', notes } = req.body;

    // Utiliser l'adresse de livraison comme adresse de facturation si non spécifiée
    const billingAddr = billing_address || shipping_address;

    return await transaction(async (connection) => {
      // Générer un numéro de commande unique
      const orderNumber = `BM${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // Calculer le total et vérifier le stock
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        // Récupérer les informations du produit
        let productQuery;
        let productParams;

        if (item.variant_id) {
          productQuery = `
            SELECT 
              p.*, 
              pv.name as variant_name,
              pv.sku as variant_sku,
              pv.price as variant_price,
              COALESCE(SUM(i.quantity), 0) as inventory_quantity
            FROM products p
            LEFT JOIN product_variants pv ON p.id = pv.product_id
            LEFT JOIN inventory i ON pv.id = i.variant_id
            WHERE p.id = ? AND pv.id = ? AND p.status = 'active'
            GROUP BY p.id, pv.id
          `;
          productParams = [item.product_id, item.variant_id];
        } else {
          productQuery = `
            SELECT 
              p.*,
              COALESCE(SUM(i.quantity), 0) as inventory_quantity
            FROM products p
            LEFT JOIN inventory i ON p.id = i.product_id AND i.variant_id IS NULL
            WHERE p.id = ? AND p.status = 'active'
            GROUP BY p.id
          `;
          productParams = [item.product_id];
        }

        const [product] = await connection.execute(productQuery, productParams);

        if (product.length === 0) {
          throw new Error(`Produit ${item.product_id} non trouvé`);
        }

        const productData = product[0];

        // Vérifier le stock
        if (productData.inventory_quantity < item.quantity) {
          throw new Error(`Stock insuffisant pour ${productData.name}`);
        }

        const unitPrice = item.variant_id ? productData.variant_price : productData.price;
        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;

        orderItems.push({
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          product_name: productData.name,
          product_sku: item.variant_id ? productData.variant_sku : productData.sku,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: itemTotal
        });
      }

      // Calculer les frais de livraison (gratuit à partir de 200€)
      const shippingAmount = subtotal >= 200 ? 0 : 9.99;
      const taxAmount = 0; // TVA à implémenter selon les règles
      const totalAmount = subtotal + shippingAmount + taxAmount;

      // Créer la commande
      const [orderResult] = await connection.execute(`
        INSERT INTO orders (
          order_number, user_id, email, status, currency, 
          subtotal, tax_amount, shipping_amount, total_amount, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderNumber,
        userId,
        req.user.email,
        'pending',
        currency,
        subtotal,
        taxAmount,
        shippingAmount,
        totalAmount,
        notes || null
      ]);

      const orderId = orderResult.insertId;

      // Insérer les articles de la commande
      for (const item of orderItems) {
        await connection.execute(`
          INSERT INTO order_items (
            order_id, product_id, variant_id, product_name, product_sku,
            quantity, unit_price, total_price
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          orderId,
          item.product_id,
          item.variant_id,
          item.product_name,
          item.product_sku,
          item.quantity,
          item.unit_price,
          item.total_price
        ]);
      }

      // Insérer les adresses
      // Adresse de livraison
      await connection.execute(`
        INSERT INTO order_addresses (
          order_id, type, first_name, last_name, company,
          street_address, apartment, city, postal_code, country, phone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderId,
        'shipping',
        shipping_address.first_name,
        shipping_address.last_name,
        shipping_address.company || null,
        shipping_address.street_address,
        shipping_address.apartment || null,
        shipping_address.city,
        shipping_address.postal_code,
        shipping_address.country,
        shipping_address.phone || null
      ]);

      // Adresse de facturation
      await connection.execute(`
        INSERT INTO order_addresses (
          order_id, type, first_name, last_name, company,
          street_address, apartment, city, postal_code, country, phone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderId,
        'billing',
        billingAddr.first_name,
        billingAddr.last_name,
        billingAddr.company || null,
        billingAddr.street_address,
        billingAddr.apartment || null,
        billingAddr.city,
        billingAddr.postal_code,
        billingAddr.country,
        billingAddr.phone || null
      ]);

      // Mettre à jour le stock
      for (const item of items) {
        if (item.variant_id) {
          // Mettre à jour le stock de la variante
          await connection.execute(`
            UPDATE inventory 
            SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
            WHERE variant_id = ?
          `, [item.quantity, item.variant_id]);
        } else {
          // Mettre à jour le stock du produit
          await connection.execute(`
            UPDATE inventory 
            SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
            WHERE product_id = ? AND variant_id IS NULL
          `, [item.quantity, item.product_id]);
        }
      }

      // Vider le panier de l'utilisateur
      await connection.execute(`
        DELETE ci FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.id
        WHERE c.user_id = ?
      `, [userId]);

      // Récupérer la commande complète
      const [order] = await connection.execute(`
        SELECT * FROM orders WHERE id = ?
      `, [orderId]);

      res.status(201).json({
        message: 'Commande créée avec succès',
        order: {
          ...order[0],
          items: orderItems
        }
      });
    });

  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    
    if (error.message.includes('non trouvé') || error.message.includes('Stock insuffisant')) {
      return res.status(400).json({
        error: 'Erreur de validation',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de créer la commande'
    });
  }
});

// GET /api/orders - Récupérer les commandes de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE o.user_id = ?';
    let params = [userId];

    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }

    const ordersQuery = `
      SELECT 
        o.*,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const orders = await query(ordersQuery, [...params, parseInt(limit), parseInt(offset)]);

    // Comptage total
    const countQuery = `
      SELECT COUNT(*) as total FROM orders o ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const total = countResult[0].total;

    // Récupérer les articles pour chaque commande
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const itemsQuery = `
          SELECT 
            oi.*,
            (SELECT image_url FROM product_images WHERE product_id = oi.product_id AND is_primary = 1 LIMIT 1) as product_image
          FROM order_items oi
          WHERE oi.order_id = ?
          ORDER BY oi.id ASC
        `;

        const items = await query(itemsQuery, [order.id]);

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

    res.json({
      orders: ordersWithItems.map(order => ({
        ...order,
        subtotal: parseFloat(order.subtotal),
        tax_amount: parseFloat(order.tax_amount),
        shipping_amount: parseFloat(order.shipping_amount),
        total_amount: parseFloat(order.total_amount)
      })),
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
    const userId = req.user.id;
    const { id } = req.params;

    // Récupérer la commande
    const orders = await query(`
      SELECT o.* FROM orders o 
      WHERE o.id = ? AND o.user_id = ?
    `, [id, userId]);

    if (orders.length === 0) {
      return res.status(404).json({
        error: 'Commande non trouvée',
        message: 'Cette commande n\'existe pas ou n\'appartient pas à cet utilisateur'
      });
    }

    const order = orders[0];

    // Récupérer les articles
    const items = await query(`
      SELECT 
        oi.*,
        (SELECT image_url FROM product_images WHERE product_id = oi.product_id AND is_primary = 1 LIMIT 1) as product_image
      FROM order_items oi
      WHERE oi.order_id = ?
      ORDER BY oi.id ASC
    `, [id]);

    // Récupérer les adresses
    const addresses = await query(`
      SELECT * FROM order_addresses 
      WHERE order_id = ? 
      ORDER BY type ASC
    `, [id]);

    // Récupérer les transactions de paiement
    const transactions = await query(`
      SELECT * FROM payment_transactions 
      WHERE order_id = ? 
      ORDER BY created_at DESC
    `, [id]);

    // Formater les adresses
    const shippingAddress = addresses.find(addr => addr.type === 'shipping');
    const billingAddress = addresses.find(addr => addr.type === 'billing');

    res.json({
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
        billing_address: billingAddress,
        transactions: transactions
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

// PUT /api/orders/:id/cancel - Annuler une commande
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Vérifier que la commande existe et appartient à l'utilisateur
    const orders = await query(`
      SELECT * FROM orders 
      WHERE id = ? AND user_id = ? AND status IN ('pending', 'confirmed')
    `, [id, userId]);

    if (orders.length === 0) {
      return res.status(404).json({
        error: 'Commande non trouvée',
        message: 'Cette commande n\'existe pas, ne vous appartient pas ou ne peut plus être annulée'
      });
    }

    // Mettre à jour le statut
    await query(`
      UPDATE orders 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [id]);

    // Remettre les articles en stock
    const items = await query(`
      SELECT product_id, variant_id, quantity 
      FROM order_items 
      WHERE order_id = ?
    `, [id]);

    for (const item of items) {
      if (item.variant_id) {
        await query(`
          UPDATE inventory 
          SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
          WHERE variant_id = ?
        `, [item.quantity, item.variant_id]);
      } else {
        await query(`
          UPDATE inventory 
          SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
          WHERE product_id = ? AND variant_id IS NULL
        `, [item.quantity, item.product_id]);
      }
    }

    res.json({
      message: 'Commande annulée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation de la commande:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible d\'annuler la commande'
    });
  }
});

module.exports = router;
