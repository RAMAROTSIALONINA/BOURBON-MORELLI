const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
require('dotenv').config();

// Auth admin
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requis' });
  }
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(authHeader.replace('Bearer ', ''), process.env.JWT_SECRET || 'your-secret-key');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Accès admin requis' });
    }
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

// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', authenticateAdmin, async (req, res) => {
  let connection;
  try {
    connection = await getConnection();

    // === KPIs Aujourd'hui vs Hier ===
    const [todayRows] = await connection.execute(`
      SELECT
        COUNT(*) AS count,
        COALESCE(SUM(total_amount), 0) AS revenue
      FROM orders
      WHERE DATE(created_at) = CURDATE()
    `);

    const [yesterdayRows] = await connection.execute(`
      SELECT
        COUNT(*) AS count,
        COALESCE(SUM(total_amount), 0) AS revenue
      FROM orders
      WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
    `);

    // === Totaux globaux ===
    const [totalOrdersRow] = await connection.execute(`SELECT COUNT(*) AS c FROM orders`);
    const [totalRevenueRow] = await connection.execute(`
      SELECT COALESCE(SUM(total_amount), 0) AS r FROM orders
      WHERE status NOT IN ('cancelled')
    `);
    const [totalCustomersRow] = await connection.execute(`SELECT COUNT(*) AS c FROM users WHERE role = 'customer' OR role IS NULL`);
    const [totalProductsRow] = await connection.execute(`SELECT COUNT(*) AS c FROM products WHERE status = 'active'`);

    // Panier moyen (30 derniers jours)
    const [avgCartRow] = await connection.execute(`
      SELECT COALESCE(AVG(total_amount), 0) AS avg_cart
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND status NOT IN ('cancelled')
    `);

    // Nouveaux clients cette semaine
    const [newCustomersRow] = await connection.execute(`
      SELECT COUNT(*) AS c FROM users
      WHERE (role = 'customer' OR role IS NULL)
        AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    // === Actions requises ===
    const [pendingRow] = await connection.execute(`
      SELECT COUNT(*) AS c FROM orders
      WHERE status = 'pending' AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);
    const [pendingAllRow] = await connection.execute(`
      SELECT COUNT(*) AS c FROM orders WHERE status = 'pending'
    `);
    const [lowStockRow] = await connection.execute(`
      SELECT COUNT(DISTINCT p.id) AS c
      FROM products p
      JOIN inventory i ON i.product_id = p.id
      WHERE p.status = 'active'
        AND i.quantity > 0
        AND i.quantity <= COALESCE(i.low_stock_threshold, 5)
    `);
    const [outOfStockRow] = await connection.execute(`
      SELECT COUNT(DISTINCT p.id) AS c
      FROM products p
      JOIN inventory i ON i.product_id = p.id
      WHERE p.status = 'active' AND i.quantity = 0
    `);

    // === Graphique ventes 7 jours ===
    const [salesChart] = await connection.execute(`
      SELECT
        DATE(created_at) AS day,
        COUNT(*) AS orders,
        COALESCE(SUM(total_amount), 0) AS revenue
      FROM orders
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        AND status NOT IN ('cancelled')
      GROUP BY DATE(created_at)
      ORDER BY day ASC
    `);

    // === Dernières commandes ===
    const [recentOrders] = await connection.execute(`
      SELECT
        o.id,
        o.order_number,
        o.total_amount,
        o.status,
        o.created_at,
        o.notes,
        u.first_name,
        u.last_name,
        u.email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    // Enrichir avec customer depuis notes JSON si manquant
    const recentOrdersEnriched = recentOrders.map(o => {
      let customerName = `${o.first_name || ''} ${o.last_name || ''}`.trim();
      let customerEmail = o.email;
      if (!customerName || !customerEmail) {
        try {
          const notes = JSON.parse(o.notes || '{}');
          const c = notes.customer || {};
          customerName = customerName || `${c.first_name || ''} ${c.last_name || ''}`.trim();
          customerEmail = customerEmail || c.email;
        } catch (e) { /* ignore */ }
      }
      return {
        id: o.id,
        order_number: o.order_number,
        total_amount: parseFloat(o.total_amount || 0),
        status: o.status,
        created_at: o.created_at,
        customer_name: customerName || 'Client',
        customer_email: customerEmail || ''
      };
    });

    // === Top produits (30j) ===
    const [topProducts] = await connection.execute(`
      SELECT
        p.id,
        p.name,
        p.price,
        (SELECT pi.image_url FROM product_images pi
         WHERE pi.product_id = p.id
         ORDER BY pi.is_primary DESC, pi.id ASC LIMIT 1) AS image_url,
        COALESCE(SUM(oi.quantity), 0) AS total_sold,
        COALESCE(SUM(oi.total_price), 0) AS total_revenue
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND o.status NOT IN ('cancelled')
      WHERE p.status = 'active'
      GROUP BY p.id, p.name, p.price
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    // Helpers calculs
    const pct = (current, previous) => {
      const c = parseFloat(current) || 0;
      const p = parseFloat(previous) || 0;
      if (p === 0) return c > 0 ? 100 : 0;
      return Math.round(((c - p) / p) * 100);
    };

    const todayRevenue = parseFloat(todayRows[0].revenue) || 0;
    const yesterdayRevenue = parseFloat(yesterdayRows[0].revenue) || 0;
    const todayCount = parseInt(todayRows[0].count) || 0;
    const yesterdayCount = parseInt(yesterdayRows[0].count) || 0;

    res.json({
      kpis: {
        todayRevenue,
        todayOrders: todayCount,
        revenueChange: pct(todayRevenue, yesterdayRevenue),
        ordersChange: pct(todayCount, yesterdayCount),
        totalOrders: parseInt(totalOrdersRow[0].c) || 0,
        totalRevenue: parseFloat(totalRevenueRow[0].r) || 0,
        totalCustomers: parseInt(totalCustomersRow[0].c) || 0,
        totalProducts: parseInt(totalProductsRow[0].c) || 0,
        avgCart: parseFloat(avgCartRow[0].avg_cart) || 0,
        newCustomersWeek: parseInt(newCustomersRow[0].c) || 0
      },
      alerts: {
        pendingOver24h: parseInt(pendingRow[0].c) || 0,
        pendingAll: parseInt(pendingAllRow[0].c) || 0,
        lowStock: parseInt(lowStockRow[0].c) || 0,
        outOfStock: parseInt(outOfStockRow[0].c) || 0
      },
      salesChart: salesChart.map(r => ({
        day: r.day,
        orders: parseInt(r.orders) || 0,
        revenue: parseFloat(r.revenue) || 0
      })),
      recentOrders: recentOrdersEnriched,
      topProducts: topProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.price) || 0,
        image_url: p.image_url,
        total_sold: parseInt(p.total_sold) || 0,
        total_revenue: parseFloat(p.total_revenue) || 0
      }))
    });

  } catch (error) {
    console.error('Erreur dashboard stats:', error);
    res.status(500).json({ error: 'Erreur serveur', message: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

module.exports = router;
