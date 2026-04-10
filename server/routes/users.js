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
      LIMIT ? OFFSET ?
    `;

    const reviews = await query(reviewsQuery, [userId, parseInt(limit), parseInt(offset)]);

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

// Routes admin
router.get('/admin/list', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (search) {
      whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    // Test simple sans transformation
    const usersQuery = `
      SELECT 
        id, first_name, last_name, email, phone, role, status, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const users = await query(usersQuery);
    console.log('USERS BRUTS:', users);

    res.json({
      users: users,
      pagination: {
        current_page: 1,
        per_page: 5,
        total: users.length,
        total_pages: 1,
        has_next: false,
        has_prev: false
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
  body('role').isIn(['client', 'admin']).withMessage('Le rôle doit être client ou admin'),
  body('status').isIn(['active', 'inactive']).withMessage('Le statut doit être actif ou inactif')
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

    // Créer l'utilisateur
    const result = await query(`
      INSERT INTO users (first_name, last_name, email, phone, password, role, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [first_name, last_name, email, phone, hashedPassword, role, status]);

    const userId = result.insertId;

    // Ajouter l'adresse si fournie
    if (address || city || postal_code || country) {
      await query(`
        INSERT INTO addresses (user_id, address, city, postal_code, country, is_default) 
        VALUES (?, ?, ?, ?, ?, 1)
      `, [userId, address || '', city || '', postal_code || '', country || '']);
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
    console.error('Erreur lors de la création de l\'utilisateur:', error);
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
  body('role').optional().isIn(['client', 'admin']).withMessage('Le rôle doit être client ou admin'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Le statut doit être actif ou inactif')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.params.id;
    const { first_name, last_name, email, phone, role, status, password, address, city, postal_code, country } = req.body;

    // Vérifier si l'utilisateur existe
    const existingUsers = await query('SELECT id, email FROM users WHERE id = ?', [userId]);
    if (existingUsers.length === 0) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé',
        message: 'Cet utilisateur n\'existe pas'
      });
    }

    // Si l'email est modifié, vérifier qu'il n'est pas déjà utilisé
    if (email && email !== existingUsers[0].email) {
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
      updates.push('status = ?');
      params.push(status);
    }

    if (password && password.trim() !== '') {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
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
            address = COALESCE(?, address), 
            city = COALESCE(?, city), 
            postal_code = COALESCE(?, postal_code), 
            country = COALESCE(?, country)
          WHERE user_id = ? AND is_default = 1
        `, [address, city, postal_code, country, userId]);
      } else {
        // Créer une nouvelle adresse
        await query(`
          INSERT INTO addresses (user_id, address, city, postal_code, country, is_default) 
          VALUES (?, ?, ?, ?, ?, 1)
        `, [userId, address || '', city || '', postal_code || '', country || '']);
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
    const userId = req.params.id;

    // Vérifier si l'utilisateur existe
    const existingUsers = await query('SELECT id, role FROM users WHERE id = ?', [userId]);
    if (existingUsers.length === 0) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé',
        message: 'Cet utilisateur n\'existe pas'
      });
    }

    // Empêcher la suppression de l'utilisateur admin principal
    if (userId == 1) {
      return res.status(403).json({
        error: 'Suppression non autorisée',
        message: 'Impossible de supprimer le compte administrateur principal'
      });
    }

    // Supprimer l'utilisateur et ses données associées
    await query('DELETE FROM addresses WHERE user_id = ?', [userId]);
    await query('DELETE FROM orders WHERE user_id = ?', [userId]);
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

// GET /api/users/admin/temp-token - Obtenir un token admin temporaire (développement uniquement)
router.get('/admin/temp-token', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    
    // Token admin pré-généré
    const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBib3VyYm9ubW9yZWxsaS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzU4MjI4ODQsImV4cCI6MTc3NjQyNzY4NH0.HcVFO8j36P8Q1Shpv6ohF0Gttl8eIwOTYpAWMgFgXl8';
    
    // Vérifier et décoder le token
    const decoded = jwt.verify(adminToken, 'bourbon_morelli_jwt_secret_key_2024_very_long_and_secure');
    
    res.json({
      message: 'Token admin temporaire pour développement',
      token: adminToken,
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      },
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
router.get('/admin/dev-bypass', async (req, res) => {
  try {
    console.log('Endpoint de contournement utilisé - Mode développement');
    
    // Données mockées pour développement
    const mockUsers = [
      {
        id: 1,
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@bourbonmorelli.com',
        phone: '+33 6 12 34 56 78',
        role: 'admin',
        status: 'active',
        order_count: 0,
        total_spent: 0,
        created_at: '2024-01-01'
      },
      {
        id: 2,
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@email.com',
        phone: '+33 6 12 34 56 78',
        role: 'client',
        status: 'active',
        order_count: 5,
        total_spent: 1234.50,
        created_at: '2024-01-15'
      },
      {
        id: 3,
        first_name: 'Marie',
        last_name: 'Martin',
        email: 'marie.martin@email.com',
        phone: '+33 6 23 45 67 89',
        role: 'client',
        status: 'active',
        order_count: 3,
        total_spent: 567.89,
        created_at: '2024-02-20'
      }
    ];

    res.json({
      users: mockUsers,
      pagination: {
        current_page: 1,
        per_page: 10,
        total: mockUsers.length,
        total_pages: 1,
        has_next: false,
        has_prev: false
      },
      warning: 'Mode développement - Données mockées'
    });
  } catch (error) {
    console.error('Erreur dans le bypass de développement:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de charger les données de développement'
    });
  }
});

// GET /api/users/admin/dev-stats - Statistiques de développement (sans auth)
router.get('/admin/dev-stats', async (req, res) => {
  try {
    console.log('Stats de développement utilisées - Mode développement');
    
    const mockStats = {
      total: 3,
      active: 3,
      admin: 1,
      inactive: 0
    };

    res.json({
      stats: mockStats,
      warning: 'Mode développement - Données mockées'
    });
  } catch (error) {
    console.error('Erreur dans les stats de développement:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de charger les statistiques de développement'
    });
  }
});

module.exports = router;
