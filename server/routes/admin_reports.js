const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
require('dotenv').config();

// Middleware admin
const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token requis' });
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Accès admin requis' });
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

const getConnection = () => mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bourbon_morelli',
  charset: 'utf8mb4'
});

// Helpers : range de dates
const parseRange = (req) => {
  const to = req.query.to ? new Date(req.query.to) : new Date();
  const from = req.query.from ? new Date(req.query.from)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString().slice(0, 19).replace('T', ' '),
    to: to.toISOString().slice(0, 19).replace('T', ' '),
    fromIso: from.toISOString().slice(0, 10),
    toIso: to.toISOString().slice(0, 10)
  };
};

// ====== 1. RAPPORT VENTES ======
router.get('/sales', authenticateAdmin, async (req, res) => {
  let connection;
  try {
    const { from, to, fromIso, toIso } = parseRange(req);
    connection = await getConnection();

    const [summary] = await connection.execute(`
      SELECT COUNT(*) AS orders,
             COALESCE(SUM(total_amount),0) AS revenue,
             COALESCE(SUM(subtotal),0) AS subtotal,
             COALESCE(SUM(tax_amount),0) AS tax,
             COALESCE(SUM(shipping_amount),0) AS shipping,
             COALESCE(SUM(discount_amount),0) AS discount,
             COALESCE(AVG(total_amount),0) AS avg_cart
      FROM orders
      WHERE status NOT IN ('cancelled') AND created_at BETWEEN ? AND ?
    `, [from, to]);

    const [byStatus] = await connection.execute(`
      SELECT status, COUNT(*) AS count, COALESCE(SUM(total_amount),0) AS total
      FROM orders WHERE created_at BETWEEN ? AND ?
      GROUP BY status ORDER BY count DESC
    `, [from, to]);

    const [ordersList] = await connection.execute(`
      SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at,
             COALESCE(CONCAT(u.first_name,' ',u.last_name), o.email, 'Client') AS customer,
             COALESCE(u.email, o.email) AS email
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      WHERE o.created_at BETWEEN ? AND ?
      ORDER BY o.created_at DESC
    `, [from, to]);

    const [topProducts] = await connection.execute(`
      SELECT p.id, p.name, SUM(oi.quantity) AS sold, SUM(oi.total_price) AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE o.status NOT IN ('cancelled') AND o.created_at BETWEEN ? AND ?
      GROUP BY p.id, p.name
      ORDER BY revenue DESC LIMIT 10
    `, [from, to]);

    await connection.end();

    res.json({
      type: 'sales',
      title: 'Rapport de ventes',
      period: { from: fromIso, to: toIso },
      summary: {
        orders: parseInt(summary[0].orders),
        revenue: parseFloat(summary[0].revenue),
        subtotal: parseFloat(summary[0].subtotal),
        tax: parseFloat(summary[0].tax),
        shipping: parseFloat(summary[0].shipping),
        discount: parseFloat(summary[0].discount),
        avgCart: parseFloat(summary[0].avg_cart)
      },
      byStatus: byStatus.map(r => ({ status: r.status, count: parseInt(r.count), total: parseFloat(r.total) })),
      orders: ordersList.map(o => ({
        id: o.id, order_number: o.order_number, status: o.status,
        total: parseFloat(o.total_amount), customer: o.customer, email: o.email,
        date: o.created_at
      })),
      topProducts: topProducts.map(p => ({
        id: p.id, name: p.name, sold: parseInt(p.sold), revenue: parseFloat(p.revenue)
      }))
    });
  } catch (e) {
    if (connection) try { await connection.end(); } catch (_) {}
    res.status(500).json({ error: 'Erreur serveur', message: e.message });
  }
});

// ====== 2. RAPPORT FINANCIER ======
router.get('/financial', authenticateAdmin, async (req, res) => {
  let connection;
  try {
    const { from, to, fromIso, toIso } = parseRange(req);
    connection = await getConnection();

    const [summary] = await connection.execute(`
      SELECT
        COUNT(*) AS payments,
        COALESCE(SUM(CASE WHEN payment_status='completed' THEN amount ELSE 0 END),0) AS completed,
        COALESCE(SUM(CASE WHEN payment_status='pending' THEN amount ELSE 0 END),0) AS pending,
        COALESCE(SUM(CASE WHEN payment_status='failed' THEN amount ELSE 0 END),0) AS failed,
        COALESCE(SUM(CASE WHEN payment_status='refunded' THEN amount ELSE 0 END),0) AS refunded
      FROM payments WHERE created_at BETWEEN ? AND ?
    `, [from, to]);

    const [byMethod] = await connection.execute(`
      SELECT payment_method AS method, COUNT(*) AS count,
             COALESCE(SUM(amount),0) AS total
      FROM payments
      WHERE payment_status='completed' AND created_at BETWEEN ? AND ?
      GROUP BY payment_method
    `, [from, to]);

    const [payments] = await connection.execute(`
      SELECT p.id, p.transaction_id, p.amount, p.currency, p.payment_method,
             p.payment_status, p.created_at, p.processed_at,
             o.order_number
      FROM payments p
      LEFT JOIN orders o ON o.id = p.order_id
      WHERE p.created_at BETWEEN ? AND ?
      ORDER BY p.created_at DESC
    `, [from, to]);

    // TVA estimée (tax_amount sur orders correspondantes)
    const [taxRow] = await connection.execute(`
      SELECT COALESCE(SUM(tax_amount),0) AS tax
      FROM orders WHERE status NOT IN ('cancelled') AND created_at BETWEEN ? AND ?
    `, [from, to]);

    await connection.end();

    res.json({
      type: 'financial',
      title: 'Rapport financier',
      period: { from: fromIso, to: toIso },
      summary: {
        payments: parseInt(summary[0].payments),
        completed: parseFloat(summary[0].completed),
        pending: parseFloat(summary[0].pending),
        failed: parseFloat(summary[0].failed),
        refunded: parseFloat(summary[0].refunded),
        tax: parseFloat(taxRow[0].tax),
        net: parseFloat(summary[0].completed) - parseFloat(summary[0].refunded)
      },
      byMethod: byMethod.map(r => ({ method: r.method, count: parseInt(r.count), total: parseFloat(r.total) })),
      payments: payments.map(p => ({
        id: p.id, transaction_id: p.transaction_id,
        amount: parseFloat(p.amount), currency: p.currency,
        method: p.payment_method, status: p.payment_status,
        order: p.order_number, date: p.created_at, processed_at: p.processed_at
      }))
    });
  } catch (e) {
    if (connection) try { await connection.end(); } catch (_) {}
    res.status(500).json({ error: 'Erreur serveur', message: e.message });
  }
});

// ====== 3. RAPPORT INVENTAIRE ======
router.get('/inventory', authenticateAdmin, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();

    const [rows] = await connection.execute(`
      SELECT
        p.id, p.name, p.sku, p.price, p.cost_price, p.status,
        COALESCE(c.name, 'Sans catégorie') AS category,
        COALESCE(i.quantity, 0) AS quantity,
        COALESCE(i.low_stock_threshold, 5) AS threshold,
        COALESCE(i.reserved_quantity, 0) AS reserved
      FROM products p
      LEFT JOIN inventory i ON i.product_id = p.id
      LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.name ASC
    `);

    const items = rows.map(r => {
      const qty = parseInt(r.quantity) || 0;
      const threshold = parseInt(r.threshold) || 5;
      let stockStatus = 'ok';
      if (qty === 0) stockStatus = 'out';
      else if (qty <= threshold) stockStatus = 'low';
      return {
        id: r.id, name: r.name, sku: r.sku, category: r.category,
        price: parseFloat(r.price),
        cost: parseFloat(r.cost_price) || 0,
        quantity: qty, threshold, reserved: parseInt(r.reserved),
        stockStatus,
        stockValue: qty * (parseFloat(r.cost_price) || parseFloat(r.price) || 0)
      };
    });

    const summary = {
      totalProducts: items.length,
      outOfStock: items.filter(i => i.stockStatus === 'out').length,
      lowStock: items.filter(i => i.stockStatus === 'low').length,
      inStock: items.filter(i => i.stockStatus === 'ok').length,
      stockValue: items.reduce((s, i) => s + i.stockValue, 0),
      totalUnits: items.reduce((s, i) => s + i.quantity, 0)
    };

    await connection.end();

    res.json({
      type: 'inventory',
      title: 'Rapport d\'inventaire',
      period: { from: new Date().toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
      summary,
      items
    });
  } catch (e) {
    if (connection) try { await connection.end(); } catch (_) {}
    res.status(500).json({ error: 'Erreur serveur', message: e.message });
  }
});

// ====== 4. RAPPORT CLIENTS ======
router.get('/customers', authenticateAdmin, async (req, res) => {
  let connection;
  try {
    const { from, to, fromIso, toIso } = parseRange(req);
    connection = await getConnection();

    // Top acheteurs inscrits
    const [registered] = await connection.execute(`
      SELECT u.id, u.first_name, u.last_name, u.email,
             COUNT(DISTINCT o.id) AS orders,
             COALESCE(SUM(o.total_amount),0) AS total_spent,
             MAX(o.created_at) AS last_order
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id AND o.status NOT IN ('cancelled')
        AND o.created_at BETWEEN ? AND ?
      WHERE (u.role = 'customer' OR u.role IS NULL)
      GROUP BY u.id
      HAVING orders > 0
      ORDER BY total_spent DESC
    `, [from, to]);

    // Top acheteurs invités
    const [guests] = await connection.execute(`
      SELECT o.email,
             COUNT(DISTINCT o.id) AS orders,
             COALESCE(SUM(o.total_amount),0) AS total_spent,
             MAX(o.created_at) AS last_order
      FROM orders o
      WHERE o.user_id IS NULL AND o.email IS NOT NULL
        AND o.status NOT IN ('cancelled')
        AND o.created_at BETWEEN ? AND ?
      GROUP BY o.email
      ORDER BY total_spent DESC
    `, [from, to]);

    const summary = {
      registered: registered.length,
      guests: guests.length,
      total: registered.length + guests.length,
      totalRevenue: [...registered, ...guests].reduce((s, c) => s + parseFloat(c.total_spent), 0),
      avgPerCustomer: (registered.length + guests.length) > 0
        ? [...registered, ...guests].reduce((s, c) => s + parseFloat(c.total_spent), 0) / (registered.length + guests.length)
        : 0
    };

    await connection.end();

    res.json({
      type: 'customers',
      title: 'Rapport clients',
      period: { from: fromIso, to: toIso },
      summary,
      registered: registered.map(r => ({
        id: r.id, name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
        email: r.email, orders: parseInt(r.orders),
        total_spent: parseFloat(r.total_spent), last_order: r.last_order
      })),
      guests: guests.map(g => ({
        email: g.email, orders: parseInt(g.orders),
        total_spent: parseFloat(g.total_spent), last_order: g.last_order
      }))
    });
  } catch (e) {
    if (connection) try { await connection.end(); } catch (_) {}
    res.status(500).json({ error: 'Erreur serveur', message: e.message });
  }
});

// ====== 5. RAPPORT PRODUITS ======
router.get('/products', authenticateAdmin, async (req, res) => {
  let connection;
  try {
    const { from, to, fromIso, toIso } = parseRange(req);
    connection = await getConnection();

    const [rows] = await connection.execute(`
      SELECT
        p.id, p.name, p.sku, p.price, p.cost_price, p.status,
        COALESCE(c.name, 'Sans catégorie') AS category,
        COALESCE(i.quantity, 0) AS stock,
        COALESCE(SUM(oi.quantity), 0) AS sold,
        COALESCE(SUM(oi.total_price), 0) AS revenue
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN inventory i ON i.product_id = p.id
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id
        AND o.status NOT IN ('cancelled')
        AND o.created_at BETWEEN ? AND ?
      GROUP BY p.id, p.name, p.sku, p.price, p.cost_price, p.status, c.name, i.quantity
      ORDER BY revenue DESC
    `, [from, to]);

    const items = rows.map(r => {
      const price = parseFloat(r.price) || 0;
      const cost = parseFloat(r.cost_price) || 0;
      const sold = parseInt(r.sold) || 0;
      const revenue = parseFloat(r.revenue) || 0;
      const margin = price - cost;
      const marginPct = price > 0 ? (margin / price) * 100 : 0;
      return {
        id: r.id, name: r.name, sku: r.sku, category: r.category,
        status: r.status, price, cost,
        margin: Math.round(margin * 100) / 100,
        marginPct: Math.round(marginPct * 10) / 10,
        stock: parseInt(r.stock) || 0,
        sold, revenue,
        grossProfit: Math.round((revenue - (cost * sold)) * 100) / 100
      };
    });

    const summary = {
      totalProducts: items.length,
      activeSold: items.filter(i => i.sold > 0).length,
      totalUnitsSold: items.reduce((s, i) => s + i.sold, 0),
      totalRevenue: items.reduce((s, i) => s + i.revenue, 0),
      totalProfit: items.reduce((s, i) => s + i.grossProfit, 0),
      avgMarginPct: items.length ? items.reduce((s, i) => s + i.marginPct, 0) / items.length : 0
    };

    await connection.end();

    res.json({
      type: 'products',
      title: 'Rapport produits',
      period: { from: fromIso, to: toIso },
      summary,
      items
    });
  } catch (e) {
    if (connection) try { await connection.end(); } catch (_) {}
    res.status(500).json({ error: 'Erreur serveur', message: e.message });
  }
});

module.exports = router;
