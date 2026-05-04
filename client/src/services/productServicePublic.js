import axios from 'axios';

const API_BASE_URL = 'http://localhost:5003/api/public';

const productServicePublic = {
  getAllProducts: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products`);
      return response.data.products || [];
    } catch (error) {
      return [];
    }
  },

  getProductById: async (productId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/${productId}`);
      return response.data.product;
    } catch (error) {
      throw error.response?.data || { error: 'Erreur serveur', message: 'Impossible de récupérer le produit' };
    }
  },

  getProductsByCategory: async (categoryName) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/category/${encodeURIComponent(categoryName)}`);
      return response.data.products || [];
    } catch (error) {
      return [];
    }
  },

  searchProducts: async (query) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/products`, { params: { search: query } });
      return response.data.products || [];
    } catch (error) {
      return [];
    }
  }
};

export default productServicePublic;
