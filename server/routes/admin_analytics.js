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

// Mapping période → nombre de jours
const PERIOD_DAYS = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };

// GET /api/admin/analytics?period=7d|30d|90d|1y
router.get('/analytics', authenticateAdmin, async (req, res) => {
  let connection;
  try {
    const period = req.query.period || '30d';
    const days = PERIOD_DAYS[period] || 30;

    connection = await getConnection();

    // === KPIs période actuelle vs précédente ===
    const [currentRow] = await connection.execute(`
      SELECT
        COUNT(*) AS orders,
        COALESCE(SUM(total_amount), 0) AS revenue,
        COALESCE(AVG(total_amount), 0) AS avg_cart
      FROM orders
      WHERE status NOT IN ('cancelled')
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [days]);

    const [previousRow] = await connection.execute(`
      SELECT
        COUNT(*) AS orders,
        COALESCE(SUM(total_amount), 0) AS revenue,
        COALESCE(AVG(total_amount), 0) AS avg_cart
      FROM orders
      WHERE status NOT IN ('cancelled')
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [days * 2, days]);

    // Conversion invités → inscrits
    const [regRow] = await connection.execute(`
      SELECT COUNT(DISTINCT user_id) AS c FROM orders
      WHERE user_id IS NOT NULL AND status NOT IN ('cancelled')
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [days]);
    const [guestRow] = await connection.execute(`
      SELECT COUNT(DISTINCT email) AS c FROM orders
      WHERE user_id IS NULL AND email IS NOT NULL AND status NOT IN ('cancelled')
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [days]);

    const [regPrevRow] = await connection.execute(`
      SELECT COUNT(DISTINCT user_id) AS c FROM orders
      WHERE user_id IS NOT NULL AND status NOT IN ('cancelled')
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [days * 2, days]);
    const [guestPrevRow] = await connection.execute(`
      SELECT COUNT(DISTINCT email) AS c FROM orders
      WHERE user_id IS NULL AND email IS NOT NULL AND status NOT IN ('cancelled')
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [days * 2, days]);

    const regCount = parseInt(regRow[0].c) || 0;
    const guestCount = parseInt(guestRow[0].c) || 0;
    const conversion = (regCount + guestCount) > 0 ? (regCount / (regCount + guestCount)) * 100 : 0;
    const regPrev = parseInt(regPrevRow[0].c) || 0;
    const guestPrev = parseInt(guestPrevRow[0].c) || 0;
    const conversionPrev = (regPrev + guestPrev) > 0 ? (regPrev / (regPrev + guestPrev)) * 100 : 0;

    const pct = (c, p) => {
      c = parseFloat(c) || 0; p = parseFloat(p) || 0;
      if (p === 0) return c > 0 ? 100 : 0;
      return Math.round(((c - p) / p) * 100);
    };

    const kpis = {
      revenue: { current: parseFloat(currentRow[0].revenue), previous: parseFloat(previousRow[0].revenue), pct: pct(currentRow[0].revenue, previousRow[0].revenue) },
      orders: { current: parseInt(currentRow[0].orders), previous: parseInt(previousRow[0].orders), pct: pct(currentRow[0].orders, previousRow[0].orders) },
      avgCart: { current: parseFloat(currentRow[0].avg_cart), previous: parseFloat(previousRow[0].avg_cart), pct: pct(currentRow[0].avg_cart, previousRow[0].avg_cart) },
      conversion: { current: Math.round(conversion * 10) / 10, previous: Math.round(conversionPrev * 10) / 10, pct: pct(conversion, conversionPrev) }
    };

    // === Évolution CA jour par jour (période actuelle) ===
    const [revenueCurrent] = await connection.execute(`
      SELECT DATE(created_at) AS d, COALESCE(SUM(total_amount),0) AS revenue
      FROM orders
      WHERE status NOT IN ('cancelled')
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at) ORDER BY d ASC
    `, [days - 1]);

    const [revenuePrevious] = await connection.execute(`
      SELECT DATE(created_at) AS d, COALESCE(SUM(total_amount),0) AS revenue
      FROM orders
      WHERE status NOT IN ('cancelled')
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND created_at < DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at) ORDER BY d ASC
    `, [days * 2 - 1, days - 1]);

    // === Répartition par catégorie ===
    const [categoryBreakdown] = await connection.execute(`
      SELECT
        COALESCE(c.name, 'Sans catégorie') AS name,
        COALESCE(SUM(oi.total_price), 0) AS value
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE o.status NOT IN ('cancelled')
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY c.id, c.name
      ORDER BY value DESC
    `, [days]);

    // === Top 10 produits ===
    const [topProducts] = await connection.execute(`
      SELECT
        p.id, p.name, p.price,
        (SELECT pi.image_url FROM product_images pi
         WHERE pi.product_id = p.id
         ORDER BY pi.is_primary DESC, pi.id ASC LIMIT 1) AS image_url,
        COALESCE(SUM(oi.quantity), 0) AS sold,
        COALESCE(SUM(oi.total_price), 0) AS revenue
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id
        AND o.status NOT IN ('cancelled')
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      WHERE p.status = 'active'
      GROUP BY p.id, p.name, p.price
      HAVING sold > 0
      ORDER BY revenue DESC
      LIMIT 10
    `, [days]);

    // === Clients inscrits vs invités (12 derniers mois) ===
    const [customerTypeChart] = await connection.execute(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) AS registered,
        SUM(CASE WHEN user_id IS NULL THEN 1 ELSE 0 END) AS guests
      FROM orders
      WHERE status NOT IN ('cancelled')
        AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    // === Méthodes de paiement ===
    const [paymentMethods] = await connection.execute(`
      SELECT payment_method AS method, COUNT(*) AS count, COALESCE(SUM(amount),0) AS total
      FROM payments
      WHERE payment_status IN ('completed','pending')
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY payment_method
      ORDER BY count DESC
    `, [days]);

    // === Heatmap jour × heure ===
    const [heatmap] = await connection.execute(`
      SELECT
        DAYOFWEEK(created_at) AS dow,
        HOUR(created_at) AS hour,
        COUNT(*) AS count
      FROM orders
      WHERE status NOT IN ('cancelled')
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DAYOFWEEK(created_at), HOUR(created_at)
    `, [Math.max(days, 30)]);

    await connection.end();

    res.json({
      period,
      days,
      kpis,
      revenueChart: {
        current: revenueCurrent.map(r => ({ date: r.d, revenue: parseFloat(r.revenue) })),
        previous: revenuePrevious.map(r => ({ date: r.d, revenue: parseFloat(r.revenue) }))
      },
      categoryBreakdown: categoryBreakdown.map(c => ({ name: c.name, value: parseFloat(c.value) })),
      topProducts: topProducts.map(p => ({
        id: p.id, name: p.name, price: parseFloat(p.price),
        image_url: p.image_url, sold: parseInt(p.sold), revenue: parseFloat(p.revenue)
      })),
      customerTypeChart: customerTypeChart.map(r => ({
        month: r.month, registered: parseInt(r.registered), guests: parseInt(r.guests)
      })),
      paymentMethods: paymentMethods.map(m => ({
        method: m.method, count: parseInt(m.count), total: parseFloat(m.total)
      })),
      heatmap: heatmap.map(h => ({ dow: parseInt(h.dow), hour: parseInt(h.hour), count: parseInt(h.count) }))
    });

  } catch (error) {
    console.error('Erreur analytics:', error);
    if (connection) try { await connection.end(); } catch (e) {}
    res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
});

module.exports = router;
