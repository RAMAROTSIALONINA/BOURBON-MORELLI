import axios from 'axios';

const API_BASE_URL = 'http://localhost:5003/api';

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

// Obtenir un token admin temporaire pour le développement
const getTempAdminToken = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/admin/temp-token`);
    return response.data.token;
  } catch (error) {
    console.error('Erreur lors de l\'obtention du token temporaire:', error);
    throw error;
  }
};

const notificationService = {
  // Récupérer toutes les notifications
  getAllNotifications: async () => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/notifications`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les notifications' };
    }
  },

  // Récupérer une notification par son ID
  getNotificationById: async (notificationId) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/notifications/${notificationId}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la notification:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer la notification' };
    }
  },

  // Créer une nouvelle notification
  createNotification: async (notificationData) => {
    try {
      console.log('=== CREATE NOTIFICATION ===');
      console.log('Notification data:', JSON.stringify(notificationData, null, 2));
      
      const config = await getAuthConfig();
      const response = await axios.post(
        `${API_BASE_URL}/notifications`,
        notificationData,
        config
      );
      
      console.log('=== RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de créer la notification' };
    }
  },

  // Mettre à jour une notification
  updateNotification: async (notificationId, notificationData) => {
    try {
      console.log('=== UPDATE NOTIFICATION ===');
      console.log('Notification ID:', notificationId);
      console.log('Notification data:', JSON.stringify(notificationData, null, 2));
      
      const config = await getAuthConfig();
      const response = await axios.put(
        `${API_BASE_URL}/notifications/${notificationId}`,
        notificationData,
        config
      );
      
      console.log('=== RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la notification:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de mettre à jour la notification' };
    }
  },

  // Supprimer une notification
  deleteNotification: async (notificationId) => {
    try {
      console.log('=== DELETE NOTIFICATION ===');
      console.log('Notification ID:', notificationId);
      
      const config = await getAuthConfig();
      const response = await axios.delete(
        `${API_BASE_URL}/notifications/${notificationId}`,
        config
      );
      
      console.log('=== RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de supprimer la notification' };
    }
  },

  // Envoyer une notification
  sendNotification: async (notificationId) => {
    try {
      console.log('=== SEND NOTIFICATION ===');
      console.log('Notification ID:', notificationId);
      
      const config = await getAuthConfig();
      const response = await axios.post(
        `${API_BASE_URL}/notifications/${notificationId}/send`,
        {},
        config
      );
      
      console.log('=== RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible d\'envoyer la notification' };
    }
  },

  // Récupérer les notifications par type
  getNotificationsByType: async (type) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/notifications?type=${encodeURIComponent(type)}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications par type:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les notifications de ce type' };
    }
  },

  // Récupérer les notifications par statut
  getNotificationsByStatus: async (isActive) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/notifications?is_active=${isActive}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications par statut:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les notifications de ce statut' };
    }
  },

  // Récupérer les notifications planifiées
  getScheduledNotifications: async () => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/notifications/scheduled`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications planifiées:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les notifications planifiées' };
    }
  },

  // Récupérer les notifications envoyées
  getSentNotifications: async () => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/notifications/sent`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications envoyées:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les notifications envoyées' };
    }
  },

  // Exporter les notifications
  exportNotifications: async (filters = {}) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/notifications/export`,
        {
          ...config,
          params: filters
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'export des notifications:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible d\'exporter les notifications' };
    }
  },

  // Obtenir les statistiques des notifications
  getNotificationStats: async () => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/notifications/stats`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les statistiques' };
    }
  },

  // Rechercher des notifications
  searchNotifications: async (query) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/notifications/search?q=${encodeURIComponent(query)}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche des notifications:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de rechercher les notifications' };
    }
  },

  // Envoyer une notification en masse
  sendBulkNotifications: async (notificationIds) => {
    try {
      console.log('=== SEND BULK NOTIFICATIONS ===');
      console.log('Notification IDs:', notificationIds);
      
      const config = await getAuthConfig();
      const response = await axios.post(
        `${API_BASE_URL}/notifications/bulk-send`,
        { notification_ids: notificationIds },
        config
      );
      
      console.log('=== RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'envoi massif des notifications:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible d\'envoyer les notifications en masse' };
    }
  }
};

// Exporter getAuthConfig séparément pour utilisation externe
export { getAuthConfig };

export default notificationService;
