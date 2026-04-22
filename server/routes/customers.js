const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
require('dotenv').config();

// Middleware pour vérifier l'authentification admin
const authenticateAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token requis' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Accès admin requis' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// GET /api/customers - Récupérer tous les clients (inscrits + invités)
router.get('/', authenticateAdmin, async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    // 1. Clients inscrits (table users)
    const [registeredUsers] = await connection.execute(`
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role,
        u.status,
        u.created_at,
        u.updated_at,
        COUNT(DISTINCT o.id) AS orders_count,
        COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) AS total_spent,
        MAX(o.created_at) AS last_order_date
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      WHERE u.role IN ('customer', '') OR u.role IS NULL OR u.role = 'customer'
      GROUP BY u.id
    `);

    // 2. Clients invités (dans orders mais absents de users)
    const [guestOrders] = await connection.execute(`
      SELECT
        o.email,
        o.notes,
        COUNT(DISTINCT o.id) AS orders_count,
        COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) AS total_spent,
        MIN(o.created_at) AS first_order_date,
        MAX(o.created_at) AS last_order_date
      FROM orders o
      WHERE o.user_id IS NULL
        AND o.email IS NOT NULL
        AND o.email NOT IN (SELECT email FROM users WHERE email IS NOT NULL)
      GROUP BY o.email
    `);

    // Normaliser les inscrits
    const registered = registeredUsers.map(u => ({
      id: `u-${u.id}`,
      user_id: u.id,
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      email: u.email,
      phone: u.phone || '',
      type: 'registered',
      // status=2 réservé pour les comptes explicitement désactivés ; 0/1/NULL => actif
      status: (u.status === 2 || u.status === '2') ? 'inactive' : 'active',
      orders_count: parseInt(u.orders_count) || 0,
      total_spent: parseFloat(u.total_spent) || 0,
      last_order_date: u.last_order_date,
      created_at: u.created_at,
      updated_at: u.updated_at
    }));

    // Normaliser les invités (extraire nom/téléphone depuis notes JSON)
    const guests = guestOrders.map((g, idx) => {
      let firstName = '';
      let lastName = '';
      let phone = '';
      try {
        const n = JSON.parse(g.notes || '{}');
        const c = n.customer || {};
        firstName = c.first_name || '';
        lastName = c.last_name || '';
        phone = c.phone || '';
        // Fallback sur champ flat
        if (!firstName && n.customer_name) {
          const parts = n.customer_name.split(' ');
          firstName = parts[0] || '';
          lastName = parts.slice(1).join(' ') || '';
        }
        if (!phone && n.customer_phone) phone = n.customer_phone;
      } catch (e) { /* ignore */ }

      return {
        id: `g-${idx}`,
        user_id: null,
        first_name: firstName,
        last_name: lastName,
        email: g.email,
        phone,
        type: 'guest',
        status: 'active',
        orders_count: parseInt(g.orders_count) || 0,
        total_spent: parseFloat(g.total_spent) || 0,
        last_order_date: g.last_order_date,
        created_at: g.first_order_date,
        updated_at: g.last_order_date
      };
    });

    // Fusion + tri (plus récent d'abord)
    const customers = [...registered, ...guests].sort((a, b) => {
      const da = new Date(a.last_order_date || a.created_at || 0).getTime();
      const db = new Date(b.last_order_date || b.created_at || 0).getTime();
      return db - da;
    });

    await connection.end();

    res.json({
      success: true,
      customers,
      total: customers.length,
      stats: {
        registered: registered.length,
        guests: guests.length
      }
    });

  } catch (error) {
    console.error('Erreur clients:', error);
    if (connection) try { await connection.end(); } catch (e) {}
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

// GET /api/customers/:id - Récupérer un client par ID
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    const [customers] = await connection.execute(`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        phone,
        role,
        created_at,
        updated_at
      FROM users
      WHERE id = ? AND role = 'customer'
    `, [id]);

    if (customers.length === 0) {
      await connection.end();
      return res.status(404).json({
        error: 'Client non trouvé',
        message: 'Ce client n\'existe pas'
      });
    }

    await connection.end();

    res.json({
      success: true,
      customer: customers[0]
    });

  } catch (error) {
    console.error('Erreur client:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

// PUT /api/customers/:id - Mettre à jour un client
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone } = req.body;

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    // Vérifier si le client existe
    const [customers] = await connection.execute(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [id, 'customer']
    );

    if (customers.length === 0) {
      await connection.end();
      return res.status(404).json({
        error: 'Client non trouvé',
        message: 'Ce client n\'existe pas'
      });
    }

    // Mettre à jour le client
    await connection.execute(`
      UPDATE users 
      SET first_name = ?, last_name = ?, email = ?, phone = ?, updated_at = NOW()
      WHERE id = ? AND role = 'customer'
    `, [first_name, last_name, email, phone, id]);

    await connection.end();

    res.json({
      success: true,
      message: 'Client mis à jour avec succès',
      customer: {
        id: parseInt(id),
        first_name,
        last_name,
        email,
        phone,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur mise à jour client:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

// POST /api/customers - Créer un nouveau client
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, password } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        error: 'Champs obligatoires manquants',
        message: 'Le nom, prénom et email sont requis'
      });
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    // Hasher le mot de passe
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password || 'password123', 10);

    const [result] = await connection.execute(`
      INSERT INTO users (first_name, last_name, email, phone, password_hash, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'customer', NOW(), NOW())
    `, [first_name, last_name, email, phone, hashedPassword]);

    await connection.end();

    res.status(201).json({
      success: true,
      message: 'Client créé avec succès',
      customer: {
        id: result.insertId,
        first_name,
        last_name,
        email,
        phone,
        role: 'customer',
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur création client:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

// DELETE /api/customers/guest/:email - Supprimer un client invité (= purger ses commandes)
router.delete('/guest/:email', authenticateAdmin, async (req, res) => {
  let connection;
  try {
    const email = decodeURIComponent(req.params.email);

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    // Trouver les commandes de cet invité
    const [orders] = await connection.execute(
      'SELECT id FROM orders WHERE user_id IS NULL AND email = ?',
      [email]
    );

    if (orders.length === 0) {
      await connection.end();
      return res.status(404).json({
        error: 'Invité non trouvé',
        message: 'Aucune commande trouvée pour cet email invité'
      });
    }

    const orderIds = orders.map(o => o.id);
    const placeholders = orderIds.map(() => '?').join(',');

    // Supprimer en cascade : payments → order_items → orders
    await connection.execute(`DELETE FROM payments WHERE order_id IN (${placeholders})`, orderIds);
    await connection.execute(`DELETE FROM order_items WHERE order_id IN (${placeholders})`, orderIds);
    const [result] = await connection.execute(`DELETE FROM orders WHERE id IN (${placeholders})`, orderIds);

    await connection.end();

    res.json({
      success: true,
      message: `Invité ${email} supprimé (${result.affectedRows} commande(s) purgée(s))`,
      deletedOrders: result.affectedRows
    });

  } catch (error) {
    console.error('Erreur suppression invité:', error);
    if (connection) try { await connection.end(); } catch (_) {}
    res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
});

// DELETE /api/customers/:id - Supprimer un client inscrit (table users)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  let connection;
  try {
    const { id } = req.params;

    // Accepter seulement un ID numérique (les IDs composites sont routés ailleurs)
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        error: 'ID invalide',
        message: 'L\'ID doit être numérique. Pour un invité, utilisez /api/customers/guest/:email'
      });
    }

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bourbon_morelli',
      charset: 'utf8mb4'
    });

    // Vérifier que l'utilisateur existe (role customer ou null, jamais admin)
    const [customers] = await connection.execute(
      "SELECT id, role FROM users WHERE id = ?",
      [id]
    );

    if (customers.length === 0) {
      await connection.end();
      return res.status(404).json({
        error: 'Client non trouvé',
        message: 'Ce client n\'existe pas'
      });
    }

    if (customers[0].role === 'admin') {
      await connection.end();
      return res.status(403).json({
        error: 'Suppression interdite',
        message: 'Un administrateur ne peut pas être supprimé via cette route'
      });
    }

    // Détacher ses commandes (les garder mais anonymiser le user_id → NULL + email)
    // pour ne pas perdre l'historique de vente
    await connection.execute(
      `UPDATE orders SET user_id = NULL,
         email = COALESCE(email, (SELECT email FROM users WHERE id = ?))
       WHERE user_id = ?`,
      [id, id]
    );

    // Supprimer le user
    await connection.execute('DELETE FROM users WHERE id = ?', [id]);

    await connection.end();

    res.json({
      success: true,
      message: 'Client supprimé avec succès (ses commandes sont conservées comme invité)'
    });

  } catch (error) {
    console.error('Erreur suppression client:', error);
    if (connection) try { await connection.end(); } catch (_) {}
    res.status(500).json({
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

module.exports = router;
