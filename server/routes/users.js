const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

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

// GET /api/users/profile - Récupérer le profil de l'utilisateur connecté
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer les informations de base
    const users = await query(`
      SELECT 
        id, first_name, last_name, email, phone, role, created_at, updated_at
      FROM users 
      WHERE id = ?
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé',
        message: 'Cet utilisateur n\'existe pas'
      });
    }

    const user = users[0];

    // Récupérer les adresses
    const addresses = await query(`
      SELECT * FROM addresses 
      WHERE user_id = ? 
      ORDER BY is_default DESC, created_at DESC
    `, [userId]);

    // Récupérer les statistiques
    const stats = await query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_order_date,
        COUNT(DISTINCT pr.id) as total_reviews
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      LEFT JOIN product_reviews pr ON u.id = pr.user_id
      WHERE u.id = ?
    `, [userId]);

    res.json({
      user: {
        ...user,
        addresses: addresses,
        stats: {
          total_orders: stats[0].total_orders || 0,
          total_spent: parseFloat(stats[0].total_spent) || 0,
          last_order_date: stats[0].last_order_date,
          total_reviews: stats[0].total_reviews || 0
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer le profil'
    });
  }
});

// PUT /api/users/profile - Mettre à jour le profil
router.put('/profile', authenticateToken, [
  body('first_name').optional().trim().isLength({ min: 2, max: 100 }),
  body('last_name').optional().trim().isLength({ min: 2, max: 100 }),
  body('phone').optional().isMobilePhone('any')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, phone } = req.body;

    const updates = [];
    const params = [];

    if (first_name !== undefined) {
      updates.push('first_name = ?');
      params.push(first_name);
    }

    if (last_name !== undefined) {
      updates.push('last_name = ?');
      params.push(last_name);
    }

    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Aucune modification',
        message: 'Aucune donnée à mettre à jour'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);

    await query(`
      UPDATE users SET ${updates.join(', ')} 
      WHERE id = ?
    `, params);

    // Récupérer les informations mises à jour
    const users = await query(`
      SELECT id, first_name, last_name, email, phone, role, updated_at 
      FROM users WHERE id = ?
    `, [userId]);

    res.json({
      message: 'Profil mis à jour avec succès',
      user: users[0]
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de mettre à jour le profil'
    });
  }
});

// GET /api/users/addresses - Récupérer les adresses de l'utilisateur
router.get('/addresses', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const addresses = await query(`
      SELECT * FROM addresses 
      WHERE user_id = ? 
      ORDER BY is_default DESC, created_at DESC
    `, [userId]);

    res.json({ addresses });

  } catch (error) {
    console.error('Erreur lors de la récupération des adresses:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les adresses'
    });
  }
});

// POST /api/users/addresses - Ajouter une nouvelle adresse
router.post('/addresses', authenticateToken, [
  body('type').isIn(['billing', 'shipping']),
  body('first_name').trim().isLength({ min: 2 }),
  body('last_name').trim().isLength({ min: 2 }),
  body('street_address').trim().isLength({ min: 5 }),
  body('city').trim().isLength({ min: 2 }),
  body('postal_code').trim().isLength({ min: 3 }),
  body('country').trim().isLength({ min: 2 }),
  body('is_default').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      type,
      first_name,
      last_name,
      company,
      street_address,
      apartment,
      city,
      postal_code,
      country,
      phone,
      is_default = false
    } = req.body;

    // Si c'est l'adresse par défaut, désactiver les autres adresses par défaut du même type
    if (is_default) {
      await query(`
        UPDATE addresses 
        SET is_default = FALSE 
        WHERE user_id = ? AND type = ?
      `, [userId, type]);
    }

    const result = await query(`
      INSERT INTO addresses (
        user_id, type, first_name, last_name, company,
        street_address, apartment, city, postal_code, country, phone, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, type, first_name, last_name, company,
      street_address, apartment, city, postal_code, country, phone, is_default
    ]);

    // Récupérer l'adresse créée
    const addresses = await query(`
      SELECT * FROM addresses WHERE id = ?
    `, [result.insertId]);

    res.status(201).json({
      message: 'Adresse ajoutée avec succès',
      address: addresses[0]
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'adresse:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible d\'ajouter l\'adresse'
    });
  }
});

// PUT /api/users/addresses/:id - Mettre à jour une adresse
router.put('/addresses/:id', authenticateToken, [
  body('type').optional().isIn(['billing', 'shipping']),
  body('first_name').optional().trim().isLength({ min: 2 }),
  body('last_name').optional().trim().isLength({ min: 2 }),
  body('street_address').optional().trim().isLength({ min: 5 }),
  body('city').optional().trim().isLength({ min: 2 }),
  body('postal_code').optional().trim().isLength({ min: 3 }),
  body('country').optional().trim().isLength({ min: 2 }),
  body('is_default').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier que l'adresse appartient à l'utilisateur
    const addresses = await query(`
      SELECT * FROM addresses 
      WHERE id = ? AND user_id = ?
    `, [id, userId]);

    if (addresses.length === 0) {
      return res.status(404).json({
        error: 'Adresse non trouvée',
        message: 'Cette adresse n\'existe pas ou ne vous appartient pas'
      });
    }

    // Si c'est l'adresse par défaut, désactiver les autres
    if (updateData.is_default) {
      await query(`
        UPDATE addresses 
        SET is_default = FALSE 
        WHERE user_id = ? AND type = ? AND id != ?
      `, [userId, updateData.type || addresses[0].type, id]);
    }

    const updates = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
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
      UPDATE addresses 
      SET ${updates.join(', ')} 
      WHERE id = ?
    `, params);

    // Récupérer l'adresse mise à jour
    const updatedAddresses = await query(`
      SELECT * FROM addresses WHERE id = ?
    `, [id]);

    res.json({
      message: 'Adresse mise à jour avec succès',
      address: updatedAddresses[0]
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'adresse:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de mettre à jour l\'adresse'
    });
  }
});

// DELETE /api/users/addresses/:id - Supprimer une adresse
router.delete('/addresses/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Vérifier que l'adresse appartient à l'utilisateur
    const addresses = await query(`
      SELECT * FROM addresses 
      WHERE id = ? AND user_id = ?
    `, [id, userId]);

    if (addresses.length === 0) {
      return res.status(404).json({
        error: 'Adresse non trouvée',
        message: 'Cette adresse n\'existe pas ou ne vous appartient pas'
      });
    }

    await query('DELETE FROM addresses WHERE id = ?', [id]);

    res.json({
      message: 'Adresse supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'adresse:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de supprimer l\'adresse'
    });
  }
});

// GET /api/users/orders - Récupérer les commandes de l'utilisateur
router.get('/orders', authenticateToken, async (req, res) => {
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

    // Construction de la requête avec valeurs directes
    const ordersQuery = `
      SELECT 
        o.*,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT ${parseInt(limit) || 10} OFFSET ${parseInt(offset) || 0}
    `;

    const orders = await query(ordersQuery, params);

    // Comptage total
    const countQuery = `
      SELECT COUNT(*) as total FROM orders o ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const total = countResult[0].total;

    res.json({
      orders: orders.map(order => ({
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

// GET /api/users/reviews - Récupérer les avis de l'utilisateur
router.get('/reviews', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Construction de la requête avec valeurs directes
    const reviewsQuery = `
      SELECT 
        pr.*,
        p.name as product_name,
        p.slug as product_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image
      FROM product_reviews pr
      LEFT JOIN products p ON pr.product_id = p.id
      WHERE pr.user_id = ?
      ORDER BY pr.created_at DESC
      LIMIT ${parseInt(limit) || 10} OFFSET ${parseInt(offset) || 0}
    `;

    const reviews = await query(reviewsQuery, [userId]);

    // Comptage total
    const countQuery = 'SELECT COUNT(*) as total FROM product_reviews WHERE user_id = ?';
    const countResult = await query(countQuery, [userId]);
    const total = countResult[0].total;

    res.json({
      reviews: reviews.map(review => ({
        ...review,
        rating: parseInt(review.rating)
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
    console.error('Erreur lors de la récupération des avis:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les avis'
    });
  }
});

// POST /api/users/reviews - Créer un avis
router.post('/reviews', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, rating, title, content } = req.body;

    if (!product_id || !rating) {
      return res.status(400).json({ error: 'product_id et rating sont requis' });
    }
    const r = parseInt(rating);
    if (isNaN(r) || r < 1 || r > 5) {
      return res.status(400).json({ error: 'rating doit être entre 1 et 5' });
    }

    // Vérifie que le produit existe
    const prodRows = await query('SELECT id FROM products WHERE id = ? LIMIT 1', [product_id]);
    if (prodRows.length === 0) {
      return res.status(404).json({ error: 'Produit introuvable' });
    }

    // Un seul avis par user/produit
    const existing = await query(
      'SELECT id FROM product_reviews WHERE user_id = ? AND product_id = ? LIMIT 1',
      [userId, product_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Vous avez déjà laissé un avis pour ce produit' });
    }

    const result = await query(
      `INSERT INTO product_reviews (product_id, user_id, rating, title, content)
       VALUES (?, ?, ?, ?, ?)`,
      [product_id, userId, r, title || null, content || null]
    );

    const [review] = await query(
      `SELECT pr.*, p.name as product_name, p.slug as product_slug,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image
       FROM product_reviews pr
       LEFT JOIN products p ON pr.product_id = p.id
       WHERE pr.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: 'Avis créé', review });
  } catch (error) {
    console.error('Erreur création avis:', error);
    res.status(500).json({ error: 'Erreur serveur', message: 'Impossible de créer l\'avis' });
  }
});

// PUT /api/users/reviews/:id - Modifier son avis
router.put('/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.id;
    const { rating, title, content } = req.body;

    const rows = await query(
      'SELECT id, user_id FROM product_reviews WHERE id = ? LIMIT 1',
      [reviewId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Avis introuvable' });
    if (rows[0].user_id !== userId) return res.status(403).json({ error: 'Non autorisé' });

    const fields = [];
    const params = [];
    if (rating !== undefined) {
      const r = parseInt(rating);
      if (isNaN(r) || r < 1 || r > 5) return res.status(400).json({ error: 'rating invalide' });
      fields.push('rating = ?'); params.push(r);
    }
    if (title !== undefined)   { fields.push('title = ?');   params.push(title); }
    if (content !== undefined) { fields.push('content = ?'); params.push(content); }

    if (fields.length === 0) return res.status(400).json({ error: 'Aucun champ à modifier' });

    fields.push('updated_at = NOW()');
    params.push(reviewId);

    await query(`UPDATE product_reviews SET ${fields.join(', ')} WHERE id = ?`, params);

    const [review] = await query(
      `SELECT pr.*, p.name as product_name, p.slug as product_slug,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image
       FROM product_reviews pr
       LEFT JOIN products p ON pr.product_id = p.id
       WHERE pr.id = ?`,
      [reviewId]
    );

    res.json({ message: 'Avis mis à jour', review });
  } catch (error) {
    console.error('Erreur modification avis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/users/reviews/:id
router.delete('/reviews/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const reviewId = req.params.id;

    const rows = await query(
      'SELECT id, user_id FROM product_reviews WHERE id = ? LIMIT 1',
      [reviewId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Avis introuvable' });
    if (rows[0].user_id !== userId) return res.status(403).json({ error: 'Non autorisé' });

    await query('DELETE FROM product_reviews WHERE id = ?', [reviewId]);
    res.json({ message: 'Avis supprimé' });
  } catch (error) {
    console.error('Erreur suppression avis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes admin
router.get('/admin/list', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { search, role } = req.query;

    // S'assurer que les valeurs sont des nombres entiers valides
    const validatedLimit = parseInt(limit) || 20;
    const validatedOffset = parseInt(offset) || 0;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role && ['customer', 'admin'].includes(role)) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    // Construction de la requête avec les valeurs directement intégrées pour éviter les erreurs de paramètres
    let usersQuery = `
      SELECT
        id, first_name, last_name, email, phone, role, status, created_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${validatedLimit} OFFSET ${validatedOffset}
    `;

    const users = await query(usersQuery, params);

    const [countRow] = await query(
      `SELECT COUNT(*) AS total FROM users ${whereClause}`,
      params
    );
    const total = countRow.total;

    res.json({
      users,
      pagination: {
        current_page: page,
        per_page: limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs (admin):', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les utilisateurs'
    });
  }
});

// POST /api/users/admin/create - Créer un nouvel utilisateur (admin)
router.post('/admin/create', authenticateToken, requireAdmin, [
  body('first_name').notEmpty().withMessage('Le prénom est requis'),
  body('last_name').notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().withMessage('L\'email doit être valide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('role').isIn(['customer', 'admin']).withMessage('Le rôle doit être customer ou admin'),
  body('status').custom((value, { req }) => {
  // Accepter les chaînes et les nombres
  const validValues = ['active', 'inactive', 0, 1];
  return validValues.includes(value);
}).withMessage('Le statut doit être actif, inactif, 0 ou 1'),
], handleValidationErrors, async (req, res) => {
  try {
    const { first_name, last_name, email, phone, password, role, status, address, city, postal_code, country } = req.body;

    // Vérifier si l'email existe déjà
    const existingUsers = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({
        error: 'Email déjà utilisé',
        message: 'Cet email est déjà associé à un compte'
      });
    }

    // Hasher le mot de passe
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Convertir le statut pour la base de données
    const dbStatus = (status === 'active' || status === 1) ? 1 : 0;

    // Créer l'utilisateur
    const result = await query(`
      INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [first_name, last_name, email, phone, hashedPassword, role, dbStatus]);

    const userId = result.insertId;

    // Ajouter l'adresse si fournie
    if (address || city || postal_code || country) {
      await query(`
        INSERT INTO addresses (user_id, street_address, city, postal_code, country, is_default, first_name, last_name) 
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `, [userId, address || '', city || '', postal_code || '', country || '', first_name, last_name]);
    }

    // Récupérer l'utilisateur créé
    const users = await query(`
      SELECT id, first_name, last_name, email, phone, role, status, created_at
      FROM users WHERE id = ?
    `, [userId]);

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: users[0]
    });

  } catch (error) {
    console.error('Erreur création utilisateur:', error.message);
    if (process.env.NODE_ENV !== 'production') {
      console.error('Stack:', error.stack);
    }
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de créer l\'utilisateur'
    });
  }
});

// PUT /api/users/admin/:id - Modifier un utilisateur (admin)
router.put('/admin/:id', authenticateToken, requireAdmin, [
  body('first_name').optional().notEmpty().withMessage('Le prénom ne peut pas être vide'),
  body('last_name').optional().notEmpty().withMessage('Le nom ne peut pas être vide'),
  body('email').optional().isEmail().withMessage('L\'email doit être valide'),
  body('role').optional().isIn(['customer', 'admin']).withMessage('Le rôle doit être customer ou admin'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Le statut doit être actif ou inactif')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'ID invalide', message: 'ID utilisateur invalide' });
    }
    const { first_name, last_name, email, phone, role, status, password, address, city, postal_code, country } = req.body;

    // Vérifier si l'utilisateur existe
    const existingUsers = await query('SELECT id, email, role FROM users WHERE id = ?', [userId]);
    if (existingUsers.length === 0) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé',
        message: 'Cet utilisateur n\'existe pas'
      });
    }

    const target = existingUsers[0];

    // Empêcher un admin de se rétrograder lui-même
    if (role && role !== 'admin' && userId === req.user.id) {
      return res.status(403).json({
        error: 'Opération interdite',
        message: 'Vous ne pouvez pas modifier votre propre rôle administrateur'
      });
    }

    // Empêcher de rétrograder le dernier admin
    if (role && role !== 'admin' && target.role === 'admin') {
      const [{ cnt }] = await query("SELECT COUNT(*) AS cnt FROM users WHERE role = 'admin'");
      if (cnt <= 1) {
        return res.status(403).json({
          error: 'Opération interdite',
          message: 'Impossible de rétrograder le dernier administrateur'
        });
      }
    }

    // Empêcher de désactiver son propre compte
    if (status === 'inactive' && userId === req.user.id) {
      return res.status(403).json({
        error: 'Opération interdite',
        message: 'Vous ne pouvez pas désactiver votre propre compte'
      });
    }

    // Si l'email est modifié, vérifier qu'il n'est pas déjà utilisé
    if (email && email !== target.email) {
      const emailCheck = await query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (emailCheck.length > 0) {
        return res.status(400).json({
          error: 'Email déjà utilisé',
          message: 'Cet email est déjà associé à un autre compte'
        });
      }
    }

    // Construire la requête de mise à jour
    const updates = [];
    const params = [];

    if (first_name !== undefined) {
      updates.push('first_name = ?');
      params.push(first_name);
    }

    if (last_name !== undefined) {
      updates.push('last_name = ?');
      params.push(last_name);
    }

    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }

    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }

    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }

    if (status !== undefined) {
      const dbStatus = status === 'active' ? 1 : 0;
      updates.push('status = ?');
      params.push(dbStatus);
    }

    if (password && password.trim() !== '') {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      params.push(hashedPassword);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(userId);

      await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Mettre à jour l'adresse si fournie
    if (address !== undefined || city !== undefined || postal_code !== undefined || country !== undefined) {
      // Vérifier si une adresse existe
      const existingAddress = await query('SELECT id FROM addresses WHERE user_id = ? AND is_default = 1', [userId]);
      
      if (existingAddress.length > 0) {
        // Mettre à jour l'adresse existante
        await query(`
          UPDATE addresses SET 
            street_address = COALESCE(?, street_address), 
            city = COALESCE(?, city), 
            postal_code = COALESCE(?, postal_code), 
            country = COALESCE(?, country)
          WHERE user_id = ? AND is_default = 1
        `, [address, city, postal_code, country, userId]);
      } else {
        // Créer une nouvelle adresse
        await query(`
          INSERT INTO addresses (user_id, street_address, city, postal_code, country, is_default, first_name, last_name) 
          VALUES (?, ?, ?, ?, ?, 1, ?, ?)
        `, [userId, address || '', city || '', postal_code || '', country || '', first_name, last_name]);
      }
    }

    // Récupérer l'utilisateur mis à jour
    const users = await query(`
      SELECT id, first_name, last_name, email, phone, role, status, created_at, updated_at
      FROM users WHERE id = ?
    `, [userId]);

    res.json({
      message: 'Utilisateur mis à jour avec succès',
      user: users[0]
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de mettre à jour l\'utilisateur'
    });
  }
});

// DELETE /api/users/admin/:id - Supprimer un utilisateur (admin)
router.delete('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'ID invalide', message: 'ID utilisateur invalide' });
    }

    // Vérifier si l'utilisateur existe
    const existingUsers = await query('SELECT id, role FROM users WHERE id = ?', [userId]);
    if (existingUsers.length === 0) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé',
        message: 'Cet utilisateur n\'existe pas'
      });
    }

    const target = existingUsers[0];

    // Empêcher l'auto-suppression
    if (userId === req.user.id) {
      return res.status(403).json({
        error: 'Opération interdite',
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    // Empêcher la suppression de l'utilisateur admin principal
    if (userId === 1) {
      return res.status(403).json({
        error: 'Suppression non autorisée',
        message: 'Impossible de supprimer le compte administrateur principal'
      });
    }

    // Empêcher la suppression d'un autre admin (seul le super-admin id=1 peut supprimer un admin)
    if (target.role === 'admin' && req.user.id !== 1) {
      return res.status(403).json({
        error: 'Opération interdite',
        message: 'Seul l\'administrateur principal peut supprimer un autre administrateur'
      });
    }

    // Protection dernier admin
    if (target.role === 'admin') {
      const [{ cnt }] = await query("SELECT COUNT(*) AS cnt FROM users WHERE role = 'admin'");
      if (cnt <= 1) {
        return res.status(403).json({
          error: 'Opération interdite',
          message: 'Impossible de supprimer le dernier administrateur'
        });
      }
    }

    // Anonymiser les commandes au lieu de les supprimer (garder historique)
    await query('UPDATE orders SET user_id = NULL WHERE user_id = ?', [userId]);
    await query('DELETE FROM addresses WHERE user_id = ?', [userId]);
    await query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de supprimer l\'utilisateur'
    });
  }
});

// GET /api/users/admin/stats - Statistiques des utilisateurs (admin)
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Statistiques générales
    const totalUsers = await query('SELECT COUNT(*) as total FROM users');
    const activeUsers = await query('SELECT COUNT(*) as total FROM users WHERE status = ?', [1]);
    const adminUsers = await query('SELECT COUNT(*) as total FROM users WHERE role = ?', ['admin']);
    const inactiveUsers = await query('SELECT COUNT(*) as total FROM users WHERE status = ?', [0]);

    // Utilisateurs récents
    const recentUsers = await query(`
      SELECT id, first_name, last_name, email, created_at
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    res.json({
      stats: {
        total: totalUsers[0].total,
        active: activeUsers[0].total,
        admin: adminUsers[0].total,
        inactive: inactiveUsers[0].total
      },
      recentUsers: recentUsers
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les statistiques'
    });
  }
});

// Middleware: endpoints réservés au développement uniquement
const devOnly = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Non trouvé', message: 'Endpoint non disponible' });
  }
  next();
};

// GET /api/users/admin/temp-token - Obtenir un token admin temporaire (développement uniquement)
router.get('/admin/temp-token', devOnly, async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');

    // Générer un token admin FRAIS (valide 7 jours)
    // Trouver un admin réel en base
    const admins = await query("SELECT id, email, role FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
    if (admins.length === 0) {
      return res.status(404).json({ error: 'Aucun admin', message: 'Aucun compte administrateur en base' });
    }
    const payload = {
      userId: admins[0].id,
      email: admins[0].email,
      role: admins[0].role
    };
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const adminToken = jwt.sign(payload, secret, { expiresIn: '7d' });

    res.json({
      message: 'Token admin temporaire pour développement',
      token: adminToken,
      user: payload,
      warning: 'Ce endpoint ne doit être utilisé qu\'en développement'
    });
  } catch (error) {
    console.error('Erreur lors de la génération du token temporaire:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de générer le token temporaire'
    });
  }
});

// GET /api/users/admin/dev-bypass - Endpoint de contournement pour développement (sans auth)
router.get('/admin/dev-bypass', devOnly, async (req, res) => {
  try {
    const users = await query(`
      SELECT id, first_name, last_name, email, phone, role, status, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 20
    `);
    res.json({
      users,
      pagination: {
        current_page: 1,
        per_page: 20,
        total: users.length,
        total_pages: 1,
        has_next: false,
        has_prev: false
      },
      warning: 'Mode développement - Données réelles sans authentification'
    });
  } catch (error) {
    console.error('Erreur dans le bypass de développement:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de charger les données de développement'
    });
  }
});

module.exports = router;
