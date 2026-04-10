const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'bourbon-morelli-secret-key-2024';

class AuthService {
  // Inscription d'un nouvel utilisateur
  async register(userData) {
    const { first_name, last_name, email, password, phone } = userData;

    try {
      // Vérifier si l'email existe déjà
      const [existingUser] = await db.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUser.length > 0) {
        throw new Error('Cet email est déjà utilisé');
      }

      // Hasher le mot de passe
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Insérer le nouvel utilisateur
      const [result] = await db.execute(
        `INSERT INTO users (first_name, last_name, email, password_hash, phone, role) 
         VALUES (?, ?, ?, ?, ?, 'customer')`,
        [first_name, last_name, email, password_hash, phone]
      );

      // Récupérer l'utilisateur créé
      const [newUser] = await db.execute(
        'SELECT id, first_name, last_name, email, phone, role, created_at FROM users WHERE id = ?',
        [result.insertId]
      );

      return {
        success: true,
        user: newUser[0],
        message: 'Compte créé avec succès'
      };

    } catch (error) {
      throw new Error(error.message || 'Erreur lors de l\'inscription');
    }
  }

  // Connexion d'un utilisateur
  async login(email, password) {
    try {
      // Rechercher l'utilisateur par email
      const [users] = await db.execute(
        'SELECT id, first_name, last_name, email, password_hash, phone, role FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        throw new Error('Email ou mot de passe incorrect');
      }

      const user = users[0];

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        throw new Error('Email ou mot de passe incorrect');
      }

      // Générer le token JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Supprimer le mot de passe hashé de la réponse
      delete user.password_hash;

      return {
        success: true,
        user,
        token,
        message: 'Connexion réussie'
      };

    } catch (error) {
      throw new Error(error.message || 'Erreur lors de la connexion');
    }
  }

  // Vérification du token JWT
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Récupérer les informations fraîches de l'utilisateur
      const [users] = await db.execute(
        'SELECT id, first_name, last_name, email, phone, role FROM users WHERE id = ?',
        [decoded.userId]
      );

      if (users.length === 0) {
        throw new Error('Utilisateur non trouvé');
      }

      return {
        success: true,
        user: users[0]
      };

    } catch (error) {
      throw new Error('Token invalide ou expiré');
    }
  }

  // Mise à jour du profil utilisateur
  async updateProfile(userId, updateData) {
    try {
      const { first_name, last_name, phone } = updateData;
      
      const [result] = await db.execute(
        'UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?',
        [first_name, last_name, phone, userId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Utilisateur non trouvé');
      }

      // Récupérer les données mises à jour
      const [updatedUser] = await db.execute(
        'SELECT id, first_name, last_name, email, phone, role FROM users WHERE id = ?',
        [userId]
      );

      return {
        success: true,
        user: updatedUser[0],
        message: 'Profil mis à jour avec succès'
      };

    } catch (error) {
      throw new Error(error.message || 'Erreur lors de la mise à jour du profil');
    }
  }

  // Changement de mot de passe
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Récupérer le mot de passe actuel
      const [users] = await db.execute(
        'SELECT password_hash FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier le mot de passe actuel
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password_hash);

      if (!isCurrentPasswordValid) {
        throw new Error('Mot de passe actuel incorrect');
      }

      // Hasher le nouveau mot de passe
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Mettre à jour le mot de passe
      await db.execute(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [newPasswordHash, userId]
      );

      return {
        success: true,
        message: 'Mot de passe changé avec succès'
      };

    } catch (error) {
      throw new Error(error.message || 'Erreur lors du changement de mot de passe');
    }
  }

  // Vérification si l'utilisateur est admin
  async isAdmin(userId) {
    try {
      const [users] = await db.execute(
        'SELECT role FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return false;
      }

      return users[0].role === 'admin';

    } catch (error) {
      return false;
    }
  }
}

module.exports = new AuthService();
