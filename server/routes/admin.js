const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Middleware pour toutes les routes admin
router.use(authenticateToken, requireAdmin);

// GET /api/admin/dashboard - Tableau de bord administrateur
router.get('/dashboard', async (req, res) => {
  try {
    // Statistiques générales
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'customer') as total_customers,
        (SELECT COUNT(*) FROM products WHERE status = 'active') as active_products,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders) as total_revenue,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = CURDATE()) as today_revenue,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()) as today_orders
    `);

    // Commandes récentes
    const recentOrders = await query(`
      SELECT 
        o.*,
        u.first_name,
        u.last_name,
        u.email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    // Produits les plus vendus
    const topProducts = await query(`
      SELECT 
        p.name,
        p.slug,
        SUM(oi.quantity) as total_sold,
        SUM(oi.total_price) as total_revenue
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY oi.product_id
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    // Ventes des 30 derniers jours
    const salesChart = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Stock faible
    const lowStock = await query(`
      SELECT 
        p.name,
        p.slug,
        COALESCE(SUM(i.quantity), 0) as stock_quantity
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id AND i.variant_id IS NULL
      WHERE p.status = 'active'
      GROUP BY p.id
      HAVING stock_quantity <= 10
      ORDER BY stock_quantity ASC
      LIMIT 10
    `);

    res.json({
      stats: {
        total_customers: parseInt(stats[0].total_customers),
        active_products: parseInt(stats[0].active_products),
        total_orders: parseInt(stats[0].total_orders),
        pending_orders: parseInt(stats[0].pending_orders),
        total_revenue: parseFloat(stats[0].total_revenue),
        today_revenue: parseFloat(stats[0].today_revenue),
        today_orders: parseInt(stats[0].today_orders)
      },
      recent_orders: recentOrders.map(order => ({
        ...order,
        total_amount: parseFloat(order.total_amount)
      })),
      top_products: topProducts.map(product => ({
        ...product,
        total_revenue: parseFloat(product.total_revenue)
      })),
      sales_chart: salesChart.map(day => ({
        ...day,
        revenue: parseFloat(day.revenue),
        orders: parseInt(day.orders)
      })),
      low_stock: lowStock.map(product => ({
        ...product,
        stock_quantity: parseInt(product.stock_quantity)
      }))
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du dashboard:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les données du tableau de bord'
    });
  }
});

// GET /api/admin/products - Gestion des produits (admin)
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, category } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }

    if (category) {
      whereClause += ' AND p.category_id = ?';
      params.push(category);
    }

    const productsQuery = `
      SELECT 
        p.*,
        c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        (SELECT COUNT(*) FROM order_items WHERE product_id = p.id) as order_count,
        COALESCE(SUM(i.quantity), 0) as inventory_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id AND i.variant_id IS NULL
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const products = await query(productsQuery, [...params, parseInt(limit), parseInt(offset)]);

    // Comptage total
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const total = countResult[0].total;

    res.json({
      products: products.map(product => ({
        ...product,
        price: parseFloat(product.price),
        compare_price: product.compare_price ? parseFloat(product.compare_price) : null,
        inventory_quantity: parseInt(product.inventory_quantity),
        order_count: parseInt(product.order_count)
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
    console.error('Erreur lors de la récupération des produits (admin):', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les produits'
    });
  }
});

// POST /api/admin/products - Créer un produit
router.post('/products', async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      short_description,
      sku,
      price,
      compare_price,
      category_id,
      status = 'draft',
      featured = false,
      weight,
      brand
    } = req.body;

    // Vérifier que le SKU est unique
    const existingProducts = await query('SELECT id FROM products WHERE sku = ?', [sku]);
    if (existingProducts.length > 0) {
      return res.status(400).json({
        error: 'SKU déjà utilisé',
        message: 'Ce SKU existe déjà'
      });
    }

    // Insérer le produit
    const result = await query(`
      INSERT INTO products (
        name, slug, description, short_description, sku, 
        price, compare_price, category_id, status, featured, 
        weight, brand
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, slug, description, short_description, sku,
      price, compare_price, category_id, status, featured,
      weight, brand
    ]);

    // Créer l'entrée d'inventaire
    await query(`
      INSERT INTO inventory (product_id, quantity, location)
      VALUES (?, 0, 'Entrepôt principal')
    `, [result.insertId]);

    // Récupérer le produit créé
    const products = await query(`
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [result.insertId]);

    res.status(201).json({
      message: 'Produit créé avec succès',
      product: {
        ...products[0],
        price: parseFloat(products[0].price),
        compare_price: products[0].compare_price ? parseFloat(products[0].compare_price) : null
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de créer le produit'
    });
  }
});

// PUT /api/admin/products/:id - Mettre à jour un produit
router.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier que le produit existe
    const products = await query('SELECT id, sku FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({
        error: 'Produit non trouvé',
        message: 'Ce produit n\'existe pas'
      });
    }

    // Si le SKU change, vérifier qu'il est unique
    if (updateData.sku && updateData.sku !== products[0].sku) {
      const existingProducts = await query('SELECT id FROM products WHERE sku = ? AND id != ?', [updateData.sku, id]);
      if (existingProducts.length > 0) {
        return res.status(400).json({
          error: 'SKU déjà utilisé',
          message: 'Ce SKU existe déjà'
        });
      }
    }

    const updates = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') {
        updates.push(`${key} = ?`);
        params.push(updateData[key]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Aucune modification',
        message: 'Aucune donnée à mettre à jour'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await query(`
      UPDATE products 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `, params);

    // Récupérer le produit mis à jour
    const updatedProducts = await query(`
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);

    res.json({
      message: 'Produit mis à jour avec succès',
      product: {
        ...updatedProducts[0],
        price: parseFloat(updatedProducts[0].price),
        compare_price: updatedProducts[0].compare_price ? parseFloat(updatedProducts[0].compare_price) : null
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de mettre à jour le produit'
    });
  }
});

// DELETE /api/admin/products/:id - Supprimer un produit
router.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que le produit existe
    const products = await query('SELECT id FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({
        error: 'Produit non trouvé',
        message: 'Ce produit n\'existe pas'
      });
    }

    // Vérifier qu'il n'y a pas de commandes en cours
    const orderItems = await query(`
      SELECT COUNT(*) as count 
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.product_id = ? AND o.status NOT IN ('delivered', 'cancelled')
    `, [id]);

    if (orderItems[0].count > 0) {
      return res.status(400).json({
        error: 'Impossible de supprimer',
        message: 'Ce produit est dans des commandes en cours'
      });
    }

    // Supprimer le produit (cascade supprimera les images, variantes, etc.)
    await query('DELETE FROM products WHERE id = ?', [id]);

    res.json({
      message: 'Produit supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de supprimer le produit'
    });
  }
});

// GET /api/admin/orders - Gestion des commandes (admin)
router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }

    if (search) {
      whereClause += ' AND (o.order_number LIKE ? OR o.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const ordersQuery = `
      SELECT 
        o.*,
        u.first_name,
        u.last_name,
        u.email,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const orders = await query(ordersQuery, [...params, parseInt(limit), parseInt(offset)]);

    // Comptage total
    const countQuery = `SELECT COUNT(*) as total FROM orders o LEFT JOIN users u ON o.user_id = u.id ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = countResult[0].total;

    res.json({
      orders: orders.map(order => ({
        ...order,
        subtotal: parseFloat(order.subtotal),
        tax_amount: parseFloat(order.tax_amount),
        shipping_amount: parseFloat(order.shipping_amount),
        total_amount: parseFloat(order.total_amount),
        item_count: parseInt(order.item_count)
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
    console.error('Erreur lors de la récupération des commandes (admin):', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les commandes'
    });
  }
});

// PUT /api/admin/orders/:id/status - Mettre à jour le statut d'une commande
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({
        error: 'Statut invalide',
        message: 'Statut de commande non valide'
      });
    }

    // Vérifier que la commande existe
    const orders = await query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({
        error: 'Commande non trouvée',
        message: 'Cette commande n\'existe pas'
      });
    }

    // Mettre à jour le statut
    await query(`
      UPDATE orders 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, id]);

    res.json({
      message: 'Statut de la commande mis à jour avec succès',
      status: status
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de la commande:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de mettre à jour le statut de la commande'
    });
  }
});

// GET /api/analytics/sales - Analytics des ventes
router.get('/analytics/sales', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);

    // Ventes par période
    const salesByPeriod = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue,
        COALESCE(AVG(total_amount), 0) as avg_order_value
      FROM orders 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [days]);

    // Ventes par catégorie
    const salesByCategory = await query(`
      SELECT 
        c.name as category,
        COUNT(DISTINCT o.id) as orders,
        COALESCE(SUM(oi.total_price), 0) as revenue
      FROM order_items oi
      LEFT JOIN orders o ON oi.order_id = o.id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY c.id
      ORDER BY revenue DESC
    `, [days]);

    // Produits les plus vendus
    const topProducts = await query(`
      SELECT 
        p.name,
        p.slug,
        SUM(oi.quantity) as total_sold,
        SUM(oi.total_price) as revenue
      FROM order_items oi
      LEFT JOIN orders o ON oi.order_id = o.id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY oi.product_id
      ORDER BY total_sold DESC
      LIMIT 10
    `, [days]);

    res.json({
      sales_by_period: salesByPeriod.map(day => ({
        ...day,
        revenue: parseFloat(day.revenue),
        avg_order_value: parseFloat(day.avg_order_value),
        orders: parseInt(day.orders)
      })),
      sales_by_category: salesByCategory.map(cat => ({
        ...cat,
        revenue: parseFloat(cat.revenue),
        orders: parseInt(cat.orders)
      })),
      top_products: topProducts.map(product => ({
        ...product,
        revenue: parseFloat(product.revenue),
        total_sold: parseInt(product.total_sold)
      }))
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des analytics:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les analytics'
    });
  }
});

module.exports = router;
