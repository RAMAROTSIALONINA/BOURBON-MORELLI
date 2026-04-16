import axios from 'axios';

const API_BASE_URL = 'http://localhost:5003/api';

// Service pour les commandes client (utilise localStorage pour simulation)
const customerOrderService = {
  // Créer une nouvelle commande
  createOrder: async (orderData) => {
    try {
      console.log('=== CREATE ORDER ===');
      console.log('Order data:', JSON.stringify(orderData, null, 2));
      
      // Simulation de création de commande
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const order = {
        id: 'CMD-' + Date.now(),
        ...orderData,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      
      // Sauvegarder la commande dans localStorage
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      orders.push(order);
      localStorage.setItem('orders', JSON.stringify(orders));
      
      console.log('=== ORDER CREATED ===');
      console.log('Order ID:', order.id);
      
      return {
        success: true,
        order: order,
        message: 'Commande créée avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      return {
        success: false,
        message: 'Erreur lors de la création de la commande',
        error: error.message
      };
    }
  },

  // Récupérer les commandes du client
  getCustomerOrders: async (customerEmail) => {
    try {
      console.log('=== GET CUSTOMER ORDERS ===');
      console.log('Customer email:', customerEmail);
      
      // Simulation de chargement
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const customerOrders = orders.filter(order => order.customerEmail === customerEmail);
      
      console.log('=== ORDERS LOADED ===');
      console.log('Orders found:', customerOrders.length);
      
      return {
        success: true,
        orders: customerOrders,
        message: 'Commandes récupérées avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des commandes',
        error: error.message
      };
    }
  },

  // Mettre à jour le statut d'une commande
  updateOrderStatus: async (orderId, status) => {
    try {
      console.log('=== UPDATE ORDER STATUS ===');
      console.log('Order ID:', orderId, 'New status:', status);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const orderIndex = orders.findIndex(order => order.id === orderId);
      
      if (orderIndex === -1) {
        throw new Error('Commande non trouvée');
      }
      
      orders[orderIndex].status = status;
      orders[orderIndex].updatedAt = new Date().toISOString();
      
      localStorage.setItem('orders', JSON.stringify(orders));
      
      console.log('=== ORDER STATUS UPDATED ===');
      
      return {
        success: true,
        order: orders[orderIndex],
        message: 'Statut de la commande mis à jour'
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      return {
        success: false,
        message: 'Erreur lors de la mise à jour du statut',
        error: error.message
      };
    }
  }
};

// Configuration d'axios avec le token d'authentification (pour admin)
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

const orderService = {
  // Récupérer toutes les commandes
  getAllOrders: async () => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/orders`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les commandes' };
    }
  },

  // Récupérer une commande par son ID
  getOrderById: async (orderId) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/orders/${orderId}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la commande:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer la commande' };
    }
  },

  // Mettre à jour le statut d'une commande
  updateOrderStatus: async (orderId, statusData) => {
    try {
      console.log('=== UPDATE ORDER STATUS ===');
      console.log('Order ID:', orderId);
      console.log('Status data:', JSON.stringify(statusData, null, 2));
      
      const config = await getAuthConfig();
      const response = await axios.patch(
        `${API_BASE_URL}/orders/${orderId}/status`,
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

  // Créer une nouvelle commande
  createOrder: async (orderData) => {
    try {
      console.log('=== CREATE ORDER ===');
      console.log('Order data:', JSON.stringify(orderData, null, 2));
      
      const config = await getAuthConfig();
      const response = await axios.post(
        `${API_BASE_URL}/orders`,
        orderData,
        config
      );
      
      console.log('=== RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de créer la commande' };
    }
  },

  // Mettre à jour une commande
  updateOrder: async (orderId, orderData) => {
    try {
      console.log('=== UPDATE ORDER ===');
      console.log('Order ID:', orderId);
      console.log('Order data:', JSON.stringify(orderData, null, 2));
      
      const config = await getAuthConfig();
      const response = await axios.put(
        `${API_BASE_URL}/orders/${orderId}`,
        orderData,
        config
      );
      
      console.log('=== RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la commande:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de mettre à jour la commande' };
    }
  },

  // Supprimer une commande
  deleteOrder: async (orderId) => {
    try {
      console.log('=== DELETE ORDER ===');
      console.log('Order ID:', orderId);
      
      const config = await getAuthConfig();
      const response = await axios.delete(
        `${API_BASE_URL}/orders/${orderId}`,
        config
      );
      
      console.log('=== RESPONSE ===');
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de la commande:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de supprimer la commande' };
    }
  },

  // Récupérer les commandes par statut
  getOrdersByStatus: async (status) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/orders?status=${encodeURIComponent(status)}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes par statut:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les commandes de ce statut' };
    }
  },

  // Récupérer les commandes d'un client
  getOrdersByCustomer: async (customerId) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/orders?customer_id=${customerId}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes du client:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les commandes du client' };
    }
  },

  // Exporter les commandes
  exportOrders: async (filters = {}) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/orders/export`,
        {
          ...config,
          params: filters
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'export des commandes:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible d\'exporter les commandes' };
    }
  }
};

// Exporter getAuthConfig séparément pour utilisation externe
export { getAuthConfig };

// Exporter le service client séparément
export { customerOrderService };

export default orderService;
