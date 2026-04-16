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

const productService = {
  // Récupérer tous les produits
  getAllProducts: async () => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/products`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les produits' };
    }
  },

  // Récupérer un produit par son ID
  getProductById: async (productId) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/products/${productId}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du produit:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer le produit' };
    }
  },

  // Créer un nouveau produit
  createProduct: async (productData) => {
    try {
      console.log('=== CRÉATION PRODUIT ===');
      console.log('Tentative de création de produit...');
      console.log('Données produit:', JSON.stringify(productData, null, 2));
      
      const config = await getAuthConfig();
      console.log('Config obtenue:', JSON.stringify(config, null, 2));
      
      const response = await axios.post(
        `${API_BASE_URL}/products`,
        productData,
        config
      );
      
      console.log('=== RÉPONSE API REÇUE ===');
      console.log('Réponse:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de créer le produit' };
    }
  },

  // Mettre à jour un produit
  updateProduct: async (productId, productData) => {
    try {
      console.log('=== MISE À JOUR PRODUIT ===');
      console.log('Tentative de mise à jour du produit:', productId);
      console.log('Données produit:', JSON.stringify(productData, null, 2));
      
      const config = await getAuthConfig();
      const response = await axios.put(
        `${API_BASE_URL}/products/${productId}`,
        productData,
        config
      );
      
      console.log('=== RÉPONSE API REÇUE ===');
      console.log('Réponse:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de mettre à jour le produit' };
    }
  },

  // Supprimer un produit
  deleteProduct: async (productId) => {
    try {
      console.log('=== SUPPRESSION PRODUIT ===');
      console.log('Tentative de suppression du produit:', productId);
      
      const config = await getAuthConfig();
      const response = await axios.delete(
        `${API_BASE_URL}/products/${productId}`,
        config
      );
      
      console.log('=== RÉPONSE API REÇUE ===');
      console.log('Réponse:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de supprimer le produit' };
    }
  },

  // Récupérer les produits par catégorie
  getProductsByCategory: async (category) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.get(
        `${API_BASE_URL}/products?category=${encodeURIComponent(category)}`,
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des produits par catégorie:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer les produits de cette catégorie' };
    }
  },

  // Mettre à jour le stock d'un produit
  updateStock: async (productId, stock) => {
    try {
      const config = await getAuthConfig();
      const response = await axios.patch(
        `${API_BASE_URL}/products/${productId}/stock`,
        { stock },
        config
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de mettre à jour le stock' };
    }
  }
};

// Exporter getAuthConfig séparément pour utilisation externe
export { getAuthConfig };

export default productService;
