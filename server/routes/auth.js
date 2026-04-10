const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

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

// POST /api/auth/register - Inscription
router.post('/register', [
  body('first_name').trim().isLength({ min: 2, max: 100 }).withMessage('Le prénom doit contenir entre 2 et 100 caractères'),
  body('last_name').trim().isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères'),
  body('phone').optional().isMobilePhone('any').withMessage('Numéro de téléphone invalide')
], handleValidationErrors, async (req, res) => {
  try {
    const { first_name, last_name, email, password, phone } = req.body;

    // Vérifier si l'email existe déjà
    const existingUsers = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({
        error: 'Email déjà utilisé',
        message: 'Un compte avec cet email existe déjà'
      });
    }

    // Hasher le mot de passe
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insérer le nouvel utilisateur
    const result = await query(
      `INSERT INTO users (first_name, last_name, email, password_hash, phone, role) 
       VALUES (?, ?, ?, ?, ?, 'customer')`,
      [first_name, last_name, email, passwordHash, phone]
    );

    // Créer le token JWT
    const token = jwt.sign(
      { userId: result.insertId, email, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Récupérer les informations de l'utilisateur créé
    const users = await query(
      'SELECT id, first_name, last_name, email, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    const user = users[0];

    res.status(201).json({
      message: 'Inscription réussie',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      },
      token
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de créer le compte'
    });
  }
});

// POST /api/auth/login - Connexion
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Le mot de passe est requis')
], handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Récupérer l'utilisateur
    const users = await query(
      'SELECT id, first_name, last_name, email, password_hash, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Identifiants invalides',
        message: 'Email ou mot de passe incorrect'
      });
    }

    const user = users[0];

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Identifiants invalides',
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Créer le token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Mettre à jour la date de dernière connexion
    await query(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    res.json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de se connecter'
    });
  }
});

// GET /api/auth/me - Récupérer les informations de l'utilisateur connecté
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer les informations complètes de l'utilisateur
    const users = await query(
      `SELECT id, first_name, last_name, email, phone, role, created_at, updated_at 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé',
        message: 'Cet utilisateur n\'existe pas'
      });
    }

    const user = users[0];

    // Récupérer les adresses de l'utilisateur
    const addresses = await query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [userId]
    );

    // Récupérer les statistiques de l'utilisateur
    const stats = await query(
      `SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_order_date
       FROM orders o 
       WHERE o.user_id = ?`,
      [userId]
    );

    res.json({
      user: {
        ...user,
        addresses: addresses,
        stats: {
          total_orders: stats[0].total_orders || 0,
          total_spent: parseFloat(stats[0].total_spent) || 0,
          last_order_date: stats[0].last_order_date
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les informations du profil'
    });
  }
});

// PUT /api/auth/profile - Mettre à jour le profil
router.put('/profile', authenticateToken, [
  body('first_name').optional().trim().isLength({ min: 2, max: 100 }),
  body('last_name').optional().trim().isLength({ min: 2, max: 100 }),
  body('phone').optional().isMobilePhone('any'),
  body('current_password').optional().isLength({ min: 8 }),
  body('new_password').optional().isLength({ min: 8 })
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, phone, current_password, new_password } = req.body;

    // Vérifier le mot de passe actuel si changement de mot de passe
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({
          error: 'Mot de passe actuel requis',
          message: 'Le mot de passe actuel est requis pour en définir un nouveau'
        });
      }

      const users = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
      const isValidPassword = await bcrypt.compare(current_password, users[0].password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Mot de passe incorrect',
          message: 'Le mot de passe actuel est incorrect'
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

    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }

    if (new_password) {
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(new_password, saltRounds);
      updates.push('password_hash = ?');
      params.push(passwordHash);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Aucune modification',
        message: 'Aucune donnée à mettre à jour'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);

    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Récupérer les informations mises à jour
    const users = await query(
      'SELECT id, first_name, last_name, email, phone, role, updated_at FROM users WHERE id = ?',
      [userId]
    );

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

// POST /api/auth/logout - Déconnexion
router.post('/logout', authenticateToken, (req, res) => {
  // Dans une implémentation plus avancée, on pourrait ajouter le token à une liste noire
  // Pour l'instant, on retourne simplement un message de succès
  res.json({
    message: 'Déconnexion réussie'
  });
});

// POST /api/auth/refresh - Rafraîchir le token
router.post('/refresh', authenticateToken, (req, res) => {
  try {
    const user = req.user;

    // Créer un nouveau token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Token rafraîchi avec succès',
      token
    });

  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de rafraîchir le token'
    });
  }
});

module.exports = router;
