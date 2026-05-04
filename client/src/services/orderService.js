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

// Configuration d'axios avec le token admin stocké
const getAuthConfig = () => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin/login';
    throw new Error('Token d\'authentification requis');
  }
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
};

// Gérer les erreurs d'auth (401/403) : purger et rediriger
const handleAuthError = (error) => {
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin/login';
  }
  throw error.response?.data || { error: 'Erreur serveur' };
};

const orderService = {
  // Récupérer toutes les commandes
  getAllOrders: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders`, getAuthConfig());
      return response.data;
    } catch (error) {
      handleAuthError(error);
    }
  },

  // Récupérer une commande par son ID
  getOrderById: async (orderId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/${orderId}`, getAuthConfig());
      return response.data;
    } catch (error) {
      handleAuthError(error);
    }
  },

  // Mettre à jour le statut d'une commande
  updateOrderStatus: async (orderId, statusData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, statusData, getAuthConfig());
      return response.data;
    } catch (error) {
      handleAuthError(error);
    }
  },

  createOrder: async (orderData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/orders`, orderData, getAuthConfig());
      return response.data;
    } catch (error) {
      handleAuthError(error);
    }
  },

  updateOrder: async (orderId, orderData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/orders/${orderId}`, orderData, getAuthConfig());
      return response.data;
    } catch (error) {
      handleAuthError(error);
    }
  },

  deleteOrder: async (orderId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/orders/${orderId}`, getAuthConfig());
      return response.data;
    } catch (error) {
      handleAuthError(error);
    }
  },

  getOrdersByStatus: async (status) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders?status=${encodeURIComponent(status)}`, getAuthConfig());
      return response.data;
    } catch (error) {
      handleAuthError(error);
    }
  },

  getOrdersByCustomer: async (customerId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders?customer_id=${customerId}`, getAuthConfig());
      return response.data;
    } catch (error) {
      handleAuthError(error);
    }
  },

  exportOrders: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders/export`, { ...getAuthConfig(), params: filters });
      return response.data;
    } catch (error) {
      handleAuthError(error);
    }
  }
};

// Exporter getAuthConfig séparément pour utilisation externe
export { getAuthConfig };

// Exporter le service client séparément
export { customerOrderService };

export default orderService;
