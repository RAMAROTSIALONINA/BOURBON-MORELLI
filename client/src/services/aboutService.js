import axios from 'axios';

const API_BASE_URL = 'http://localhost:5003/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const aboutService = {
  // Lecture publique (pas d'auth)
  async getAbout() {
    const { data } = await axios.get(`${API_BASE_URL}/site-settings/about`);
    return data?.value || null;
  },

  // Écriture admin
  async updateAbout(value) {
    const { data } = await axios.put(
      `${API_BASE_URL}/site-settings/about`,
      { value },
      { headers: getAuthHeaders() }
    );
    return data?.value || null;
  }
};

export default aboutService;
