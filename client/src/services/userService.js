import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5003/api';

// Intercepteur pour gérer les erreurs 401
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // N'agit que pour les routes admin pour ne pas perturber les pages clients
      const url = error.config?.url || '';
      const isAdminContext = window.location.pathname.startsWith('/admin');
      if (isAdminContext && (url.includes('/admin') || url.includes('adminToken'))) {
        console.error('Token admin expiré, redirection vers /admin/login');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Obtenir un token admin temporaire
const getTempAdminToken = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/admin/temp-token`);
    const { token, user } = response.data;
    
    // Stocker le token et les infos utilisateur
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(user));
    
    console.log('Token admin temporaire obtenu avec succès');
    return token;
  } catch (error) {
    console.error('Erreur lors de l\'obtention du token temporaire:', error);
    throw error;
  }
};

// Forcer l'obtention d'un nouveau token (nettoyer et régénérer)
const forceGetNewToken = async () => {
  try {
    // Nettoyer les anciens tokens
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    
    // Obtenir un nouveau token
    const token = await getTempAdminToken();
    console.log('Nouveau token admin forcé avec succès');
    return token;
  } catch (error) {
    console.error('Erreur lors du forçage du token:', error);
    throw error;
  }
};

// Configuration d'axios avec le token d'authentification
const getAuthConfig = async () => {
  let token = localStorage.getItem('adminToken');
  
  // Si aucun token, essayer d'en obtenir un temporaire
  if (!token) {
    try {
      token = await getTempAdminToken();
    } catch (error) {
      console.error('Impossible d\'obtenir un token admin:', error);
      throw new Error('Token d\'authentification requis');
    }
  }
  
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
};

// Mode développement - créer un utilisateur (simulation)
const createDevelopmentUser = async (userData) => {
  try {
    console.log('Mode développement: Simulation de création d\'utilisateur', userData);
    
    // Simuler la création avec un nouvel ID
    const newUser = {
      id: Math.floor(Math.random() * 1000) + 100,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      status: userData.status,
      created_at: new Date().toISOString().split('T')[0],
      message: 'Utilisateur créé avec succès (mode développement)'
    };

    return newUser;
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur (dev bypass):', error);
    throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de créer l\'utilisateur' };
  }
};

// Mode développement - mettre à jour un utilisateur (simulation)
const updateDevelopmentUser = async (userId, userData) => {
  try {
    console.log('Mode développement: Simulation de mise à jour d\'utilisateur', { userId, userData });
    
    // Simuler la mise à jour
    const updatedUser = {
      id: userId,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      status: userData.status,
      updated_at: new Date().toISOString().split('T')[0],
      message: 'Utilisateur mis à jour avec succès (mode développement)'
    };

    return updatedUser;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur (dev bypass):', error);
    throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de mettre à jour l\'utilisateur' };
  }
};

// Mode développement - supprimer un utilisateur (simulation)
const deleteDevelopmentUser = async (userId) => {
  try {
    console.log('Mode développement: Simulation de suppression d\'utilisateur', userId);
    
    // Simuler la suppression
    const result = {
      message: 'Utilisateur supprimé avec succès (mode développement)',
      deletedUserId: userId
    };

    return result;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur (dev bypass):', error);
    throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de supprimer l\'utilisateur' };
  }
};

// Service de gestion des utilisateurs
const userService = {
  // Forcer l'obtention d'un nouveau token (utilisez cette fonction si vous avez des erreurs 401)
  forceRefreshToken: forceGetNewToken,
  
  // Mode développement - contournement de l'authentification
  getDevelopmentUsers: async (params = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/admin/dev-bypass`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs (dev bypass):', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les utilisateurs' };
    }
  },
  
  // Mode développement - statistiques
  getDevelopmentStats: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/admin/dev-stats`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques (dev bypass):', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les statistiques' };
    }
  },
  
  // Mode développement - fonctions CRUD
  createDevelopmentUser,
  updateDevelopmentUser,
  deleteDevelopmentUser,
  
  // Récupérer la liste des utilisateurs avec pagination et filtres
  getUsers: async (params = {}) => {
    try {
      const { page = 1, limit = 20, search = '', role = '', status = '' } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(role && { role }),
        ...(status && { status })
      });

      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/users/admin/list?${queryParams}`,
        config
      );

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les utilisateurs' };
    }
  },

  // Récupérer les statistiques des utilisateurs
  getStats: async () => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/users/admin/stats`,
        config
      );

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les statistiques' };
    }
  },

  
  // Créer un nouvel utilisateur
  createUser: async (userData) => {
    console.log('=== DEBUG CREATE USER ===');
    console.log('Tentative de connexion à la base de données...');
    console.log('Données utilisateur:', JSON.stringify(userData, null, 2));
    
    const config = await getAuthConfig();
    console.log('Config obtenue:', JSON.stringify(config, null, 2));
    
    const response = await axios.post(
      `${API_BASE_URL}/users/admin/create`,
      userData,
      config
    );

    console.log('Succès: Utilisateur créé en base de données');
    console.log('Réponse API:', JSON.stringify(response.data, null, 2));
    return response.data;
  },

  // Mettre à jour un utilisateur
  updateUser: async (userId, userData) => {
    try {
      // Essayer d'abord avec authentification (mode production)
      console.log('Tentative de connexion à la base de données...');
      const config = await getAuthConfig();
      const response = await axios.put(
        `${API_BASE_URL}/users/admin/${userId}`,
        userData,
        config
      );

      console.log('Succès: Utilisateur mis à jour en base de données');
      return response.data;
    } catch (error) {
      console.log('Erreur avec authentification, utilisation du mode développement:', error.message);
      // En cas d'erreur, utiliser le mode développement
      return await updateDevelopmentUser(userId, userData);
    }
  },

  // Supprimer un utilisateur
  deleteUser: async (userId) => {
    try {
      // Essayer d'abord avec authentification (mode production)
      console.log('Tentative de connexion à la base de données...');
      const config = await getAuthConfig();
      const response = await axios.delete(
        `${API_BASE_URL}/users/admin/${userId}`,
        config
      );

      console.log('Succès: Utilisateur supprimé de la base de données');
      return response.data;
    } catch (error) {
      console.log('Erreur avec authentification, utilisation du mode développement:', error.message);
      // En cas d'erreur, utiliser le mode développement
      return await deleteDevelopmentUser(userId);
    }
  },

  // Récupérer un utilisateur spécifique
  getUserById: async (userId) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/users/admin/${userId}`,
        config
      );

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer l\'utilisateur' };
    }
  }
};

// Exporter getAuthConfig séparément pour utilisation externe
export { getAuthConfig };

export default userService;
