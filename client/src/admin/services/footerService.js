import axios from 'axios';

const API_BASE_URL = 'http://localhost:5003/api/admin';

const footerService = {
  // Récupérer tous les paramètres du footer
  getFooterSettings: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/footer`);
      return response.data;
    } catch (error) {
      console.error('Erreur récupération footer settings:', error);
      throw error;
    }
  },

  // Récupérer les sections disponibles
  getSections: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/footer/sections`);
      return response.data;
    } catch (error) {
      console.error('Erreur récupération sections:', error);
      throw error;
    }
  },

  // Mettre à jour un paramètre
  updateSetting: async (id, value, isActive = true) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/footer/${id}`, {
        value,
        is_active: isActive
      });
      return response.data;
    } catch (error) {
      console.error('Erreur mise à jour setting:', error);
      throw error;
    }
  },

  // Ajouter un nouveau paramètre
  addSetting: async (setting) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/footer`, setting);
      return response.data;
    } catch (error) {
      console.error('Erreur ajout setting:', error);
      throw error;
    }
  },

  // Supprimer un paramètre
  deleteSetting: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/footer/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur suppression setting:', error);
      throw error;
    }
  }
};

export default footerService;
