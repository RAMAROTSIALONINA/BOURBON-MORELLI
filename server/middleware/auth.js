const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware d'authentification
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Accès non autorisé',
        message: 'Token manquant'
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupérer les informations de l'utilisateur depuis la base de données
    const users = await query(
      'SELECT id, first_name, last_name, email, role FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Accès non autorisé',
        message: 'Utilisateur non trouvé'
      });
    }

    req.user = users[0];
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Accès non autorisé',
        message: 'Token invalide'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Accès non autorisé',
        message: 'Token expiré'
      });
    }

    console.error('Erreur d\'authentification:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Erreur lors de l\'authentification'
    });
  }
};

// Middleware pour vérifier si l'utilisateur est admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Accès interdit',
      message: 'Droits administratifs requis'
    });
  }
  next();
};

// Middleware optionnel (ne bloque pas si pas de token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const users = await query(
        'SELECT id, first_name, last_name, email, role FROM users WHERE id = ?',
        [decoded.userId]
      );

      if (users.length > 0) {
        req.user = users[0];
      }
    }

    next();
  } catch (error) {
    // Ignorer les erreurs pour l'auth optionnelle
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth
};
