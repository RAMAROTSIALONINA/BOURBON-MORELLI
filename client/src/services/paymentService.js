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

const paymentService = {
  // Récupérer tous les paiements
  getAllPayments: async () => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/payments`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des paiements:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les paiements' };
    }
  },

  // Récupérer un paiement par son ID
  getPaymentById: async (paymentId) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/payments/${paymentId}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du paiement:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer le paiement' };
    }
  },

  // Mettre à jour le statut d'un paiement
  updatePaymentStatus: async (paymentId, statusData) => {
    try {
      console.log('=== UPDATE PAYMENT STATUS ===');
      console.log('Payment ID:', paymentId);
      console.log('Status data:', JSON.stringify(statusData, null, 2));
      
      const config = await getAuthConfig();
      const response = await axios.patch(
        `${API_BASE_URL}/payments/${paymentId}/status`,
        statusData,
        config
      );
      
      console.log('=== RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de mettre à jour le statut' };
    }
  },

  // Créer un nouveau paiement
  createPayment: async (paymentData) => {
    try {
      console.log('=== CREATE PAYMENT ===');
      console.log('Payment data:', JSON.stringify(paymentData, null, 2));
      
      const config = await getAuthConfig();
      const response = await axios.post(
        `${API_BASE_URL}/payments`,
        paymentData,
        config
      );
      
      console.log('=== RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du paiement:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de créer le paiement' };
    }
  },

  // Mettre à jour un paiement
  updatePayment: async (paymentId, paymentData) => {
    try {
      console.log('=== UPDATE PAYMENT ===');
      console.log('Payment ID:', paymentId);
      console.log('Payment data:', JSON.stringify(paymentData, null, 2));
      
      const config = await getAuthConfig();
      const response = await axios.put(
        `${API_BASE_URL}/payments/${paymentId}`,
        paymentData,
        config
      );
      
      console.log('=== RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du paiement:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de mettre à jour le paiement' };
    }
  },

  // Supprimer un paiement
  deletePayment: async (paymentId) => {
    try {
      console.log('=== DELETE PAYMENT ===');
      console.log('Payment ID:', paymentId);
      
      const config = await getAuthConfig();
      const response = await axios.delete(
        `${API_BASE_URL}/payments/${paymentId}`,
        config
      );
      
      console.log('=== RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du paiement:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de supprimer le paiement' };
    }
  },

  // Traiter un remboursement
  processRefund: async (paymentId, refundData) => {
    try {
      console.log('=== PROCESS REFUND ===');
      console.log('Payment ID:', paymentId);
      console.log('Refund data:', JSON.stringify(refundData, null, 2));
      
      const config = await getAuthConfig();
      const response = await axios.post(
        `${API_BASE_URL}/payments/${paymentId}/refund`,
        refundData,
        config
      );
      
      console.log('=== RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors du traitement du remboursement:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de traiter le remboursement' };
    }
  },

  // Récupérer les paiements par statut
  getPaymentsByStatus: async (status) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/payments?status=${encodeURIComponent(status)}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des paiements par statut:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les paiements de ce statut' };
    }
  },

  // Récupérer les paiements par méthode
  getPaymentsByMethod: async (method) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/payments?method=${encodeURIComponent(method)}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des paiements par méthode:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les paiements de cette méthode' };
    }
  },

  // Récupérer les paiements d'une commande
  getPaymentsByOrder: async (orderId) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/payments?order_id=${orderId}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des paiements de la commande:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les paiements de la commande' };
    }
  },

  // Récupérer les paiements d'un client
  getPaymentsByCustomer: async (customerId) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/payments?customer_id=${customerId}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des paiements du client:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les paiements du client' };
    }
  },

  // Exporter les paiements
  exportPayments: async (filters = {}) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/payments/export`,
        {
          ...config,
          params: filters
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'export des paiements:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible d\'exporter les paiements' };
    }
  },

  // Obtenir les statistiques des paiements
  getPaymentStats: async () => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/payments/stats`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les statistiques' };
    }
  },

  // Rechercher des paiements
  searchPayments: async (query) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/payments/search?q=${encodeURIComponent(query)}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche des paiements:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de rechercher les paiements' };
    }
  }
};

// Exporter getAuthConfig séparément pour utilisation externe
export { getAuthConfig };

export default paymentService;
