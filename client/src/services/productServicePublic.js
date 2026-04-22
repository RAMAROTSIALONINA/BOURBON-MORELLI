import axios from 'axios';

const API_BASE_URL = 'http://localhost:5003/api/public';

const productServicePublic = {
  // Récupérer tous les produits (public)
  getAllProducts: async () => {
    try {
      console.log('Récupération des produits depuis API publique...');
      const response = await axios.get(`${API_BASE_URL}/products`);
      console.log('Produits récupérés:', response.data.products?.length || 0);
      return response.data.products || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      
      // En cas d'erreur, retourner un tableau vide
      console.log('Fallback: retour d\'un tableau vide');
      return [];
    }
  },

  // Récupérer un produit par son ID (public)
  getProductById: async (productId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/${productId}`);
      return response.data.product;
    } catch (error) {
      console.error('Erreur lors de la récupération du produit:', error);
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer le produit' };
    }
  },

  // Récupérer les produits par catégorie (public)
  getProductsByCategory: async (categoryName) => {
    try {
      console.log(`Récupération des produits pour la catégorie: ${categoryName}`);
      const response = await axios.get(`${API_BASE_URL}/products/category/${encodeURIComponent(categoryName)}`);
      console.log('Produits de catégorie récupérés:', response.data.products?.length || 0);
      return response.data.products || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des produits par catégorie:', error);
      
      // En cas d'erreur, retourner un tableau vide
      console.log('Fallback: retour d\'un tableau vide pour la catégorie');
      return [];
    }
  },

  // Rechercher des produits (public)
  searchProducts: async (query) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products`, {
        params: { search: query }
      });
      return response.data.products || [];
    } catch (error) {
      console.error('Erreur lors de la recherche des produits:', error);
      return [];
    }
  }
};

export default productServicePublic;
