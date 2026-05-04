import axios from 'axios';
import emailService from './emailService';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

const normalizeUser = (u = {}) => ({
  id: u.id,
  firstName: u.first_name || u.firstName || '',
  lastName: u.last_name || u.lastName || '',
  email: u.email || '',
  phone: u.phone || '',
  address: u.address || '',
  role: u.role || 'customer',
  createdAt: u.created_at || u.createdAt || new Date().toISOString()
});

const authService = {
  // Inscription d'un nouvel utilisateur (appel API réel)
  register: async (userData) => {
    try {
      const payload = {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        password: userData.password,
        phone: userData.phone || undefined
      };

      const { data } = await axios.post(`${API}/auth/register`, payload);
      const user = normalizeUser(data.user);
      const token = data.token;

      localStorage.setItem('userToken', token);
      localStorage.setItem('userInfo', JSON.stringify(user));

      // Email de bienvenue (non bloquant)
      try {
        await emailService.sendWelcomeEmail(user.email, `${user.firstName} ${user.lastName}`);
      } catch (e) { console.warn('Welcome email failed:', e); }

      return { success: true, message: 'Compte créé avec succès', user, token };
    } catch (error) {
      // Afficher le premier message de validation serveur si disponible
      const details = error.response?.data?.details;
      const msg = (details && details.length > 0)
        ? details[0].msg
        : (error.response?.data?.message || error.response?.data?.error || 'Erreur lors de la création du compte');
      const err = new Error(msg);
      err.success = false;
      throw err;
    }
  },

  // Connexion (appel API réel)
  login: async (credentials) => {
    try {
      const { data } = await axios.post(`${API}/auth/login`, {
        email: credentials.email,
        password: credentials.password
      });
      const user = normalizeUser(data.user);
      const token = data.token;

      localStorage.setItem('userToken', token);
      localStorage.setItem('userInfo', JSON.stringify(user));

      return { success: true, message: 'Connexion réussie', user, token };
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      const msg = error.response?.data?.message || error.response?.data?.error || 'Email ou mot de passe incorrect';
      const err = new Error(msg);
      err.success = false;
      err.code = 'Login failed';
      throw err;
    }
  },

  // Déconnexion
  logout: async () => {
    try {
      console.log('=== LOGOUT USER ===');
      
      // Appeler l'API de déconnexion si disponible
      // await axios.post(`${API_BASE_URL}/auth/logout`, {}, getAuthConfig());
      
      // Nettoyer le stockage local
      localStorage.removeItem('userToken');
      localStorage.removeItem('userInfo');
      
      console.log('=== LOGOUT SUCCESS ===');
      
      return { success: true, message: 'Déconnexion réussie' };
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, nettoyer le stockage local
      localStorage.removeItem('userToken');
      localStorage.removeItem('userInfo');
      throw error.response?.data || { 
        success: false, 
        message: 'Erreur lors de la déconnexion',
        error: 'Logout failed'
      };
    }
  },

  // Obtenir les informations de l'utilisateur connecté
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        throw new Error('Aucun token trouvé');
      }
      
      console.log('=== GET CURRENT USER ===');
      
      // Simulation de récupération des infos utilisateur
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        console.log('Current user:', user);
        return { success: true, user };
      } else {
        throw new Error('Informations utilisateur non trouvées');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des infos utilisateur:', error);
      // Nettoyer les données invalides
      localStorage.removeItem('userToken');
      localStorage.removeItem('userInfo');
      throw error.response?.data || { 
        success: false, 
        message: 'Utilisateur non trouvé',
        error: 'User not found'
      };
    }
  },

  // Mettre à jour le profil utilisateur
  updateProfile: async (userData) => {
    try {
      console.log('=== UPDATE PROFILE ===');
      console.log('User data:', JSON.stringify(userData, null, 2));
      
      // Simulation de mise à jour
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mettre à jour les infos dans localStorage
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const updatedUser = { ...userInfo, ...userData };
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      
      console.log('=== UPDATE RESPONSE ===');
      console.log('Updated user:', updatedUser);
      
      return {
        success: true,
        message: 'Profil mis à jour avec succès',
        user: updatedUser
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error.response?.data || { 
        success: false, 
        message: 'Erreur lors de la mise à jour',
        error: 'Update failed'
      };
    }
  },

  // Changer le mot de passe
  changePassword: async (passwordData) => {
    try {
      console.log('=== CHANGE PASSWORD ===');
      
      // Simulation de changement de mot de passe
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('=== PASSWORD CHANGED ===');
      
      return {
        success: true,
        message: 'Mot de passe changé avec succès'
      };
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      throw error.response?.data || { 
        success: false, 
        message: 'Erreur lors du changement de mot de passe',
        error: 'Password change failed'
      };
    }
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    const token = localStorage.getItem('userToken');
    const userInfo = localStorage.getItem('userInfo');
    return !!(token && userInfo);
  },

  // Obtenir le token
  getToken: () => {
    return localStorage.getItem('userToken');
  },

  // Obtenir les infos utilisateur
  getUserInfo: () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  },

  // Demande de réinitialisation (API réelle)
  forgotPassword: async (email) => {
    try {
      const { data } = await axios.post(`${API}/auth/forgot-password`, { email });
      return {
        success: true,
        message: data.message || 'Si cet email existe, un lien a été envoyé.',
        // Présent uniquement en dev si email non configuré
        devResetLink: data.devResetLink || null
      };
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || 'Erreur lors de l\'envoi du lien';
      const err = new Error(msg);
      err.success = false;
      throw err;
    }
  },

  // Réinitialiser le mot de passe (API réelle)
  resetPassword: async (token, newPassword) => {
    try {
      const { data } = await axios.post(`${API}/auth/reset-password`, {
        token,
        password: newPassword
      });
      try { localStorage.removeItem('passwordReset'); } catch {}
      return { success: true, message: data.message || 'Mot de passe réinitialisé avec succès' };
    } catch (error) {
      console.error('Erreur resetPassword:', error);
      const msg = error.response?.data?.error || error.response?.data?.message || 'Token invalide ou expiré';
      const err = new Error(msg);
      err.success = false;
      throw err;
    }
  }
};

export default authService;
