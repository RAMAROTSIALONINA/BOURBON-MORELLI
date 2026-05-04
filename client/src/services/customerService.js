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

const customerService = {
  // Récupérer tous les clients
  getAllCustomers: async () => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/customers`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les clients' };
    }
  },

  // Récupérer un client par son ID
  getCustomerById: async (customerId) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/customers/${customerId}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du client:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer le client' };
    }
  },

  // Mettre à jour un client
  updateCustomer: async (customerId, customerData) => {
    try {
      console.log('=== UPDATE CUSTOMER ===');
      console.log('Customer ID:', customerId);
      console.log('Customer data:', JSON.stringify(customerData, null, 2));

      const idStr = String(customerId);
      if (idStr.startsWith('g-')) {
        throw new Error('Les clients invités ne peuvent pas être modifiés (ils n\'ont pas de compte).');
      }
      const realId = idStr.startsWith('u-') ? idStr.slice(2) : idStr;

      const config = await getAuthConfig();
      const response = await axios.put(
        `${API_BASE_URL}/customers/${realId}`,
        customerData,
        config
      );
      
      console.log('=== RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du client:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de mettre à jour le client' };
    }
  },

  // Créer un nouveau client
  createCustomer: async (customerData) => {
    try {
      console.log('=== CREATE CUSTOMER ===');
      console.log('Customer data:', JSON.stringify(customerData, null, 2));
      
      const config = await getAuthConfig();
      const response = await axios.post(
        `${API_BASE_URL}/customers`,
        customerData,
        config
      );
      
      console.log('=== RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de créer le client' };
    }
  },

  // Supprimer un client (gère les IDs composites : u-XX pour inscrits, g-XX pour invités)
  deleteCustomer: async (customerId, customerEmail) => {
    try {
      console.log('=== DELETE CUSTOMER ===');
      console.log('Customer ID:', customerId, 'Email:', customerEmail);

      const idStr = String(customerId);
      let url;
      if (idStr.startsWith('u-')) {
        // Inscrit : supprimer depuis la table users par ID numérique
        const userId = idStr.slice(2);
        url = `${API_BASE_URL}/customers/${userId}`;
      } else if (idStr.startsWith('g-')) {
        // Invité : supprimer par email via route dédiée
        if (!customerEmail) throw new Error('Email requis pour supprimer un invité');
        url = `${API_BASE_URL}/customers/guest/${encodeURIComponent(customerEmail)}`;
      } else {
        // Fallback : ID brut (rétro-compatibilité)
        url = `${API_BASE_URL}/customers/${idStr}`;
      }

      const config = await getAuthConfig();
      const response = await axios.delete(url, config);

      console.log('=== RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data, null, 2));

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de supprimer le client' };
    }
  },

  // Récupérer les clients par statut
  getCustomersByStatus: async (status) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/customers?status=${encodeURIComponent(status)}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des clients par statut:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les clients de ce statut' };
    }
  },

  // Rechercher des clients
  searchCustomers: async (query) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/customers/search?q=${encodeURIComponent(query)}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche des clients:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de rechercher les clients' };
    }
  },

  // Exporter les clients
  exportCustomers: async (filters = {}) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/customers/export`,
        {
          ...config,
          params: filters
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'export des clients:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible d\'exporter les clients' };
    }
  },

  // Obtenir les statistiques des clients
  getCustomerStats: async () => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/customers/stats`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les statistiques' };
    }
  }
};

// Exporter getAuthConfig séparément pour utilisation externe
export { getAuthConfig };

export default customerService;
